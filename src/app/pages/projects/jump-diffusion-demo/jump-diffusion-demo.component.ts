import { Component, AfterViewInit, ElementRef, ViewChild, DoCheck } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProjectDemoShellComponent } from '../../../components/project-demo-shell/project-demo-shell.component';
import { githubRepoUrl } from '../../../core/constants';
import { blackScholes } from '../../../core/engines/black-scholes';
import { mertonJumpDiffusion, MertonResult } from '../../../core/engines/merton-jump-diffusion';

@Component({
  selector: 'app-jump-diffusion-demo',
  standalone: true,
  imports: [CommonModule, FormsModule, ProjectDemoShellComponent],
  templateUrl: './jump-diffusion-demo.component.html',
  styleUrl: './jump-diffusion-demo.component.scss',
})
export class JumpDiffusionDemoComponent implements AfterViewInit, DoCheck {
  readonly repoUrl = githubRepoUrl('jump-diffusion-pricer');

  spot = 100;
  strike = 105;
  maturity = 0.5;
  ratePct = 4;
  volPct = 18;
  jumpIntensity = 0.6; // jumps/year
  jumpMeanPct = -2;    // mean log-jump, %
  jumpVolPct = 12;     // log-jump vol, %

  @ViewChild('conv') convCanvas!: ElementRef<HTMLCanvasElement>;
  private lastSignature = '';

  get merton(): MertonResult {
    return mertonJumpDiffusion({
      spot: this.spot,
      strike: this.strike,
      maturity: this.maturity,
      rate: this.ratePct / 100,
      vol: this.volPct / 100,
      type: 'call',
      jumpIntensity: this.jumpIntensity,
      jumpMean: this.jumpMeanPct / 100,
      jumpVol: this.jumpVolPct / 100,
    });
  }

  get plainBsmPrice(): number {
    return blackScholes({
      spot: this.spot,
      strike: this.strike,
      maturity: this.maturity,
      rate: this.ratePct / 100,
      vol: this.volPct / 100,
      type: 'call',
    }).price;
  }

  get jumpRiskPremium(): number {
    return this.merton.price - this.plainBsmPrice;
  }

  ngAfterViewInit(): void {
    this.drawConvergence();
  }

  ngDoCheck(): void {
    const sig = [this.spot, this.strike, this.maturity, this.ratePct, this.volPct, this.jumpIntensity, this.jumpMeanPct, this.jumpVolPct].join('|');
    if (sig !== this.lastSignature && this.convCanvas) {
      this.lastSignature = sig;
      this.drawConvergence();
    }
  }

  private drawConvergence(): void {
    const canvas = this.convCanvas.nativeElement;
    const ctx = canvas.getContext('2d')!;
    const w = (canvas.width = canvas.offsetWidth * 2);
    const h = (canvas.height = canvas.offsetHeight * 2);
    ctx.clearRect(0, 0, w, h);

    const sums = this.merton.partialSums;
    const min = Math.min(...sums);
    const max = Math.max(...sums);
    const range = max - min || 1;

    ctx.beginPath();
    ctx.strokeStyle = '#2F6F4E';
    ctx.lineWidth = 2.5;
    sums.forEach((v, i) => {
      const x = (i / (sums.length - 1)) * w;
      const y = h - 10 - ((v - min) / range) * (h - 20);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();
  }
}
