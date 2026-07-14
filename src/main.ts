import 'zone.js';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, withHashLocation, withInMemoryScrolling } from '@angular/router';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';

// Hash-based routing: GitHub Pages serves static files with no server-side
// rewrites, so a path like /projects/bsm-pricer would 404 on a hard refresh
// or direct link. Hash URLs (/#/projects/bsm-pricer) never hit the server
// for the route part, so they always resolve.
bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(),
    provideRouter(
      routes,
      withHashLocation(),
      withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' }),
    ),
  ],
});
