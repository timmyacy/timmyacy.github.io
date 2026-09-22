import { Component } from '@angular/core';
import { HeroComponent } from '../../components/hero/hero.component';
import { AboutComponent } from '../../components/about/about.component';
import { PricingToolsComponent } from '../../components/pricing-tools/pricing-tools.component';
import { EngineCheckComponent } from '../../components/engine-check/engine-check.component';
import { GitActivityComponent } from '../../components/git-activity/git-activity.component';
import { ApiDocsComponent } from '../../components/api-docs/api-docs.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    HeroComponent,
    AboutComponent,
    PricingToolsComponent,
    EngineCheckComponent,
    GitActivityComponent,
    ApiDocsComponent,
  ],
  templateUrl: './home.component.html',
})
export class HomeComponent {}
