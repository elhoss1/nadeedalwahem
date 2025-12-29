import { ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WoocommerceService } from '../../services/woocommerce.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './checkout.html',
  styleUrls: ['./checkout.scss']
})
export class CheckoutComponent implements OnInit {

  cartItems: any[] = [];
  cartTotal: number = 0;

  // 🔥 الوزن والشحن
  totalWeight: number = 0;
  shippingCost: number = 0;

  grandTotal: number = 0;

  checkoutForm = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: 'السعودية',
    paymentMethod: 'cod'
  };

  isSubmitting = false;
  orderPlaced = false;
  orderError: string = '';

  constructor(
    private woocommerceService: WoocommerceService,
    private cdr: ChangeDetectorRef,
    private zone: NgZone
  ) {}

  ngOnInit(): void {
    this.woocommerceService.cart$.subscribe(items => {
      this.zone.run(() => {
        this.cartItems = items;

        // إجمالي المنتجات
        this.cartTotal = this.woocommerceService.getCartTotal();

        // حساب الوزن
        this.totalWeight = this.calculateTotalWeight();

        // حساب الشحن (ثابت أو حسب الوزن)
        this.shippingCost = this.calculateShippingCost(this.totalWeight);

        // الإجمالي النهائي
        this.grandTotal = this.cartTotal + this.shippingCost;

        this.cdr.detectChanges();
      });
    });
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
  // 🔥 حساب الوزن الإجمالي
  // =========================
  calculateTotalWeight(): number {
    return this.cartItems.reduce((total, item) => {
      return total + (item.weight * item.quantity);
    }, 0);
  }



  // =========================
  // 🔥 حساب الشحن
  // =========================
  calculateShippingCost(weight: number): number {

  if (this.hasProductWithoutWeight()) {
    return 25;
  }

  const stepWeight = 20;
  const stepPrice = 25;

  return Math.ceil(weight / stepWeight) * stepPrice;
}


  // =========================
  // إنشاء الطلب
  // =========================
  placeOrder(): void {
    if (!this.validateForm()) {
      this.orderError = 'يرجى ملء جميع الحقول المطلوبة.';
      this.cdr.detectChanges();
      return;
    }

    this.isSubmitting = true;
    this.orderError = '';
    this.cdr.detectChanges();

    const lineItems = this.cartItems.map(item => ({
      product_id: item.id,
      quantity: item.quantity
    }));

    const orderData = {
      payment_method: this.checkoutForm.paymentMethod,
      payment_method_title: 'الدفع عند الاستلام',
      set_paid: false,
      billing: {
        first_name: this.checkoutForm.firstName,
        last_name: this.checkoutForm.lastName,
        address_1: this.checkoutForm.address,
        city: this.checkoutForm.city,
        country: this.checkoutForm.country,
        email: this.checkoutForm.email,
        phone: this.checkoutForm.phone
      },
      shipping: {
        first_name: this.checkoutForm.firstName,
        last_name: this.checkoutForm.lastName,
        address_1: this.checkoutForm.address,
        city: this.checkoutForm.city,
        country: this.checkoutForm.country
      },
      line_items: lineItems,
      shipping_lines: [
        {
          method_id: 'weight_based',
          method_title: this.hasProductWithoutWeight()
            ? 'شحن ثابت'
            : `شحن حسب الوزن (${this.totalWeight.toFixed(1)} كجم)`,
          total: this.shippingCost.toString()
        }
      ]
    };

    this.woocommerceService.createOrder(orderData).subscribe({
      next: () => {
        this.zone.run(() => {
          this.isSubmitting = false;
          this.orderPlaced = true;
          this.woocommerceService.clearCart();
          this.cdr.detectChanges();
        });
      },
      error: (error) => {
        this.zone.run(() => {
          this.isSubmitting = false;
          this.orderError = 'حدث خطأ أثناء إتمام الطلب.';
          console.error(error);
          this.cdr.detectChanges();
        });
      }
    });
  }

  validateForm(): boolean {
    return (
      this.checkoutForm.firstName.trim() !== '' &&
      this.checkoutForm.lastName.trim() !== '' &&
      this.checkoutForm.email.trim() !== '' &&
      this.checkoutForm.phone.trim() !== '' &&
      this.checkoutForm.address.trim() !== '' &&
      this.checkoutForm.city.trim() !== ''
    );
  }
}
