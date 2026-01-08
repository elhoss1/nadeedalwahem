import { WoocommerceService } from '../../services/woocommerce.service';
import { Component, OnInit } from '@angular/core';
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

  constructor(private wooService: WoocommerceService) {}

  ngOnInit(): void {
    // الخطوة الوحيدة التي سنقوم بها: تفريغ سلة المشتريات
    // هذا آمن لأنه لا يؤثر على واجهة هذه الصفحة
    this.wooService.clearCart();
  }
}
