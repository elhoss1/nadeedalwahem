import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { WoocommerceService } from '../../services/woocommerce.service';
import { ToastrService } from 'ngx-toastr'; // 1. استيراد ToastrService

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss']
})
export class CartComponent implements OnInit {
  cartItems: any[] = [];
  total = 0;

  constructor(
    private woocommerceService: WoocommerceService,
    private toastr: ToastrService, // 2. حقن ToastrService
    private cdr: ChangeDetectorRef // حقن ChangeDetectorRef لتحسين التحديث
  ) {}

  ngOnInit(): void {
    // الاشتراك في تغييرات السلة لتحديث الواجهة تلقائيًا
    this.woocommerceService.cart$.subscribe((items) => {
      this.cartItems = items;
      this.calculateTotal();
      this.cdr.detectChanges(); // ضمان تحديث الواجهة
    });

    // لا حاجة لتحميل السلة يدويًا هنا، الـ constructor في الخدمة يقوم بذلك
    // والـ subscribe أعلاه سيتولى التحديث الأول.
  }

  calculateTotal(): void {
    this.total = this.woocommerceService.getCartTotal();
  }

  updateQuantity(productId: number, quantity: number): void {
    const newQuantity = Math.max(1, quantity); // التأكد من أن الكمية لا تقل عن 1
    this.woocommerceService.updateCartQuantity(productId, newQuantity);

    // لا داعي لإظهار توستر عند كل زيادة أو نقصان لتجنب إزعاج المستخدم
    // التحديث في الواجهة كافٍ.
  }

  removeItem(productId: number): void {
    // لا نستخدم confirm() بعد الآن
    const removedItem = this.cartItems.find(item => item.id === productId);
    if (removedItem) {
      this.woocommerceService.removeFromCart(productId);
      this.toastr.error(`تم إزالة "${removedItem.name}" من السلة.`, 'تم الحذف');
    }
  }

  clearCart(): void {
    // لا نستخدم confirm() بعد الآن
    if (this.cartItems.length > 0) {
      this.woocommerceService.clearCart();
      this.toastr.warning('تم مسح جميع المنتجات من السلة.', 'السلة فارغة');
    }
  }

  getTaxAmount(): number {
    return this.total * 0.15; // ضريبة 15%
  }

  getShippingCost(): number {
    // شحن مجاني للطلبات أكثر من 500 ريال، وإلا 50 ريال
    return this.total > 500 || this.total === 0 ? 0 : 50;
  }

  getFinalTotal(): number {
    return this.total + this.getTaxAmount() + this.getShippingCost();
  }
}
