import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { WoocommerceService } from '../../services/woocommerce.service';


@Component({
  selector: 'app-order-success',
  templateUrl: './order-success.html',
  styleUrls: ['./order-success-styles.scss']
})
export class OrderSuccessComponent implements OnInit {
loading = true;
  paymentSuccess = false;
  errorMessage: string | null = null;
  order: any = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private wooService: WoocommerceService
  ) {}

  ngOnInit(): void {
    // قراءة المُعرّفات من رابط العودة
    const paymentId = this.route.snapshot.queryParamMap.get('id');
    const status = this.route.snapshot.queryParamMap.get('status');
    const orderId = this.route.snapshot.queryParamMap.get('order_id'); // افترض أنك تمرر هذا

    if (status === 'paid' && paymentId && orderId) {
      // الدفع ناجح ظاهرياً، لنتحقق من الخادم
      this.verifyPaymentAndUpdateOrder(orderId);
    } else {
      // الدفع فشل أو الرابط غير صحيح
      this.loading = false;
      this.paymentSuccess = false;
      this.errorMessage = this.route.snapshot.queryParamMap.get('message') || 'فشلت عملية الدفع.';
    }
  }

  private verifyPaymentAndUpdateOrder(orderId: string): void {
    // 1. تحديث حالة الطلب في ووكومرس
    this.wooService.updateOrderStatus(orderId, 'processing').pipe(
      switchMap(updatedOrder => {
        // 2. بعد التحديث الناجح، جلب تفاصيل الطلب لعرضها
        this.order = updatedOrder;
        this.paymentSuccess = true;
        this.loading = false;
        // 3. تفريغ سلة المشتريات
        this.wooService.clearCart();
        return of(updatedOrder); // Continue pipe
      }),
      catchError(error => {
        // حدث خطأ أثناء تحديث الطلب
        console.error('Error updating order status:', error);
        this.loading = false;
        this.paymentSuccess = false;
        this.errorMessage = 'حدث خطأ أثناء تأكيد طلبك. الرجاء التواصل مع الدعم الفني وتزويدهم برقم الطلب: ' + orderId;
        return of(null); // Handle error gracefully
      })
    ).subscribe();
  }
}
