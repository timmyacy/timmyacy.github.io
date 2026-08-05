import { mulberry32, boxMuller } from './rng';
import { blackScholes, OptionType } from './black-scholes';
import { normCdf } from './normal-dist';

export type McOptionKind = 'european' | 'binary' | 'asian' | 'barrier' | 'lookback';

export interface McInputs {
  kind: McOptionKind;
  type: OptionType;
  spot: number;
  strike: number;
  maturity: number;
  rate: number;
  vol: number;
  simulations: number;
  numSteps: number;   // used by asian/barrier/lookback
  barrier?: number;   // used by barrier
  antithetic: boolean;
  seed?: number;
}

export interface McResult {
  price: number;
  stdError: number;
  ci95: [number, number];
  convergence: number[];   // running discounted price estimate, subsampled
  samplePaths: number[][]; // a handful of raw price paths, for the spaghetti chart (path-dependent kinds only)
  closedForm?: number;     // Black-Scholes / binary closed form, where one exists
}

const MAX_SIMULATIONS = 50_000;
const MAX_STEPS = 252;
const CONVERGENCE_POINTS = 150;
const SAMPLE_PATH_COUNT = 40;

function payoff(kind: McOptionKind, type: OptionType, path: number[], strike: number, barrier?: number): number {
  const terminal = path[path.length - 1];

  switch (kind) {
    case 'european':
      return type === 'call' ? Math.max(terminal - strike, 0) : Math.max(strike - terminal, 0);

    case 'binary':
      return type === 'call' ? (terminal > strike ? 1 : 0) : (terminal < strike ? 1 : 0);

    case 'asian': {
      const avg = path.reduce((s, p) => s + p, 0) / path.length;
      return type === 'call' ? Math.max(avg - strike, 0) : Math.max(strike - avg, 0);
    }

    case 'barrier': {
      const b = barrier ?? strike;
      const knockedOut = type === 'call' ? path.some((p) => p >= b) : path.some((p) => p <= b);
      if (knockedOut) return 0;
      return type === 'call' ? Math.max(terminal - strike, 0) : Math.max(strike - terminal, 0);
    }

    case 'lookback': {
      const max = Math.max(...path);
      const min = Math.min(...path);
      return type === 'call' ? terminal - min : max - terminal;
    }
  }
}

function binaryClosedForm(type: OptionType, spot: number, strike: number, maturity: number, rate: number, vol: number): number {
  const d2 = (Math.log(spot / strike) + (rate - 0.5 * vol * vol) * maturity) / (vol * Math.sqrt(maturity));
  const disc = Math.exp(-rate * maturity);
  return type === 'call' ? disc * normCdf(d2) : disc * normCdf(-d2);
}

/**
 * Monte Carlo option pricer mirroring the MC-Pricer C++ engine: GBM paths
 * driven by Box-Muller normals, optional antithetic variance reduction,
 * discounted-payoff averaging across five option types.
 */
export function priceMonteCarlo(inputs: McInputs): McResult {
  const { kind, type, spot, strike, maturity, rate, vol, barrier, antithetic } = inputs;
  const simulations = Math.min(Math.max(1, Math.round(inputs.simulations)), MAX_SIMULATIONS);
  const isPathDependent = kind === 'asian' || kind === 'barrier' || kind === 'lookback';
  const numSteps = isPathDependent ? Math.min(Math.max(1, Math.round(inputs.numSteps)), MAX_STEPS) : 1;
  const dt = maturity / numSteps;
  const drift = (rate - 0.5 * vol * vol) * dt;
  const diffusion = vol * Math.sqrt(dt);
  const discount = Math.exp(-rate * maturity);

  const rand = mulberry32(inputs.seed ?? 1234);
  const samplePaths: number[][] = [];
  const discountedPayoffs: number[] = new Array(simulations);

  const buildPath = (sign: 1 | -1): number[] => {
    const path = new Array<number>(numSteps + 1);
    path[0] = spot;
    let s = spot;
    for (let step = 0; step < numSteps; step++) {
      // Reuses one Box-Muller normal per step; antithetic pass negates it (-Z),
      // exactly mirroring the C++ engine's variance-reduction flag.
      const [z] = boxMuller(rand);
      s *= Math.exp(drift + diffusion * sign * z);
      path[step + 1] = s;
    }
    return path;
  };

  let i = 0;
  while (i < simulations) {
    const path = buildPath(1);
    let p = discount * payoff(kind, type, path, strike, barrier);

    if (antithetic && i + 1 < simulations) {
      const antiPath = buildPath(-1);
      const antiP = discount * payoff(kind, type, antiPath, strike, barrier);
      p = 0.5 * (p + antiP);
      discountedPayoffs[i] = p;
      discountedPayoffs[i + 1] = p;
      if (isPathDependent && samplePaths.length < SAMPLE_PATH_COUNT) samplePaths.push(path);
      i += 2;
      continue;
    }

    discountedPayoffs[i] = p;
    if (isPathDependent && samplePaths.length < SAMPLE_PATH_COUNT) samplePaths.push(path);
    i += 1;
  }

  let sum = 0;
  let sumSq = 0;
  const convergence: number[] = [];
  const sampleEvery = Math.max(1, Math.floor(simulations / CONVERGENCE_POINTS));

  for (let n = 0; n < simulations; n++) {
    sum += discountedPayoffs[n];
    sumSq += discountedPayoffs[n] * discountedPayoffs[n];
    if (n % sampleEvery === 0 || n === simulations - 1) {
      convergence.push(sum / (n + 1));
    }
  }

  const price = sum / simulations;
  const variance = Math.max(0, sumSq / simulations - price * price);
  const stdError = Math.sqrt(variance / simulations);

  let closedForm: number | undefined;
  if (kind === 'european') {
    closedForm = blackScholes({ spot, strike, maturity, rate, vol, type }).price;
  } else if (kind === 'binary') {
    closedForm = binaryClosedForm(type, spot, strike, maturity, rate, vol);
  }

  return {
    price,
    stdError,
    ci95: [price - 1.96 * stdError, price + 1.96 * stdError],
    convergence,
    samplePaths,
    closedForm,
  };
}
