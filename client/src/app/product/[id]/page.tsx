import ProductDetailView from './ProductDetailView';
import ProductService from '@/services/productService';

export async function generateStaticParams() {
  // Bypass API fetching during Vercel/CI production builds to avoid ECONNREFUSED logs.
  // Next.js will generate pages on-demand at runtime.
  if (process.env.VERCEL || process.env.CI) {
    return [];
  }

  try {
    // Fetch products to pre-render. For static export, we need the slugs.
    const products = await ProductService.getShowingProducts();
    
    if (!products || !Array.isArray(products) || products.length === 0) {
      return [{ id: '1' }];
    }

    return products.map((product) => ({
      id: product.slug || product._id,
    }));
  } catch (error) {
    // Suppress logging connection refuse during build/CI to keep logs clean
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error fetching products for generateStaticParams:', error);
    }
    return [{ id: '1' }];
  }
}

export default function ProductDetailPage() {
  return <ProductDetailView />;
}