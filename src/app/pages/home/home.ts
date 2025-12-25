import { Product } from './../../interface/product';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterModule } from '@angular/router';
import { WoocommerceService } from '../../services/woocommerce.service';
import { ChangeDetectorRef } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import {
  trigger,
  transition,
  style,
  animate,
  query,
  stagger
} from '@angular/animations';


@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule ,RouterLink],
  templateUrl: './home.html',
  styleUrls: ['./home.scss'],
  animations: [
    trigger('cardAnimation', [
      transition(':enter', [ // يتم تفعيله عند دخول الـ component إلى العرض
        query('.product-card', [
          style({ opacity: 0, transform: 'translateY(30px)' }),
          stagger('100ms', [
            animate('500ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ])
  ]
})
export class HomeComponent implements OnInit {
  featuredProducts: any[] = [];
  categories: any[] = [];
  isLoading = true;
  private Product: Product | undefined

  constructor(private woocommerceService: WoocommerceService , private cdr: ChangeDetectorRef , private toastr: ToastrService ) {}

  ngOnInit(): void {
    this.loadFeaturedProducts();
  }

  loadFeaturedProducts(): void {

  this.isLoading = true;
  this.woocommerceService.getProducts({ per_page: 8, orderby: 'popularity' }).subscribe(
  (data: any[]) => {
    this.featuredProducts = data;
    this.isLoading = false;
    this.cdr.detectChanges();
  },
  (error) => {
    console.error('Error loading products:', error);
    this.isLoading = false;
    this.cdr.detectChanges();
  }
);

}



  addToCart(product: any): void {
    this.woocommerceService.addToCart({
      id: product.id,
      name: product.name,
      price: parseFloat(product.price),
      image: this.getProductImage(product),
      quantity: 1
    });
    this.toastr.success(`تمت إضافة "${product.name}" إلى السلة بنجاح!`, 'نجاح', {
      // يمكنك إضافة إعدادات خاصة لهذه الرسالة فقط إذا أردت
      closeButton: true
    });
  }

  getProductImage(product: any): string {
    return product.images?.[0]?.src || '/placeholder.png';
  }
}
