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
      path: '/v1/profile',
      description: "The CV as structured JSON, for anyone who'd rather curl it than read a PDF. Genuinely live, this is a real static file, not a mocked example.",
      example:
`curl https://timmyacy.github.io/v1/profile

{
  "name": "Oluwatimilehin Ajibode",
  "preferred_name": "Timmy",
  "education": [
    { "degree": "MSc Mathematical Finance (Distinction)", "school": "University of York", "thesis": "Multi-Level Monte Carlo methods for options pricing (84%)" }
  ],
  "projects": [
    { "name": "C++ Algorithmic Trading System", "demo": "https://timmyacy.github.io/#/projects/trading-system" },
    "..."
  ],
  "github": "https://github.com/timmyacy"
}`,
    },
    {
      verb: 'GET',
      path: '/cv.txt',
      description: 'The CV again, but as plain text this time, formatted to read well straight out of a terminal. Also genuinely real, try it.',
      example:
`curl https://timmyacy.github.io/cv.txt

OLUWATIMILEHIN AJIBODE
(known as Timmy)
Quant Developer / Quant Analyst
...`,
    },
  ];
}
