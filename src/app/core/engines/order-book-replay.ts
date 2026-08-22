import { mulberry32 } from './rng';

export interface BookLevel {
  price: number;
  size: number;
}

export interface Trade {
  side: 'buy' | 'sell';
  price: number;
  size: number;
}

export interface ReplayTick {
  t: number;          // ms into the session
  mid: number;
  bids: BookLevel[];  // best-to-worst, 5 levels
  asks: BookLevel[];
  trade: Trade | null;
  pnl: number;
}

/**
 * Generates a synthetic but internally consistent limit-order-book session:
 * a mid-price random walk, a 5-level ladder around it, an occasional print,
 * and a running position P&L. Stands in for a recording of the C++ engine's
 * FIX/UDP feed. Labelled as a replay, not a live connection.
 */
export function generateReplaySession(ticks = 240, seed = Math.floor(Math.random() * 2 ** 31)): ReplayTick[] {
  const rand = mulberry32(seed);
  const spread = 0.02;
  let mid = 100;
  let position = 0;
  let cash = 0;
  const out: ReplayTick[] = [];

  for (let i = 0; i < ticks; i++) {
    mid += (rand() - 0.5) * 0.18;
    mid = Math.max(80, Math.min(120, mid));

    const bids: BookLevel[] = Array.from({ length: 5 }, (_, lvl) => ({
      price: +(mid - spread / 2 - lvl * 0.03).toFixed(2),
      size: Math.round(20 + rand() * 180),
    }));
    const asks: BookLevel[] = Array.from({ length: 5 }, (_, lvl) => ({
      price: +(mid + spread / 2 + lvl * 0.03).toFixed(2),
      size: Math.round(20 + rand() * 180),
    }));

    let trade: Trade | null = null;
    if (rand() < 0.35) {
      const side: 'buy' | 'sell' = rand() < 0.5 ? 'buy' : 'sell';
      const price = side === 'buy' ? asks[0].price : bids[0].price;
      const size = Math.round(1 + rand() * 12);
      trade = { side, price, size };
      const signedSize = side === 'buy' ? size : -size;
      position += signedSize;
      cash -= signedSize * price;
    }

    const pnl = cash + position * mid;
    out.push({ t: i * 250, mid: +mid.toFixed(2), bids, asks, trade, pnl: +pnl.toFixed(2) });
  }

  return out;
}
