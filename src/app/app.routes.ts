import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  {
    path: 'projects/bsm-pricer',
    loadComponent: () =>
      import('./pages/projects/bsm-pricer-demo/bsm-pricer-demo.component').then((m) => m.BsmPricerDemoComponent),
  },
  {
    path: 'projects/jump-diffusion-pricer',
    loadComponent: () =>
      import('./pages/projects/jump-diffusion-demo/jump-diffusion-demo.component').then((m) => m.JumpDiffusionDemoComponent),
  },
  {
    path: 'projects/fx-risk-aggregator',
    loadComponent: () =>
      import('./pages/projects/fx-risk-demo/fx-risk-demo.component').then((m) => m.FxRiskDemoComponent),
  },
  {
    path: 'projects/trading-system',
    loadComponent: () =>
      import('./pages/projects/trading-system-demo/trading-system-demo.component').then((m) => m.TradingSystemDemoComponent),
  },
  {
    path: 'projects/mc-pricer',
    loadComponent: () =>
      import('./pages/projects/mc-pricer-demo/mc-pricer-demo.component').then((m) => m.McPricerDemoComponent),
  },
  {
    path: 'projects/mlmc-pricer',
    loadComponent: () =>
      import('./pages/projects/mlmc-demo/mlmc-demo.component').then((m) => m.MlmcDemoComponent),
  },
  {
    path: 'blog',
    loadComponent: () => import('./pages/blog-list/blog-list.component').then((m) => m.BlogListComponent),
  },
  {
    path: 'blog/:slug',
    loadComponent: () => import('./pages/blog-post/blog-post.component').then((m) => m.BlogPostComponent),
  },
  {
    path: 'admin',
    loadComponent: () => import('./pages/admin/admin.component').then((m) => m.AdminComponent),
  },
  { path: '**', redirectTo: '' },
];
