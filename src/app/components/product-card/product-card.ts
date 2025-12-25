import { Component, Input , Output , EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from '../../services/cart';
import { RouterLink } from '@angular/router';
import { FavoritesService } from '../../services/favorites';
import { Product } from '../../interface/product';


@Component({
  selector: 'app-product-card',
  imports: [CommonModule , RouterLink ],
  templateUrl: './product-card.html',
  styleUrls: ['./product-card.scss'] // صححت هنا
})

export class ProductCardComponent {
  showToast = false;
  @Input() product!: Product;


  selectedProduct: any = null;




  constructor(private cartService: CartService, private favoritesService: FavoritesService ) {}





   isFavorite(): boolean {
    return this.favoritesService.isFavorite(this.product.id);
  }


   toggleFavorite(): void {
    if (this.isFavorite()) {
      this.favoritesService.removeFromFavorites(this.product.id);
    } else {
      this.favoritesService.addToFavorites(this.product);
    }
  }









  addToCart(): void {
    if (this.product.stock_status === 'instock') {
      this.cartService.addToCart(this.product, 1);
      // alert('تم إضافة المنتج إلى السلة بنجاح!');


      this.showToast = true;

    // اخفاء الرسالة بعد 3 ثواني
    setTimeout(() => {
      this.showToast = false;
    }, 3000);
    }



  }






  /**
   * دالة لإغلاق ال-Lightbox.
   */




transformOrigin = 'center center';


}
