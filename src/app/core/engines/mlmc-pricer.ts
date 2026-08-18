import { mulberry32, boxMuller } from './rng';
import { blackScholes, OptionType } from './black-scholes';

export type MlmcScheme = 'euler' | 'milstein' | 'srk';
export type MlmcOptionKind = 'european' | 'asian';

export interface MlmcInputs {
  spot: number;
  strike: number;
  maturity: number;
  rate: number;
  vol: number;
  type: OptionType;
  scheme: MlmcScheme;
  optionKind: MlmcOptionKind;
  levels: number;     // L: levels 0..L, step counts 1, 2, 4, ..., 2^L
  basePaths: number;  // N_0; deeper levels use fewer paths per the V_l/C_l rule
  seed?: number;
}

export interface MlmcLevel {
  level: number;
  steps: number;
  paths: number;
  meanY: number;
  varY: number;
  cost: number; // paths * steps, a proxy for computational work
}

export interface MlmcResult {
  price: number;
  stdError: number;
  levels: MlmcLevel[];
  exact: number;              // Black-Scholes closed form, for reference (European only)
  naiveMc: { price: number; stdError: number; cost: number };
  mlmcCost: number;
}

const MIN_PATHS = 200;

function normals(count: number, rand: () => number): number[] {
  const out: number[] = [];
  while (out.length < count) {
    const [a, b] = boxMuller(rand);
    out.push(a);
    if (out.length < count) out.push(b);
  }
  return out;
}

/**
 * One discretization step for dS = r*S*dt + vol*S*dW, matching the three
 * schemes in the thesis notebook's diagnostics (euler/milstein/srk_mlmc_diagnostics.dat):
 *  - Euler-Maruyama: strong order 0.5, the textbook MLMC baseline.
 *  - Milstein: adds the Ito correction term, strong order 1, which should
 *    noticeably steepen the level-variance decay compared to plain Euler.
 *  - SRK (derivative-free / Platen scheme): also strong order 1, reaching the
 *    same accuracy as Milstein without needing an analytic derivative of the
 *    diffusion term (useful when that derivative isn't easily available).
 */
function stepUpdate(scheme: MlmcScheme, s: number, rate: number, vol: number, dt: number, dW: number): number {
  const drift = rate * s * dt;
  switch (scheme) {
    case 'euler':
      return s + drift + vol * s * dW;
    case 'milstein':
      return s + drift + vol * s * dW + 0.5 * vol * vol * s * (dW * dW - dt);
    case 'srk': {
      const sqrtDt = Math.sqrt(dt);
      const sHat = s + drift + vol * s * sqrtDt;
      return s + drift + vol * s * dW + ((vol * (sHat - s)) / (2 * sqrtDt)) * (dW * dW - dt);
    }
  }
}

function runPath(scheme: MlmcScheme, spot: number, rate: number, vol: number, dt: number, dWs: number[]): { terminal: number; average: number } {
  let s = spot;
  let sum = 0;
  for (let i = 0; i < dWs.length; i++) {
    s = Math.max(stepUpdate(scheme, s, rate, vol, dt, dWs[i]), 1e-6);
    sum += s;
  }
  return { terminal: s, average: sum / dWs.length };
}

function discountedPayoffFrom(
  optionKind: MlmcOptionKind,
  type: OptionType,
  result: { terminal: number; average: number },
  strike: number,
  discount: number,
): number {
  const value = optionKind === 'asian' ? result.average : result.terminal;
  const payoff = type === 'call' ? Math.max(value - strike, 0) : Math.max(strike - value, 0);
  return discount * payoff;
}

/**
 * Giles (2008) multilevel Monte Carlo. Fine (steps=2^l) and coarse
 * (steps=2^(l-1)) paths at the same level share the same Brownian path:
 * each coarse step is the sum of the two fine Brownian increments beneath
 * it, so the difference Y_l = P_fine - P_coarse has shrinking variance as
 * l grows. That's the whole mechanism MLMC exploits to cut simulation
 * cost. The exact price returned is Black-Scholes, so it's only a
 * meaningful reference for the European payoff. Asian has no closed form;
 * it's included just to show the estimator works on path-dependent payoffs too.
 */
export function priceMlmc(inputs: MlmcInputs): MlmcResult {
  const { spot, strike, maturity, rate, vol, type, scheme, optionKind } = inputs;
  const L = Math.min(Math.max(1, Math.round(inputs.levels)), 10);
  const basePaths = Math.min(Math.max(MIN_PATHS, Math.round(inputs.basePaths)), 20_000);
  const discount = Math.exp(-rate * maturity);
  const rand = mulberry32(inputs.seed ?? 7);

  const levels: MlmcLevel[] = [];
  let price = 0;
  let estimatorVariance = 0;
  let mlmcCost = 0;

  for (let l = 0; l <= L; l++) {
    const stepsFine = 2 ** l;
    const dtFine = maturity / stepsFine;

    // N_l ~ sqrt(V_l / C_l); deeper levels need far fewer paths because
    // each one is already far more accurate than the last.
    const paths = Math.max(MIN_PATHS, Math.round(basePaths * 2 ** (-1.5 * l)));

    let sumY = 0;
    let sumY2 = 0;

    for (let n = 0; n < paths; n++) {
      const z = normals(stepsFine, rand);
      const dWsFine = z.map((zi) => Math.sqrt(dtFine) * zi);
      const fine = runPath(scheme, spot, rate, vol, dtFine, dWsFine);
      const pFine = discountedPayoffFrom(optionKind, type, fine, strike, discount);

      let y: number;
      if (l === 0) {
        y = pFine;
      } else {
        const stepsCoarse = stepsFine / 2;
        const dtCoarse = maturity / stepsCoarse;
        const dWsCoarse = Array.from({ length: stepsCoarse }, (_, k) => dWsFine[2 * k] + dWsFine[2 * k + 1]);
        const coarse = runPath(scheme, spot, rate, vol, dtCoarse, dWsCoarse);
        const pCoarse = discountedPayoffFrom(optionKind, type, coarse, strike, discount);
        y = pFine - pCoarse;
      }

      sumY += y;
      sumY2 += y * y;
    }

    const meanY = sumY / paths;
    const varY = Math.max(0, sumY2 / paths - meanY * meanY);
    const cost = paths * stepsFine;

    levels.push({ level: l, steps: stepsFine, paths, meanY, varY, cost });
    price += meanY;
    estimatorVariance += varY / paths;
    mlmcCost += cost;
  }

  // Naive single-level MC at the finest grid, same path budget as level 0,
  // as a cost/accuracy baseline. Uses the same scheme as the MLMC levels so
  // the comparison isolates cost, not discretization differences.
  const finestSteps = 2 ** L;
  const dtF = maturity / finestSteps;
  let sum = 0;
  let sumSq = 0;
  for (let n = 0; n < basePaths; n++) {
    const dWs = normals(finestSteps, rand).map((zi) => Math.sqrt(dtF) * zi);
    const result = runPath(scheme, spot, rate, vol, dtF, dWs);
    const p = discountedPayoffFrom(optionKind, type, result, strike, discount);
    sum += p;
    sumSq += p * p;
  }
  const naivePrice = sum / basePaths;
  const naiveVar = Math.max(0, sumSq / basePaths - naivePrice * naivePrice);

  return {
    price,
    stdError: Math.sqrt(estimatorVariance),
    levels,
    exact: blackScholes({ spot, strike, maturity, rate, vol, type }).price,
    naiveMc: { price: naivePrice, stdError: Math.sqrt(naiveVar / basePaths), cost: basePaths * finestSteps },
    mlmcCost,
  };
}
