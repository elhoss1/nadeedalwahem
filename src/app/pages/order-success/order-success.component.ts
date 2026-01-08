import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { WoocommerceService } from '../../services/woocommerce.service';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';


// الوحدات المطلوبة
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-order-success',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './order-success.html',
  styleUrls: ['./order-success-styles.scss']
})
export class OrderSuccessComponent implements OnInit {

  constructor(
    private route: ActivatedRoute,
    private wooService: WoocommerceService
  ) {}

  ngOnInit(): void {
    // 1. تفريغ سلة المشتريات فوراً
    this.wooService.clearCart();

    // 2. محاولة تحديث حالة الطلب في الخلفية (بشكل صامت)
    this.updateOrderStatusInBackground();
  }

  private updateOrderStatusInBackground(): void {
    // قراءة المعرّفات من الرابط
    const orderId = this.route.snapshot.paramMap.get('id');
    const paymentStatus = this.route.snapshot.queryParamMap.get('status');

    // التحقق من أن الدفع ناجح وأن رقم الطلب موجود
    if (paymentStatus === 'paid' && orderId) {
      console.log(`Payment successful for order ${orderId}. Attempting to update status in background.`);

      // إرسال طلب التحديث
      this.wooService.updateOrderStatus(orderId, 'processing').pipe(
        catchError(error => {
          // إذا فشل الطلب، فقط قم بتسجيل الخطأ في الـ Console
          // لا تقم بفعل أي شيء يؤثر على واجهة المستخدم
          console.error('Background order status update failed:', error);
          // `of(null)` يضمن أن الـ Observable يكتمل بنجاح ولا يكسر التطبيق
          return of(null);
        })
      ).subscribe(response => {
        if (response) {
          console.log(`Order ${orderId} status successfully updated to 'processing'.`);
        }
      });
    }
  }
}
