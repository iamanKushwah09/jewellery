'use client';

import { useAppSelector, useAppDispatch } from '../store/hooks';
import { toggleWishlist } from '../store/slices/wishlistSlice';
import { HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { Product } from '../types';
import toast from 'react-hot-toast';
import { RootState } from '../store/types';
import { fbPixel } from '../lib/fbPixel';
import { showingTranslateValue } from '../lib/utils';

interface WishlistButtonProps {
  product: Product;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'icon' | 'button';
  className?: string;
}

export default function WishlistButton({ 
  product, 
  size = 'md', 
  variant = 'icon',
  className = '' 
}: WishlistButtonProps) {
  const dispatch = useAppDispatch();
  const { items: wishlistItems } = useAppSelector((state: RootState) => state.wishlist);
  const isInWishlist = wishlistItems.some(item => item._id === product._id);

  const handleToggleWishlist = () => {
    dispatch(toggleWishlist(product));
    toast.success(isInWishlist ? 'Removed from wishlist' : 'Added to wishlist');

    // Track Facebook Pixel AddToWishlist (only on add, not remove)
    if (!isInWishlist) {
      fbPixel.trackAddToWishlist({
        contentName: showingTranslateValue(product.title),
        contentIds: [product._id],
        contentType: 'product',
        value: product.prices?.price || 0,
      });
    }
  };

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  const buttonSizeClasses = {
    sm: 'p-1',
    md: 'p-2',
    lg: 'p-3'
  };

  if (variant === 'button') {
    return (
      <button
        onClick={handleToggleWishlist}
        className={`flex items-center justify-center rounded-full bg-white shadow-md hover:bg-gray-50 transition-colors ${buttonSizeClasses[size]} ${className}`}
        aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
      >
        {isInWishlist ? (
          <HeartSolidIcon className={`${sizeClasses[size]} text-red-500`} />
        ) : (
          <HeartIcon className={`${sizeClasses[size]} text-gray-600`} />
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleToggleWishlist}
      className={`p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors ${className}`}
      aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      {isInWishlist ? (
        <HeartSolidIcon className={`${sizeClasses[size]} text-red-500`} />
      ) : (
        <HeartIcon className={`${sizeClasses[size]} text-gray-600`} />
      )}
    </button>
  );
}