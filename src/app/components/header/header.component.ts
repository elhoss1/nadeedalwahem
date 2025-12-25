import { Component, OnInit, HostListener} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { WoocommerceService } from '../../services/woocommerce.service';


@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  cartItemCount = 0;
  isMenuOpen = false;


  constructor(private woocommerceService: WoocommerceService) {}

  ngOnInit(): void {
    this.woocommerceService.cart$.subscribe(() => {
      this.cartItemCount = this.woocommerceService.getCartItemCount();
    });

    // تحميل السلة من localStorage
    this.woocommerceService.loadCartFromLocalStorage();
    this.cartItemCount = this.woocommerceService.getCartItemCount();
  }

    // فتح/إغلاق القائمة
  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;

    // منع التمرير في الخلفية عند فتح القائمة
    if (this.isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }

  // إغلاق القائمة
  closeMenu(): void {
    this.isMenuOpen = false;
    document.body.style.overflow = '';
  }

  // إغلاق القائمة عند النقر خارجها
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    const navbar = document.querySelector('.navbar');
    const menuToggle = document.querySelector('.menu-toggle');

    if (this.isMenuOpen && navbar && !navbar.contains(target)) {
      this.closeMenu();
    }
  }

  // إغلاق القائمة عند تغيير حجم الشاشة
  @HostListener('window:resize', ['$event'])
  onResize(event: Event): void {
    if (window.innerWidth > 768 && this.isMenuOpen) {
      this.closeMenu();
    }
  }
}
