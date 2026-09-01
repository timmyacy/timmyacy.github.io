import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Endpoint {
  verb: string;
  path: string;
  description: string;
  example: string;
}

@Component({
  selector: 'app-api-docs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './api-docs.component.html',
  styleUrl: './api-docs.component.scss'
})
export class ApiDocsComponent {
  readonly endpoints: Endpoint[] = [
    {
      verb: 'GET',
      path: '/v1/price',
      description: 'Call the pricing engines directly: send option parameters, get back a price and full Greeks.',
      example:
`GET /v1/price?model=bsm&spot=100&strike=105&vol=0.22&maturity=0.5&rate=0.04
Authorization: Bearer YOUR_API_KEY

{
  "price": 4.83,
  "delta": 0.421,
  "gamma": 0.031,
  "vega": 18.9,
  "theta": -6.2
}`,
    },
    {
      verb: 'GET',
      path: '/v1/markets',
      description: 'Read-only access to the live tickers tracked on this site.',
      example:
`GET /v1/markets?symbol=AAPL
Authorization: Bearer YOUR_API_KEY

{
  "symbol": "AAPL",
  "price": 231.42,
  "change_pct": 0.84,
  "timestamp": "2026-09-13T14:02:11Z"
}`,
    },
    {
      verb: 'GET',
      path: '/v1/activity',
      description: 'The same live build log shown on this page, as JSON. It\'s basically a thin wrapper around the GitHub public events API.',
      example:
`GET /v1/activity?limit=3

[
  {
    "repo": "timmyacy/MC-Pricer",
    "type": "push",
    "message": "Add put-call parity self-check to CLI output",
    "sha": "a1c9e42",
    "timestamp": "2026-09-12T09:14:03Z"
  }
]`,
    },
    {
      verb: 'GET',
      path: '/v1/profile',
      description: "The CV as structured JSON, for anyone who'd rather curl it than read a PDF.",
      example:
`GET /v1/profile

{
  "name": "Timmy Ajibode",
  "education": "MSc Mathematical Finance, York",
  "experience": "SAA Consultants, 4 yrs",
  "repos": ["BSM-Pricer", "Jump_Diffusion_Pricer", "MC-Pricer", "Risk-Aggregrator", "Trading-System", "Thesis"],
  "github": "github.com/timmyacy"
}`,
    },
  ];
}
