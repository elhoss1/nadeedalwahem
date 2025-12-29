import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home';
import { ProductsComponent } from './pages/products/products';
import { CartComponent } from './pages/cart/cart.component';
import { CheckoutComponent } from './pages/checkout/checkout';
import { ContactComponent } from './pages/contact/contact';
import { About } from './pages/about/about';

export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'products', component: ProductsComponent },
    { path: 'cart', component: CartComponent },
    { path: 'checkout', component: CheckoutComponent },
    { path: 'about', component: About },
    { path: 'contact', component: ContactComponent },
    {
      path: 'Rawdates',
      loadComponent: () => import("./pages/rawdatedates/rawdatedates").then(m => m.Rawdatedates)
    },
    {
      path: 'maknoozautomaticdates',
      loadComponent: () => import("./pages/maknooz-automatic-dates/maknooz-automatic-dates").then(m => m.MaknoozAutomaticDates)
    },
    {
      path: 'Surveydatesprose',
      loadComponent: () => import("./pages/sundry-packing-dates/sundry-packing-dates").then(m => m.SundryPackingDates)
    },

    {
      path: 'Maamoul',
      loadComponent: () => import("./pages/maamoul/maamoul").then(m => m.Maamoul)
    },

    {
      path: 'services',
      loadComponent: () => import("./pages/ourservices/ourservices").then(m => m.Ourservices)
    },

    { path: 'products/:id', loadComponent: ()=> import("./components/product-detail/product-detail").then(m=>m.ProductDetailComponent) },
    { path: 'blog', loadComponent:()=> import("./pages/blog/blog").then(m=>m.BlogComponent) },
    { path: 'blog/:id', loadComponent:()=>import('./pages/blog-post/blog-post').then(m=>m.BlogPostComponent) },

    { path: '**', redirectTo: '' },


  ];

