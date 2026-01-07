import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { WoocommerceService } from '../../services/woocommerce.service';
import { ToastrService } from 'ngx-toastr';
import { CategoriesBarComponent } from "../../components/categories-bar/categories-bar";

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, CategoriesBarComponent],
  templateUrl: './products.html',
  styleUrls: ['./products.scss']
})
export class ProductsComponent implements OnInit {
  products: any[] = [];
  categories: any[] = [];
  isLoading = true;
  selectedCategory: number | null = null;
  searchTerm: string = '';
  sortBy: string = 'date'; // date, price, popularity

  constructor(
    private woocommerceService: WoocommerceService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.selectedCategory = params['category'] ? parseInt(params['category']) : null;
      this.loadProducts();
    });
  }

  loadProducts(): void {
    this.isLoading = true;
    this.cdr.detectChanges();

    let params: any = {
      per_page: 100,
      search: this.searchTerm,
      orderby: this.sortBy,
      order: 'asc'
    };

    if (this.selectedCategory) {
      params.category = this.selectedCategory;
    }

    if (this.sortBy === 'price') {
      params.order = 'asc';
    } else if (this.sortBy === 'popularity') {
      params.orderby = 'popularity';
    }

    this.woocommerceService.getProducts(params).subscribe(
      (data: any[]) => {
        this.products = data;
        this.isLoading = false;
        this.cdr.detectChanges();
        console.log("done");

      },
      (error) => {
        console.error('Error loading products:', error);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    );
  }

  onCategoryChange(categoryId: number | null): void {
    this.selectedCategory = categoryId;
    this.loadProducts();
  }

  onSearch(): void {
    this.loadProducts();
  }

  onSortChange(): void {
    this.loadProducts();
  }

  addToCart(product: any): void {
    this.woocommerceService.addToCart({
      id: product.id,
      name: product.name,
      price: parseFloat(product.price),
      image: this.getProductImage(product),
      quantity: 1,
      weight: parseFloat(product.weight || '1')
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
