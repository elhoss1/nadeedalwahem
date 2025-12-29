import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core'; // استيراد الأدوات اللازمة
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { WoocommerceService } from '../../services/woocommerce.service';

@Component({
  selector: 'app-blog',
  standalone: true, // تأكد من وجودها
  imports: [CommonModule, RouterModule],
  templateUrl: './blog.html',
  styleUrl: './blog.scss',
})
export class BlogComponent implements OnInit {
  posts: any[] = [];
  isLoading = true;

  constructor(
    private woocommerceService: WoocommerceService,
    private cdr: ChangeDetectorRef, // حقن أداة كشف التغييرات
    private zone: NgZone           // حقن أداة التحكم في المنطقة (Zone)
  ) {}

  ngOnInit(): void {
    this.loadPosts();
  }

  loadPosts(): void {
    this.isLoading = true;
    this.cdr.detectChanges(); // تحديث أولي لإظهار اللودر

    this.woocommerceService.getPosts({ per_page: 10 }).subscribe({
      next: (data) => {
        // استخدام zone.run لإعادة التفاعل لبيئة Angular
        this.zone.run(() => {
          this.posts = data;
          this.isLoading = false;
          this.cdr.detectChanges(); // إجبار المتصفح على عرض المقالات فوراً
        });
      },
      error: (err) => {
        this.zone.run(() => {
          console.error('Error loading posts:', err);
          this.isLoading = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

  getPostImage(post: any): string {
    // استخدام Safe Navigation (?.) لتجنب أي خطأ يعطل الصفحة
    if (post?._embedded?.['wp:featuredmedia']?.[0]) {
      return post._embedded['wp:featuredmedia'][0].source_url;
    }
    return 'imegs/placeholder.png';
  }
}
