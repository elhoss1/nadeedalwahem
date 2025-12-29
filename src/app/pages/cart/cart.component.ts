import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { WoocommerceService } from '../../services/woocommerce.service';
import { ToastrService } from 'ngx-toastr';

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

  // 🔥 الوزن والشحن
  totalWeight = 0;
  shippingCost = 0;

  constructor(
    private woocommerceService: WoocommerceService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.woocommerceService.cart$.subscribe((items) => {
      this.cartItems = items;

      // إجمالي المنتجات
      this.total = this.woocommerceService.getCartTotal();

      // حساب الوزن
      this.totalWeight = this.calculateTotalWeight();

      // حساب الشحن
      this.shippingCost = this.calculateShippingCost(this.totalWeight);

      this.cdr.detectChanges();
    });
  }

  // =========================
  // 🔥 حساب الوزن الإجمالي
  // =========================
  calculateTotalWeight(): number {
    return this.cartItems.reduce((total, item) => {
      return total + (item.weight * item.quantity);
    }, 0);
  }

  // =========================
  // 🔥 هل يوجد منتج بدون وزن؟
  // =========================
  hasProductWithoutWeight(): boolean {
    return this.cartItems.some(item => {
      return item.quantity > 0 && item.weight <= 0;
    });
  }

  // =========================
  // 🔥 حساب الشحن
  // =========================
  calculateShippingCost(weight: number): number {

    // 🟡 شحن ثابت لو في منتج بدون وزن
    if (this.hasProductWithoutWeight()) {
      return 25;
    }

    // 🟢 شحن حسب الوزن
    if (weight <= 0) return 0;

    const stepWeight = 20; // كل 20 كجم
    const stepPrice = 25;  // 25 ريال

    return Math.ceil(weight / stepWeight) * stepPrice;
  }

  // =========================
  // تحديث الكمية
  // =========================
  updateQuantity(productId: number, quantity: number): void {
    const newQuantity = Math.max(1, quantity);
    this.woocommerceService.updateCartQuantity(productId, newQuantity);
  }

  // =========================
  // حذف عنصر
  // =========================
  removeItem(productId: number): void {
    const removedItem = this.cartItems.find(item => item.id === productId);
    if (removedItem) {
      this.woocommerceService.removeFromCart(productId);
      this.toastr.error(`تم إزالة "${removedItem.name}" من السلة.`, 'تم الحذف');
    }
  }

  // =========================
  // مسح السلة
  // =========================
  clearCart(): void {
    if (this.cartItems.length > 0) {
      this.woocommerceService.clearCart();
      this.toastr.warning('تم مسح جميع المنتجات من السلة.', 'السلة فارغة');
    }
  }

  // =========================
  // الضريبة
  // =========================
  // getTaxAmount(): number {
  //   return this.total * 0.15;
  // }

  // =========================
  // الشحن (لـ HTML)
  // =========================
  getShippingCost(): number {
    return this.shippingCost;
  }

  // =========================
  // الإجمالي النهائي
  // =========================
  getFinalTotal(): number {
    return this.total + this.getShippingCost();
  }
}
