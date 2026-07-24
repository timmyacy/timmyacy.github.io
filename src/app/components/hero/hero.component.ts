import { Component, AfterViewInit, ElementRef, ViewChildren, QueryList } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Ticker {
  symbol: string;
  price: string;
  changePct: string;
  trend: 'up' | 'down';
}

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.scss'
})
export class HeroComponent implements AfterViewInit {
  // In the real app this comes from a MarketDataService hitting /v1/markets,
  // not a hardcoded array. This is just mock data for the mockup.
  readonly tickers: Ticker[] = [
    { symbol: 'AAPL',    price: '$231.42',   changePct: '+0.84%', trend: 'up' },
    { symbol: 'BTC-USD', price: '$61,204',   changePct: '-1.12%', trend: 'down' },
    { symbol: 'GBP/USD', price: '1.3417',    changePct: '+0.21%', trend: 'up' },
    { symbol: 'SPX',     price: '5,842.6',   changePct: '+0.36%', trend: 'up' },
    { symbol: 'US10Y',   price: '4.128%',    changePct: '-0.03%', trend: 'down' },
    { symbol: 'XAU/USD', price: '2,614.8',   changePct: '+0.58%', trend: 'up' },
  ];

  @ViewChildren('spark') sparkCanvases!: QueryList<ElementRef<HTMLCanvasElement>>;

  ngAfterViewInit(): void {
    this.sparkCanvases.forEach((ref, i) => this.drawSpark(ref.nativeElement, this.tickers[i].trend));
  }

  private drawSpark(canvas: HTMLCanvasElement, trend: 'up' | 'down'): void {
    const ctx = canvas.getContext('2d')!;
    const w = (canvas.width = canvas.offsetWidth * 2);
    const h = (canvas.height = canvas.offsetHeight * 2);
    const points: number[] = [];
    let v = h / 2;
    for (let i = 0; i < 24; i++) {
      const bias = trend === 'up' ? -1.3 : 1.3;
      v += (Math.random() - 0.5) * 10 + bias;
      v = Math.max(6, Math.min(h - 6, v));
      points.push(v);
    }
    ctx.beginPath();
    ctx.strokeStyle = trend === 'up' ? '#2F6F4E' : '#A8452F';
    ctx.lineWidth = 2;
    points.forEach((p, i) => {
      const x = (i / (points.length - 1)) * w;
      i === 0 ? ctx.moveTo(x, p) : ctx.lineTo(x, p);
    });
    ctx.stroke();
  }
}
