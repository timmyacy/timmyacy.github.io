import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MarketDataService } from '../../core/services/market-data.service';
import { blackScholes } from '../../core/engines/black-scholes';
import { mertonJumpDiffusion } from '../../core/engines/merton-jump-diffusion';
import { priceMonteCarlo } from '../../core/engines/monte-carlo-pricer';

interface EngineProof {
  symbol: string;
  spot: number;
  bsm: number;
  mc: number;
  merton: number;
  spreadPct: number;
}

interface Instrument {
  coingeckoId: string;
  symbol: string;
  vol: number;          // assumed annualized vol, real crypto options data isn't free/keyless to pull
  jumpIntensity: number;
  jumpMean: number;
  jumpVol: number;
  fallbackSpot: number; // used if the live fetch fails, so the panel never renders empty
}

const RATE = 0.045;
const MATURITY_DAYS = 30;

const INSTRUMENTS: Instrument[] = [
  { coingeckoId: 'bitcoin', symbol: 'BTC', vol: 0.55, jumpIntensity: 1.4, jumpMean: -0.04, jumpVol: 0.12, fallbackSpot: 61_200 },
  { coingeckoId: 'ethereum', symbol: 'ETH', vol: 0.62, jumpIntensity: 1.6, jumpMean: -0.05, jumpVol: 0.14, fallbackSpot: 2_420 },
];

@Component({
  selector: 'app-engine-check',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './engine-check.component.html',
  styleUrl: './engine-check.component.scss'
})
export class EngineCheckComponent implements OnInit {
  readonly maturityDays = MATURITY_DAYS;

  proofs: EngineProof[] = [];
  loading = true;
  isFallback = false;

  constructor(private readonly marketData: MarketDataService) {}

  ngOnInit(): void {
    this.marketData.getSpotPrices(INSTRUMENTS.map((i) => i.coingeckoId)).subscribe((prices) => {
      this.loading = false;
      const gotLiveData = INSTRUMENTS.some((i) => prices[i.coingeckoId] > 0);
      this.isFallback = !gotLiveData;
      this.proofs = INSTRUMENTS.map((instrument) =>
        this.computeProof(instrument, prices[instrument.coingeckoId] || instrument.fallbackSpot),
      );
    });
  }

  private computeProof(instrument: Instrument, spot: number): EngineProof {
    const maturity = MATURITY_DAYS / 365;
    const strike = spot; // at-the-money: strike set to the live spot itself

    const bsm = blackScholes({ spot, strike, maturity, rate: RATE, vol: instrument.vol, type: 'call' }).price;

    const mc = priceMonteCarlo({
      kind: 'european',
      type: 'call',
      spot,
      strike,
      maturity,
      rate: RATE,
      vol: instrument.vol,
      simulations: 20_000,
      numSteps: 1,
      antithetic: true,
      seed: Date.now(),
    }).price;

    const merton = mertonJumpDiffusion({
      spot,
      strike,
      maturity,
      rate: RATE,
      vol: instrument.vol,
      type: 'call',
      jumpIntensity: instrument.jumpIntensity,
      jumpMean: instrument.jumpMean,
      jumpVol: instrument.jumpVol,
    }).price;

    const prices = [bsm, mc, merton];
    const spreadPct = ((Math.max(...prices) - Math.min(...prices)) / bsm) * 100;

    return { symbol: instrument.symbol, spot, bsm, mc, merton, spreadPct };
  }
}
