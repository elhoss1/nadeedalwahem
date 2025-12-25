import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { WoocommerceService } from '../../services/woocommerce.service';

@Component({
  selector: 'app-blog',
  imports: [CommonModule, RouterModule],
  templateUrl: './blog.html',
  styleUrl: './blog.scss',
})
export class BlogComponent implements OnInit {
  posts: any[] = [];
  isLoading = true;

  constructor(private woocommerceService: WoocommerceService) {}

  ngOnInit(): void {
    this.loadPosts();
  }

  loadPosts(): void {
    this.isLoading = true;
    this.woocommerceService.getPosts({ per_page: 10 }).subscribe({
      next: (data) => {
        this.posts = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading posts:', err);
        this.isLoading = false;
      }
    });
  }

  // دالة لاستخراج رابط الصورة البارزة
  getPostImage(post: any): string {
    if (post._embedded && post._embedded['wp:featuredmedia'] && post._embedded['wp:featuredmedia'][0]) {
      return post._embedded['wp:featuredmedia'][0].source_url;
    }
    return 'imegs/placeholder.png'; // صورة افتراضية
  }
}
