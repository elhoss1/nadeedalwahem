import {
  Component,
  OnInit,
  ChangeDetectorRef,
  NgZone
} from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { ToastrService } from 'ngx-toastr';
import { WoocommerceService } from '../../services/woocommerce.service';
import { CategoriesBarComponent } from "../categories-bar/categories-bar";

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, CategoriesBarComponent],
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
    private router: Router,
    private woocommerceService: WoocommerceService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef,
    private zone: NgZone,
    private titleService: Title
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
    this.cdr.detectChanges();

    this.woocommerceService.getProduct(id).subscribe({
      next: (data) => {
        this.zone.run(() => {
          this.product = data;

          // ✅ Title المتصفح
          this.titleService.setTitle(`${this.product.name} | متجرنا`);

          // ✅ تصحيح الرابط بالـ slug
          const slug = this.slugify(this.product.name);
          const currentSlug = this.route.snapshot.paramMap.get('slug');

          if (currentSlug !== slug) {
            this.router.navigate(
              ['/products', this.product.id, slug],
              { replaceUrl: true }
            );
          }




          if (this.product.images?.length) {
            this.selectedImage = this.product.images[0].src;
          }

          this.isLoading = false;

          if (this.product.categories?.length) {
            this.loadRelatedProducts(
              this.product.categories[0].id,
              this.product.id
            );
          }

          this.cdr.detectChanges();
        });
      },
      error: () => {
        this.zone.run(() => {
          this.isLoading = false;
          this.toastr.error('حدث خطأ أثناء تحميل تفاصيل المنتج');
          this.cdr.detectChanges();
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

  selectImage(imageUrl: string): void {
    this.selectedImage = imageUrl;
  }

  increaseQuantity(): void {
    this.quantity++;
  }

  decreaseQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  addToCart(): void {
    if (!this.product) return;

    this.woocommerceService.addToCart({
      id: this.product.id,
      name: this.product.name,
      price: parseFloat(this.product.price),
      image: this.product.images?.[0]?.src || '/placeholder.png',
      quantity: this.quantity
    });

    this.toastr.success(
      `تمت إضافة ${this.quantity}x من "${this.product.name}" إلى السلة`
    );
  }

  // ✅ تحويل اسم المنتج إلى slug
  slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\u0600-\u06FFa-z0-9-]/g, '');
  }
}
