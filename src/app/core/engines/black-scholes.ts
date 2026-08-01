import { normCdf, normPdf } from './normal-dist';

export type OptionType = 'call' | 'put';

export interface BsmInputs {
  spot: number;
  strike: number;
  maturity: number; // years
  rate: number;      // annualized, decimal
  vol: number;        // annualized, decimal
  type: OptionType;
}

export interface BsmResult {
  price: number;
  delta: number;
  gamma: number;
  vega: number;   // per 1 vol point (1%)
  theta: number;  // per calendar day
  rho: number;    // per 1% rate move
  d1: number;
  d2: number;
}

/** Textbook Black-Scholes-Merton price + Greeks for a European option. */
export function blackScholes({ spot: S, strike: K, maturity: T, rate: r, vol: sigma, type }: BsmInputs): BsmResult {
  const sqrtT = Math.sqrt(T);
  const d1 = (Math.log(S / K) + (r + (sigma * sigma) / 2) * T) / (sigma * sqrtT);
  const d2 = d1 - sigma * sqrtT;

  const Nd1 = normCdf(d1);
  const Nd2 = normCdf(d2);
  const pdf1 = normPdf(d1);
  const discK = K * Math.exp(-r * T);

  const price = type === 'call'
    ? S * Nd1 - discK * Nd2
    : discK * normCdf(-d2) - S * normCdf(-d1);

  const delta = type === 'call' ? Nd1 : Nd1 - 1;
  const gamma = pdf1 / (S * sigma * sqrtT);
  const vega = (S * pdf1 * sqrtT) / 100;
  const rho = type === 'call'
    ? (K * T * Math.exp(-r * T) * Nd2) / 100
    : (-K * T * Math.exp(-r * T) * normCdf(-d2)) / 100;

  const thetaAnnual = type === 'call'
    ? -(S * pdf1 * sigma) / (2 * sqrtT) - r * discK * Nd2
    : -(S * pdf1 * sigma) / (2 * sqrtT) + r * discK * normCdf(-d2);
  const theta = thetaAnnual / 365;

  return { price, delta, gamma, vega, theta, rho, d1, d2 };
}

/** Returns call - put and the parity-implied value (S - K e^-rT); should match to float precision. */
export function putCallParityCheck(inputs: Omit<BsmInputs, 'type'>): { lhs: number; rhs: number; diff: number } {
  const call = blackScholes({ ...inputs, type: 'call' }).price;
  const put = blackScholes({ ...inputs, type: 'put' }).price;
  const lhs = call - put;
  const rhs = inputs.spot - inputs.strike * Math.exp(-inputs.rate * inputs.maturity);
  return { lhs, rhs, diff: lhs - rhs };
}
