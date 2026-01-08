import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core'; // 1. إعادة استيراد ChangeDetectorRef
import { ActivatedRoute } from '@angular/router';
import { WoocommerceService } from '../../services/woocommerce.service';
import { Subscription, of, throwError } from 'rxjs';
import { switchMap, catchError, tap, finalize } from 'rxjs/operators'; // 2. استيراد finalize

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
export class OrderSuccessComponent implements OnInit, OnDestroy {

  isLoading = true;
  isSuccess = false;
  error: string | null = null;
  order: any = null;

  private dataSub: Subscription | undefined;

  constructor(
    private route: ActivatedRoute,
    private wooService: WoocommerceService,
    private cdr: ChangeDetectorRef // 3. إعادة حقن ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.dataSub = this.processOrderConfirmation();
  }

  private processOrderConfirmation(): Subscription {
    return this.route.paramMap.pipe(
      switchMap(params => {
        const orderId = params.get('id');
        const paymentStatus = this.route.snapshot.queryParamMap.get('status');
        const paymentMessage = this.route.snapshot.queryParamMap.get('message');

        if (paymentStatus === 'paid' && orderId) {
          return this.wooService.updateOrderStatus(orderId, 'processing').pipe(
            catchError(err => {
              console.error('Error updating order status:', err);
              const friendlyError = `تم الدفع بنجاح، ولكن فشل تحديث حالة الطلب. الرجاء التواصل مع الدعم وتزويدهم برقم الطلب: ${orderId}`;
              return throwError(() => new Error(friendlyError));
            })
          );
        } else {
          const friendlyError = paymentMessage || 'فشلت عملية الدفع أو أن الرابط غير صالح.';
          return throwError(() => new Error(friendlyError));
        }
      }),
      switchMap(updatedOrder => {
        if (updatedOrder && updatedOrder.id) {
          return this.wooService.getOrder(updatedOrder.id).pipe(
            catchError(err => {
              console.error('Error fetching final order details:', err);
              return of(updatedOrder);
            })
          );
        }
        return throwError(() => new Error('لم يتم العثور على الطلب بعد التحديث.'));
      }),
      // 4. استخدام finalize لضمان إيقاف التحميل دائماً
      finalize(() => {
        this.isLoading = false;
        this.cdr.detectChanges(); // تحديث الواجهة لإخفاء التحميل
      })
    ).subscribe({
      next: (finalOrder) => {
        // --- حالة النجاح ---
        this.order = finalOrder;
        this.isSuccess = true;
        this.wooService.clearCart();

        // 5. استدعاء detectChanges بعد تحديث كل متغيرات النجاح
        this.cdr.detectChanges();
      },
      error: (err) => {
        // --- حالة الفشل ---
        this.error = err.message;
        this.isSuccess = false;

        // 6. استدعاء detectChanges بعد تحديث كل متغيرات الفشل
        this.cdr.detectChanges();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.dataSub) {
      this.dataSub.unsubscribe();
    }
  }
}
