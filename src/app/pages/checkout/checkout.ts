import { ChangeDetectorRef, Component, NgZone, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
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

  // الوزن والشحن
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
    paymentMethod: 'moyasar' // القيمة الافتراضية هي الدفع الإلكتروني
  };

  isSubmitting = false;
  orderPlaced = false;
  orderError: string = '';

  constructor(
    private woocommerceService: WoocommerceService,
    private cdr: ChangeDetectorRef,
    private zone: NgZone,
    // =================================================================
    // 🔥 جديد: حقن PLATFORM_ID للتحقق من بيئة المتصفح
    // =================================================================
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.woocommerceService.cart$.subscribe(items => {
      this.zone.run(() => {
        this.cartItems = items;
        this.cartTotal = this.woocommerceService.getCartTotal();
        this.totalWeight = this.calculateTotalWeight();
        this.shippingCost = this.calculateShippingCost(this.totalWeight);
        this.grandTotal = this.cartTotal + this.shippingCost;
        this.cdr.detectChanges();
      });
    });
  }

  // =========================
  // دوال حساب الوزن والشحن (تبقى كما هي)
  // =========================
  hasProductWithoutWeight(): boolean {
    return this.cartItems.some(item => item.quantity > 0 && !item.weight);
  }

  calculateTotalWeight(): number {
    return this.cartItems.reduce((total, item) => total + ((item.weight || 0) * item.quantity), 0);
  }

  calculateShippingCost(weight: number): number {
    if (this.hasProductWithoutWeight()) {
      return 25; // شحن ثابت إذا كان هناك منتج بدون وزن
    }
    const stepWeight = 20;
    const stepPrice = 25;
    if (weight === 0) return 0; // لا توجد تكلفة شحن إذا كانت السلة فارغة
    return Math.ceil(weight / stepWeight) * stepPrice;
  }

  // =========================
  // التحقق من صحة النموذج (يبقى كما هو)
  // =========================
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

  // =================================================================
  // 🔥 تعديل كبير: دالة إنشاء الطلب المحدثة بالكامل
  // =================================================================
  placeOrder(): void {
    if (!this.validateForm()) {
      this.orderError = 'يرجى ملء جميع الحقول المطلوبة.';
      this.cdr.detectChanges();
      return;
    }

    this.isSubmitting = true;
    this.orderError = '';
    this.cdr.detectChanges();

    const isOnlinePayment = this.checkoutForm.paymentMethod === 'moyasar';

    const orderData = {
      payment_method: isOnlinePayment ? 'moyasar' : 'cod',
      payment_method_title: isOnlinePayment ? 'الدفع الإلكتروني (ميسّر)' : 'الدفع عند الاستلام',
      set_paid: false, // سيتم تحديثها لاحقاً عبر الـ webhook للدفع الإلكتروني
      billing: {
        first_name: this.checkoutForm.firstName,
        address_1: this.checkoutForm.address,
        city: this.checkoutForm.city,
        country: this.checkoutForm.country,
        email: this.checkoutForm.email,
        phone: this.checkoutForm.phone
      },
      shipping: {
        first_name: this.checkoutForm.firstName,
        address_1: this.checkoutForm.address,
        city: this.checkoutForm.city,
        country: this.checkoutForm.country
      },
      line_items: this.cartItems.map(item => ({
        product_id: item.id,
        quantity: item.quantity
      })),
      shipping_lines: [
        {
          method_id: 'weight_based_shipping',
          method_title: this.hasProductWithoutWeight()
            ? 'شحن ثابت'
            : `شحن حسب الوزن (${this.totalWeight.toFixed(1)} كجم)`,
          total: this.shippingCost.toString()
        }
      ]
    };

    // 1. إنشاء الطلب في ووكومرس أولاً
    this.woocommerceService.createOrder(orderData).subscribe({
      next: (createdOrder) => {
        // إذا كان الدفع عند الاستلام، تكون العملية قد انتهت بنجاح هنا
        if (!isOnlinePayment) {
          this.handleCodSuccess();
          return;
        }

        // 2. إذا كان الدفع إلكترونياً، قم بإنشاء رابط الدفع من ميسّر
        const orderId = createdOrder.id;
        const totalAmount = parseFloat(createdOrder.total);

        this.woocommerceService.createMoyasarPayment(totalAmount, orderId).subscribe({
          next: (paymentResponse) => {
            if (paymentResponse && paymentResponse.success && paymentResponse.payment_url) {
              // 3. توجيه المستخدم إلى صفحة الدفع الخاصة بميسّر
              if (isPlatformBrowser(this.platformId)) {
                window.location.href = paymentResponse.payment_url;
              }
            } else {
              this.handleError('لم نتمكن من إنشاء رابط الدفع. يرجى المحاولة مرة أخرى أو اختيار الدفع عند الاستلام.');
            }
          },
          error: (err) => {
            console.error('Moyasar payment creation error:', err);
            this.handleError('حدث خطأ أثناء الاتصال ببوابة الدفع. يرجى التحقق من اتصالك بالإنترنت.');
          }
        });
      },
      error: (err) => {
        console.error('Order creation error:', err);
        this.handleError('حدث خطأ أثناء إنشاء طلبك. قد تكون بعض البيانات غير صحيحة.');
      }
    });
  }

  // =================================================================
  // 🔥 جديد: دوال مساعدة لمعالجة النجاح والخطأ
  // =================================================================
  private handleCodSuccess(): void {
    this.zone.run(() => {
      this.isSubmitting = false;
      this.orderPlaced = true;
      this.woocommerceService.clearCart();
      this.cdr.detectChanges();
    });
  }

  private handleError(message: string): void {
    this.zone.run(() => {
      this.isSubmitting = false;
      this.orderError = message;
      this.cdr.detectChanges();
    });
  }
}
