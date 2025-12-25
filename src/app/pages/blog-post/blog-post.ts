import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { WoocommerceService } from '../../services/woocommerce.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-blog-post',
  imports: [CommonModule, RouterModule],
  templateUrl: './blog-post.html',
  styleUrl: './blog-post.scss',
})
export class BlogPostComponent implements OnInit {
  post: any = null;
  isLoading = true;

  constructor(
    private route: ActivatedRoute,
    private woocommerceService: WoocommerceService
  ) {}

  ngOnInit(): void {
    const postId = this.route.snapshot.paramMap.get('id');
    if (postId) {
      this.loadPost(+postId);
    }
  }

  loadPost(id: number): void {
    this.isLoading = true;
    this.woocommerceService.getPost(id).subscribe({
      next: (data) => {
        this.post = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading post:', err);
        this.isLoading = false;
      }
    });
  }

  getPostImage(post: any): string {
    if (post._embedded && post._embedded['wp:featuredmedia'] && post._embedded['wp:featuredmedia'][0]) {
      return post._embedded['wp:featuredmedia'][0].source_url;
    }
    return '';
  }
}
