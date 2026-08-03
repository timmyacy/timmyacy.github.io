import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProjectDemoShellComponent } from '../../../components/project-demo-shell/project-demo-shell.component';
import { githubRepoUrl } from '../../../core/constants';
import { blackScholes, OptionType, putCallParityCheck } from '../../../core/engines/black-scholes';

@Component({
  selector: 'app-bsm-pricer-demo',
  standalone: true,
  imports: [CommonModule, FormsModule, ProjectDemoShellComponent],
  templateUrl: './bsm-pricer-demo.component.html',
  styleUrl: './bsm-pricer-demo.component.scss',
})
export class BsmPricerDemoComponent {
  readonly repoUrl = githubRepoUrl('bsm-pricer');

  spot = 100;
  strike = 105;
  maturity = 0.5;
  ratePct = 4;
  volPct = 22;
  type: OptionType = 'call';

  get result() {
    return blackScholes({
      spot: this.spot,
      strike: this.strike,
      maturity: this.maturity,
      rate: this.ratePct / 100,
      vol: this.volPct / 100,
      type: this.type,
    });
  }

  get parity() {
    return putCallParityCheck({
      spot: this.spot,
      strike: this.strike,
      maturity: this.maturity,
      rate: this.ratePct / 100,
      vol: this.volPct / 100,
    });
  }
}
