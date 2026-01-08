import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { WoocommerceService } from '../../services/woocommerce.service';
import { Subscription, of, throwError } from 'rxjs';
import { switchMap, catchError, tap } from 'rxjs/operators';

// الوحدات المطلوبة للمكون المستقل (Standalone)
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-order-success',
  standalone: true, // ضروري جداً عند استخدام loadComponent
  imports: [
    CommonModule,   // لاستخدام *ngIf, *ngFor, ...
    RouterModule    // لاستخدام routerLink
  ],
  templateUrl: './order-success.html',
  styleUrls: ['./order-success-styles.scss']
})
export class OrderSuccessComponent implements OnInit, OnDestroy {

  // --- الحالة (State) ---
  isLoading = true;
  isSuccess = false;
  error: string | null = null;
  order: any = null;

  private dataSub: Subscription | undefined;

  constructor(
    private route: ActivatedRoute,
    private wooService: WoocommerceService,
    private cdr: ChangeDetectorRef, // حقن ChangeDetectorRef كإجراء وقائي

  ) {}

  ngOnInit(): void {
    this.dataSub = this.processOrderConfirmation();
  }

  private processOrderConfirmation(): Subscription {
    // نستخدم paramMap كـ Observable للتعامل مع المسار بشكل تفاعلي
    return this.route.paramMap.pipe(
      // الخطوة 1: استخراج المعلمات من الرابط
      switchMap(params => {
        const orderId = params.get('id'); // من المسار: /order-success/7057
        const paymentStatus = this.route.snapshot.queryParamMap.get('status'); // من الرابط: ?status=paid
        const paymentMessage = this.route.snapshot.queryParamMap.get('message'); // من الرابط: ?message=APPROVED

        console.log(`Processing -> Order ID: ${orderId}, Payment Status: ${paymentStatus}`);

        // التحقق من أن الدفع ناجح وأن رقم الطلب موجود
        if (paymentStatus === 'paid' && orderId) {
          // الدفع ناجح، قم بتحديث حالة الطلب في ووكومرس
          // "processing" تعني أن الدفع تم والطلب قيد التنفيذ
          return this.wooService.updateOrderStatus(orderId, 'processing').pipe(
            tap(() => console.log(`Order ${orderId} status updated to processing.`)),
            catchError(err => {
              console.error('Error updating order status:', err);
              // هذا الخطأ حرج، يعني أن الدفع تم لكن لم نتمكن من تحديث المتجر
              const friendlyError = `تم الدفع بنجاح، ولكن فشل تحديث حالة الطلب. الرجاء التواصل مع الدعم وتزويدهم برقم الطلب: ${orderId}`;
              return throwError(() => new Error(friendlyError));
            })
          );
        } else {
          // الدفع فشل أو الرابط غير مكتمل
          const friendlyError = paymentMessage || 'فشلت عملية الدفع أو أن الرابط غير صالح.';
          return throwError(() => new Error(friendlyError));
        }
      }),
      // الخطوة 2: بعد التحديث الناجح، جلب تفاصيل الطلب الكاملة لعرضها
      switchMap(updatedOrder => {
        if (updatedOrder && updatedOrder.id) {
          console.log(`Fetching full details for order ${updatedOrder.id}`);
        this.cdr.detectChanges(); // إجبار تحديث الواجهة حتى عند الخطأ

          return this.wooService.getOrder(updatedOrder.id).pipe(
            catchError(err => {
              console.error('Error fetching final order details:', err);
              // يمكن عرض الطلب المحدث حتى لو فشل الجلب الكامل
              return of(updatedOrder);
            })
          );
        }
        // إذا لم يكن هناك طلب محدث، نلقي خطأ
        return throwError(() => new Error('لم يتم العثور على الطلب بعد التحديث.'));
      })
    ).subscribe({
      next: (finalOrder) => {
        // --- حالة النجاح ---
        console.log('Order confirmation successful!', finalOrder);
        this.cdr.detectChanges(); // إجبار تحديث الواجهة حتى عند الخطأ
        this.order = finalOrder;
        this.isSuccess = true;
        this.isLoading = false;
        this.wooService.clearCart(); // تفريغ سلة المشتريات
      },
      error: (err) => {
        // --- حالة الفشل ---
        console.error('An error occurred in the confirmation process:', err);
        this.error = err.message; // عرض رسالة الخطأ الصديقة التي أنشأناها
        this.isSuccess = false;
        this.isLoading = false;
      }
    });
  }

  ngOnDestroy(): void {
    // أفضل ممارسة: إلغاء الاشتراك عند تدمير المكون لتجنب تسرب الذاكرة
    if (this.dataSub) {
      this.dataSub.unsubscribe();
    }
  }
}
