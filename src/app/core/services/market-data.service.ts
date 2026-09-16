import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';

/**
 * CoinGecko's public price endpoint is one of the few free, keyless market
 * data APIs that actually sends CORS headers, so it's the only asset class
 * this static site can pull a genuinely live spot price from in-browser.
 * Equities (Yahoo Finance) and FX (Frankfurter) were checked and both omit
 * Access-Control-Allow-Origin, so they'd silently fail from a browser fetch.
 */
@Injectable({ providedIn: 'root' })
export class MarketDataService {
  constructor(private readonly http: HttpClient) {}

  getSpotPrices(coingeckoIds: string[]): Observable<Record<string, number>> {
    const ids = coingeckoIds.join(',');
    return this.http
      .get<Record<string, { usd: number }>>(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`)
      .pipe(
        map((res) => Object.fromEntries(Object.entries(res).map(([id, v]) => [id, v.usd]))),
        catchError(() => of({})),
      );
  }
}
