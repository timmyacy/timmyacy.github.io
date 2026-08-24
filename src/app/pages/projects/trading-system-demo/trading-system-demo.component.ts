import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProjectDemoShellComponent } from '../../../components/project-demo-shell/project-demo-shell.component';
import { githubRepoUrl } from '../../../core/constants';
import { generateReplaySession, ReplayTick, Trade } from '../../../core/engines/order-book-replay';

@Component({
  selector: 'app-trading-system-demo',
  standalone: true,
  imports: [CommonModule, ProjectDemoShellComponent],
  templateUrl: './trading-system-demo.component.html',
  styleUrl: './trading-system-demo.component.scss',
})
export class TradingSystemDemoComponent implements OnInit, AfterViewInit, OnDestroy {
  readonly repoUrl = githubRepoUrl('Trading-System');
  session: ReplayTick[] = generateReplaySession();

  index = 0;
  playing = true;
  tape: Trade[] = [];

  @ViewChild('pnlChart') pnlCanvas!: ElementRef<HTMLCanvasElement>;
  private timer?: ReturnType<typeof setInterval>;

  get current(): ReplayTick {
    return this.session[this.index];
  }

  get reversedAsks() {
    return this.current.asks.slice().reverse();
  }

  get finished(): boolean {
    return this.index >= this.session.length - 1;
  }

  ngOnInit(): void {
    this.timer = setInterval(() => this.step(), 220);
  }

  ngAfterViewInit(): void {
    this.drawPnl();
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  toggle(): void {
    if (this.finished) {
      this.restart();
      return;
    }
    this.playing = !this.playing;
  }

  restart(): void {
    this.session = generateReplaySession();
    this.index = 0;
    this.tape = [];
    this.playing = true;
    this.drawPnl();
  }

  private step(): void {
    if (!this.playing) return;
    if (this.finished) {
      this.playing = false;
      return;
    }
    this.index++;
    const trade = this.current.trade;
    if (trade) {
      this.tape.unshift(trade);
      if (this.tape.length > 8) this.tape.pop();
    }
    this.drawPnl();
  }

  private drawPnl(): void {
    if (!this.pnlCanvas) return;
    const canvas = this.pnlCanvas.nativeElement;
    const ctx = canvas.getContext('2d')!;
    const w = (canvas.width = canvas.offsetWidth * 2);
    const h = (canvas.height = canvas.offsetHeight * 2);
    ctx.clearRect(0, 0, w, h);

    const series = this.session.slice(0, this.index + 1).map((t) => t.pnl);
    if (series.length < 2) return;

    const min = Math.min(...series, 0);
    const max = Math.max(...series, 0);
    const range = max - min || 1;

    const zeroY = h - 10 - ((0 - min) / range) * (h - 20);
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, zeroY);
    ctx.lineTo(w, zeroY);
    ctx.stroke();

    ctx.beginPath();
    ctx.strokeStyle = series[series.length - 1] >= 0 ? '#8FD1A8' : '#E0A08C';
    ctx.lineWidth = 2.5;
    series.forEach((v, i) => {
      const x = (i / (this.session.length - 1)) * w;
      const y = h - 10 - ((v - min) / range) * (h - 20);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();
  }
}
