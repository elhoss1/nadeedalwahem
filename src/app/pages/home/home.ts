import {
  Component,
  OnInit,
  CUSTOM_ELEMENTS_SCHEMA,
  NgZone,
  ChangeDetectorRef,
  Inject,
  PLATFORM_ID
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { WoocommerceService } from '../../services/woocommerce.service';
import { ToastrService } from 'ngx-toastr';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.html',
  styleUrls: ['./home.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class HomeComponent implements OnInit {

  sections = [
    { id: 34, name: 'تمور خام', path: '/Rawdates', products: [] as any[] },
    { id: 183, name: 'مكنوز آلي', path: '/maknoozautomaticdates', products: [] as any[] },
    { id: 21, name: 'تعبئة نثري', path: '/Surveydatesprose', products: [] as any[] },
    { id: 169, name: 'المعمول', path: '/Maamoul', products: [] as any[] },
  ];

  isLoading = true;

  constructor(
    private woo: WoocommerceService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef,
    private zone: NgZone,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // تسجيل Swiper فقط في المتصفح لمنع أخطاء السيرفر (InvalidCharacterError)
    if (isPlatformBrowser(this.platformId)) {
      import('swiper/element/bundle').then(module => {
        module.register();
      });
    }
  }

  ngOnInit(): void {
    this.loadProductsForSections();
  }

  loadProductsForSections(): void {
  this.isLoading = true;
  const requests = this.sections.map(section =>
    this.woo.getProducts({ category: section.id, per_page: 8 })
  );

  forkJoin(requests).subscribe({
    next: (results) => {
      // نستخدم setTimeout(0) لإخراج التحديث من دورة Angular الحالية وتجنب التجميد
      setTimeout(() => {
        this.zone.run(() => {
          results.forEach((products, i) => {
            this.sections[i].products = products || [];
          });
          this.isLoading = false;
          this.cdr.detectChanges();
        });
      }, 0);
    },
    error: (err) => {
      this.zone.run(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      });
    }
  });
}

  addToCart(product: any): void {
    if (!product) return;

    // تحويل السعر لرقم بشكل آمن
    const priceValue = parseFloat(product.price || '0');

    this.woo.addToCart({
      id: product.id,
      name: product.name,
      price: priceValue,
      image: this.getProductImage(product),
      quantity: 1,
      weight: parseFloat(product.weight || '0')
    });
    this.toastr.success(`تمت إضافة ${product.name}`, 'نجاح');
  }

  getProductImage(product: any): string {
    return product.images?.[0]?.src || 'assets/placeholder.png';
  }

}
