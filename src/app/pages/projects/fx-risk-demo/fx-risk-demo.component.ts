import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProjectDemoShellComponent } from '../../../components/project-demo-shell/project-demo-shell.component';
import { githubRepoUrl } from '../../../core/constants';
import { aggregateFxRisk, FxOptionInputs } from '../../../core/engines/garman-kohlhagen';

interface PositionRow {
  pair: string;
  inputs: FxOptionInputs;
}

@Component({
  selector: 'app-fx-risk-demo',
  standalone: true,
  imports: [CommonModule, FormsModule, ProjectDemoShellComponent],
  templateUrl: './fx-risk-demo.component.html',
  styleUrl: './fx-risk-demo.component.scss',
})
export class FxRiskDemoComponent {
  readonly repoUrl = githubRepoUrl('fx-risk-aggregator');

  positions: PositionRow[] = [
    {
      pair: 'GBP/USD',
      inputs: { spot: 1.34, strike: 1.36, maturity: 0.25, domesticRate: 0.045, foreignRate: 0.05, vol: 0.09, type: 'call', notional: 1_000_000 },
    },
    {
      pair: 'EUR/USD',
      inputs: { spot: 1.09, strike: 1.07, maturity: 0.5, domesticRate: 0.045, foreignRate: 0.03, vol: 0.085, type: 'put', notional: 750_000 },
    },
    {
      pair: 'USD/JPY',
      inputs: { spot: 155.2, strike: 158, maturity: 0.17, domesticRate: 0.045, foreignRate: 0.001, vol: 0.11, type: 'call', notional: 500_000 },
    },
  ];

  get aggregate() {
    return aggregateFxRisk(this.positions);
  }

  addPosition(): void {
    this.positions.push({
      pair: 'NEW/PAIR',
      inputs: { spot: 1.0, strike: 1.0, maturity: 0.25, domesticRate: 0.04, foreignRate: 0.04, vol: 0.1, type: 'call', notional: 100_000 },
    });
  }

  removePosition(i: number): void {
    this.positions.splice(i, 1);
  }
}
