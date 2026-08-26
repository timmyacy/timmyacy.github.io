import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { GITHUB_PROFILE_URL, githubRepoUrl } from '../../core/constants';

interface Tool {
  name: string;
  lang: string;
  description: string;
  stat: string;
  repoUrl: string;
  demoRoute: string;
}

@Component({
  selector: 'app-pricing-tools',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './pricing-tools.component.html',
  styleUrl: './pricing-tools.component.scss'
})
export class PricingToolsComponent {
  readonly tools: Tool[] = [
    {
      name: 'BSM-Pricer',
      lang: 'C++',
      description: 'Black-Scholes engine with full Greeks and put-call parity self-checks, plus a CSV batch mode for pricing a whole book in one pass.',
      stat: '58/58 unit tests passing',
      repoUrl: githubRepoUrl('BSM-Pricer'),
      demoRoute: '/projects/bsm-pricer',
    },
    {
      name: 'Jump-Diffusion Pricer',
      lang: 'C++',
      description: 'Carr-Madan FFT pricer built on a Cooley-Tukey FFT written from scratch, covering Merton jump-diffusion and Variance Gamma.',
      stat: 'Verified: semi-analytic, FFT and Monte Carlo agree',
      repoUrl: githubRepoUrl('Jump_Diffusion_Pricer'),
      demoRoute: '/projects/jump-diffusion-pricer',
    },
    {
      name: 'MC-Pricer',
      lang: 'C++',
      description: 'Monte Carlo engine covering five option types (European, Binary, Asian, Barrier and Lookback) via GBM paths, a Box-Muller normal generator, and antithetic variance reduction.',
      stat: 'European price converges to Black-Scholes within ±0.02 at N=1,000,000',
      repoUrl: githubRepoUrl('MC-Pricer'),
      demoRoute: '/projects/mc-pricer',
    },
    {
      name: 'MLMC-Pricer',
      lang: 'Python',
      description: 'Multilevel Monte Carlo (Giles, 2008) for European options, from my MSc thesis. Couples fine and coarse Euler-Maruyama paths from the same Brownian path to cut simulation cost by an order of magnitude over standard MC. The thesis also extends it to Asian options and a Heston stochastic vol model.',
      stat: 'Typically 5-15x cheaper than single-level MC for equal accuracy',
      repoUrl: `${GITHUB_PROFILE_URL}/Thesis/blob/main/European%20Options/MLMC_Scheme_Pricer.ipynb`,
      demoRoute: '/projects/mlmc-pricer',
    },
    {
      name: 'FX Risk Aggregator',
      lang: 'Python',
      description: 'Garman-Kohlhagen pricing with a Pydantic data layer for a portfolio of FX options positions.',
      stat: 'Found & fixed a cross-currency Greek aggregation bug',
      repoUrl: githubRepoUrl('Risk-Aggregrator'),
      demoRoute: '/projects/fx-risk-aggregator',
    },
    {
      name: 'Trading-System',
      lang: 'C++',
      description: 'FIX order parsing, a UDP market data feed, a price-time priority order book, and a position manager.',
      stat: 'Risk engine outputs mark-to-market P&L and VaR each cycle',
      repoUrl: githubRepoUrl('Trading-System'),
      demoRoute: '/projects/trading-system',
    },
  ];
}
