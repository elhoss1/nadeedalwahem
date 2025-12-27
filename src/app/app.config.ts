import { ApplicationConfig } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideToastr } from 'ngx-toastr';
import { routes } from './app.routes';

// ملاحظة: قمنا بحذف provideClientHydration تماماً لأنها المسبب الرئيسي لتجمد اللودر مع Swiper
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withInMemoryScrolling({
        scrollPositionRestoration: 'top',
        anchorScrolling: 'enabled'
      })
    ),

    // تأكد أن provideAnimations موجودة هنا لضمان عمل Toastr واللودر بسلاسة
    provideAnimations(),

    // withFetch() ضرورية جداً في Angular 18 لضمان سرعة جلب البيانات
    provideHttpClient(withFetch()),

    provideToastr({
      timeOut: 3000,
      positionClass: 'toast-bottom-right',
      preventDuplicates: true,
      progressBar: true,
    }),
  ]
};
