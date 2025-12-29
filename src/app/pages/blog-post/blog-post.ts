import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core'; // إضافة الأدوات المطلوبة
import { ActivatedRoute, RouterModule } from '@angular/router';
import { WoocommerceService } from '../../services/woocommerce.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-blog-post',
  standalone: true, // تأكد أنها standalone
  imports: [CommonModule, RouterModule],
  templateUrl: './blog-post.html',
  styleUrl: './blog-post.scss',
})
export class BlogPostComponent implements OnInit {
  post: any = null;
  isLoading = true;

  constructor(
    private route: ActivatedRoute,
    private woocommerceService: WoocommerceService,
    private cdr: ChangeDetectorRef, // حقن أداة كشف التغييرات
    private zone: NgZone           // حقن أداة التحكم في الـ Zone
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const postId = params.get('id');
      if (postId) {
        this.loadPost(+postId);
      }
    });
  }

  loadPost(id: number): void {
    this.isLoading = true;
    this.cdr.detectChanges(); // إظهار اللودر فوراً

    this.woocommerceService.getPost(id).subscribe({
      next: (data) => {
        // إجبار المتصفح على استلام البيانات داخل الـ Zone
        this.zone.run(() => {
          this.post = data;
          this.isLoading = false;
          this.cdr.detectChanges(); // إجبار Angular على رسم المقال فوراً
        });
      },
      error: (err) => {
        this.zone.run(() => {
          console.error('Error loading post:', err);
          this.isLoading = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

  getPostImage(post: any): string {
    if (post?._embedded?.['wp:featuredmedia']?.[0]) {
      return post._embedded['wp:featuredmedia'][0].source_url;
    }
    return 'assets/placeholder.png'; // يفضل وضع مسار لصورة افتراضية
  }
}
