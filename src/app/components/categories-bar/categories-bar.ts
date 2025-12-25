import { Component, OnInit } from '@angular/core';
import { WoocommerceService } from '../../services/woocommerce.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-categories-bar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './categories-bar.html',
  styleUrl: './categories-bar.scss',
})
export class CategoriesBarComponent implements OnInit {

  // --- هنا نقوم بتعريف الأقسام يدويًا ---
  // كل عنصر يحتوي على:
  // id: رقم الـ ID الخاص بالقسم في WooCommerce
  // name: الاسم الذي سيظهر في الشريط
manualCategories = [
    { id: 21, name: 'تمور خام', link: '/Rawdates', queryParams: {} },
    { id: 22, name: 'مكنوز آلي', link: '/maknoozautomaticdates', queryParams: {} },
    { id: 23, name: 'تعبئة نثري', link: '/Surveydatesprose', queryParams: {} }, // مثال لصفحة مخصصة
    { id: 24, name: 'المعمول', link: '/Maamoul', queryParams: {} }, // مثال لصفحة مخصصة
    // { id: 25, name: 'قسم آخر', link: '/another-page' },
  ];

  activeUrl = '';

  constructor(private router: Router) {}

  ngOnInit(): void {
    // الاستماع لتغييرات الرابط لتحديد الزر النشط
    this.router.events.subscribe(() => {
      this.activeUrl = this.router.url;
    });
    this.activeUrl = this.router.url; // تعيين القيمة الأولية
  }

  // دالة لتحديد ما إذا كان الرابط نشطًا
  isActive(category: any): boolean {
    // بناء الرابط المتوقع من بيانات القسم
    let expectedUrl = category.link;
    const queryParams = new URLSearchParams(category.queryParams).toString();
    if (queryParams) {
      expectedUrl += `?${queryParams}`;
    }

    // التحقق من تطابق الرابط الحالي مع الرابط المتوقع
    return this.activeUrl === expectedUrl;
  }
}
