import { Component, OnInit } from '@angular/core';
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

  constructor(private woocommerceService: WoocommerceService) { }

  ngOnInit(): void {
    this.woocommerceService.cart$.subscribe(items => {
      this.cartItems = items;
      this.cartTotal = this.woocommerceService.getCartTotal();
      this.grandTotal = this.cartTotal + this.shippingCost;
    });

    if (this.cartItems.length === 0) {
      // توجيه المستخدم إلى السلة إذا كانت فارغة
      // يجب إضافة Router في imports وتوجيه المستخدم
    }
  }

  placeOrder(): void {
    if (!this.validateForm()) {
      this.orderError = 'يرجى ملء جميع الحقول المطلوبة.';
      return;
    }

    this.isSubmitting = true;
    this.orderError = '';

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
    this.woocommerceService.createOrder(orderData).subscribe(
      (response) => {
        this.isSubmitting = false;
        this.orderPlaced = true;
        this.woocommerceService.clearCart();
        // يمكن توجيه المستخدم لصفحة شكر
      },
      (error) => {
        this.isSubmitting = false;
        this.orderError = 'حدث خطأ أثناء إتمام الطلب. يرجى المحاولة مرة أخرى.';
        console.error('Order creation error:', error);
      }
    );

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
