import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { WoocommerceService } from '../../services/woocommerce.service';

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

  order: OrderDetails | null = null;
  isLoading = true;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private woocommerceService: WoocommerceService
  ) {}

  ngOnInit(): void {
    this.route.paramMap
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const orderId = params.get('id');
        if (orderId) {
          this.getOrder(orderId);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * جلب الطلب الحقيقي
   */
  private getOrder(orderId: string): void {
    this.isLoading = true;

    this.woocommerceService.getOrderById(orderId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (order) => {
          this.order = {
            orderNumber: order.id,
            orderDate: order.date_created,
            totalAmount: Number(order.total),
            currency: order.currency,
            customerEmail: order.billing.email,
            shippingStatus: this.mapOrderStatus(order.status)
          };
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
          this.router.navigate(['/']);
        }
      });
  }

  /**
   * تحويل حالة WooCommerce
   */
  private mapOrderStatus(status: string): OrderDetails['shippingStatus'] {
    switch (status) {
      case 'pending':
        return 'received';
      case 'processing':
        return 'processing';
      case 'completed':
        return 'delivered';
      default:
        return 'received';
    }
  }

  copyOrderNumber(): void {
    if (!this.order) return;

    navigator.clipboard.writeText(this.order.orderNumber);
  }

  trackOrder(): void {
    if (this.order) {
      this.router.navigate(['/orders/track', this.order.orderNumber]);
    }
  }

  goToHome(): void {
    this.router.navigate(['/']);
  }

  getStepIndex(): number {
    const map = {
      received: 0,
      processing: 1,
      shipped: 2,
      delivered: 3
    };
    return this.order ? map[this.order.shippingStatus] : 0;
  }
}
