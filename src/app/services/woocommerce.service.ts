import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Product } from '../interface/product'; // تأكد من أن هذا المسار صحيح
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
} )
export class WoocommerceService {
  private baseUrl = 'https://www.nadeedalwashm.com/wp-json/wc/v3';
  private consumerKey = 'ck_c039cdfa4d414f773dfde6f88a9bd7d356f8a11a';
  private consumerSecret = 'cs_7e000061084cfcf98c3d3ac063508856404da1ee';

  // Observable subjects for cart management
  private cartSubject = new BehaviorSubject<any[]>([] );
  public cart$ = this.cartSubject.asObservable();

  constructor(private http: HttpClient ) {
    this.loadCartFromLocalStorage();
  }

  // دالة مركزية لإنشاء هيدرز المصادقة
  private getAuthHeaders(): HttpHeaders {
    const auth = btoa(`${this.consumerKey}:${this.consumerSecret}`);
    return new HttpHeaders({
      'Authorization': `Basic ${auth}`
    });
  }

  // دالة مركزية لتحويل كائن إلى HttpParams
  private buildParams(params: any): HttpParams {
    let httpParams = new HttpParams( );
    for (const key in params) {
      if (params.hasOwnProperty(key) && params[key] !== null && params[key] !== undefined) {
        httpParams = httpParams.set(key, params[key].toString( ));
      }
    }
    return httpParams;
  }

  /**
   * الحصول على جميع المنتجات
   */
  getProducts(params?: any ): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/products`, {
      headers: this.getAuthHeaders( ),
      params: this.buildParams(params)
    }).pipe(
      catchError(error => {
        console.error('HttpClient Error fetching products:', error);
        return of([]); // أرجع مصفوفة فارغة عند الخطأ
      })
    );
  }

  /**
   * الحصول على منتج واحد
   */
  getProduct(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/products/${id}`, {
      headers: this.getAuthHeaders( )
    }).pipe(
      catchError(error => {
        console.error(`HttpClient Error fetching product with id ${id}:`, error);
        return throwError(() => new Error('Failed to fetch product.'));
      })
    );
  }

  /**
   * الحصول على الفئات
   */
  getCategories(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/products/categories`, {
      headers: this.getAuthHeaders( )
    }).pipe(
      catchError(error => {
        console.error('HttpClient Error fetching categories:', error);
        return of([]);
      })
    );
  }

  /**
   * الحصول على الطلبات
   */
  getOrders(params?: any): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/orders`, {
      headers: this.getAuthHeaders( ),
      params: this.buildParams(params)
    }).pipe(
      catchError(error => {
        console.error('HttpClient Error fetching orders:', error);
        return of([]);
      })
    );
  }

  /**
   * إنشاء طلب جديد
   */
  createOrder(orderData: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/orders`, orderData, {
      headers: this.getAuthHeaders( )
    }).pipe(
      catchError(error => {
        console.error('HttpClient Error creating order:', error);
        return throwError(() => new Error('Failed to create order.'));
      })
    );
  }

  /**
   * الحصول على طلب واحد
   */
  getOrder(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/orders/${id}`, {
      headers: this.getAuthHeaders( )
    }).pipe(
      catchError(error => {
        console.error(`HttpClient Error fetching order with id ${id}:`, error);
        return throwError(() => new Error('Failed to fetch order.'));
      })
    );
  }

  /**
   * إدارة السلة المحلية
   */
  addToCart(product: any): void {
    const currentCart = this.cartSubject.value;
    const existingItem = currentCart.find(item => item.id === product.id);

    if (existingItem) {
      existingItem.quantity += product.quantity || 1;
    } else {
      currentCart.push({ ...product, quantity: product.quantity || 1 });
    }

    this.cartSubject.next([...currentCart]);
    this.saveCartToLocalStorage();
  }

  /**
   * إزالة من السلة
   */
  removeFromCart(productId: number): void {
    const currentCart = this.cartSubject.value.filter(item => item.id !== productId);
    this.cartSubject.next(currentCart);
    this.saveCartToLocalStorage();
  }

  /**
   * تحديث كمية المنتج في السلة
   */
  updateCartQuantity(productId: number, quantity: number): void {
    const currentCart = this.cartSubject.value;
    const item = currentCart.find(item => item.id === productId);

    if (item) {
      if (quantity <= 0) {
        this.removeFromCart(productId);
      } else {
        item.quantity = quantity;
        this.cartSubject.next([...currentCart]);
        this.saveCartToLocalStorage();
      }
    }
  }

  /**
   * مسح السلة
   */
  clearCart(): void {
    this.cartSubject.next([]);
    localStorage.removeItem('nadeed_cart');
  }

  /**
   * الحصول على السلة الحالية
   */
  getCart(): any[] {
    return this.cartSubject.value;
  }

  /**
   * حفظ السلة في localStorage
   */
  private saveCartToLocalStorage(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('nadeed_cart', JSON.stringify(this.cartSubject.value));
    }
  }

  /**
   * تحميل السلة من localStorage
   */
  loadCartFromLocalStorage(): void {
    if (typeof localStorage !== 'undefined') {
      const savedCart = localStorage.getItem('nadeed_cart');
      if (savedCart) {
        this.cartSubject.next(JSON.parse(savedCart));
      }
    }
  }

  /**
   * حساب إجمالي السلة
   */
  getCartTotal(): number {
    return this.cartSubject.value.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  }

  /**
   * الحصول على عدد العناصر في السلة
   */
  getCartItemCount(): number {
    return this.cartSubject.value.reduce((count, item) => {
      return count + item.quantity;
    }, 0);
  }


  getPosts(params?: any): Observable<any[]> {
    // ملاحظة: نستخدم مسار API الخاص بـ WordPress هنا، وليس WooCommerce
    const wpApiUrl = 'https://www.nadeedalwashm.com/wp-json/wp/v2';
    return this.http.get<any[]>(`${wpApiUrl}/posts?_embed`, { params } );
  }

  /**
   * الحصول على مقال واحد (Post)
   */
  getPost(id: number): Observable<any> {
    const wpApiUrl = 'https://www.nadeedalwashm.com/wp-json/wp/v2';
    return this.http.get<any>(`${wpApiUrl}/posts/${id}?_embed` );
  }
}
