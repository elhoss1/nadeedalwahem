import { ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WoocommerceService } from '../../services/woocommerce.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule , RouterLink],
  templateUrl: './checkout.html',
  styleUrls: ['./checkout.scss']
})
export class CheckoutComponent implements OnInit {
  cartItems: any[] = [];
  cartTotal: number = 0;
  shippingCost: number = 50;
  grandTotal: number = 0;

  checkoutForm = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: 'السعودية',
    paymentMethod: 'cod' // cod: Cash on Delivery
  };

  isSubmitting = false;
  orderPlaced = false;
  orderError: string = '';

  constructor(
    private woocommerceService: WoocommerceService,
    private cdr: ChangeDetectorRef, // حقن الخدمة
    private zone: NgZone        // حقن الخدمة
  ) { }

  ngOnInit(): void {
    this.woocommerceService.cart$.subscribe(items => {
      // نلف التحديث بـ zone.run و cdr لضمان ظهور البيانات فوراً
      this.zone.run(() => {
        this.cartItems = items;
        this.cartTotal = this.woocommerceService.getCartTotal();
        this.grandTotal = this.cartTotal + this.shippingCost;
        this.cdr.detectChanges(); // تنبيه Angular بوجود تغييرات
      });
    });
  }

  placeOrder(): void {
    if (!this.validateForm()) {
      this.orderError = 'يرجى ملء جميع الحقول المطلوبة.';
      this.cdr.detectChanges(); // تحديث لعرض الخطأ
      return;
    }

    this.isSubmitting = true;
    this.orderError = '';
    this.cdr.detectChanges(); // إظهار لودر الزر فوراً

    const lineItems = this.cartItems.map(item => ({
      product_id: item.id,
      quantity: item.quantity
    }));

    const orderData = {
      payment_method: this.checkoutForm.paymentMethod,
      payment_method_title: this.checkoutForm.paymentMethod === 'cod' ? 'الدفع عند الاستلام' : 'بطاقة ائتمانية',
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
          method_id: "flat_rate",
          method_title: "شحن ثابت",
          total: this.shippingCost.toString()
        }
      ]
    };

    // محاكاة إنشاء الطلب
    setTimeout(() => {
      this.isSubmitting = false;
      this.orderPlaced = true;
      this.woocommerceService.clearCart();
    }, 2000);


    // الكود الفعلي لإنشاء الطلب (يتطلب دالة createOrder في الخدمة)
    this.woocommerceService.createOrder(orderData).subscribe({
      next: (response) => {
        this.zone.run(() => {
          this.isSubmitting = false;
          this.orderPlaced = true;
          this.woocommerceService.clearCart();
          this.cdr.detectChanges(); // إخفاء اللودر وإظهار رسالة النجاح فوراً
        });
      },
      error: (error) => {
        this.zone.run(() => {
          this.isSubmitting = false;
          this.orderError = 'حدث خطأ أثناء إتمام الطلب.';
          this.cdr.detectChanges();
          console.error('Order creation error:', error);
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
