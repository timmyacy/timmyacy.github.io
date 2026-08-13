import { blackScholes, OptionType } from './black-scholes';

export interface MertonInputs {
  spot: number;
  strike: number;
  maturity: number;
  rate: number;
  vol: number;
  type: OptionType;
  jumpIntensity: number; // lambda: expected jumps per year
  jumpMean: number;      // mu_J: mean log-jump size
  jumpVol: number;       // sigma_J: log-jump volatility
  terms?: number;        // series truncation, default 30
}

export interface MertonResult {
  price: number;
  partialSums: number[]; // running total after each added term, for convergence display
}

function factorial(n: number): number {
  let f = 1;
  for (let i = 2; i <= n; i++) f *= i;
  return f;
}

/**
 * Merton (1976) closed-form jump-diffusion price: a Poisson-weighted mixture
 * of Black-Scholes prices, each with variance and drift adjusted for n jumps.
 * The C++ repo also carries a Carr-Madan FFT pricer for Variance Gamma and
 * cross-checks against Monte Carlo. This is just the semi-analytic series.
 */
export function mertonJumpDiffusion(inputs: MertonInputs): MertonResult {
  const { spot, strike, maturity, rate, vol, type, jumpIntensity: lambda, jumpMean: muJ, jumpVol: sigmaJ } = inputs;
  const terms = inputs.terms ?? 30;

  const k = Math.exp(muJ + 0.5 * sigmaJ * sigmaJ) - 1;
  const lambdaPrime = lambda * (1 + k);

  let price = 0;
  const partialSums: number[] = [];

  for (let n = 0; n < terms; n++) {
    const poissonWeight = (Math.exp(-lambdaPrime * maturity) * Math.pow(lambdaPrime * maturity, n)) / factorial(n);
    const sigmaN = Math.sqrt(vol * vol + (n * sigmaJ * sigmaJ) / maturity);
    const rN = rate - lambda * k + (n * Math.log(1 + k)) / maturity;

    const term = blackScholes({ spot, strike, maturity, rate: rN, vol: sigmaN, type }).price;
    price += poissonWeight * term;
    partialSums.push(price);
  }

  return { price, partialSums };
}
