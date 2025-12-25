import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { WoocommerceService } from '../../services/woocommerce.service';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { CategoriesBarComponent } from "../../components/categories-bar/categories-bar";

@Component({
  selector: 'app-sundry-packing-dates',
  standalone: true, // تأكد من أن هذا صحيح لمشروعك
  imports: [CommonModule, RouterModule, FormsModule, CategoriesBarComponent],
  templateUrl: './sundry-packing-dates.html',
  styleUrls: ['./sundry-packing-dates.scss'], // تأكد من أن اسم الملف صحيح
})
export class SundryPackingDates implements OnInit {
  products: any[] = [];
  categories: any[] = [];
  isLoading = true;
  selectedCategory: number | null = null;
  searchTerm: string = '';
  sortBy: string = 'date';

  // المعرف الثابت للفئة لهذه الصفحة
  private readonly PAGE_CATEGORY_ID = 21;

  constructor(
    private woocommerceService: WoocommerceService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef, // حقن ChangeDetectorRef كإجراء وقائي
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    // لا تستدعي loadProducts هنا مباشرة
    // اعتمد على الـ Observable الخاص بالـ route
    this.route.queryParams.subscribe(params => {
      // تحقق إذا كان هناك 'category' في الرابط
      if (params['category']) {
        // إذا وجد، استخدمه
        this.selectedCategory = parseInt(params['category'], 10);
      } else {
        // إذا لم يوجد، استخدم المعرف الثابت الخاص بالصفحة
        this.selectedCategory = this.PAGE_CATEGORY_ID;
      }
      // الآن، استدعِ loadProducts مرة واحدة فقط بالمعرف الصحيح
      this.loadProducts();
    });

    // يمكنك تحميل الفئات بشكل منفصل، هذا لا يسبب مشكلة
    this.loadCategories();
  }

  loadCategories(): void {
    this.woocommerceService.getCategories().subscribe({
      next: (data: any[]) => {
        this.categories = data.filter(cat => cat.count > 0);
        this.cdr.detectChanges(); // تحديث الواجهة بعد جلب الفئات
      },
      error: (error) => console.error('Error loading categories:', error)
    });
  }

  loadProducts(): void {
    if (!this.selectedCategory) {
      console.warn("No category selected, aborting loadProducts.");
      this.isLoading = false;
      return; // لا تقم بالتحميل إذا لم يتم تحديد فئة
    }

    this.isLoading = true;
    const params: any = {
      per_page: 20,
      search: this.searchTerm,
      orderby: this.sortBy,
      category: this.selectedCategory // استخدم دائمًا this.selectedCategory
    };

    if (this.sortBy === 'price') {
      params.order = 'asc';
    } else if (this.sortBy === 'popularity') {
      params.orderby = 'popularity';
      // WooCommerce يتوقع 'desc' مع 'popularity' عادةً
      params.order = 'desc';
    } else {
      // للأحدث (date)
      params.order = 'desc';
    }

    this.woocommerceService.getProducts(params).subscribe({
      next: (data: any[]) => {
        this.products = data;
        this.isLoading = false;
        this.cdr.detectChanges(); // إجبار تحديث الواجهة
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.isLoading = false;
        this.cdr.detectChanges(); // إجبار تحديث الواجهة حتى عند الخطأ
      }
    });
  }

  // --- باقي الدوال تبقى كما هي ---

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
      quantity: 1
    });

    // استبدل alert() باستدعاء التوستر
    // alert('تمت إضافة المنتج إلى السلة بنجاح!');

    // استخدم .success() لإظهار رسالة نجاح خضراء
    this.toastr.success(`تمت إضافة "${product.name}" إلى السلة بنجاح!`, 'نجاح', {
      // يمكنك إضافة إعدادات خاصة لهذه الرسالة فقط إذا أردت
      closeButton: true
    });
  }

  getProductImage(product: any): string {
    // استخدام الدالة الآمنة التي تحمي من الأخطاء
    try {
      if (product?.images?.length > 0) {
        return product.images[0].src;
      }
    } catch (e) {
      console.error('Error getting product image', e);
    }
    return '/placeholder.png'; // صورة احتياطية
  }
}
