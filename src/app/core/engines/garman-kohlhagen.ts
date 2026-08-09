import { normCdf, normPdf } from './normal-dist';
import { OptionType } from './black-scholes';

export interface FxOptionInputs {
  spot: number;        // domestic per 1 foreign unit, e.g. GBP/USD
  strike: number;
  maturity: number;
  domesticRate: number;
  foreignRate: number;
  vol: number;
  type: OptionType;
  notional: number; // units of foreign currency
}

export interface FxOptionResult {
  price: number;       // in domestic currency, per unit notional
  premium: number;     // price * notional
  delta: number;
  vega: number;
}

/** Garman-Kohlhagen: Black-Scholes with a foreign-currency dividend-style carry. */
export function garmanKohlhagen(inputs: FxOptionInputs): FxOptionResult {
  const { spot: S, strike: K, maturity: T, domesticRate: rd, foreignRate: rf, vol: sigma, type, notional } = inputs;
  const sqrtT = Math.sqrt(T);
  const d1 = (Math.log(S / K) + (rd - rf + (sigma * sigma) / 2) * T) / (sigma * sqrtT);
  const d2 = d1 - sigma * sqrtT;

  const discF = Math.exp(-rf * T);
  const discD = Math.exp(-rd * T);

  const price = type === 'call'
    ? S * discF * normCdf(d1) - K * discD * normCdf(d2)
    : K * discD * normCdf(-d2) - S * discF * normCdf(-d1);

  const delta = type === 'call' ? discF * normCdf(d1) : discF * (normCdf(d1) - 1);
  const vega = (S * discF * normPdf(d1) * sqrtT) / 100;

  return { price, premium: price * notional, delta, vega };
}

export interface FxPosition {
  pair: string;
  inputs: FxOptionInputs;
}

export interface AggregatedRisk {
  totalPremium: number;
  netDelta: number;   // domestic-currency delta, notional-weighted
  netVega: number;
  positions: (FxOptionResult & { pair: string })[];
}

/** Rolls a small book of FX option positions up into portfolio-level Greeks. */
export function aggregateFxRisk(positions: FxPosition[]): AggregatedRisk {
  const results = positions.map((p) => ({ pair: p.pair, ...garmanKohlhagen(p.inputs) }));
  return {
    totalPremium: results.reduce((sum, r) => sum + r.premium, 0),
    netDelta: results.reduce((sum, r, i) => sum + r.delta * positions[i].inputs.notional, 0),
    netVega: results.reduce((sum, r, i) => sum + r.vega * positions[i].inputs.notional, 0),
    positions: results,
  };
}
