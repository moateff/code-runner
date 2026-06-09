// 🌟 GLOBAL INTERCEPTOR: Suppress Monaco Editor's harmless ResizeObserver loop warnings
if (typeof window !== 'undefined') {
  const rawConsoleError = console.error;
  console.error = (...args: any[]) => {
    if (args[0] && String(args[0]).includes('ResizeObserver loop completed with undelivered notifications')) {
      return;
    }
    rawConsoleError.apply(console, args);
  };

  window.addEventListener('error', (event) => {
    if (event.message && event.message.includes('ResizeObserver loop')) {
      event.stopImmediatePropagation();
    }
  });
}

import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
