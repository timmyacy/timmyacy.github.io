import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Dataset {
  category: string;
  count: string;
  tag: string;
}

@Component({
  selector: 'app-datasets',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './datasets.component.html',
  styleUrl: './datasets.component.scss'
})
export class DatasetsComponent {
  // Placeholder counts, replace with real numbers once the data
  // pipeline exists. Don't ship invented figures to production.
  readonly datasets: Dataset[] = [
    { category: 'EQUITIES',     count: '-', tag: 'CSV / PARQUET' },
    { category: 'FX PAIRS',     count: '-', tag: 'TICK DATA' },
    { category: 'CRYPTO',       count: '-', tag: 'OHLCV' },
    { category: 'MACRO SERIES', count: '-', tag: 'FRED-SOURCED' },
  ];
}
