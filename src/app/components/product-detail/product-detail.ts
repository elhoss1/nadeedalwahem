import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core'; // أضفنا هؤلاء
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { WoocommerceService } from '../../services/woocommerce.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-product-detail',
  standalone: true, // تأكد أنها standalone
  imports: [CommonModule, RouterModule],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.scss',
})
export class ProductDetailComponent implements OnInit {
  product: any = null;
  relatedProducts: any[] = [];
  isLoading = true;
  quantity = 1;
  selectedImage = '';

  constructor(
    private route: ActivatedRoute,
    private woocommerceService: WoocommerceService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef, // حقن الخدمة
    private zone: NgZone           // حقن الخدمة
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const productId = params.get('id');
      if (productId) {
        this.quantity = 1;
        this.loadProductDetails(+productId);
      }
    });
  }

  loadProductDetails(id: number): void {
    this.isLoading = true;
    this.cdr.detectChanges(); // تحديث فوري لإظهار اللودر

    this.woocommerceService.getProduct(id).subscribe({
      next: (data) => {
        // نستخدم zone.run لضمان العودة لبيئة Angular وتحديث الواجهة
        this.zone.run(() => {
          this.product = data;
          if (this.product.images && this.product.images.length > 0) {
            this.selectedImage = this.product.images[0].src;
          }
          this.isLoading = false;

          // جلب المنتجات ذات الصلة
          if (this.product.categories && this.product.categories.length > 0) {
            this.loadRelatedProducts(this.product.categories[0].id, this.product.id);
          }

          this.cdr.detectChanges(); // إجبار المتصفح على الرسم الآن
        });
      },
      error: (err) => {
        this.zone.run(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
          this.toastr.error('حدث خطأ أثناء تحميل تفاصيل المنتج.');
        });
      }
    });
  }

  loadRelatedProducts(categoryId: number, currentProductId: number): void {
    const params = {
      per_page: 5,
      category: categoryId,
      exclude: [currentProductId]
    };
    this.woocommerceService.getProducts(params).subscribe(data => {
      this.zone.run(() => {
        this.relatedProducts = data;
        this.cdr.detectChanges();
      });
    });
  }

  // تغيير الصورة الرئيسية عند النقر على صورة مصغرة
  selectImage(imageUrl: string): void {
    this.selectedImage = imageUrl;
  }

  // زيادة الكمية
  increaseQuantity(): void {
    this.quantity++;
  }

  // إنقاص الكمية
  decreaseQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  // إضافة المنتج للسلة
  addToCart(): void {
    if (!this.product) return;
    this.woocommerceService.addToCart({
      id: this.product.id,
      name: this.product.name,
      price: parseFloat(this.product.price),
      image: this.product.images?.[0]?.src || '/placeholder.png',
      quantity: this.quantity
    });
    this.toastr.success(`تمت إضافة ${this.quantity}x من "${this.product.name}" إلى السلة!`);
  }
}
