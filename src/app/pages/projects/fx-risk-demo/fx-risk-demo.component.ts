import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProjectDemoShellComponent } from '../../../components/project-demo-shell/project-demo-shell.component';
import { GITHUB_PROFILE_URL } from '../../../core/constants';
import { aggregateFxRisk, FxOptionInputs } from '../../../core/engines/garman-kohlhagen';

interface PositionRow {
  pair: string;
  inputs: FxOptionInputs;
}

interface FxPreset {
  spot: number;
  domesticRate: number;
  foreignRate: number;
  vol: number;
}

// Standard reference levels for testing the aggregator, not a live feed.
// (FX quotes aren't freely fetchable without an API key, unlike the crypto
// prices used in the Live Engine Check section below.) Domestic = USD.
const FX_PRESETS: Record<string, FxPreset> = {
  'GBP/USD': { spot: 1.34, domesticRate: 0.045, foreignRate: 0.05, vol: 0.09 },
  'EUR/USD': { spot: 1.09, domesticRate: 0.045, foreignRate: 0.03, vol: 0.085 },
  'USD/JPY': { spot: 155.2, domesticRate: 0.045, foreignRate: 0.001, vol: 0.11 },
  'AUD/USD': { spot: 0.66, domesticRate: 0.045, foreignRate: 0.043, vol: 0.1 },
  'USD/CHF': { spot: 0.88, domesticRate: 0.045, foreignRate: 0.011, vol: 0.08 },
  'USD/CAD': { spot: 1.37, domesticRate: 0.045, foreignRate: 0.03, vol: 0.075 },
};

const FX_PAIRS = Object.keys(FX_PRESETS);

function buildPosition(pair: string, type: 'call' | 'put', notional: number): PositionRow {
  const preset = FX_PRESETS[pair];
  return {
    pair,
    inputs: { spot: preset.spot, strike: preset.spot, maturity: 0.25, domesticRate: preset.domesticRate, foreignRate: preset.foreignRate, vol: preset.vol, type, notional },
  };
}

@Component({
  selector: 'app-fx-risk-demo',
  standalone: true,
  imports: [CommonModule, FormsModule, ProjectDemoShellComponent],
  templateUrl: './fx-risk-demo.component.html',
  styleUrl: './fx-risk-demo.component.scss',
})
export class FxRiskDemoComponent {
  readonly repoUrl = `${GITHUB_PROFILE_URL}/Risk-Aggregrator`;
  readonly fxPairs = FX_PAIRS;

  positions: PositionRow[] = [
    buildPosition('GBP/USD', 'call', 1_000_000),
    buildPosition('EUR/USD', 'put', 750_000),
    buildPosition('USD/JPY', 'call', 500_000),
  ];

  get aggregate() {
    return aggregateFxRisk(this.positions);
  }

  onPairChange(row: PositionRow): void {
    const preset = FX_PRESETS[row.pair];
    row.inputs = { ...row.inputs, spot: preset.spot, strike: preset.spot, domesticRate: preset.domesticRate, foreignRate: preset.foreignRate, vol: preset.vol };
  }

  addPosition(): void {
    const unused = this.fxPairs.find((p) => !this.positions.some((row) => row.pair === p)) ?? this.fxPairs[0];
    this.positions.push(buildPosition(unused, 'call', 100_000));
  }

  removePosition(i: number): void {
    this.positions.splice(i, 1);
  }
}
