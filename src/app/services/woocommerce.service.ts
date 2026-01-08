import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Observable, BehaviorSubject, of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Product } from '../interface/product';

@Injectable({
  providedIn: 'root'
})
export class WoocommerceService {
  // === Configuration ===
  // تحذير: يفضل وضع المفاتيح في environment.ts وعدم تركها هنا لأسباب أمنية
  private readonly wooBaseUrl = 'https://www.nadeedalwashm.com/wp-json/wc/v3';
  private readonly wpBaseUrl = 'https://www.nadeedalwashm.com/wp-json/wp/v2';
  private readonly customApiBaseUrl = 'https://www.nadeedalwashm.com/wp-json';

  private readonly consumerKey = 'ck_c039cdfa4d414f773dfde6f88a9bd7d356f8a11a';
  private readonly consumerSecret = 'cs_7e000061084cfcf98c3d3ac063508856404da1ee';
  private readonly cartStorageKey = 'nadeed_cart';

  // === State Management (Cart) ===
  private cartSubject = new BehaviorSubject<any[]>([]);
  public cart$ = this.cartSubject.asObservable();

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.loadCartFromLocalStorage();
  }

  // =================================================================
  // Section 1: Helper Methods (دوال مساعدة)
  // =================================================================

  private getAuthHeaders(): HttpHeaders {
    // Basic Auth Header
    const auth = btoa(`${this.consumerKey}:${this.consumerSecret}`);
    return new HttpHeaders({
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json'
    });
  }

  private buildParams(params: any): HttpParams {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key].toString());
        }
      });
    }
    return httpParams;
  }

  private handleError(operation = 'operation', result?: any) {
    return (error: any): Observable<any> => {
      console.error(`${operation} failed: ${error.message}`, error);
      if (result) {
        return of(result);
      }
      return throwError(() => new Error(`${operation} failed.`));
    };
  }

  // =================================================================
  // Section 2: Products API (المنتجات)
  // =================================================================

  getProducts(params?: any): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.wooBaseUrl}/products`, {
      headers: this.getAuthHeaders(),
      params: this.buildParams(params)
    }).pipe(
      catchError(this.handleError('getProducts', []))
    );
  }

  getProduct(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.wooBaseUrl}/products/${id}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError(`getProduct id=${id}`))
    );
  }

  getCategories(): Observable<any[]> {
    return this.http.get<any[]>(`${this.wooBaseUrl}/products/categories`, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError('getCategories', []))
    );
  }

  // =================================================================
  // Section 3: Orders API (الطلبات)
  // =================================================================

  getOrders(params?: any): Observable<any[]> {
    return this.http.get<any[]>(`${this.wooBaseUrl}/orders`, {
      headers: this.getAuthHeaders(),
      params: this.buildParams(params)
    }).pipe(
      catchError(this.handleError('getOrders', []))
    );
  }

  getOrder(id: number): Observable<any> {
    return this.http.get<any>(`${this.wooBaseUrl}/orders/${id}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError(`getOrder id=${id}`))
    );
  }

  createOrder(orderData: any): Observable<any> {
    return this.http.post<any>(`${this.wooBaseUrl}/orders`, orderData, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError('createOrder'))
    );
  }


  createMoyasarPayment(amount: number, orderId: number): Observable<{ success: boolean, payment_url: string }> {
    const moyasarEndpoint = `${this.customApiBaseUrl}/moyasar-api/v1/create-payment`;
    const body = {
      amount: amount,
      order_id: orderId,
      description: `الدفع لطلب رقم #${orderId} من نضيد الوشم`
    };
    return this.http.post<{ success: boolean, payment_url: string }>(moyasarEndpoint, body ).pipe(
      catchError(this.handleError('createMoyasarPayment'))
    );
  }

  // =================================================================
  // Section 4: WordPress Blog API (المدونة)
  // =================================================================

  getPosts(params?: any): Observable<any[]> {
    return this.http.get<any[]>(`${this.wpBaseUrl}/posts?_embed`, {
      params: this.buildParams(params)
    }).pipe(
      catchError(this.handleError('getPosts', []))
    );
  }

  getPost(id: number): Observable<any> {
    return this.http.get<any>(`${this.wpBaseUrl}/posts/${id}?_embed`).pipe(
      catchError(this.handleError(`getPost id=${id}`))
    );
  }



  getOrderById(orderId: string): Observable<any> {
    return this.http.get(
      `${this.wpBaseUrl}/orders/${orderId}`,
      {
        params: {
          consumer_key: this.consumerKey,
          consumer_secret: this.consumerSecret
        }
      }
    );
  }

  /**
   * جلب الطلبات الخاصة بإيميل عميل
   */
  getOrdersByEmail(email: string): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.wpBaseUrl}/orders`,
      {
        params: {
          consumer_key: this.consumerKey,
          consumer_secret: this.consumerSecret,
          billing_email: email
        }
      }
    );
  }

  /**
   * تحديث حالة الطلب
   */
  /**
 * تحديث حالة الطلب (النسخة الصحيحة)
 */
updateOrderStatus(orderId: string, status: string): Observable<any> {
  // 1. استخدام المسار الصحيح لووكومرس
  const endpoint = `${this.wooBaseUrl}/orders/${orderId}`;
  const body = { status: status };

  console.log(`Sending PUT request to: ${endpoint}`); // للتأكد من المسار

  // 2. استخدام Basic Auth في الهيدر (الطريقة الصحيحة لطلبات PUT)
  return this.http.put(endpoint, body, {
    headers: this.getAuthHeaders( ) // <-- استخدام الدالة المساعدة للمصادقة
  }).pipe(
    // يمكنك إضافة معالجة أخطاء مخصصة هنا إذا أردت
    catchError(this.handleError(`updateOrderStatus id=${orderId}`))
  );
}


  // =================================================================
  // Section 5: Cart Management (إدارة السلة)
  // =================================================================

  getCart(): any[] {
    return this.cartSubject.value;
  }

  getCartTotal(): number {
    return this.cartSubject.value.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  getCartItemCount(): number {
    return this.cartSubject.value.reduce((count, item) => count + item.quantity, 0);
  }

  addToCart(product: any): void {
    const currentCart = [...this.cartSubject.value];
    const existingItem = currentCart.find(item => item.id === product.id);

    if (existingItem) {
      existingItem.quantity += product.quantity || 1;
    } else {
      currentCart.push({ ...product, quantity: product.quantity || 1 });
    }

    this.updateCartState(currentCart);
  }

  removeFromCart(productId: number): void {
    const currentCart = this.cartSubject.value.filter(item => item.id !== productId);
    this.updateCartState(currentCart);
  }

  updateCartQuantity(productId: number, quantity: number): void {
    if (quantity <= 0) {
      this.removeFromCart(productId);
      return;
    }

    const currentCart = [...this.cartSubject.value];
    const item = currentCart.find(i => i.id === productId);

    if (item) {
      item.quantity = quantity;
      this.updateCartState(currentCart);
    }
  }

  clearCart(): void {
    this.updateCartState([]);
  }

  // دوال خاصة لتحديث الحالة والتخزين
  private updateCartState(cart: any[]): void {
    this.cartSubject.next(cart);
    this.saveCartToLocalStorage(cart);
  }

  private saveCartToLocalStorage(cart: any[]): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.cartStorageKey, JSON.stringify(cart));
    }
  }

  public loadCartFromLocalStorage(): void {
    if (isPlatformBrowser(this.platformId)) {
      const savedCart = localStorage.getItem(this.cartStorageKey);
      if (savedCart) {
        try {
          this.cartSubject.next(JSON.parse(savedCart));
        } catch (e) {
          console.error('Error parsing cart from local storage', e);
          this.cartSubject.next([]);
        }
      }
    }
  }
}
