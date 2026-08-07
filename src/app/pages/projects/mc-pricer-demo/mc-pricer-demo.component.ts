import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProjectDemoShellComponent } from '../../../components/project-demo-shell/project-demo-shell.component';
import { githubRepoUrl } from '../../../core/constants';
import { OptionType } from '../../../core/engines/black-scholes';
import { McOptionKind, McResult, priceMonteCarlo } from '../../../core/engines/monte-carlo-pricer';

@Component({
  selector: 'app-mc-pricer-demo',
  standalone: true,
  imports: [CommonModule, FormsModule, ProjectDemoShellComponent],
  templateUrl: './mc-pricer-demo.component.html',
  styleUrl: './mc-pricer-demo.component.scss',
})
export class McPricerDemoComponent implements OnInit {
  readonly repoUrl = githubRepoUrl('MC-Pricer');

  kind: McOptionKind = 'asian';
  type: OptionType = 'call';
  spot = 100;
  strike = 100;
  maturity = 1;
  ratePct = 5;
  volPct = 20;
  simulations = 10_000;
  numSteps = 52;
  barrier = 120;
  antithetic = true;

  result: McResult | null = null;
  running = false;

  @ViewChild('conv') convCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('paths') pathsCanvas?: ElementRef<HTMLCanvasElement>;

  get isPathDependent(): boolean {
    return this.kind === 'asian' || this.kind === 'barrier' || this.kind === 'lookback';
  }

  get isBarrier(): boolean {
    return this.kind === 'barrier';
  }

  get hasClosedForm(): boolean {
    return this.kind === 'european' || this.kind === 'binary';
  }

  ngOnInit(): void {
    this.run();
  }

  run(): void {
    this.running = true;
    // Defer one tick so the "Running…" state actually paints before the
    // (synchronous, potentially ~100-300ms) simulation blocks the thread.
    setTimeout(() => {
      this.result = priceMonteCarlo({
        kind: this.kind,
        type: this.type,
        spot: this.spot,
        strike: this.strike,
        maturity: this.maturity,
        rate: this.ratePct / 100,
        vol: this.volPct / 100,
        simulations: this.simulations,
        numSteps: this.numSteps,
        barrier: this.barrier,
        antithetic: this.antithetic,
      });
      this.running = false;
      requestAnimationFrame(() => this.draw());
    }, 20);
  }

  private draw(): void {
    if (!this.result) return;
    this.drawConvergence(this.result.convergence, this.result.closedForm);
    if (this.isPathDependent) this.drawPaths(this.result.samplePaths);
  }

  private drawConvergence(series: number[], reference?: number): void {
    const canvas = this.convCanvas?.nativeElement;
    if (!canvas || series.length < 2) return;
    const ctx = canvas.getContext('2d')!;
    const w = (canvas.width = canvas.offsetWidth * 2);
    const h = (canvas.height = canvas.offsetHeight * 2);
    ctx.clearRect(0, 0, w, h);

    const values = reference !== undefined ? [...series, reference] : series;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const y = (v: number) => h - 10 - ((v - min) / range) * (h - 20);

    if (reference !== undefined) {
      ctx.strokeStyle = 'rgba(24,27,32,0.35)';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, y(reference));
      ctx.lineTo(w, y(reference));
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.beginPath();
    ctx.strokeStyle = '#2F6F4E';
    ctx.lineWidth = 2.5;
    series.forEach((v, i) => {
      const x = (i / (series.length - 1)) * w;
      i === 0 ? ctx.moveTo(x, y(v)) : ctx.lineTo(x, y(v));
    });
    ctx.stroke();
  }

  private drawPaths(paths: number[][]): void {
    const canvas = this.pathsCanvas?.nativeElement;
    if (!canvas || paths.length === 0) return;
    const ctx = canvas.getContext('2d')!;
    const w = (canvas.width = canvas.offsetWidth * 2);
    const h = (canvas.height = canvas.offsetHeight * 2);
    ctx.clearRect(0, 0, w, h);

    const allValues = paths.flat();
    const barrierVal = this.isBarrier ? this.barrier : undefined;
    const min = Math.min(...allValues, ...(barrierVal !== undefined ? [barrierVal] : []));
    const max = Math.max(...allValues, ...(barrierVal !== undefined ? [barrierVal] : []));
    const range = max - min || 1;
    const y = (v: number) => h - 8 - ((v - min) / range) * (h - 16);

    if (barrierVal !== undefined) {
      ctx.strokeStyle = '#A8452F';
      ctx.setLineDash([5, 4]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, y(barrierVal));
      ctx.lineTo(w, y(barrierVal));
      ctx.stroke();
      ctx.setLineDash([]);
    }

    paths.forEach((path) => {
      const endsUp = path[path.length - 1] >= path[0];
      ctx.strokeStyle = endsUp ? 'rgba(47,111,78,0.55)' : 'rgba(168,69,47,0.55)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      path.forEach((v, i) => {
        const x = (i / (path.length - 1)) * w;
        i === 0 ? ctx.moveTo(x, y(v)) : ctx.lineTo(x, y(v));
      });
      ctx.stroke();
    });
  }
}
