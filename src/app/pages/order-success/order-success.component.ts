import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface OrderDetails {
  orderNumber: string;
  orderDate: string;
  totalAmount: number;
  currency: string;
  customerEmail: string;
  shippingStatus: 'received' | 'processing' | 'shipped' | 'delivered';
}

@Component({
  selector: 'app-order-success',
  templateUrl: './order-success.html',
  styleUrls: ['./order-success-styles.scss']
})
export class OrderSuccessComponent implements OnInit, OnDestroy {
  // بيانات الطلب
  order: OrderDetails | null = null;

  // حالة التحميل
  isLoading = true;

  // للتحكم في إلغاء الاشتراكات
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadOrderDetails();
    this.triggerConfetti();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * تحميل تفاصيل الطلب من الرابط أو الخدمة
   */
  private loadOrderDetails(): void {
    // محاكاة تحميل البيانات
    // في الواقع، قد تحصل على رقم الطلب من الـ Params
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const orderId = params['id'] || '12345678';

      // محاكاة استدعاء API
      setTimeout(() => {
        this.order = {
          orderNumber: orderId,
          orderDate: new Date().toLocaleDateString('ar-SA', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          }),
          totalAmount: 450,
          currency: 'ر.س',
          customerEmail: 'customer@example.com',
          shippingStatus: 'received'
        };
        this.isLoading = false;
      }, 1000);
    });
  }

  /**
   * تشغيل تأثير الاحتفال
   */
  private triggerConfetti(): void {
    // يمكن استدعاء دالة JavaScript لإنشاء التأثير
    // أو استخدام مكتبة مثل canvas-confetti
    console.log('Confetti triggered!');
  }

  /**
   * نسخ رقم الطلب إلى الحافظة
   */
  copyOrderNumber(): void {
    if (this.order) {
      navigator.clipboard.writeText(this.order.orderNumber).then(() => {
        this.showNotification('تم نسخ رقم الطلب بنجاح!');
      });
    }
  }

  /**
   * عرض إشعار مؤقت
   */
  private showNotification(message: string): void {
    // منطق عرض الإشعار
    console.log(message);
  }

  /**
   * متابعة حالة الطلب
   */
  trackOrder(): void {
    if (this.order) {
      this.router.navigate(['/orders/track', this.order.orderNumber]);
    }
  }

  /**
   * العودة إلى الصفحة الرئيسية
   */
  goToHome(): void {
    this.router.navigate(['/']);
  }

  /**
   * الحصول على مؤشر الخطوة الحالية للشحن
   */
  getStepIndex(): number {
    const statusMap = {
      'received': 0,
      'processing': 1,
      'shipped': 2,
      'delivered': 3
    };
    return this.order ? statusMap[this.order.shippingStatus] : 0;
  }
}
