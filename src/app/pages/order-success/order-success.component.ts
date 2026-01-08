import { Component, OnInit, OnDestroy, NgZone, ChangeDetectorRef } from '@angular/core'; // 1. استيراد NgZone
import { ActivatedRoute } from '@angular/router';
import { WoocommerceService } from '../../services/woocommerce.service';
import { Subscription, of, throwError } from 'rxjs';
import { switchMap, catchError, tap } from 'rxjs/operators';

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
    private cdr: ChangeDetectorRef, // حقن ChangeDetectorRef كإجراء وقائي

    private zone: NgZone // 2. حقن NgZone في الـ constructor
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
      })
    ).subscribe({
      next: (finalOrder) => {
        // 3. تنفيذ الكود الذي يغير الحالة داخل NgZone.run()
        this.zone.run(() => {
          console.log('Order confirmation successful! Running in zone.');
        this.cdr.detectChanges(); // تحديث الواجهة بعد جلب الفئات
          this.order = finalOrder;
          this.isSuccess = true;
          this.isLoading = false;
          this.wooService.clearCart();
        });
      },
      error: (err) => {
        // 4. تنفيذ كود الخطأ أيضاً داخل NgZone.run()
        this.zone.run(() => {
          console.error('An error occurred. Running in zone.');
          this.error = err.message;
          this.isSuccess = false;
          this.isLoading = false;
        });
      }
    });
  }

  ngOnDestroy(): void {
    if (this.dataSub) {
      this.dataSub.unsubscribe();
    }
  }
}
