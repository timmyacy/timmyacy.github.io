import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProjectDemoShellComponent } from '../../../components/project-demo-shell/project-demo-shell.component';
import { GITHUB_PROFILE_URL } from '../../../core/constants';
import { OptionType } from '../../../core/engines/black-scholes';
import { MlmcOptionKind, MlmcResult, MlmcScheme, priceMlmc } from '../../../core/engines/mlmc-pricer';

@Component({
  selector: 'app-mlmc-demo',
  standalone: true,
  imports: [CommonModule, FormsModule, ProjectDemoShellComponent],
  templateUrl: './mlmc-demo.component.html',
  styleUrl: './mlmc-demo.component.scss',
})
export class MlmcDemoComponent implements OnInit {
  // Source is the "European Options" MLMC notebook in the MSc thesis repo,
  // not a standalone project. This demo is a TS port of that scheme.
  readonly repoUrl = `${GITHUB_PROFILE_URL}/Thesis/blob/main/European%20Options/MLMC_Scheme_Pricer.ipynb`;

  type: OptionType = 'call';
  scheme: MlmcScheme = 'euler';
  optionKind: MlmcOptionKind = 'european';
  spot = 100;
  strike = 100;
  maturity = 1;
  ratePct = 5;
  volPct = 20;
  levels = 6;
  basePaths = 4000;

  result: MlmcResult | null = null;
  running = false;

  @ViewChild('varChart') varCanvas?: ElementRef<HTMLCanvasElement>;

  get costRatio(): number {
    if (!this.result) return 0;
    return this.result.naiveMc.cost / this.result.mlmcCost;
  }

  get hasExactReference(): boolean {
    return this.optionKind === 'european';
  }

  ngOnInit(): void {
    this.run();
  }

  run(): void {
    this.running = true;
    setTimeout(() => {
      this.result = priceMlmc({
        spot: this.spot,
        strike: this.strike,
        maturity: this.maturity,
        rate: this.ratePct / 100,
        vol: this.volPct / 100,
        type: this.type,
        scheme: this.scheme,
        optionKind: this.optionKind,
        levels: this.levels,
        basePaths: this.basePaths,
      });
      this.running = false;
      requestAnimationFrame(() => this.drawVarianceChart());
    }, 20);
  }

  private drawVarianceChart(): void {
    const canvas = this.varCanvas?.nativeElement;
    if (!canvas || !this.result) return;
    const ctx = canvas.getContext('2d')!;
    const w = (canvas.width = canvas.offsetWidth * 2);
    const h = (canvas.height = canvas.offsetHeight * 2);
    ctx.clearRect(0, 0, w, h);

    const log2Var = this.result.levels.map((l) => Math.log2(Math.max(l.varY, 1e-12)));
    const min = Math.min(...log2Var);
    const max = Math.max(...log2Var);
    const range = max - min || 1;
    const n = log2Var.length;
    const barW = (w / n) * 0.6;

    log2Var.forEach((v, i) => {
      const x = (i / n) * w + (w / n - barW) / 2;
      const barH = ((v - min) / range) * (h - 30);
      ctx.fillStyle = '#2F6F4E';
      ctx.fillRect(x, h - 20 - barH, barW, barH);

      ctx.fillStyle = '#4A4E56';
      ctx.font = '20px "IBM Plex Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`L${i}`, x + barW / 2, h - 4);
    });
  }
}
