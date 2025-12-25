import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { WoocommerceService } from '../../services/woocommerce.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-product-detail',
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
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    // استخراج 'id' المنتج من الرابط
    const productId = this.route.snapshot.paramMap.get('id');

    if (productId) {
      this.loadProductDetails(+productId); // علامة + لتحويل النص إلى رقم
    }
  }

  loadProductDetails(id: number): void {
    this.isLoading = true;
    this.woocommerceService.getProduct(id).subscribe({
      next: (data) => {
        this.product = data;
        // تعيين الصورة الرئيسية عند تحميل المنتج
        if (this.product.images && this.product.images.length > 0) {
          this.selectedImage = this.product.images[0].src;
        }
        this.isLoading = false;
        // جلب المنتجات ذات الصلة بناءً على تصنيف المنتج الحالي
        if (this.product.categories && this.product.categories.length > 0) {
          this.loadRelatedProducts(this.product.categories[0].id, this.product.id);
        }
      },
      error: (err) => {
        console.error('Error loading product details:', err);
        this.isLoading = false;
        this.toastr.error('حدث خطأ أثناء تحميل تفاصيل المنتج.');
      }
    });
  }

  loadRelatedProducts(categoryId: number, currentProductId: number): void {
    const params = {
      per_page: 5, // عدد المنتجات ذات الصلة
      category: categoryId,
      exclude: [currentProductId] // استثناء المنتج الحالي من القائمة
    };
    this.woocommerceService.getProducts(params).subscribe(data => {
      this.relatedProducts = data;
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
