'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { createOrder } from '../store/slices/orderSlice';
import { clearCart } from '../store/slices/cartSlice';
import { useCalculateShippingMutation } from '../store/slices/clientShippingApiSlice';
import axios from 'axios';
import { 
  CreditCardIcon, 
  TruckIcon, 
  LockClosedIcon,
  CheckIcon,
  BanknotesIcon,
  CheckBadgeIcon,
  TagIcon,
  TicketIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { showingTranslateValue } from '../lib/utils';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5056/api';

interface MembershipInfo {
  tier: { _id: string; name: string; discountPercentage: number } | null;
  isActive: boolean;
  expiry: string | null;
}

export default function CheckoutForm() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { items, total } = useAppSelector(state => state.cart);
  const { isAuthenticated, user } = useAppSelector(state => state.auth);
  const userId = (user as any)?._id;
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [calculateShippingApi] = useCalculateShippingMutation();
  const [shippingInfo, setShippingInfo] = useState({ cost: 0, distance: 0, strategy: '' });
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [useLoyaltyPoints, setUseLoyaltyPoints] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cash-on-delivery'>('razorpay');
  const [membership, setMembership] = useState<MembershipInfo | null>(null);
  const [pointsToEarn, setPointsToEarn] = useState(0);
  const [couponsToEarn, setCouponsToEarn] = useState<any[]>([]);
  const [customerCoupons, setCustomerCoupons] = useState<any[]>([]);
  const [selectedCoupon, setSelectedCoupon] = useState<any | null>(null);
  const [loyaltyConfig, setLoyaltyConfig] = useState<any>(null);
  const [formData, setFormData] = useState({
    // Shipping Address
    firstName: user?.name?.split(' ')[0] || '',
    lastName: user?.name?.split(' ').slice(1).join(' ') || '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'USA',
    
    // Payment
    cardNumber: '',
    cardName: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    
    // Additional
    saveAddress: true,
    savePayment: false,
  });

  const [guestFormData, setGuestFormData] = useState({
    customer: '',
    phone: '',
    transportStation: '',
    remarks: '',
  });

  const [savedAddress, setSavedAddress] = useState<any>(null);
  const [useSavedAddress, setUseSavedAddress] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('savedCheckoutAddress');
      if (saved) {
        const parsed = JSON.parse(saved);
        setSavedAddress(parsed);
        setUseSavedAddress(true);
        setFormData(prev => ({
          ...prev,
          ...parsed,
          saveAddress: true
        }));
      }
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && userId) {
      // Fetch loyalty points from the correct loyalty program endpoint
      axios.get(`${API_BASE}/loyalty-program/points-balance/${userId}`)
        .then(res => {
          if (res.data && res.data.success && typeof res.data.balance === 'number') {
            setLoyaltyPoints(res.data.balance);
          }
        })
        .catch(err => console.error("Error fetching loyalty points:", err));

      // Fetch customer active issued coupons
      axios.get(`${API_BASE}/loyalty-program/customer-coupons/${userId}`)
        .then(res => {
          if (res.data?.success) {
            const active = (res.data.data || []).filter((c: any) => !c.isUsed && new Date(c.expiryDate) > new Date());
            setCustomerCoupons(active);
          }
        })
        .catch(err => console.error("Error fetching customer coupons:", err));

      // Fetch membership tier
      axios.get(`${API_BASE}/loyalty-program/my-membership/${userId}`)
        .then(res => {
          if (res.data?.success) setMembership(res.data.data);
        })
        .catch(err => console.error("Error fetching membership:", err));

      // Fetch loyalty configuration
      axios.get(`${API_BASE}/loyalty-program/config`)
        .then(res => {
          if (res.data && res.data.success) {
            setLoyaltyConfig(res.data.data);
          }
        })
        .catch(err => console.error("Error fetching loyalty config:", err));
    }
  }, [isAuthenticated, userId]);

  useEffect(() => {
    if (isAuthenticated && userId && items.length > 0) {
      const loyaltyItems = items.map(item => ({
        item_id: item.product._id,
        item_group_id: item.product.item_group_id || null,
        price: item.product.prices.price,
        quantity: item.quantity
      }));

      axios.post(`${API_BASE}/loyalty-program/calculate-points`, {
        customerId: userId,
        items: loyaltyItems,
        totalAmount: total
      })
      .then(res => {
        if (res.data && res.data.success) {
          setPointsToEarn(res.data.pointsAwarded || 0);
          setCouponsToEarn(res.data.couponsIssued || []);
        }
      })
      .catch(err => console.error("Error calculating points to earn:", err));
    } else {
      setPointsToEarn(0);
      setCouponsToEarn([]);
    }
  }, [isAuthenticated, userId, items, total]);

  const handleGuestInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setGuestFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(price);
  };

  const shippingCost = shippingInfo.cost;
  const pointValue = loyaltyConfig?.pointValueInRs ?? 0.8;
  const minPoints = loyaltyConfig?.minPointToRedeem ?? 0;
  const minInvoice = loyaltyConfig?.minInvoiceAmountToRedeem ?? 0;

  // Membership discount
  const membershipDiscountPercent = membership?.isActive && membership?.tier?.discountPercentage
    ? membership.tier.discountPercentage : 0;
  const membershipDiscountAmount = parseFloat(((total * membershipDiscountPercent) / 100).toFixed(2));

  const canRedeem = loyaltyPoints >= minPoints && total >= minInvoice;
  const maxRedeemablePoints = Math.min(loyaltyPoints, Math.ceil((total - membershipDiscountAmount) / pointValue));
  const redeemPoints = useLoyaltyPoints && canRedeem ? maxRedeemablePoints : 0;
  const loyaltyDiscount = redeemPoints * pointValue;
  const couponDiscountAmount = selectedCoupon ? (selectedCoupon.couponValue || 0) : 0;

  const finalTotal = Math.max(0, total + shippingCost - loyaltyDiscount - membershipDiscountAmount - couponDiscountAmount);

  const totalSavings = items.reduce((sum, item) => {
    const originalPrice = item.product.prices?.originalPrice;
    const price = item.product.prices?.price;
    if (originalPrice && price && originalPrice > price) {
      return sum + (originalPrice - price) * item.quantity;
    }
    return sum;
  }, 0);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleAddressBlur = async () => {
    // Only call if we have items
    if (total > 0 && formData.zipCode) {
      try {
        toast.loading('Calculating shipping...', { id: 'shipping-toast' });
        
        // Fetch coordinates using free OpenStreetMap Nominatim API
        let lat = 28.7041; 
        let lng = 77.1025;
        
        try {
          const query = `${formData.zipCode} ${formData.city} ${formData.country}`;
          const geocodeRes = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
          if (geocodeRes.data && geocodeRes.data.length > 0) {
            lat = parseFloat(geocodeRes.data[0].lat);
            lng = parseFloat(geocodeRes.data[0].lon);
          }
        } catch (geoErr) {
          console.warn('Geocoding failed, falling back to default coordinates.');
        }
        
        const res = await calculateShippingApi({ latitude: lat, longitude: lng, orderAmount: total }).unwrap();
        if (res?.data) {
          setShippingInfo({
            cost: res.data.shippingCharge,
            distance: res.data.distanceKm,
            strategy: res.data.shippingStrategy
          });
          toast.success(`Shipping calculated: ₹${res.data.shippingCharge} for ${res.data.distanceKm}km`, { id: 'shipping-toast' });
        }
      } catch (err: any) {
        toast.error(err?.data?.message || 'Failed to calculate dynamic shipping.', { id: 'shipping-toast' });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone ||
        !formData.address || !formData.city || !formData.state || !formData.zipCode) {
      toast.error('Please fill in all required shipping address fields');
      return;
    }

    setIsProcessing(true);

    try {
      const orderData = {
        cart: items.map(item => ({
          _id: item.product._id,
          id: item.product._id,
          title: showingTranslateValue(item.product.title),
          image: item.product.image || [],
          price: item.product.prices.price,
          originalPrice: item.product.prices.originalPrice,
          quantity: item.quantity,
          itemTotal: item.product.prices.price * item.quantity,
          color: item.color || '',
          size: item.size || '',
          groupId: item.product.item_group_id || null
        })),
        total: finalTotal,
        subTotal: total,
        discount: loyaltyDiscount + membershipDiscountAmount + couponDiscountAmount,
        membershipDiscount: membershipDiscountAmount,
        couponDiscount: couponDiscountAmount,
        couponCode: selectedCoupon?.couponCode || '',
        membershipTier: membership?.tier?.name || null,
        redeemPoints: redeemPoints,
        shippingCost: shippingCost,
        paymentMethod: paymentMethod === 'razorpay' ? 'Razorpay' : 'Cash on Delivery',
        user_info: {
          name: `${formData.firstName} ${formData.lastName}`,
          contact: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: formData.country,
        }
      };

      if (paymentMethod === 'razorpay') {
        const loadScript = () => new Promise((resolve) => {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => resolve(true);
          script.onerror = () => resolve(false);
          document.body.appendChild(script);
        });

        const res = await loadScript();
        if (!res) {
          toast.error('Razorpay SDK failed to load. Are you online?');
          setIsProcessing(false);
          return;
        }

        const token = localStorage.getItem('authToken');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const result = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5056/api'}/order/create/razorpay`, {
          amount: finalTotal,
          currency: 'INR'
        }, { 
          withCredentials: true,
          headers
        });

        if (!result.data || !result.data.order_id) {
          toast.error('Server error. Are you online?');
          setIsProcessing(false);
          return;
        }

        const { order_id, amount, currency } = result.data;

        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, 
          amount: amount,
          currency: currency,
          name: "VTC shoe",
          description: "Test Transaction",
          order_id: order_id,
          handler: async function (response: any) {
            try {
              const verifyRes = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5056/api'}/order/verify-payment`, {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              }, { 
                withCredentials: true,
                headers
              });
              
                if (verifyRes.data.success) {
                  await dispatch(createOrder(orderData)).unwrap();
                  dispatch(clearCart());
                  toast.success('Payment successful & Order placed!');
                router.push('/order-confirmation');
              } else {
                toast.error('Payment verification failed.');
              }
            } catch (err: any) {
              toast.error('Payment verification error.');
            } finally {
              setIsProcessing(false);
            }
          },
          prefill: {
            name: `${formData.firstName} ${formData.lastName}`,
            email: formData.email,
            contact: formData.phone,
          },
          theme: {
            color: "#3399cc",
          },
        };

        const paymentObject = new (window as any).Razorpay(options);
        paymentObject.on('payment.failed', function (response: any) {
          toast.error(response.error.description);
          setIsProcessing(false);
        });
        paymentObject.open();
      } else {
        await dispatch(createOrder(orderData)).unwrap();
        dispatch(clearCart());
        toast.success('Order placed successfully!');
        router.push('/order-confirmation');
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to place order. Please try again.';
      toast.error(errorMessage);
      setIsProcessing(false);
    }
    
    // Save address if checked
    if (isAuthenticated && formData.saveAddress && !isProcessing) {
      localStorage.setItem('savedCheckoutAddress', JSON.stringify({
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        country: formData.country,
      }));
    }
  };

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Checkout</h1>
        <p className="text-gray-600">Complete your purchase</p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Checkout Form */}
        <div className="xl:col-span-2 space-y-8 min-w-0">
              {/* Shipping Address */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center space-x-2 mb-6">
                  <TruckIcon className="h-6 w-6 text-blue-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Shipping Address</h2>
                </div>
                
                {isAuthenticated && savedAddress && (
                  <div className="mb-6 space-y-3">
                    <label className={`relative flex p-4 border rounded-lg cursor-pointer transition-colors ${useSavedAddress ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <input type="radio" name="addressSelect" checked={useSavedAddress} onChange={() => {
                        setUseSavedAddress(true);
                        setFormData(prev => ({ ...prev, ...savedAddress, saveAddress: true }));
                      }} className="sr-only" />
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${useSavedAddress ? 'border-blue-500' : 'border-gray-300'}`}>
                          {useSavedAddress && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">Use saved address</p>
                          <p className="text-sm text-gray-500 mt-1">{savedAddress.address}, {savedAddress.city}, {savedAddress.state} {savedAddress.zipCode}</p>
                          <p className="text-xs text-gray-400">{savedAddress.firstName} {savedAddress.lastName} - {savedAddress.phone}</p>
                        </div>
                      </div>
                    </label>
                    <label className={`relative flex p-4 border rounded-lg cursor-pointer transition-colors ${!useSavedAddress ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <input type="radio" name="addressSelect" checked={!useSavedAddress} onChange={() => {
                        setUseSavedAddress(false);
                        setFormData(prev => ({ ...prev, address: '', city: '', state: '', zipCode: '', phone: '' }));
                      }} className="sr-only" />
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${!useSavedAddress ? 'border-blue-500' : 'border-gray-300'}`}>
                          {!useSavedAddress && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">Enter a new address</p>
                        </div>
                      </div>
                    </label>
                  </div>
                )}
                
                <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${isAuthenticated && useSavedAddress ? 'hidden' : ''}`}>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      required={!(isAuthenticated && useSavedAddress)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      required={!(isAuthenticated && useSavedAddress)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      required={!(isAuthenticated && useSavedAddress)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      required={!(isAuthenticated && useSavedAddress)}
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address *
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      required={!(isAuthenticated && useSavedAddress)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      required={!(isAuthenticated && useSavedAddress)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State *
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      required={!(isAuthenticated && useSavedAddress)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ZIP Code *
                    </label>
                    <input
                      type="text"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleInputChange}
                      onBlur={handleAddressBlur}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      required={!(isAuthenticated && useSavedAddress)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Country
                    </label>
                    <select
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="USA">United States</option>
                      <option value="Canada">Canada</option>
                      <option value="UK">United Kingdom</option>
                      <option value="India">India</option>
                    </select>
                  </div>
                </div>
                
                {isAuthenticated && (
                  <div className="mt-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="saveAddress"
                      checked={formData.saveAddress}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Save this address for future orders</span>
                  </label>
                  </div>
                )}
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center space-x-2 mb-6">
                  <CreditCardIcon className="h-6 w-6 text-blue-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Payment Method</h2>
                </div>
                
                {/* Payment Method Selection */}
                <div className="space-y-4 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className={`relative flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                      paymentMethod === 'razorpay' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="razorpay"
                        checked={paymentMethod === 'razorpay'}
                        onChange={(e) => setPaymentMethod(e.target.value as 'razorpay' | 'cash-on-delivery')}
                        className="sr-only"
                      />
                      <div className="flex items-center space-x-3">
                        <CreditCardIcon className="h-6 w-6 text-blue-600" />
                        <div>
                          <p className="font-medium text-gray-900">Razorpay</p>
                          <p className="text-sm text-gray-500">Pay securely via Razorpay</p>
                        </div>
                      </div>
                      {paymentMethod === 'razorpay' && (
                        <div className="absolute top-2 right-2 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      )}
                    </label>

                    <label className={`relative flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                      paymentMethod === 'cash-on-delivery' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cash-on-delivery"
                        checked={paymentMethod === 'cash-on-delivery'}
                        onChange={(e) => setPaymentMethod(e.target.value as 'razorpay' | 'cash-on-delivery')}
                        className="sr-only"
                      />
                      <div className="flex items-center space-x-3">
                        <BanknotesIcon className="h-6 w-6 text-green-600" />
                        <div>
                          <p className="font-medium text-gray-900">Cash on Delivery</p>
                          <p className="text-sm text-gray-500">Pay when you receive your order</p>
                        </div>
                      </div>
                      {paymentMethod === 'cash-on-delivery' && (
                        <div className="absolute top-2 right-2 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                {/* Removed manual CC form since Razorpay handles it */}

                {/* Cash on Delivery Notice */}
                {paymentMethod === 'cash-on-delivery' && (
                  <div className="border-t border-gray-200 pt-6">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <BanknotesIcon className="h-5 w-5 text-green-600 mt-0.5" />
                        <div>
                          <h4 className="text-sm font-medium text-green-800">Cash on Delivery</h4>
                          <p className="text-sm text-green-700 mt-1">
                            You'll pay the full amount of {formatPrice(finalTotal)} when your order is delivered. 
                            Please have the exact amount ready for the delivery person.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
        </div>

        {/* Order Summary */}
        <div className="xl:col-span-1 min-w-0">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>
            
            {/* Cart Items */}
            <div className="space-y-3 mb-6">
              {items.map((item) => (
                <div key={item.id} className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                    <span className="text-gray-500 text-xs">Img</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {showingTranslateValue(item.product.title)}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {item.size} • {item.color} • Qty: {item.quantity}
                    </p>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {formatPrice(item.product.prices.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
            
            {/* Totals */}
            <div className="border-t border-gray-200 pt-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium text-gray-900">{formatPrice(total)}</span>
              </div>
              
              {totalSavings > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 flex items-center gap-1">
                    <TagIcon className="h-3.5 w-3.5" />
                    Product Discounts
                  </span>
                  <span className="font-medium text-green-600">-{formatPrice(totalSavings)}</span>
                </div>
              )}

              {/* Membership Discount Row */}
              {membershipDiscountAmount > 0 && membership?.tier && (
                <div className="flex justify-between text-sm items-center bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2">
                  <span className="text-indigo-700 font-semibold flex items-center gap-1.5">
                    <CheckBadgeIcon className="h-4 w-4 flex-shrink-0" />
                    {membership.tier.name} Membership ({membership.tier.discountPercentage}%)
                  </span>
                  <span className="font-bold text-indigo-700 flex-shrink-0">-{formatPrice(membershipDiscountAmount)}</span>
                </div>
              )}
              
              {/* Applied Coupon Discount Row */}
              {couponDiscountAmount > 0 && selectedCoupon && (
                <div className="flex justify-between text-sm items-center bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                  <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
                    <TicketIcon className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                    Coupon ({selectedCoupon.couponCode})
                  </span>
                  <span className="font-bold text-emerald-700 flex-shrink-0">-{formatPrice(couponDiscountAmount)}</span>
                </div>
              )}
              
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Shipping {shippingInfo.distance > 0 && `(${shippingInfo.distance} km)`}</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">
                    {shippingCost === 0 ? 'Free' : formatPrice(shippingCost)}
                  </span>
                </div>
              </div>

              {/* Loyalty Points Redemption */}
              {loyaltyPoints > 0 && (
                <div className="pt-3 border-t border-gray-200">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={useLoyaltyPoints}
                      disabled={!canRedeem}
                      onChange={(e) => setUseLoyaltyPoints(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <span className={`text-sm font-medium ${canRedeem ? 'text-gray-700' : 'text-gray-400'}`}>
                      Use {maxRedeemablePoints} Loyalty Points (-{formatPrice(maxRedeemablePoints * pointValue)})
                    </span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1 ml-6">Available Balance: {loyaltyPoints} points</p>
                  {!canRedeem && (
                    <p className="text-xs text-amber-600 mt-1 ml-6">
                      {loyaltyPoints < minPoints && `Minimum points required to redeem is ${minPoints} points. `}
                      {total < minInvoice && `Minimum invoice amount required to redeem is ${formatPrice(minInvoice)}.`}
                    </p>
                  )}
                </div>
              )}

              {/* Active Issued Loyalty Coupons Redemption List */}
              {isAuthenticated && customerCoupons.length > 0 && (
                <div className="pt-3 border-t border-gray-200">
                  <div className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <TicketIcon className="h-4 w-4 text-indigo-600" />
                    Available Loyalty Coupons
                  </div>
                  <div className="space-y-2">
                    {customerCoupons.map((coupon) => {
                      const isSelected = selectedCoupon?.couponCode === coupon.couponCode;
                      return (
                        <div 
                          key={coupon._id}
                          onClick={() => setSelectedCoupon(isSelected ? null : coupon)}
                          className={`p-2.5 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                            isSelected 
                              ? 'border-indigo-500 bg-indigo-50/70 shadow-sm' 
                              : 'border-gray-200 hover:border-indigo-200 bg-gray-50/50'
                          }`}
                        >
                          <div>
                            <div className="text-xs font-bold text-indigo-900 font-mono">
                              {coupon.couponCode}
                            </div>
                            <div className="text-[11px] text-gray-500">
                              {coupon.description || 'Loyalty Coupon'}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-extrabold text-emerald-600">₹{coupon.couponValue} OFF</span>
                            <span className={`text-[11px] px-2 py-0.5 rounded font-semibold ${
                              isSelected ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'
                            }`}>
                              {isSelected ? 'Applied ✓' : 'Apply'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Rewards on this Order Preview Banner */}
              {(pointsToEarn > 0 || couponsToEarn.length > 0) && (
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-3 space-y-1.5 mt-3">
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
              </div>
            </div>

            {/* Security Notice */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <LockClosedIcon className="h-4 w-4" />
                <span>
                  {paymentMethod === 'razorpay' 
                    ? 'Secure checkout powered by Razorpay' 
                    : 'Safe and secure cash on delivery'
                  }
                </span>
              </div>
            </div>

            {/* Place Order Button */}
            <button
              type="submit"
              disabled={isProcessing}
              className="w-full mt-6 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <CheckIcon className="h-5 w-5" />
                  <span>Place Order</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
    </>
  );
} 