'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { removeFromCart, updateQuantity, clearCart } from '../../store/slices/cartSlice';
import { 
  TrashIcon, 
  PlusIcon, 
  MinusIcon, 
  ShoppingBagIcon,
  ArrowLeftIcon,
  // TruckIcon,
  ShieldCheckIcon,
  CreditCardIcon,
  TagIcon,
  CheckBadgeIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import type { RootState } from '../../store/types';
import { showingTranslateValue } from '../../lib/utils';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5055/api';

interface MembershipInfo {
  tier: {
    _id: string;
    name: string;
    discountPercentage: number;
  } | null;
  isActive: boolean;
  expiry: string | null;
}

export default function CartPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { items, total, itemCount } = useAppSelector((state: RootState) => state.cart);
  const { isAuthenticated, user } = useAppSelector((state: RootState) => state.auth);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [membership, setMembership] = useState<MembershipInfo | null>(null);
  const [membershipLoading, setMembershipLoading] = useState(false);
  const [pointsToEarn, setPointsToEarn] = useState(0);
  const [couponsToEarn, setCouponsToEarn] = useState<any[]>([]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch membership when user is logged in
  useEffect(() => {
    const customerId = (user as any)?._id;
    if (customerId) {
      setMembershipLoading(true);
      fetch(`${API_BASE}/loyalty-program/my-membership/${customerId}`)
        .then(r => r.json())
        .then(data => {
          if (data.success) setMembership(data.data);
        })
        .catch(console.error)
        .finally(() => setMembershipLoading(false));
    }
  }, [user]);

  // Calculate points to earn
  useEffect(() => {
    const customerId = (user as any)?._id;
    if (isAuthenticated && customerId && items.length > 0) {
      const loyaltyItems = items.map(item => ({
        item_id: item.product._id,
        item_group_id: item.product.item_group_id || null,
        price: item.product.prices.price,
        quantity: item.quantity
      }));

      fetch(`${API_BASE}/loyalty-program/calculate-points`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          items: loyaltyItems,
          totalAmount: total
        })
      })
        .then(r => r.json())
        .then(data => {
          if (data.success) {
            setPointsToEarn(data.pointsAwarded || 0);
            setCouponsToEarn(data.couponsIssued || []);
          }
        })
        .catch(console.error);
    } else {
      setPointsToEarn(0);
      setCouponsToEarn([]);
    }
  }, [isAuthenticated, user, items, total]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(price);
  };

  const calculateItemDiscount = (originalPrice: number, price: number) => {
    if (!originalPrice || !price || originalPrice <= price) return null;
    return Number((((originalPrice - price) / originalPrice) * 100).toFixed(2));
  };

  const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      dispatch(removeFromCart(itemId));
      toast.success('Item removed from cart');
    } else {
      setIsUpdating(itemId);
      dispatch(updateQuantity({ itemId, quantity: newQuantity }));
      setTimeout(() => setIsUpdating(null), 500);
    }
  };

  const handleRemoveItem = (itemId: string) => {
    dispatch(removeFromCart(itemId));
    toast.success('Item removed from cart');
  };

  const handleClearCart = () => {
    dispatch(clearCart());
    toast.success('Cart cleared');
  };

  const handleProceedToCheckout = () => {
    router.push('/checkout');
  };

  const totalSavings = items.reduce((sum, item) => {
    const originalPrice = item.product.prices?.originalPrice;
    const price = item.product.prices?.price;
    if (originalPrice && price && originalPrice > price) {
      return sum + (originalPrice - price) * item.quantity;
    }
    return sum;
  }, 0);

  // Membership discount calculation
  const membershipDiscountPercent = membership?.isActive && membership?.tier?.discountPercentage
    ? membership.tier.discountPercentage
    : 0;
  const membershipDiscountAmount = (total * membershipDiscountPercent) / 100;
  const finalTotal = total - membershipDiscountAmount;

  if (!isMounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {items.length === 0 ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <ShoppingBagIcon className="mx-auto h-24 w-24 text-gray-400 mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Your cart is empty</h1>
            <p className="text-gray-600 mb-8">Looks like you haven't added any items to your cart yet.</p>
            <Link
              href="/"
              className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5" />
              <span>Continue Shopping</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Shopping Cart</h1>
            <p className="text-gray-600">
              {itemCount} {itemCount === 1 ? 'item' : 'items'} in your cart
            </p>
          </div>

          {/* Membership Active Banner */}
          {membership?.isActive && membership.tier && (
            <div className="mb-6 flex items-center gap-3 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl px-5 py-3.5">
              <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <CheckBadgeIcon className="h-5 w-5 text-indigo-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-indigo-800">
                  {membership.tier.name} Member Discount Applied 🎉
                </p>
                <p className="text-xs text-indigo-600 mt-0.5">
                  You're saving {membership.tier.discountPercentage}% extra ({formatPrice(membershipDiscountAmount)}) as a {membership.tier.name} member!
                </p>
              </div>
              <span className="flex-shrink-0 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                -{membership.tier.discountPercentage}%
              </span>
            </div>
          )}

          {/* No membership nudge for logged-in users */}
          {isAuthenticated && !membershipLoading && !membership?.isActive && (
            <div className="mb-6 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-5 py-3.5">
              <StarIcon className="h-5 w-5 text-amber-500 flex-shrink-0" />
              <p className="text-sm text-amber-700 flex-1">
                Get a Loyalty Membership and save extra on every order!
              </p>
              <Link href="/loyalty" className="flex-shrink-0 text-xs font-bold text-amber-700 underline underline-offset-2">
                View Plans →
              </Link>
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="xl:col-span-2 min-w-0">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">Cart Items</h2>
                    <button
                      onClick={handleClearCart}
                      className="text-sm text-red-600 hover:text-red-700 font-medium"
                    >
                      Clear Cart
                    </button>
                  </div>
                </div>

                <div className="divide-y divide-gray-200">
                  {items.map((item) => (
                    <div key={item.id} className="p-6">
                      <div className="flex items-start space-x-4">
                        {/* Product Image */}
                        <div className="flex-shrink-0">
                          <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                            <span className="text-gray-500 text-xs">Image</span>
                          </div>
                        </div>

                        {/* Product Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0 pr-2 sm:pr-4">
                              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-1 break-words">
                                {showingTranslateValue(item.product.title)}
                              </h3>
                              
                              {/* Size and Color */}
                              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 mb-3">
                                <span className="bg-gray-100 px-2 py-0.5 rounded">Size: {item.size}</span>
                                <span className="bg-gray-100 px-2 py-0.5 rounded">Color: {item.color}</span>
                              </div>

                              {/* Price */}
                              <div className="flex items-center space-x-2 flex-wrap">
                                <span className="text-base sm:text-lg font-bold text-gray-900">
                                  {formatPrice(item.product.prices.price)}
                                </span>
                                {item.product.prices.originalPrice && item.product.prices.originalPrice > item.product.prices.price && (
                                  <>
                                    <span className="text-xs sm:text-sm text-gray-500 line-through">
                                      {formatPrice(item.product.prices.originalPrice)}
                                    </span>
                                    <span className="text-xs sm:text-sm font-bold text-green-600">
                                      ({calculateItemDiscount(item.product.prices.originalPrice, item.product.prices.price)}% OFF)
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Remove Button */}
                            <button
                              onClick={() => handleRemoveItem(item.id)}
                              className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0 p-1 sm:p-2 -mr-1 sm:-mr-2"
                            >
                              <TrashIcon className="h-4 sm:h-5 w-4 sm:w-5" />
                            </button>
                          </div>

                          {/* Quantity Controls */}
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-4 sm:mt-6 gap-3 sm:gap-0">
                            <div className="flex items-center space-x-2 w-full sm:w-auto">
                              <span className="text-xs sm:text-sm font-medium text-gray-700 hidden sm:inline-block">Quantity:</span>
                              <div className="flex items-center border border-gray-300 rounded-lg bg-white h-8 sm:h-9">
                                <button
                                  onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                                  disabled={isUpdating === item.id}
                                  className="w-8 sm:w-9 h-full flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-50 rounded-l-lg border-r border-gray-200"
                                >
                                  <MinusIcon className="h-3 sm:h-4 w-3 sm:w-4 text-gray-600" />
                                </button>
                                <span className="w-10 sm:w-12 h-full flex items-center justify-center text-xs sm:text-sm font-medium text-gray-900">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                  disabled={isUpdating === item.id}
                                  className="w-8 sm:w-9 h-full flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-50 rounded-r-lg border-l border-gray-200"
                                >
                                  <PlusIcon className="h-3 sm:h-4 w-3 sm:w-4 text-gray-600" />
                                </button>
                              </div>
                            </div>

                            {/* Item Total */}
                            <div className="text-left sm:text-right w-full sm:w-auto flex items-center justify-between sm:block bg-gray-50 sm:bg-transparent p-2 sm:p-0 rounded-md sm:rounded-none">
                              <span className="text-xs font-medium text-gray-500 sm:hidden">Total:</span>
                              <span className="text-sm sm:text-lg font-black text-gray-900">
                                {formatPrice(item.product.prices.price * item.quantity)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="xl:col-span-1 min-w-0">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
                
                {/* Summary Items */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal ({itemCount} items)</span>
                    <span className="font-medium text-gray-900">{formatPrice(total)}</span>
                  </div>
                  
                  {/* Product-level savings */}
                  {totalSavings > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-green-700 flex items-center gap-1">
                        <TagIcon className="h-3.5 w-3.5" />
                        Product Discounts
                      </span>
                      <span className="font-medium text-green-700">-{formatPrice(totalSavings)}</span>
                    </div>
                  )}

                  {/* Membership discount row */}
                  {membershipDiscountAmount > 0 && membership?.tier && (
                    <div className="flex justify-between text-sm bg-indigo-50 rounded-lg px-3 py-2 border border-indigo-100">
                      <span className="text-indigo-700 font-semibold flex items-center gap-1.5">
                        <CheckBadgeIcon className="h-4 w-4 text-indigo-600 flex-shrink-0" />
                        {membership.tier.name} Membership ({membership.tier.discountPercentage}%)
                      </span>
                      <span className="font-bold text-indigo-700 flex-shrink-0">-{formatPrice(membershipDiscountAmount)}</span>
                    </div>
                  )}

                  {(pointsToEarn > 0 || couponsToEarn.length > 0) && (
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-3 space-y-1.5 mb-3">
                      <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                        <span>🎁</span> Rewards on this Order
                      </div>
                      {pointsToEarn > 0 && (
                        <div className="flex justify-between text-xs font-semibold text-emerald-700">
                          <span>Points to Earn</span>
                          <span>+{pointsToEarn} pts</span>
                        </div>
                      )}
                      {couponsToEarn.map((c, idx) => (
                        <div key={idx} className="flex justify-between text-xs font-semibold text-emerald-700">
                          <span>Free Coupon Reward</span>
                          <span>₹{c.couponValue} OFF Coupon</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between text-lg font-bold text-gray-900">
                      <span>Total</span>
                      <span>{formatPrice(finalTotal)}</span>
                    </div>
                    {membershipDiscountAmount > 0 && (
                      <p className="text-xs text-indigo-600 mt-1 text-right font-medium">
                        You saved {formatPrice(membershipDiscountAmount)} with membership! 🎉
                      </p>
                    )}
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-start space-x-3 text-sm text-gray-600">
                    <ShieldCheckIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span>30-day return policy</span>
                  </div>
                  <div className="flex items-start space-x-3 text-sm text-gray-600">
                    <CreditCardIcon className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                    <span>Secure payment processing</span>
                  </div>
                </div>

                {/* Checkout Button */}
                <button
                  onClick={handleProceedToCheckout}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Proceed to Checkout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}