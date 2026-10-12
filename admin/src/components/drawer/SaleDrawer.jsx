import React, { useState, useEffect, useContext, useCallback, useMemo } from "react";
import { Scrollbars } from "react-custom-scrollbars-2";
import { Card, CardBody, Input } from "@windmill/react-ui";
import { useTranslation } from "react-i18next";
import Title from "@/components/form/others/Title";
import InputArea from "@/components/form/input/InputArea";
import useSaleSubmit from "@/hooks/useSaleSubmit";
import CustomerServices from "@/services/CustomerServices";
import useAsync from "@/hooks/useAsync";
import SearchableDropdown from "@/pages/SearchableDropdown";
import SalesmanServices from "@/services/SalesmanServices";
import ItemServices from "@/services/ItemServices";
import SaleServices from "@/services/SaleServices";
import SaleTypeServices from "@/services/SaleTypeServices";
import SundryDiscountService from "@/services/SundryDiscountServices";
import { notifyError, notifySuccess } from "@/utils/toast";
import { SidebarContext } from "@/context/SidebarContext";
import { set } from "date-fns";
import UnitServices from "@/services/UnitServices";
import ItemDiscountServices from "@/services/ItemsDiscountServices";
import ItemSearchableDropdown from "@/pages/ItemSearchableDropdown";
import { AdminContext } from "@/context/AdminContext";
import AttributeValueServices from "@/services/AttributeValueServices";
import LoyaltyServices from "@/services/LoyaltyServices";
import CustomerPendingOrdersModal from "@/components/modal/CustomerPendingOrdersModal";
import { FiAward, FiStar, FiFileText, FiCheckCircle, FiGift, FiTag, FiPercent, FiTrash2, FiClock, FiAlertCircle, FiZap } from "react-icons/fi";


const SaleDrawer = ({ id, isViewOnly = false }) => {
  const { isDrawerOpen } = useContext(SidebarContext);
  const { state: adminState } = useContext(AdminContext);
  const { adminInfo } = adminState;

  const {
    register,
    handleSubmit,
    onSubmit,
    errors,
    isSubmitting,
    handleSelectLanguage,
  } = useSaleSubmit(id);

  const { t } = useTranslation();
  const [items, setItems] = useState([{
    image: '',
    name: '',
    itemId: '',
    hsn: '',
    quantity: '',
    unit: null,
    listPrice: '',
    discount: '',
    totalDiscount: '',
    price: '',
    amount: '',
    color: '',
    size: '',
    variantColors: [],
    variantSizes: []
  }]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [totalDiscountAmount, setTotalDiscountAmount] = useState(0);
  const [totalQuantity, setTotalQuantity] = useState(0);
  const [totalHammli, setTotalHammli] = useState(0);
  const [totalCgstSundries, setTotalCgstSundries] = useState(0);
  const [totalSgstSundries, setTotalSgstSundries] = useState(0);
  const [totalIgstSundries, setTotalIgstSundries] = useState(0);
  const [totalDiscountSundries, setTotalDiscountSundries] = useState(0);
  const [totalNetAmount, setNetAmount] = useState(0);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [voucherNo, setVoucherNo] = useState('');
  const [saleType, setSaleType] = useState('L/GST-voucher(12%)');
  const [matCentre, setMatCentre] = useState('RETAIL');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedSalesman, setSelectedSalesman] = useState(null);
  const [getParty, setParty] = useState(null);
  const [getPartyObject, setPartyObject] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemCode, setItemCode] = useState(null);
  const [selectedSaleType, setSelectedSaleType] = useState(null);
  const [itemDiscount, setItemDiscount] = useState(0);
  const [vendorDiscount, setVendorDiscount] = useState(0);
  const [hammaliDiscount, setHammaliDiscount] = useState({ name: "Hammali@20/CRT", discount: 0 });
  const [isCentralSale, setIsCentralSale] = useState(false);
  const [colorOptions, setColorOptions] = useState([]);
  const [sizeOptions, setSizeOptions] = useState([]);


  const [customerList, setCustomerList] = useState([]);
  const [isSearchingCustomers, setIsSearchingCustomers] = useState(false);
  const [customerPage, setCustomerPage] = useState(1);
  const [hasMoreCustomers, setHasMoreCustomers] = useState(false);
  const [loadingMoreCustomers, setLoadingMoreCustomers] = useState(false);

  // Loyalty states
  const [loyaltyInfo, setLoyaltyInfo] = useState(null);
  const [isFetchingLoyalty, setIsFetchingLoyalty] = useState(false);
  const [isRedeemActive, setIsRedeemActive] = useState(false);
  const [redeemPoints, setRedeemPoints] = useState(0);
  const [loyaltyDiscountAmount, setLoyaltyDiscountAmount] = useState(0);

  // Tier Membership states
  const [isTierDiscountActive, setIsTierDiscountActive] = useState(false);
  const [tierDiscountAmount, setTierDiscountAmount] = useState(0);

  // Coupon states
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [couponDiscountAmount, setCouponDiscountAmount] = useState(0);
  const [couponApplying, setCouponApplying] = useState(false);
  const [couponMessage, setCouponMessage] = useState(null);

  // Rewards preview
  const [estimatedPointsEarned, setEstimatedPointsEarned] = useState(0);

  // Pending Sale Orders states for selected party
  const [pendingOrders, setPendingOrders] = useState([]);
  const [isPendingOrdersModalOpen, setIsPendingOrdersModalOpen] = useState(false);
  const [loadedSaleOrder, setLoadedSaleOrder] = useState(null);
  const [loadedSaleOrders, setLoadedSaleOrders] = useState([]);
  const [isCheckingOrders, setIsCheckingOrders] = useState(false);

  // Check pending sale orders for the selected customer
  const checkPendingOrdersForCustomer = useCallback(async (customerId, custName) => {
    if (!customerId || id) return;
    try {
      setIsCheckingOrders(true);
      const res = await SaleServices.getPendingOrdersByCustomer(customerId);
      if (res?.success && Array.isArray(res.orders) && res.orders.length > 0) {
        setPendingOrders(res.orders);
        setIsPendingOrdersModalOpen(true);
      } else {
        setPendingOrders([]);
      }
    } catch (err) {
      console.error("Error checking pending orders:", err);
    } finally {
      setIsCheckingOrders(false);
    }
  }, [id]);

  const fetchCustomerLoyalty = useCallback(async (customerId) => {
    const id = typeof customerId === 'object' ? (customerId?.value || customerId?._id) : customerId;
    if (!id) {
      setLoyaltyInfo(null);
      setIsRedeemActive(false);
      setRedeemPoints(0);
      setLoyaltyDiscountAmount(0);
      setIsTierDiscountActive(false);
      setTierDiscountAmount(0);
      setAvailableCoupons([]);
      setSelectedCoupon(null);
      setCouponCodeInput("");
      setCouponDiscountAmount(0);
      setCouponMessage(null);
      setEstimatedPointsEarned(0);
      return;
    }
    setIsFetchingLoyalty(true);
    try {
      const [res, couponsRes] = await Promise.allSettled([
        LoyaltyServices.getPointsBalance(id),
        LoyaltyServices.getCustomerCoupons(id)
      ]);

      let loyaltyData = null;
      if (res.status === 'fulfilled' && res.value?.success) {
        loyaltyData = res.value;
      } else {
        // Fallback to legacy endpoint if deployed server hasn't updated yet
        try {
          const legacyRes = await LoyaltyServices.getCustomerLoyaltyPoints(id);
          loyaltyData = {
            success: true,
            balance: legacyRes?.totalPoints || 0,
            pointValueInRs: 1,
            visitCount: 0,
            tier: null,
            entries: legacyRes?.transactions || []
          };
        } catch {
          loyaltyData = {
            success: true,
            balance: 0,
            pointValueInRs: 1,
            visitCount: 0,
            tier: null,
            entries: []
          };
        }
      }

      setLoyaltyInfo(loyaltyData);

      // Auto-enable tier discount if tier has discountPercentage > 0 and is not expired
      if (loyaltyData?.tier && Number(loyaltyData.tier.discountPercentage) > 0 && !loyaltyData?.isTierExpired) {
        setIsTierDiscountActive(true);
      } else {
        setIsTierDiscountActive(false);
      }

      // Populate available unused, unexpired coupons
      if (couponsRes.status === 'fulfilled' && couponsRes.value?.success && Array.isArray(couponsRes.value.data)) {
        const now = new Date();
        const activeCoupons = couponsRes.value.data.filter(c => !c.isUsed && (!c.expiryDate || new Date(c.expiryDate) > now));
        setAvailableCoupons(activeCoupons);
      } else {
        setAvailableCoupons([]);
      }
      setSelectedCoupon(null);
      setCouponDiscountAmount(0);
      setCouponMessage(null);

    } catch (err) {
      console.error("Error fetching loyalty info:", err);
    } finally {
      setIsFetchingLoyalty(false);
    }
  }, []);

  const handleApplyCoupon = useCallback((coupon) => {
    if (!coupon) return;
    setSelectedCoupon(coupon);
    setCouponDiscountAmount(Number(coupon.couponValue) || 0);
    setCouponMessage({ type: 'success', text: `Coupon ${coupon.couponCode} applied! (-₹${Number(coupon.couponValue || 0).toFixed(2)})` });
  }, []);

  const handleApplyCouponCode = useCallback(async (codeToApply) => {
    const code = (codeToApply || couponCodeInput || '').trim();
    if (!code) {
      setCouponMessage({ type: 'error', text: 'Please enter a coupon code' });
      return;
    }
    const custId = selectedCustomer?.value;
    if (!custId) {
      setCouponMessage({ type: 'error', text: 'Please select a customer first' });
      return;
    }
    setCouponApplying(true);
    setCouponMessage(null);
    try {
      const loyaltyItems = items.map(item => ({
        item_id: item.itemId?.value || item.itemId?._id || item.itemId,
        price: item.price || item.listPrice || 0,
        quantity: item.quantity || 1
      }));
      const res = await LoyaltyServices.validateCoupon({
        couponCode: code,
        customerId: custId,
        totalAmount: totalAmount || 0,
        items: loyaltyItems
      });

      if (res?.success && res.valid && res.coupon) {
        setSelectedCoupon(res.coupon);
        setCouponDiscountAmount(Number(res.coupon.couponValue) || 0);
        setCouponMessage({ type: 'success', text: `Coupon ${res.coupon.couponCode} applied successfully! (-₹${Number(res.coupon.couponValue || 0).toFixed(2)})` });
        setCouponCodeInput("");
      } else {
        setCouponMessage({ type: 'error', text: res?.reason || 'Invalid or expired coupon' });
      }
    } catch (err) {
      console.error("Error validating coupon:", err);
      setCouponMessage({ type: 'error', text: err?.response?.data?.message || err?.message || 'Error validating coupon' });
    } finally {
      setCouponApplying(false);
    }
  }, [couponCodeInput, selectedCustomer, items, totalAmount]);

  const handleRemoveCoupon = useCallback(() => {
    setSelectedCoupon(null);
    setCouponDiscountAmount(0);
    setCouponMessage(null);
    setCouponCodeInput("");
  }, []);

  const fetchCustomers = useCallback(async (query = "", page = 1) => {
    return await CustomerServices.activeCustomer(query, { params: { page, limit: 100 } });
  }, []);

  const { data: customerData } = useAsync(async () => {
    const res = await fetchCustomers("", 1);
    setCustomerList(res.data || []);
    setHasMoreCustomers(res.pagination?.hasNext || false);
    setCustomerPage(1);
    return res.data;
  }, []);

  const handleSearchCustomers = useCallback(async (query) => {
    setIsSearchingCustomers(true);
    try {
      const res = await fetchCustomers(query, 1);
      setCustomerList(res.data || []);
      setHasMoreCustomers(res.pagination?.hasNext || false);
      setCustomerPage(1);
    } catch (error) {
      console.error("Error searching customers:", error);
    } finally {
      setIsSearchingCustomers(false);
    }
  }, [fetchCustomers]);

  const handleLoadMoreCustomers = useCallback(async (query) => {
    if (loadingMoreCustomers || !hasMoreCustomers) return;
    setLoadingMoreCustomers(true);
    try {
      const nextPage = customerPage + 1;
      const res = await fetchCustomers(query, nextPage);
      setCustomerList(prev => [...prev, ...(res.data || [])]);
      setHasMoreCustomers(res.pagination?.hasNext || false);
      setCustomerPage(nextPage);
    } catch (error) {
      console.error("Error loading more customers:", error);
    } finally {
      setLoadingMoreCustomers(false);
    }
  }, [customerPage, hasMoreCustomers, loadingMoreCustomers, fetchCustomers]);

  // Recalculate Tier Membership discount when items, tier, or status changes
  useEffect(() => {
    if (isTierDiscountActive && loyaltyInfo?.tier && !loyaltyInfo?.isTierExpired) {
      const tier = loyaltyInfo.tier;
      const discPercent = Number(tier.discountPercentage) || 0;
      if (discPercent <= 0) {
        setTierDiscountAmount(0);
        return;
      }

      const scope = tier.applicableOn || 'all';
      let eligibleSubtotal = 0;

      if (scope === 'all') {
        eligibleSubtotal = items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
      } else if (scope === 'item_group') {
        const allowedGroups = (tier.applicableItemGroups || []).map(g => String(g._id || g));
        eligibleSubtotal = items.reduce((sum, item) => {
          const itemGroupId = String(item.groupId || item.item_group_id || item.itemId?.item_group_id || '');
          return allowedGroups.includes(itemGroupId) ? sum + (parseFloat(item.amount) || 0) : sum;
        }, 0);
      } else if (scope === 'brand') {
        const allowedBrands = (tier.applicableBrands || []).map(b => String(b._id || b));
        eligibleSubtotal = items.reduce((sum, item) => {
          const itemBrandId = String(item.brandId || item.brand_id || item.itemId?.brand_id || '');
          return allowedBrands.includes(itemBrandId) ? sum + (parseFloat(item.amount) || 0) : sum;
        }, 0);
      } else if (scope === 'item') {
        const allowedItems = (tier.applicableItems || []).map(it => String(it._id || it));
        eligibleSubtotal = items.reduce((sum, item) => {
          const itemId = String(item.itemId?.value || item.itemId?._id || item.itemId || '');
          return allowedItems.includes(itemId) ? sum + (parseFloat(item.amount) || 0) : sum;
        }, 0);
      }

      const calculatedTierDiscount = Math.round((eligibleSubtotal * discPercent) / 100 * 100) / 100;
      setTierDiscountAmount(calculatedTierDiscount);
    } else {
      setTierDiscountAmount(0);
    }
  }, [isTierDiscountActive, loyaltyInfo, items]);

  // Recalculate loyalty points discount when points or status changes
  useEffect(() => {
    if (isRedeemActive && loyaltyInfo && Number(redeemPoints) > 0) {
      const pointVal = loyaltyInfo.pointValueInRs || 1;
      const discount = Math.round(Number(redeemPoints) * pointVal * 100) / 100;
      setLoyaltyDiscountAmount(discount);
    } else {
      setLoyaltyDiscountAmount(0);
    }
  }, [isRedeemActive, loyaltyInfo, redeemPoints]);

  // Preview estimated points to be earned on this order
  useEffect(() => {
    const custId = selectedCustomer?.value;
    if (custId && items.length > 0 && totalAmount > 0) {
      const loyaltyItems = items
        .filter(item => item.itemId?.value || item.itemId)
        .map(item => ({
          item_id: item.itemId?.value || item.itemId?._id || item.itemId,
          item_group_id: item.groupId || item.item_group_id || item.itemId?.item_group_id || null,
          price: item.price || item.listPrice || 0,
          quantity: item.quantity || 1
        }));

      if (loyaltyItems.length > 0) {
        const timer = setTimeout(() => {
          LoyaltyServices.calculatePoints({
            customerId: custId,
            items: loyaltyItems,
            totalAmount: totalNetAmount || totalAmount
          }).then(res => {
            if (res && res.success) {
              setEstimatedPointsEarned(res.pointsAwarded || 0);
            }
          }).catch(err => {
            console.warn("Could not preview loyalty points:", err);
          });
        }, 600);
        return () => clearTimeout(timer);
      }
    } else {
      setEstimatedPointsEarned(0);
    }
  }, [selectedCustomer, items, totalAmount, totalNetAmount]);

  const customerOptions = useMemo(() => {
    return customerList?.map((item) => {
      const typeBadge = item.group_type ? `[${item.group_type}]` : '';
      const codeStr = item.code ? `(${item.code})` : '';
      const labelParts = [item.name, codeStr, typeBadge].filter(Boolean);
      return {
        value: item._id,
        label: labelParts.join(' '),
        code: item.code,
        print_name: item.print_name,
        group_type: item.group_type,
        salesman_id: item.salesman_id
      };
    }) || [];
  }, [customerList]);
  const { data: salesmanData } = useAsync(() => SalesmanServices.activeAllSaleman());
  const { data: activeItems } = useAsync(() => ItemServices.getActiveItem());
  // const { data: activeSaleType } = useAsync(() => SaleTypeServices.getActiveSaleType());
  const { data: someSaleType } = useAsync(() => SaleTypeServices.getSomeSaleTypes());
  const { data: unitData } = useAsync(() => UnitServices.getActiveUnit());


  const { data: attributeValuesData } = useAsync(() => AttributeValueServices.getByAttributeValueByValue());

  useEffect(() => {
    if (attributeValuesData) {
      const colors = attributeValuesData.find(attr => attr.name?.toLowerCase() === 'color')?.groupArr || [];
      const sizes = attributeValuesData.find(attr => attr.name?.toLowerCase() === 'size')?.groupArr || [];

      setColorOptions(colors.map(c => ({ value: c.attribute_id, label: c.name })));
      setSizeOptions(sizes.map(s => ({ value: s.attribute_id, label: s.name })));
    }
  }, [attributeValuesData]);

  // console.log(someSaleType,'someSaleType')

  useEffect(() => {
    // Check if the selected sale type name contains "Central" to determine if it's a central sale
    const iscentral = selectedSaleType?.label?.toLowerCase().includes("i/gst") || false;
    setIsCentralSale(iscentral);
  }, [selectedSaleType]);

  // Load items & details from selected SaleOrder(s) into SaleDrawer
  const handleSelectSaleOrders = useCallback((orderInput) => {
    const orders = Array.isArray(orderInput) ? orderInput : (orderInput ? [orderInput] : []);
    if (orders.length === 0) return;

    setLoadedSaleOrders(orders);
    setLoadedSaleOrder(orders[0]);
    setIsPendingOrdersModalOpen(false);

    const firstOrder = orders[0];

    // Auto-populate saleType if exists
    if (firstOrder.saleType && someSaleType && someSaleType.length > 0) {
      const sTypeId = typeof firstOrder.saleType === 'object' ? firstOrder.saleType._id : firstOrder.saleType;
      const sTypeOption = someSaleType.find(it => it._id === sTypeId);
      if (sTypeOption) {
        setSelectedSaleType({ value: sTypeOption._id, label: sTypeOption.name });
      }
    }

    // Auto-populate salesman if exists
    if (firstOrder.salesman && salesmanData && salesmanData.length > 0) {
      const sManId = typeof firstOrder.salesman === 'object' ? firstOrder.salesman._id : firstOrder.salesman;
      const sManOption = salesmanData.find(it => it._id === sManId);
      if (sManOption) {
        setSelectedSalesman({ value: sManOption._id, label: sManOption.name });
      }
    }

    // Auto-populate matCentre
    if (firstOrder.matCentre) {
      setMatCentre(firstOrder.matCentre);
    }

    // Format and combine all items from all selected orders
    const allFormattedItems = [];
    orders.forEach(order => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach(item => {
          let formattedItemId = null;
          if (item.itemId) {
            if (typeof item.itemId === 'object') {
              formattedItemId = {
                value: item.itemId._id,
                label: item.itemId.name
              };
            } else {
              const itOpt = activeItems?.find(ai => ai._id === item.itemId);
              if (itOpt) {
                formattedItemId = { value: itOpt._id, label: itOpt.name };
              }
            }
          }

          // Unit formatting
          let formattedUnit = null;
          let unitId = typeof item.unit === 'object' && item.unit !== null ? item.unit._id : (typeof item.unit === 'string' ? item.unit : null);
          if (unitData && Array.isArray(unitData)) {
            const uOpt = unitData.find(u => String(u._id) === String(unitId) || String(u.name).toLowerCase() === String(item.unit || '').toLowerCase());
            if (uOpt) {
              formattedUnit = { value: uOpt._id, label: uOpt.name };
            }
          }

          const variants = item.itemId?.item_attribute?.variant || [];
          const vColors = [...new Set(variants.map(v => v.color).filter(Boolean))].map(c => {
            const global = colorOptions.find(opt => opt.label === c);
            return global || { value: c, label: c };
          });
          const vSizes = [...new Set(variants.map(v => v.size).filter(Boolean))].map(s => {
            const global = sizeOptions.find(opt => opt.label === s);
            return global || { value: s, label: s };
          });

          const ordered = Number(item.orderedQty ?? item.quantity) || 0;
          const billed = Number(item.billedQty ?? item.billedQuantity) || 0;
          const pending = item.pendingQty !== undefined ? Number(item.pendingQty) : Math.max(0, ordered - billed);

          // If this item was already 100% billed in a previous invoice, do not add it again
          if (billed > 0 && pending <= 0) {
            return;
          }

          const initialQty = pending > 0 ? pending : (ordered > 0 ? ordered : 1);
          const listPrice = parseFloat(item.listPrice || (typeof item.itemId === 'object' ? item.itemId?.sale_price : 0) || '0');
          const discount = parseFloat(item.discount || 0);
          const price = parseFloat(item.price || (listPrice - (listPrice * discount) / 100) || '0');
          const totalDiscount = (Number(initialQty) * (listPrice * discount) / 100);
          const amount = Number(initialQty) * price;

          allFormattedItems.push({
            image: item.image || (typeof item.itemId === 'object' ? item.itemId?.default_image || '' : ''),
            name: typeof item.itemId === 'object' ? item.itemId?.name : (item?.name || ''),
            itemId: formattedItemId,
            hsn: typeof item.itemId === 'object' ? item.itemId?.hsn_code : (item.hsn || ''),
            quantity: String(initialQty),
            unit: formattedUnit,
            listPrice: listPrice.toFixed(2),
            discount: discount.toString(),
            totalDiscount: totalDiscount.toFixed(2),
            price: price.toFixed(2),
            amount: amount.toFixed(2),
            color: item.color || '',
            size: item.size || '',
            conversion_factor: item.conversion_factor || 1,
            description: item.description || (orders.length > 1 ? `SO: ${order.voucherNo?.trim()}` : ''),
            variantColors: vColors,
            variantSizes: vSizes,
            orderedQty: item.orderedQty || item.quantity,
            pendingQty: initialQty
          });
        });
      }
    });

    if (allFormattedItems.length > 0) {
      setItems(allFormattedItems);
    }

    // Sum totals dynamically based on the loaded items
    let totalAmt = 0;
    let totalDisc = 0;
    let totalQty = 0;
    let totalNet = 0;
    let hamaliTotal = 0;
    let cgstTotal = 0;
    let sgstTotal = 0;
    let discTotal = 0;

    allFormattedItems.forEach(it => {
      const q = Number(it.quantity) || 0;
      const lp = Number(it.listPrice) || 0;
      const p = Number(it.price) || 0;
      const d = Number(it.totalDiscount) || 0;
      const a = Number(it.amount) || 0;
      totalQty += q;
      totalAmt += (q * lp);
      totalDisc += d;
      totalNet += a;
    });

    orders.forEach(order => {
      if (order.sundries?.SundriesDetail && Array.isArray(order.sundries.SundriesDetail)) {
        const hamali = order.sundries.SundriesDetail.find(it => it.Name === "Hammali@15/CRT" || it.Name === "Hamali");
        const cgst = order.sundries.SundriesDetail.find(it => it.Name === "CGST" || it.Name === "cgst");
        const sgst = order.sundries.SundriesDetail.find(it => it.Name === "SGST1" || it.Name === "SGST" || it.Name === "sgst");
        const discount = order.sundries.SundriesDetail.find(it => it.Name === "DISCOUNT" || it.Name === "discount");

        if (hamali) hamaliTotal += Number(hamali.DiscountAmount || 0);
        if (cgst) cgstTotal += Number(cgst.DiscountAmount || 0);
        if (sgst) sgstTotal += Number(sgst.DiscountAmount || 0);
        if (discount) discTotal += Number(discount.DiscountAmount || 0);
      }
    });

    if (hamaliTotal > 0) setTotalHammli(hamaliTotal);
    if (cgstTotal > 0) setTotalCgstSundries(cgstTotal);
    if (sgstTotal > 0) setTotalSgstSundries(sgstTotal);
    if (discTotal > 0) setTotalDiscountSundries(discTotal);
    setTotalIgstSundries(cgstTotal + sgstTotal);

    setTotalAmount(totalAmt);
    setTotalDiscountAmount(totalDisc);
    setTotalQuantity(totalQty);
    setNetAmount(totalNet + hamaliTotal + cgstTotal + sgstTotal - discTotal);

    const voucherList = orders.map(o => o.voucherNo?.trim()).filter(Boolean).join(", ");
    notifySuccess(`Loaded ${allFormattedItems.length} item(s) from Sale Order(s) [${voucherList}]! Adjust quantities as needed before saving.`);
  }, [someSaleType, salesmanData, activeItems, unitData, colorOptions, sizeOptions]);




  const handleItemChange = async (index, field, value) => {
    // Handle item selection by itemId (dropdown change)
    if (field === 'itemId') {
      try {
        const targetItemId = value?.value || value?._id || (typeof value === 'string' ? value : null);
        if (!targetItemId) {
          setItems(prev => {
            const newItems = [...prev];
            newItems[index] = {
              ...newItems[index],
              itemId: null,
              name: '',
              hsn: '',
              image: '',
              listPrice: '',
              quantity: '',
              discount: '',
              totalDiscount: '',
              price: '',
              amount: '',
              color: '',
              size: '',
              unit: null,
              variantColors: [],
              variantSizes: []
            };
            return newItems;
          });
          return;
        }

        const getItemList = await ItemServices.getItemById(targetItemId);
        if (!getItemList) return;

        let itemDiscount = 0;
        if (getParty && getItemList.item_code) {
          try {
            const getIndividualDiscount = await ItemDiscountServices.getItemDiscountServices({
              "PartyCode": getParty,
              "ItemCode": getItemList.item_code
            });
            if (getIndividualDiscount?.data?.Discount1 !== undefined) {
              itemDiscount = parseFloat(getIndividualDiscount.data.Discount1) || 0;
            }
          } catch (discErr) {
            console.warn("Could not fetch party discount for item:", discErr?.message);
            itemDiscount = 0;
          }
        }

        const listPrice = parseFloat(getItemList.sale_price || '0');
        const quantity = 6; // Default quantity
        const discount = itemDiscount !== 0
          ? itemDiscount
          : (getItemList.discount !== undefined && getItemList.discount !== null
              ? parseFloat(getItemList.discount)
              : (parseFloat(vendorDiscount) || 0));

        const totalDiscount = quantity * (listPrice * discount) / 100;
        const price = listPrice - (listPrice * discount) / 100;
        const amount = quantity * price;

        // Extract variants color and size
        const variants = getItemList.item_attribute?.variant || [];
        const vColors = [...new Set(variants.map(v => v.color).filter(Boolean))].map(c => {
          const global = colorOptions.find(opt => opt.label === c);
          return global || { value: c, label: c };
        });
        const vSizes = [...new Set(variants.map(v => v.size).filter(Boolean))].map(s => {
          const global = sizeOptions.find(opt => opt.label === s);
          return global || { value: s, label: s };
        });

        // Resolve unit
        let resolvedUnit = null;
        if (getItemList?.unit_id) {
          if (typeof getItemList.unit_id === 'object' && getItemList.unit_id._id) {
            resolvedUnit = { value: getItemList.unit_id._id, label: getItemList.unit_id.name };
          } else {
            const matchedUnit = unitData?.find(u => String(u._id) === String(getItemList.unit_id));
            resolvedUnit = { value: getItemList.unit_id, label: matchedUnit?.name || 'PCS' };
          }
        }

        // Resolve image
        let itemImage = '';
        if (Array.isArray(getItemList.image) && getItemList.image.length > 0) {
          itemImage = typeof getItemList.image[0] === 'object' ? (getItemList.image[0].url || '') : getItemList.image[0];
        } else if (typeof getItemList.image === 'string') {
          itemImage = getItemList.image;
        } else if (getItemList.default_image) {
          itemImage = getItemList.default_image;
        }

        setItems(prev => {
          const newItems = [...prev];
          newItems[index] = {
            ...newItems[index],
            itemId: value,
            name: getItemList.name || '',
            hsn: getItemList.hsn_code || '',
            image: itemImage,
            listPrice: listPrice.toFixed(2),
            quantity: quantity.toString(),
            discount: discount.toString(),
            totalDiscount: totalDiscount.toFixed(2),
            price: price.toFixed(2),
            amount: amount.toFixed(2),
            conversion_factor: getItemList.conversion_factor || 1,
            description: getItemList.description || '',
            unit: resolvedUnit,
            variantColors: vColors,
            variantSizes: vSizes,
            color: vColors.length > 0 ? vColors[0].label : '',
            size: vSizes.length > 0 ? vSizes[0].label : ''
          };
          return newItems;
        });
      } catch (error) {
        console.error('Error fetching item details:', error);
      }
      return; // Exit early after handling 'itemId'
    }

    setItems(prev => {
      const newItems = [...prev];
      let item = { ...newItems[index], [field]: value };
      let listPrice = parseFloat(item.listPrice || 0);
      let quantity = parseFloat(field === 'quantity' ? value : item.quantity || 0);
      let discount = parseFloat(field === 'discount' ? value : item.discount || 0);
      if (field === 'listPrice') listPrice = parseFloat(value || 0);
      // If discount is blank, null, or not a number, treat as 0
      if (field === 'discount' && (value === '' || value === null || isNaN(discount))) {
        discount = 0;
      }
      if (field === 'discount' || field === 'quantity' || field === 'listPrice') {
        // Calculate as per formula
        const totalDiscount = quantity * (listPrice * discount) / 100;
        // If discount is blank, price should be listPrice
        const price = (field === 'discount' && (value === '' || value === null || isNaN(parseFloat(value))))
          ? listPrice
          : listPrice - (listPrice * discount) / 100;
        const amount = quantity * price;
        item = {
          ...item,
          listPrice: listPrice.toFixed(2),
          quantity: quantity.toString(),
          discount: discount.toString(),
          totalDiscount: totalDiscount.toFixed(2),
          price: price.toFixed(2),
          amount: amount.toFixed(2)
        };
      }
      newItems[index] = item;
      return newItems;
    });
  };

  typeof window !== 'undefined' && window.console && console.log('SaleOrderDrawer mounted with id:', id);
  const [loading, setLoading] = useState(false);

  // Reset form when opening for new sale order
  // useEffect(() => {
  //   if (!id && isDrawerOpen) {
  //     resetForm();
  //   }
  // }, [id, isDrawerOpen]);

  // Reset form when drawer closes
  useEffect(() => {
    console.log("isDrawerOpen", isDrawerOpen);
    if (!isDrawerOpen) {
      // Reset form when drawer closes to ensure clean state for next open
      resetForm();
      console.log("Form resetting");
    }
  }, [isDrawerOpen]);

  // Fetch sale order details if editing
  useEffect(() => {
    if (id) {
      setLoading(true);
      SaleServices.getSaleById(id)
        .then((data) => {


          // setDate(data.date || new Date().toISOString().split('T')[0]);
          setDate(data.date ? new Date(data.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
          setVoucherNo(data.voucherNo || '');
          setMatCentre(data.matCentre || 'RETAIL');

          // Pre-populate loyalty details if saved on this invoice
          if (data.loyaltyPointsRedeemed > 0) {
            setIsRedeemActive(true);
            setRedeemPoints(data.loyaltyPointsRedeemed);
            setLoyaltyDiscountAmount(data.loyaltyDiscountAmount || 0);
          }
          if (data.loyaltyTierDiscountAmount > 0) {
            setIsTierDiscountActive(true);
            setTierDiscountAmount(data.loyaltyTierDiscountAmount);
          }
          if (data.loyaltyCouponDiscountAmount > 0) {
            setSelectedCoupon({
              _id: data.loyaltyCouponId,
              couponCode: data.loyaltyCouponCode || 'LOYALTY-COUPON',
              couponValue: data.loyaltyCouponDiscountAmount
            });
            setCouponDiscountAmount(data.loyaltyCouponDiscountAmount);
          }

          // Fix: Properly format customer value for SearchableDropdown
          // Use populated customer data from API response directly
          if (data.customer) {
            const customerIdForLoyalty = typeof data.customer === 'object' ? data.customer._id : data.customer;
            fetchCustomerLoyalty(customerIdForLoyalty);
            if (typeof data.customer === 'object' && data.customer._id) {
              // Customer is already populated with full details from API
              setSelectedCustomer({
                value: data.customer._id,
                label: data.customer.name
              });
              // Set party code for discount calculations
              if (data.customer.code) {
                setParty(data.customer.code);
                setPartyObject(data.customer);
                // Fetch vendor discount for the loaded customer
                getSundryDiscountsByPartyGroup({ getParty: data.customer.code });
              } else if (customerData && customerData.length > 0) {
                // Fallback: try to get code from customerData if not in populated data
                const customerOption = customerData.find(item => item._id === data.customer._id);
                if (customerOption && customerOption.code) {
                  setParty(customerOption.code);
                  setPartyObject(customerOption);
                  getSundryDiscountsByPartyGroup({ getParty: customerOption.code });
                }
              }
            } else if (customerData && customerData.length > 0) {
              // Fallback: customer is just an ID, find in customerData
              const customerId = data.customer;
              const customerOption = customerData.find(item => item._id === customerId);
              if (customerOption) {
                setSelectedCustomer({
                  value: customerOption._id,
                  label: customerOption.name
                });
                if (customerOption.code) {
                  setParty(customerOption.code);
                  setPartyObject(customerOption);
                  getSundryDiscountsByPartyGroup({ getParty: customerOption.code });
                }
              }
            }
          } else {
            setSelectedCustomer(null);
          }

          // Fix: Properly format salesman value for SearchableDropdown
          if (data.salesman && salesmanData && salesmanData.length > 0) {
            const salesmanId = typeof data.salesman === 'object' ? data.salesman._id : data.salesman;
            const salesmanOption = salesmanData.find(item => item._id === salesmanId);
            if (salesmanOption) {
              setSelectedSalesman({
                value: salesmanOption._id,
                label: salesmanOption.name
              });
            } else {
              setSelectedSalesman(null);
            }
          } else {
            setSelectedSalesman(null);
          }

          // Fix: Properly format sale type value for SearchableDropdown
          if (data.saleType && someSaleType && someSaleType.length > 0) {
            const saleTypeId = typeof data.saleType === 'object' ? data.saleType._id : data.saleType;
            const saleTypeOption = someSaleType.find(item => item._id === saleTypeId);
            if (saleTypeOption) {
              setSelectedSaleType({
                value: saleTypeOption._id,
                label: saleTypeOption.name
              });
            } else {
              setSelectedSaleType(null);
            }
          } else {
            setSelectedSaleType(null);
          }

          // Format items to ensure proper structure - Fixed this section
          if (data.items && data.items.length > 0) {
            const formattedItems = data?.items.map(item => {
              // Handle itemId properly for SearchableDropdown
              let formattedItemId = null;
              if (item.itemId) {
                if (typeof item.itemId === 'object') {
                  // If itemId is already an object with item details
                  formattedItemId = {
                    value: item.itemId._id,
                    label: item.itemId.name
                  };
                } else {
                  // If itemId is just a string ID, find the item in activeItems
                  const itemOption = activeItems?.find(activeItem => activeItem._id === item.itemId);
                  if (itemOption) {
                    formattedItemId = {
                      value: itemOption._id,
                      label: itemOption.name
                    };
                  }
                }
              }

              // Handle unit properly for SearchableDropdown
              let formattedUnit = null;

              // First, try to get unit from item.unit
              let unitId = null;
              let unitName = null;

              if (item.unit) {
                if (typeof item.unit === 'object' && item.unit !== null) {
                  // If unit is already an object with value/label
                  if (item.unit.value && item.unit.label) {
                    formattedUnit = item.unit;
                  } else if (item.unit._id) {
                    unitId = item.unit._id;
                  }
                } else if (typeof item.unit === 'string') {
                  // If unit is a string, it could be ID or name
                  unitName = item.unit;
                }
              }

              // If unit not found, check itemId.unit_id (from populated data)
              if (!formattedUnit && !unitId && !unitName) {
                if (item.itemId && typeof item.itemId === 'object' && item.itemId.unit_id) {
                  unitId = item.itemId.unit_id;
                }
              }

              // Find the unit in unitData if we have unitId or unitName
              if (!formattedUnit && unitData && Array.isArray(unitData) && unitData.length > 0) {
                let unitOption = null;

                if (unitId) {
                  // Find by ID (handle both string and ObjectId comparison)
                  unitOption = unitData.find(u => {
                    const uId = String(u._id || '');
                    const searchId = String(unitId || '');
                    return uId === searchId;
                  });
                } else if (unitName) {
                  // Find by name
                  unitOption = unitData.find(u => {
                    const uName = String(u.name || '').toLowerCase();
                    const searchName = String(unitName || '').toLowerCase();
                    return uName === searchName;
                  });
                }

                if (unitOption) {
                  formattedUnit = {
                    value: unitOption._id,
                    label: unitOption.name
                  };
                }
              }
              // // Extract image from populated item data
              // let itemImage = '';
              // if (typeof item.itemId === 'object' && item.itemId) {
              //   // Get image from populated item data
              //   if (item.itemId.image && item.itemId.image.length > 0 && item.itemId.image[0].url) {
              //     itemImage = item.itemId.image[0].url;
              //   } else if (item.itemId.default_image) {
              //     itemImage = item.itemId.default_image;
              //   }
              // } else if (item.image) {
              //   // Use existing image if available
              //   itemImage = item.image;
              // }

              // Extract variants color and size from populated itemId
              const variants = item.itemId?.item_attribute?.variant || [];
              const vColors = [...new Set(variants.map(v => v.color).filter(Boolean))].map(c => {
                const global = colorOptions.find(opt => opt.label === c);
                return global || { value: c, label: c };
              });
              const vSizes = [...new Set(variants.map(v => v.size).filter(Boolean))].map(s => {
                const global = sizeOptions.find(opt => opt.label === s);
                return global || { value: s, label: s };
              });

              return {
                image: item.image,
                name: typeof item.itemId === 'object' ? item.itemId?.name : (item?.name || ''),
                itemId: formattedItemId,
                hsn: typeof item.itemId === 'object' ? item.itemId?.hsn_code : (item.hsn || ''),
                quantity: item.quantity || '0',
                unit: formattedUnit,
                listPrice: item.listPrice || '0',
                discount: item.discount || '0',
                totalDiscount: item.totalDiscount || '0',
                price: item.price || '0',
                amount: item.amount || '0',
                color: item.color || '',
                size: item.size || '',
                conversion_factor: item.conversion_factor || 1,
                description: item.description,
                variantColors: vColors,
                variantSizes: vSizes
              };
            });
            setItems(formattedItems);
          }

          if (data.sundries) {
            // Handle new sundries format with SundriesDetail array
            if (data.sundries.SundriesDetail && Array.isArray(data.sundries.SundriesDetail)) {
              const hamali = data.sundries.SundriesDetail.find(item => item.Name === "Hammali@15/CRT" || item.Name === "Hamali");
              const cgst = data.sundries.SundriesDetail.find(item => item.Name === "CGST" || item.Name === "cgst");
              const sgst = data.sundries.SundriesDetail.find(item => item.Name === "SGST1" || item.Name === "SGST" || item.Name === "sgst");
              const discount = data.sundries.SundriesDetail.find(item => item.Name === "DISCOUNT" || item.Name === "discount");

              setTotalHammli(hamali?.DiscountAmount || 0);
              setTotalCgstSundries(cgst?.DiscountAmount || 0);
              setTotalSgstSundries(sgst?.DiscountAmount || 0);
              setTotalDiscountSundries(discount?.DiscountAmount || 0);
              setVendorDiscount(discount?.DiscountPercent || 0);
              setTotalIgstSundries((cgst?.DiscountAmount || 0) + (sgst?.DiscountAmount || 0));
            } else {
              // Handle old sundries format for backward compatibility
              setTotalHammli(data.sundries.hammali || 0);
              setVendorDiscount(data.sundries.discount || 0);
              setTotalCgstSundries(data.sundries.cgst || 0);
              setTotalSgstSundries(data.sundries.sgst || 0);
              setTotalIgstSundries(data.sundries.cgst + data.sundries.sgst || 0);
              setTotalDiscountSundries(data.sundries.discount || 0);
            }
          }
          setTotalAmount(data.totalAmount || 0);
          setTotalDiscountAmount(data.totalDiscountAmount || 0);
          setTotalQuantity(data.totalQuantity || 0);
          setNetAmount(data.netAmount || 0);
          if (data.loyaltyPointsRedeemed > 0) {
            setIsRedeemActive(true);
            setRedeemPoints(data.loyaltyPointsRedeemed);
            setLoyaltyDiscountAmount(data.loyaltyDiscountAmount || 0);
          }
        })
        .catch((error) => {
          console.error("Error fetching sale order:", error);
          notifyError("Failed to load sale order data");
        })
        .finally(() => setLoading(false));
    }
  }, [id, customerData, salesmanData, someSaleType, activeItems, unitData]);

  // Update unit labels when unitData loads (for items that might have been loaded before unitData)
  useEffect(() => {
    if (unitData && Array.isArray(unitData) && unitData.length > 0 && items.length > 0) {
      setItems(prev => {
        let hasChanges = false;
        const updatedItems = prev.map(item => {
          // Skip if unit is already properly formatted
          if (item.unit && typeof item.unit === 'object' && item.unit.value && item.unit.label) {
            // Verify the label is correct
            const unitOption = unitData.find(u => {
              const uId = String(u._id || '');
              const itemUnitId = String(item.unit.value || '');
              return uId === itemUnitId;
            });
            if (unitOption && item.unit.label !== unitOption.name) {
              hasChanges = true;
              return {
                ...item,
                unit: {
                  value: unitOption._id,
                  label: unitOption.name
                }
              };
            }
            return item;
          }

          // Try to find unit from item.unit (string) or item.itemId.unit_id
          let unitId = null;
          if (item.unit && typeof item.unit === 'string') {
            // Try to find by name first, then by ID
            const byName = unitData.find(u => String(u.name || '').toLowerCase() === String(item.unit || '').toLowerCase());
            if (byName) {
              hasChanges = true;
              return {
                ...item,
                unit: {
                  value: byName._id,
                  label: byName.name
                }
              };
            }
            // Try as ID
            unitId = item.unit;
          } else if (!item.unit) {
            // Check if we can get unit from itemId (this shouldn't happen after initial load, but just in case)
            // This is handled in the initial load, so we can skip here
            return item;
          }

          if (unitId) {
            const unitOption = unitData.find(u => {
              const uId = String(u._id || '');
              const searchId = String(unitId || '');
              return uId === searchId;
            });
            if (unitOption) {
              hasChanges = true;
              return {
                ...item,
                unit: {
                  value: unitOption._id,
                  label: unitOption.name
                }
              };
            }
          }

          return item;
        });
        return hasChanges ? updatedItems : prev;
      });
    }
  }, [unitData]);

  // Update color and size objects when options load
  useEffect(() => {
    if (colorOptions.length > 0 || sizeOptions.length > 0) {
      setItems(prev => {
        let hasChanges = false;
        const updatedItems = prev.map(item => {
          let newItem = { ...item };
          let changed = false;

          // If variants are not extracted yet but we have item_attribute
          if (item.itemId?.item_attribute?.variant && (!item.variantColors?.length || !item.variantSizes?.length)) {
            const variants = item.itemId.item_attribute.variant;
            const uniqueColors = [...new Set(variants.map(v => v.color).filter(Boolean))];
            const uniqueSizes = [...new Set(variants.map(v => v.size).filter(Boolean))];

            newItem.variantColors = uniqueColors.map(c => colorOptions.find(opt => opt.label === c) || { value: c, label: c });
            newItem.variantSizes = uniqueSizes.map(s => sizeOptions.find(opt => opt.label === s) || { value: s, label: s });
            changed = true;
          }

          if (item.color && typeof item.color === 'string') {
            const foundColor = (newItem.variantColors?.length > 0 ? newItem.variantColors : colorOptions).find(c => c.label === item.color);
            if (foundColor) {
              newItem.color = foundColor;
              changed = true;
            }
          }

          if (item.size && typeof item.size === 'string') {
            const foundSize = (newItem.variantSizes?.length > 0 ? newItem.variantSizes : sizeOptions).find(s => s.label === item.size);
            if (foundSize) {
              newItem.size = foundSize;
              changed = true;
            }
          }

          if (changed) hasChanges = true;
          return changed ? newItem : item;
        });
        return hasChanges ? updatedItems : prev;
      });
    }
  }, [colorOptions, sizeOptions, items.length]); // items.length added to trigger when rows are added/loaded

  // Auto-calculate amounts when items change
  useEffect(() => {
    setItems(prev => {
      return prev.map(item => {
        const price = parseFloat(item.price) || 0;
        const quantity = parseFloat(item.quantity) || 0;
        const amount = (price * quantity).toFixed(2);
        return {
          ...item,
          amount: amount
        };
      });
    });
  }, []);

  // Calculate total amount, total discount, and total quantity whenever items or vendor discount changes
  useEffect(() => {
    // Calculate basic totals from items
    const itemsTotal = items.reduce((sum, item) => {
      return sum + (parseFloat(item.amount) || 0);
    }, 0);

    const totalDiscount = items.reduce((sum, item) => {
      return sum + (parseFloat(item.totalDiscount) || 0);
    }, 0);
    setTotalDiscountAmount(Number(totalDiscount.toFixed(2)));

    const totalQty = items.reduce((sum, item) => {
      return sum + (parseFloat(item.quantity) || 0);
    }, 0);
    setTotalQuantity(Number(totalQty.toFixed(2)));

    // Calculate hammali (conversion factor based)
    const hammaliRate = typeof hammaliDiscount === 'object' ? Number(hammaliDiscount?.discount || 0) : Number(hammaliDiscount || 0);
    const hammaliAmount = items.reduce((sum, item) => {
      const quantity = parseFloat(item.quantity) || 0;
      const convFactor = Number(item.conversion_factor) || 1;
      return sum + ((quantity * convFactor) * hammaliRate || 0);
    }, 0);
    setTotalHammli(Number(hammaliAmount.toFixed(2)));

    // Step 1: Items total + Hammali = Subtotal
    const subtotalWithHammali = itemsTotal + hammaliAmount;
    setTotalAmount(Number(subtotalWithHammali.toFixed(2)));

    // Step 2: Apply vendor discount on subtotal
    const vendorDiscountAmount = (subtotalWithHammali * (vendorDiscount || 0)) / 100;
    setTotalDiscountSundries(Number(vendorDiscountAmount.toFixed(2)));

    // Step 3: Subtotal after vendor discount
    const subtotalAfterDiscount = subtotalWithHammali - vendorDiscountAmount;

    // Step 4: Calculate GST on discounted amount
    const cgstAmount = (subtotalAfterDiscount * 2.5) / 100; // 6% CGST
    const sgstAmount = (subtotalAfterDiscount * 2.5) / 100; // 6% SGST
    setTotalCgstSundries(Number(cgstAmount.toFixed(2)));
    setTotalSgstSundries(Number(sgstAmount.toFixed(2)));
    setTotalIgstSundries(Number((cgstAmount + sgstAmount).toFixed(2)));

    // Step 5: Final net amount = Subtotal after discount + GST - Tier Discount - Coupon Discount - Points Discount
    const effectiveTierDiscount = isTierDiscountActive ? (Number(tierDiscountAmount) || 0) : 0;
    const effectiveCouponDiscount = selectedCoupon ? (Number(couponDiscountAmount) || 0) : 0;
    const effectivePointsDiscount = isRedeemActive ? (Number(loyaltyDiscountAmount) || 0) : 0;

    const finalNetAmount = Math.max(0,
      subtotalAfterDiscount + cgstAmount + sgstAmount 
      - effectiveTierDiscount 
      - effectiveCouponDiscount 
      - effectivePointsDiscount
    );
    setNetAmount(Number(finalNetAmount.toFixed(2)));

  }, [items, vendorDiscount, hammaliDiscount, isTierDiscountActive, tierDiscountAmount, selectedCoupon, couponDiscountAmount, isRedeemActive, loyaltyDiscountAmount]);

  const handleAddItem = () => {
    setItems(prev => [...prev, {
      image: '',
      name: '',
      itemId: '',
      hsn: '',
      quantity: '0',
      unit: null,
      listPrice: '0',
      discount: '0',
      totalDiscount: '0',
      price: '0',
      amount: '0.00',
      color: '',
      size: ''
    }]);
  };

  const handleRemoveItem = (index) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  // const calculateTotal = (sundries) => {
  //   let total = 0;
  //   [...sundries.left, ...sundries.right].forEach(item => {
  //     const amount = parseFloat(item.amount1) || 0;
  //     total += item.type === '+' ? amount : -amount;
  //   });
  //   return total.toFixed(2);
  // };



  const resetForm = () => {
    setItems([{
      image: '',
      name: '',
      itemId: '',
      hsn: '',
      quantity: '',
      unit: null,
      listPrice: '',
      discount: '',
      totalDiscount: '',
      price: '',
      amount: '',
      color: '',
      size: '',
      variantColors: [],
      variantSizes: []
    }]);

    setTotalAmount(0);
    setTotalDiscountAmount(0);
    setTotalQuantity(0);
    setTotalHammli(0);
    setTotalCgstSundries(0);
    setTotalSgstSundries(0);
    setTotalDiscountSundries(0);
    setNetAmount(0);
    setDate(new Date().toISOString().split('T')[0]);
    setVoucherNo('');
    setMatCentre('RETAIL');
    setSelectedCustomer(null);
    setSelectedSalesman(null);
    setSelectedSaleType(null);
    setParty(null);
    setVendorDiscount(0);
    setItemDiscount(0);
    setSelectedItem(null);
    setItemCode(null);
    setLoyaltyInfo(null);
    setIsRedeemActive(false);
    setRedeemPoints(0);
    setLoyaltyDiscountAmount(0);
    setIsTierDiscountActive(false);
    setTierDiscountAmount(0);
    setAvailableCoupons([]);
    setSelectedCoupon(null);
    setCouponCodeInput("");
    setCouponDiscountAmount(0);
    setCouponMessage(null);
    setEstimatedPointsEarned(0);
    setLoadedSaleOrder(null);
    setPendingOrders([]);
    setIsPendingOrdersModalOpen(false);
  };

  // Auto-select salesman if logged in user is a salesman
  useEffect(() => {
    if (!id && isDrawerOpen && adminInfo?.salesman_id && salesmanData && !selectedSalesman) {
      const salesmanOption = salesmanData.find(s => s._id === adminInfo.salesman_id);
      if (salesmanOption) {
        setSelectedSalesman({
          value: salesmanOption._id,
          label: salesmanOption.name
        });
      }
    }
  }, [id, isDrawerOpen, adminInfo, salesmanData, selectedSalesman]);

  // useEffect(() => {
  //   if (isCentralSale) {
  //     setCustomerType("Inter-State");
  //   } else {
  //     setCustomerType("Intra-State");
  //   }
  // }, [isCentralSale]);

  const saveSaleOrder = async () => {
    try {
      // Validate required fields
      if (!selectedSaleType?.value) {
        notifyError('Please select a Sale Type');
        return;
      }
      if (!selectedCustomer?.value) {
        notifyError('Please select a Customer');
        return;
      }
      if (!selectedSalesman?.value) {
        notifyError('Please select a Salesman');
        return;
      }
      if (items.length === 0 || !items[0].itemId?.value) {
        notifyError('Please add at least one item');
        return;
      }

      let sundriesArray = [];
      if (selectedSaleType?.label.toLowerCase().includes('i/gst')) {
        sundriesArray.push({
          Name: "IGST",
          DiscountAmount: (Number(totalCgstSundries) + Number(totalSgstSundries)).toFixed(3),
          DiscountPercent: 5
        });
      } else if (selectedSaleType?.label.toLowerCase().includes('l/gst')) {
        sundriesArray.push(
          { Name: "CGST", DiscountAmount: totalCgstSundries, DiscountPercent: 2.5 },
          { Name: "SGST", DiscountAmount: totalSgstSundries, DiscountPercent: 2.5 }
        );
      }

      if (isTierDiscountActive && Number(tierDiscountAmount) > 0) {
        sundriesArray.push({
          Name: `Loyalty Tier Discount (${loyaltyInfo?.tier?.name || 'Member'} ${loyaltyInfo?.tier?.discountPercentage || 0}%)`,
          DiscountAmount: Number(tierDiscountAmount).toFixed(2),
          DiscountPercent: Number(loyaltyInfo?.tier?.discountPercentage) || 0
        });
      }

      if (selectedCoupon && Number(couponDiscountAmount) > 0) {
        sundriesArray.push({
          Name: `Loyalty Coupon (${selectedCoupon.couponCode || 'Coupon'})`,
          DiscountAmount: Number(couponDiscountAmount).toFixed(2),
          DiscountPercent: 0
        });
      }

      if (isRedeemActive && Number(loyaltyDiscountAmount) > 0) {
        sundriesArray.push({
          Name: "Loyalty Points Discount",
          DiscountAmount: Number(loyaltyDiscountAmount).toFixed(2),
          DiscountPercent: 0
        });
      }

      console.log("Sundries Array: ", items);
      const saleOrderData = {
        ...(voucherNo && voucherNo.trim() ? { voucherNo: voucherNo.trim() } : {}),
        date,
        saleType: selectedSaleType?.value || '',
        matCentre: matCentre || "Selection Footwear",
        customer: selectedCustomer?.value || '',
        salesman: selectedSalesman?.value || '',
        saleOrder: loadedSaleOrder?._id || (loadedSaleOrders[0]?._id || undefined),
        saleOrders: loadedSaleOrders.length > 0 ? loadedSaleOrders.map(o => o._id) : (loadedSaleOrder ? [loadedSaleOrder._id] : undefined),
        saleOrderVoucherNo: loadedSaleOrders.length > 0
          ? loadedSaleOrders.map(o => o.voucherNo?.trim()).filter(Boolean).join(', ')
          : (loadedSaleOrder?.voucherNo?.trim() || undefined),
        description: loadedSaleOrders.length > 0
          ? `Converted from Sale Order(s): ${loadedSaleOrders.map(o => o.voucherNo?.trim()).filter(Boolean).join(', ')}`
          : (loadedSaleOrder ? `Converted from Sale Order ${loadedSaleOrder.voucherNo}` : ''),
        items: items.map((item) => ({
          ...item,
          itemId: item.itemId?.value,
          unit: item.unit?.value,
          color: item.color?.label || item.color || '',
          size: item.size?.label || item.size || '',
        })),
        sundries: {
          SundriesDetail: [
            {
              Name: (typeof hammaliDiscount === 'object' && hammaliDiscount?.name) ? hammaliDiscount.name : "Hammali@20/CRT",
              DiscountAmount: Number(totalHammli) || 0,
              DiscountPercent: (typeof hammaliDiscount === 'object' && hammaliDiscount?.discount !== undefined) ? Number(hammaliDiscount.discount) || 0 : (Number(hammaliDiscount) || 0)
            },
            {
              Name: "Discount",
              DiscountAmount: Number(totalDiscountSundries) || 0,
              DiscountPercent: Number(vendorDiscount) || 0
            },
            ...sundriesArray
          ].filter(s => s && s.Name && typeof s.Name === 'string' && s.Name.trim() !== '')
           .map(s => ({
             Name: String(s.Name).trim(),
             DiscountAmount: Number(s.DiscountAmount) || 0,
             DiscountPercent: Number(s.DiscountPercent) || 0
           }))
        },
        totalAmount,
        totalDiscountAmount,
        totalQuantity,
        netAmount: totalNetAmount,
        loyaltyTierId: (isTierDiscountActive && loyaltyInfo?.tier?._id) ? loyaltyInfo.tier._id : null,
        loyaltyTierName: (isTierDiscountActive && loyaltyInfo?.tier?.name) ? loyaltyInfo.tier.name : '',
        loyaltyTierDiscountPercent: (isTierDiscountActive && loyaltyInfo?.tier?.discountPercentage) ? Number(loyaltyInfo.tier.discountPercentage) : 0,
        loyaltyTierDiscountAmount: (isTierDiscountActive && Number(tierDiscountAmount) > 0) ? Number(tierDiscountAmount) : 0,
        loyaltyCouponId: selectedCoupon ? selectedCoupon._id : null,
        loyaltyCouponCode: selectedCoupon ? selectedCoupon.couponCode : '',
        loyaltyCouponDiscountAmount: selectedCoupon ? Number(couponDiscountAmount) || 0 : 0,
        loyaltyPointsRedeemed: isRedeemActive ? Number(redeemPoints) || 0 : 0,
        loyaltyDiscountAmount: isRedeemActive ? Number(loyaltyDiscountAmount) || 0 : 0,
      };

      await onSubmit(saleOrderData);
    } catch (error) {
      console.error("Error saving sale order:", error);
      // Handle error appropriately, e.g., show a notification

    }
  };

  const getItemDiscount = async (ItemCode, PartyCode) => {
    try {
      const response = await ItemServices.getItemDiscount({ ItemCode, PartyCode });
      console.log("Item Discount: ", response.Discount1);
      setItemDiscount(response.Discount1);
    } catch (error) {
      console.error("Error fetching item discount:", error);
      return 0;
    }
  };

  const getSundryDiscountsByPartyGroup = async (partyCode) => {
    try {
      const response = await SundryDiscountService.getSundryDiscountsByPartyGroup(partyCode);
      const sundryDiscounts = response?.sundryDiscounts;
      const hammali = response?.hammali;
      if (Array.isArray(sundryDiscounts) && sundryDiscounts.length > 0 && sundryDiscounts[0]?.discount !== undefined) {
        setVendorDiscount(Number(sundryDiscounts[0].discount) || 0);
      } else {
        setVendorDiscount(0);
      }
      if (hammali && typeof hammali === 'object') {
        setHammaliDiscount({
          name: hammali.name || "Hammali@20/CRT",
          discount: Number(hammali.discount) || 0,
          ...hammali
        });
      } else {
        setHammaliDiscount({ name: "Hammali@20/CRT", discount: 0 });
      }
    } catch (error) {
      setVendorDiscount(0);
      setHammaliDiscount({ name: "Hammali@20/CRT", discount: 0 });
    }
  };

  const recalculateItemDiscountsForNewParty = async (newPartyCode) => {
    try {
      const updatedItems = await Promise.all(
        items.map(async (item) => {
          if (item.itemId?.value && item.name) {
            try {
              // Get item details first to ensure we have the latest data
              const getItemList = await ItemServices.getItemById(item.itemId.value);

              // Get individual discount for the new party
              let itemDiscount = 0;
              try {
                const getIndividualDiscount = await ItemDiscountServices.getItemDiscountServices({
                  "PartyCode": newPartyCode,
                  "ItemCode": getItemList.item_code
                });
                if (getIndividualDiscount?.data?.Discount1 !== undefined) {
                  itemDiscount = parseFloat(getIndividualDiscount.data.Discount1) || 0;
                }
              } catch (discErr) {
                itemDiscount = 0;
              }
              const listPrice = parseFloat(getItemList.sale_price || '0');
              const quantity = parseFloat(item.quantity || '0');

              // Use vendor discount if item discount is 0, otherwise use item discount
              const discount = itemDiscount !== 0 ? itemDiscount : (getItemList.discount !== undefined ? parseFloat(getItemList.discount) : 0);
              const totalDiscount = quantity * (listPrice * discount) / 100;
              const price = listPrice - (listPrice * discount) / 100;
              const amount = quantity * price;

              return {
                ...item,
                listPrice: listPrice.toFixed(2),
                discount: itemDiscount,
                totalDiscount: totalDiscount.toFixed(2),
                price: price.toFixed(2),
                amount: amount.toFixed(2),
              };
            } catch (error) {
              console.error('Error recalculating discount for item:', item.name, error);
              // Return the original item if there's an error
              return item;
            }
          }
          return item;
        })
      );

      setItems(updatedItems);
      console.log('Item discounts recalculated for new party:', newPartyCode);
    } catch (error) {
      console.error('Error recalculating item discounts:', error);
    }
  };
  const getItemCode = async (id) => {
    try {
      const response = await ItemServices.getItemCode(id);
      setItemCode(response.item_code);
    } catch (error) {
      console.error("Error fetching item code:", error);
    }
  };

  useEffect(() => {
    if (selectedItem) {
      getItemCode(selectedItem);
    }
  }, [selectedItem, itemCode])

  useEffect(() => {
    if (itemCode && getParty) {
      getItemDiscount(itemCode, getParty);
    }
  }, [selectedItem, getParty])

  // useEffect(() => {
  //   if (getParty) {
  //     getSundryDiscountsByPartyGroup({ "getPartyObject": getPartyObject?.vendor_group_id?.busy_group_id, "getParty": getParty });
  //   }
  // }, [getParty])

  useEffect(() => {
    if (someSaleType && someSaleType.length > 0 && !selectedSaleType) {
      const targetSaleType = someSaleType[1] || someSaleType[0];
      if (targetSaleType) {
        const defaultOption = { value: targetSaleType._id, label: targetSaleType.name };
        setSelectedSaleType(defaultOption);
      }
    }
  }, [someSaleType]);

  return (
    <>
      <div className="w-full relative px-6 py-2.5 sm:py-3 border-b border-gray-100 bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
        <Title
          register={register}
          title={id ? (isViewOnly ? t("View Sale Order") : t("Update Sale")) : t("Add Sale")}
        />
      </div>
      <Scrollbars className="w-full md:w-7/12 lg:w-8/12 xl:w-8/12 relative dark:bg-gray-700 dark:text-gray-200">
        <Card className="overflow-y-scroll flex-grow scrollbar-hide w-full max-h-full">
          <CardBody className={`p-2 sm:p-2.5 ${isViewOnly ? "pointer-events-none opacity-80" : ""}`}>
            {/* Responsive ultra-compact grid for form fields */}
            <div className={`grid grid-cols-1 sm:grid-cols-2 ${id ? "md:grid-cols-5" : "md:grid-cols-4"} gap-x-1.5 gap-y-1 sm:gap-x-2 sm:gap-y-1 mb-1.5`}>

              <div className="col-span-1">
                <label className="block text-[11px] sm:text-xs font-semibold text-gray-600 dark:text-gray-300 leading-none mb-0.5 truncate">
                  Date
                </label>
                <InputArea
                  name="date"
                  type="date"
                  disabled={isViewOnly}
                  register={register}
                  placeholder="Select date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full"
                />
              </div>

              {id ? (
                <div className="col-span-1">
                  <label className="block text-[11px] sm:text-xs font-semibold text-gray-600 dark:text-gray-300 leading-none mb-0.5 truncate">
                    Voucher No
                  </label>
                  <InputArea
                    name="voucherNo"
                    type="text"
                    disabled={isViewOnly}
                    register={register}
                    placeholder="Voucher Number"
                    value={voucherNo}
                    onChange={(e) => setVoucherNo(e.target.value)}
                    className="w-full"
                  />
                </div>
              ) : null}

              <div className="col-span-1">
                <label className="block text-[11px] sm:text-xs font-semibold text-gray-600 dark:text-gray-300 leading-none mb-0.5 truncate">
                  Sale Type
                </label>
                <SearchableDropdown
                  options={someSaleType.map((item) => ({ "value": item._id, "label": item.name }))}
                  onChange={(value) => {
                    setSelectedSaleType(value);
                  }}
                  disabled={isViewOnly}
                  value={
                    selectedSaleType?.value && someSaleType?.find((item) => item._id === selectedSaleType.value)
                      ? {
                        value: selectedSaleType.value,
                        label: someSaleType?.find((item) => item._id === selectedSaleType.value).name,
                      }
                      : selectedSaleType
                  }
                  placeholder={"Search SaleType"}
                  className="w-full"
                />
              </div>

              <div className="col-span-1">
                <label className="block text-[11px] sm:text-xs font-semibold text-gray-600 dark:text-gray-300 leading-none mb-0.5 truncate">
                  Party Name <span className="text-red-500">*</span>
                </label>
                <SearchableDropdown
                  options={customerOptions}
                  onSearch={handleSearchCustomers}
                  onLoadMore={handleLoadMoreCustomers}
                  hasMore={hasMoreCustomers}
                  loading={isSearchingCustomers}
                  loadingMore={loadingMoreCustomers}
                  onChange={(value) => {
                    const custId = value?.value || value?._id || (typeof value === 'string' ? value : null);
                    const selected = customerList.find((cust) => cust._id === custId) || (customerData && customerData.find(c => c._id === custId));
                    setSelectedCustomer(value);
                    fetchCustomerLoyalty(custId);

                    if (custId) {
                      checkPendingOrdersForCustomer(custId, selected?.name || value?.label);
                    }

                    if (selected?.code) {
                      const oldParty = getParty;
                      setParty(selected.code);
                      setPartyObject(selected);

                      console.log(selected, 'selected?.vendor_group_id?.busy_group_id');

                      getSundryDiscountsByPartyGroup({ party_group_code: selected?.vendor_group_id?.busy_group_id, getParty: selected.code });

                      if (oldParty !== selected.code && items.length > 0 && items[0].itemId?.value) {
                        recalculateItemDiscountsForNewParty(selected.code);
                      }
                    }

                    // Auto-fill salesman from vendor's linked salesman_id
                    if (selected?.salesman_id?._id && salesmanData && !selectedSalesman) {
                      const linkedSalesman = salesmanData.find(s => s._id === selected.salesman_id._id);
                      if (linkedSalesman) {
                        setSelectedSalesman({
                          value: linkedSalesman._id,
                          label: linkedSalesman.name
                        });
                      } else if (selected.salesman_id.name) {
                        // Fallback: use the populated data directly from API
                        setSelectedSalesman({
                          value: selected.salesman_id._id,
                          label: selected.salesman_id.name
                        });
                      }
                    }
                  }}
                  disabled={isViewOnly}
                  value={selectedCustomer}
                  placeholder={"Search party"}
                  className="w-full"
                />
              </div>

              <div className="col-span-1">
                <label className="block text-[11px] sm:text-xs font-semibold text-gray-600 dark:text-gray-300 leading-none mb-0.5 truncate">
                  Salesman
                </label>
                <SearchableDropdown
                  options={salesmanData.map((item) => ({ "value": item._id, "label": item.name }))}
                  onChange={(value) => setSelectedSalesman(value)}
                  disabled={isViewOnly}
                  placeholder={"Search Salesman"}
                  value={selectedSalesman}
                  className="w-full"
                />
              </div>
            </div>

            {/* Pending Sale Orders Info / Loaded Order Badge - Full Width Slim Banner */}
            {(loadedSaleOrder || loadedSaleOrders.length > 0) && (
              <div className="mb-2 px-3 py-1.5 rounded-md bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700/60 flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-indigo-800 dark:text-indigo-300 font-medium truncate">
                  <FiCheckCircle className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                  <span className="truncate">
                    {loadedSaleOrders.length > 1
                      ? <>Orders Linked: <strong className="font-bold">{loadedSaleOrders.map(o => o.voucherNo?.trim()).join(", ")}</strong> ({items.length} items loaded)</>
                      : <>Order Linked: <strong className="font-bold">{loadedSaleOrder?.voucherNo?.trim() || loadedSaleOrders[0]?.voucherNo?.trim()}</strong> ({items.length} items loaded)</>}
                  </span>
                </div>
                <div className="flex items-center gap-2.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsPendingOrdersModalOpen(true)}
                    className="text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 font-semibold underline"
                    title="Change or select different orders"
                  >
                    Change Orders
                  </button>
                  <span className="text-gray-300 dark:text-gray-600">|</span>
                  <button
                    type="button"
                    onClick={() => {
                      setLoadedSaleOrder(null);
                      setLoadedSaleOrders([]);
                    }}
                    className="text-xs text-red-500 hover:text-red-700 font-semibold underline"
                    title="Unlink this order and bill manually"
                  >
                    Unlink
                  </button>
                </div>
              </div>
            )}

            {!loadedSaleOrder && loadedSaleOrders.length === 0 && pendingOrders.length > 0 && (
              <div className="mb-2 px-3 py-1.5 rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => setIsPendingOrdersModalOpen(true)}
                  className="inline-flex items-center gap-1.5 text-amber-800 dark:text-amber-300 font-semibold hover:underline"
                >
                  <FiFileText className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                  <span>{pendingOrders.length} Pending Sale Order(s) Found — Click to View & Load</span>
                </button>
              </div>
            )}

            {/* Customer Loyalty Points Card */}
            {selectedCustomer && (
              <div className="mb-4">
                {isFetchingLoyalty ? (
                  <div className="p-3 bg-emerald-50 dark:bg-gray-800 rounded-lg border border-emerald-100 dark:border-gray-700 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600"></div>
                    Checking customer loyalty points & tier benefits...
                  </div>
                ) : loyaltyInfo ? (
                  <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-800/60 p-3 space-y-2.5">
                    {(() => {
                      const startingPoints = loyaltyInfo.balance || 0;
                      const pointsBeingRedeemed = (isRedeemActive && loyaltyInfo) ? (Number(redeemPoints) || 0) : 0;
                      const remainingPoints = Math.max(0, startingPoints - pointsBeingRedeemed);
                      const totalSavings = (isTierDiscountActive ? tierDiscountAmount : 0) + (selectedCoupon ? couponDiscountAmount : 0) + (isRedeemActive ? loyaltyDiscountAmount : 0);

                      return (
                        <>
                          {/* 1. Simple Summary Bar */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-gray-200 dark:border-gray-700 text-xs">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-1">
                                <FiAward className="text-amber-500 w-4 h-4" />
                                <span>Loyalty:</span>
                              </span>

                              {loyaltyInfo.tier ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200">
                                  <span>{loyaltyInfo.tier.name} Tier</span>
                                  {Number(loyaltyInfo.tier.discountPercentage) > 0 && !loyaltyInfo.isTierExpired && (
                                    <span className="font-bold">({loyaltyInfo.tier.discountPercentage}% OFF)</span>
                                  )}
                                </span>
                              ) : null}

                              <span className="text-gray-600 dark:text-gray-300">
                                Available: <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{startingPoints} pts</strong>
                                <span className="text-gray-400 ml-1">(₹{(startingPoints * (loyaltyInfo.pointValueInRs || 1)).toFixed(2)})</span>
                              </span>
                            </div>

                            {totalSavings > 0 && (
                              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 text-xs">
                                Savings: −₹{totalSavings.toFixed(2)}
                              </span>
                            )}
                          </div>

                          {/* 2. Simple Controls Row */}
                          <div className="space-y-2 text-xs">
                            {/* Tier Discount Toggle (if customer has active tier discount) */}
                            {loyaltyInfo.tier && Number(loyaltyInfo.tier.discountPercentage) > 0 && !loyaltyInfo.isTierExpired && (
                              <div className="flex items-center justify-between py-1 px-2 rounded bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700">
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                  <input
                                    type="checkbox"
                                    checked={isTierDiscountActive}
                                    onChange={(e) => setIsTierDiscountActive(e.target.checked)}
                                    disabled={isViewOnly}
                                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                  />
                                  <span className="text-gray-700 dark:text-gray-200 font-medium">
                                    Apply {loyaltyInfo.tier.name} Tier Discount ({loyaltyInfo.tier.discountPercentage}%)
                                  </span>
                                </label>
                                {isTierDiscountActive && tierDiscountAmount > 0 && (
                                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                    − ₹{tierDiscountAmount.toFixed(2)}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Points Redemption */}
                            {loyaltyInfo.balance > 0 && (
                              <div className="py-1.5 px-2 rounded bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700 space-y-2">
                                <div className="flex items-center justify-between">
                                  <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                      type="checkbox"
                                      checked={isRedeemActive}
                                      onChange={(e) => {
                                        const checked = e.target.checked;
                                        setIsRedeemActive(checked);
                                        if (checked && (!redeemPoints || redeemPoints === 0)) {
                                          setRedeemPoints(loyaltyInfo.balance);
                                        }
                                      }}
                                      disabled={isViewOnly}
                                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                    />
                                    <span className="text-gray-700 dark:text-gray-200 font-medium">
                                      Redeem Points (Balance: {startingPoints} pts)
                                    </span>
                                  </label>

                                  {isRedeemActive && loyaltyDiscountAmount > 0 && (
                                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                      − ₹{loyaltyDiscountAmount.toFixed(2)}
                                    </span>
                                  )}
                                </div>

                                {isRedeemActive && (
                                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-gray-100 dark:border-gray-700">
                                    <div className="flex items-center gap-2">
                                      <span className="text-gray-500">Points:</span>
                                      <input
                                        type="number"
                                        min="0"
                                        max={loyaltyInfo.balance}
                                        value={redeemPoints}
                                        onChange={(e) => {
                                          const val = Math.max(0, Math.min(loyaltyInfo.balance, Number(e.target.value) || 0));
                                          setRedeemPoints(val);
                                        }}
                                        disabled={isViewOnly}
                                        className="w-20 px-2 py-1 text-xs font-mono font-bold rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-right outline-none focus:ring-1 focus:ring-emerald-500"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => setRedeemPoints(loyaltyInfo.balance)}
                                        disabled={isViewOnly}
                                        className="px-2 py-1 text-[11px] font-semibold rounded bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 transition"
                                      >
                                        Use Max ({loyaltyInfo.balance})
                                      </button>
                                    </div>

                                    {/* Simple Minus Math */}
                                    <div className="text-xs font-mono text-gray-600 dark:text-gray-300">
                                      <span>{startingPoints}</span>
                                      <span className="text-rose-600 font-bold"> − {pointsBeingRedeemed}</span>
                                      <span> = </span>
                                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                        {remainingPoints} pts left
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Coupon / Promo Code */}
                            <div className="py-1.5 px-2 rounded bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700">
                              {selectedCoupon ? (
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5">
                                    <FiTag className="text-indigo-500 w-3.5 h-3.5" />
                                    <span className="font-mono font-bold text-gray-800 dark:text-gray-100">{selectedCoupon.couponCode}</span>
                                    <span className="text-emerald-600 font-semibold font-mono">(-₹{selectedCoupon.couponValue})</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={handleRemoveCoupon}
                                    disabled={isViewOnly}
                                    className="text-gray-400 hover:text-rose-600 text-xs transition"
                                  >
                                    Remove
                                  </button>
                                </div>
                              ) : (
                                <div className="space-y-1.5">
                                  <div className="flex items-center gap-1.5">
                                    <input
                                      type="text"
                                      placeholder="Enter Coupon / Promo Code"
                                      value={couponCodeInput}
                                      onChange={(e) => {
                                        setCouponCodeInput(e.target.value.toUpperCase());
                                        if (couponMessage) setCouponMessage(null);
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          e.preventDefault();
                                          handleApplyCouponCode();
                                        }
                                      }}
                                      disabled={isViewOnly || couponApplying}
                                      className="flex-1 px-2.5 py-1 text-xs font-mono uppercase rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 outline-none focus:ring-1 focus:ring-indigo-500"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleApplyCouponCode()}
                                      disabled={isViewOnly || couponApplying || !couponCodeInput.trim()}
                                      className="px-3 py-1 text-xs font-semibold rounded bg-gray-800 hover:bg-gray-700 text-white disabled:opacity-40 transition"
                                    >
                                      {couponApplying ? '...' : 'Apply'}
                                    </button>
                                  </div>

                                  {availableCoupons.length > 0 && (
                                    <div className="flex items-center gap-1 flex-wrap pt-0.5 text-[11px]">
                                      <span className="text-gray-400">Available:</span>
                                      {availableCoupons.map((c) => (
                                        <button
                                          key={c._id}
                                          type="button"
                                          onClick={() => handleApplyCoupon(c)}
                                          disabled={isViewOnly}
                                          className="px-1.5 py-0.5 rounded border border-dashed border-indigo-300 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950 font-mono transition"
                                        >
                                          {c.couponCode} (-₹{c.couponValue})
                                        </button>
                                      ))}
                                    </div>
                                  )}

                                  {couponMessage && (
                                    <p className={`text-[11px] font-medium ${
                                      couponMessage.type === 'success' ? 'text-emerald-600' : 'text-rose-500'
                                    }`}>
                                      {couponMessage.text}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                ) : null}
              </div>
            )}

            {/* Responsive Grid wrapper */}
            <div className="space-y-2">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-2 sm:p-2.5 shadow-xs bg-white dark:bg-gray-800 relative"
                >
                  <div className="absolute top-[4px] right-[6px]">
                    <button
                      onClick={() => handleRemoveItem(index)}
                      className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30"
                      title="Remove Item"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                  <div className="grid lg:grid-cols-6 md:grid-cols-4 grid-cols-2 gap-x-1.5 gap-y-1 sm:gap-x-2 sm:gap-y-1">
                    <div className="col-span-1">
                      <label className="block text-[11px] sm:text-xs font-semibold text-gray-600 dark:text-gray-300 leading-none mb-0.5 truncate">Image</label>
                      <div className="w-8 h-8 border border-gray-200 dark:border-gray-600 rounded-md overflow-hidden bg-gray-50 dark:bg-gray-700 flex items-center justify-center shadow-xs">
                        {item.image ? (
                          <img
                            src={`${import.meta.env.VITE_APP_API_SOCKET_URL}${item.image}`}
                            alt="Item"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextElementSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className="text-gray-400 text-[10px] font-medium" style={{ display: item.image ? 'none' : 'flex', textAlign: 'center' }}>
                          No Img
                        </div>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[11px] sm:text-xs font-semibold text-gray-600 dark:text-gray-300 leading-none mb-0.5 truncate">Item</label>
                      <ItemSearchableDropdown
                        options={activeItems?.map((ai) => ({
                          value: ai._id,
                          label: [
                            ai.name,
                            // ai?.category_id?.name || "",
                            // ai?.item_group_id?.name || "",
                            // ai?.brand_id?.name || ""
                          ].filter(Boolean).join(" | "),
                          image: ai.image && ai.image.length > 0 ? `${import.meta.env.VITE_APP_API_SOCKET_URL}${ai.image[0]}` : "",
                          stock: ai.stock
                        })) || []}
                        onChange={(value) => {
                          console.log(value, 'imagesesjlkjlkjlkjlkjlkjlkj')
                          setSelectedItem(value?.value);
                          handleItemChange(index, 'itemId', value)
                        }}
                        disabled={isViewOnly}
                        placeholder="Search Item"
                        value={item.itemId}
                      />
                    </div>

                    <div className="col-span-1">
                      <label className="block text-[11px] sm:text-xs font-semibold text-gray-600 dark:text-gray-300 leading-none mb-0.5 truncate">HSN Code</label>
                      <Input
                        disabled={isViewOnly}
                        type="text"
                        value={item.hsn || ''}
                        onChange={(e) => handleItemChange(index, 'hsn', e.target.value)}
                        placeholder="HSN Code"
                        className="h-8 text-xs sm:text-sm"
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-[11px] sm:text-xs font-semibold text-gray-600 dark:text-gray-300 leading-none mb-0.5 truncate">Color</label>
                      <SearchableDropdown
                        disabled={isViewOnly}
                        options={item.variantColors?.length > 0 ? item.variantColors : colorOptions}
                        value={typeof item.color === 'string' ? (item.variantColors?.find(c => c.label === item.color) || colorOptions.find(c => c.label === item.color)) : item.color}
                        onChange={(value) => handleItemChange(index, 'color', value)}
                        placeholder="Color"
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-[11px] sm:text-xs font-semibold text-gray-600 dark:text-gray-300 leading-none mb-0.5 truncate">Size</label>
                      <SearchableDropdown
                        disabled={isViewOnly}
                        options={item.variantSizes?.length > 0 ? item.variantSizes : sizeOptions}
                        value={typeof item.size === 'string' ? (item.variantSizes?.find(s => s.label === item.size) || sizeOptions.find(s => s.label === item.size)) : item.size}
                        onChange={(value) => handleItemChange(index, 'size', value)}
                        placeholder="Size"
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-[11px] sm:text-xs font-semibold text-gray-600 dark:text-gray-300 leading-none mb-0.5 truncate">Qty</label>
                      <Input
                        disabled={isViewOnly}
                        type="number"
                        value={item.quantity || ''}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                        placeholder="Qty"
                        className="h-8 text-xs sm:text-sm"
                      />
                    </div>

                    <div className="col-span-1">
                      <label className="block text-[11px] sm:text-xs font-semibold text-gray-600 dark:text-gray-300 leading-none mb-0.5 truncate">Unit</label>
                      <SearchableDropdown
                        disabled={isViewOnly}
                        value={item.unit}
                        onChange={(value) => handleItemChange(index, 'unit', value)}
                        placeholder="Unit"
                        options={unitData?.map((unit) => ({
                          value: unit._id,
                          label: unit.name
                        }))
                        }
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-[11px] sm:text-xs font-semibold text-gray-600 dark:text-gray-300 leading-none mb-0.5 truncate">List Price</label>
                      <Input
                        disabled={isViewOnly}
                        type="number"
                        value={item.listPrice || ''}
                        onChange={(e) => handleItemChange(index, 'listPrice', e.target.value)}
                        placeholder="List Price"
                        className="h-8 text-xs sm:text-sm"
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-[11px] sm:text-xs font-semibold text-gray-600 dark:text-gray-300 leading-none mb-0.5 truncate">Disc. %</label>
                      <Input
                        disabled={isViewOnly}
                        type="number"
                        value={item.discount || '0.00'}
                        onChange={(e) => handleItemChange(index, 'discount', e.target.value)}
                        placeholder="Disc %"
                        step="0.01"
                        min="0"
                        max="100"
                        className="h-8 text-xs sm:text-sm"
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-[11px] sm:text-xs font-semibold text-gray-600 dark:text-gray-300 leading-none mb-0.5 truncate">Total Disc.</label>
                      <Input
                        disabled={isViewOnly}
                        type="number"
                        value={item.totalDiscount || '0.00'}
                        onChange={(e) => handleItemChange(index, 'totalDiscount', e.target.value)}
                        placeholder="Total Disc."
                        step="0.01"
                        min="0"
                        max="100"
                        className="h-8 text-xs sm:text-sm"
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-[11px] sm:text-xs font-semibold text-gray-600 dark:text-gray-300 leading-none mb-0.5 truncate">Price</label>
                      <Input
                        disabled={isViewOnly}
                        type="number"
                        value={item.price || ''}
                        onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                        placeholder="Price"
                        className="h-8 text-xs sm:text-sm"
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-[11px] sm:text-xs font-semibold text-gray-600 dark:text-gray-300 leading-none mb-0.5 truncate">Amount</label>
                      <Input
                        disabled={isViewOnly}
                        type="number"
                        value={item.amount || ''}
                        readOnly
                        className="h-8 text-xs sm:text-sm bg-gray-100 dark:bg-gray-700/60 dark:text-gray-200"
                        placeholder="Amount"
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-[11px] sm:text-xs font-semibold text-gray-600 dark:text-gray-300 leading-none mb-0.5 truncate">Description</label>
                      <Input
                        // disabled={isViewOnly}
                        type="text"
                        value={item.description || ''}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        placeholder="Description"
                        className="h-8 text-xs sm:text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex justify-end">
                <button
                  onClick={handleAddItem}
                  className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 py-1.5 px-3 rounded-md text-xs font-medium transition-colors"
                >
                  + Add Item
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-2.5 rounded-md font-semibold text-xs text-gray-800 dark:text-gray-200">
                <div>Total Quantity: <span className="font-bold">{totalQuantity}</span></div>
                <div>Total Discount Amount: <span className="font-bold">₹{!totalDiscountAmount ? "0.00" : totalDiscountAmount}</span></div>
                <div>Total Amount: <span className="font-bold text-base text-primary">₹{totalAmount}</span></div>
              </div>
            </div>




            {/* Bill Sundry Details - Compact & Sleek */}
            <div className="bg-slate-50 dark:bg-gray-800/80 p-2 sm:p-2.5 rounded-lg border border-slate-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 mt-2">
              <div className="text-xs font-bold mb-1.5 tracking-wide uppercase text-gray-700 dark:text-gray-300 flex items-center justify-between">
                <span>Bill Sundry Details <span className="text-[11px] italic font-normal text-gray-400 lowercase">(apply tax - f4)</span></span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2">
                {/* Left: Hammali */}
                <div className="rounded-md bg-white dark:bg-gray-800 px-2.5 py-1.5 flex items-center justify-between shadow-xs border border-gray-200 dark:border-gray-700 min-h-[34px]">
                  <div className="flex items-center gap-1.5 min-w-0 flex-1 mr-2">
                    <span className="font-semibold text-xs text-gray-500 dark:text-gray-400 shrink-0 w-8">1. (+)</span>
                    <span className="font-medium text-xs text-gray-800 dark:text-gray-200 truncate">
                      {(typeof hammaliDiscount === 'object' && hammaliDiscount?.name) ? hammaliDiscount.name : "Hammali@20/CRT"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <input
                      disabled={isViewOnly}
                      type="number"
                      step="0.01"
                      value={(typeof hammaliDiscount === 'object' && hammaliDiscount?.discount !== undefined) ? hammaliDiscount.discount : 0}
                      className="w-16 h-7 text-xs text-right font-medium px-1.5 py-0.5 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none"
                      readOnly
                    />
                    <input
                      disabled={isViewOnly}
                      type="number"
                      step="0.01"
                      value={totalHammli}
                      className="w-20 h-7 text-xs text-right font-semibold px-1.5 py-0.5 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none"
                      readOnly
                    />
                  </div>
                </div>

                {/* Right: Discount */}
                <div className="rounded-md bg-white dark:bg-gray-800 px-2.5 py-1.5 flex items-center justify-between shadow-xs border border-gray-200 dark:border-gray-700 min-h-[34px]">
                  <div className="flex items-center gap-1.5 min-w-0 flex-1 mr-2">
                    <span className="font-semibold text-xs text-gray-500 dark:text-gray-400 shrink-0 w-8">2. (-)</span>
                    <span className="font-medium text-xs text-gray-800 dark:text-gray-200 truncate">Discount</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <input
                      disabled={isViewOnly}
                      type="number"
                      step="0.01"
                      value={vendorDiscount || '0.00'}
                      className="w-16 h-7 text-xs text-right font-medium px-1.5 py-0.5 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none"
                      readOnly
                    />
                    <input
                      disabled={isViewOnly}
                      type="number"
                      step="0.01"
                      value={totalDiscountSundries || '0.00'}
                      className="w-20 h-7 text-xs text-right font-semibold px-1.5 py-0.5 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none"
                      readOnly
                    />
                  </div>
                </div>

                {/* Conditional: IGST OR CGST + SGST */}
                {isCentralSale ? (
                  <div className="sm:col-span-2">
                    <div className="rounded-md bg-white dark:bg-gray-800 px-2.5 py-1.5 flex items-center justify-between shadow-xs border border-gray-200 dark:border-gray-700 min-h-[34px]">
                      <div className="flex items-center gap-1.5 min-w-0 flex-1 mr-2">
                        <span className="font-semibold text-xs text-gray-500 dark:text-gray-400 shrink-0 w-8">3. (+)</span>
                        <span className="font-medium text-xs text-gray-800 dark:text-gray-200 truncate">IGST</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <input
                          disabled={isViewOnly}
                          type="number"
                          step="0.01"
                          value="5.000"
                          className="w-16 h-7 text-xs text-right font-medium px-1.5 py-0.5 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none"
                          readOnly
                        />
                        <input
                          disabled={isViewOnly}
                          type="number"
                          step="0.01"
                          value={(Number(totalCgstSundries) + Number(totalSgstSundries)).toFixed(3)}
                          className="w-20 h-7 text-xs text-right font-semibold px-1.5 py-0.5 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none"
                          readOnly
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* CGST */}
                    <div className="rounded-md bg-white dark:bg-gray-800 px-2.5 py-1.5 flex items-center justify-between shadow-xs border border-gray-200 dark:border-gray-700 min-h-[34px]">
                      <div className="flex items-center gap-1.5 min-w-0 flex-1 mr-2">
                        <span className="font-semibold text-xs text-gray-500 dark:text-gray-400 shrink-0 w-8">3. (+)</span>
                        <span className="font-medium text-xs text-gray-800 dark:text-gray-200 truncate">CGST</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <input
                          disabled={isViewOnly}
                          type="number"
                          step="0.01"
                          value="2.5"
                          className="w-16 h-7 text-xs text-right font-medium px-1.5 py-0.5 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none"
                          readOnly
                        />
                        <input
                          disabled={isViewOnly}
                          type="number"
                          step="0.01"
                          value={totalCgstSundries.toFixed(2)}
                          className="w-20 h-7 text-xs text-right font-semibold px-1.5 py-0.5 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none"
                          readOnly
                        />
                      </div>
                    </div>

                    {/* SGST */}
                    <div className="rounded-md bg-white dark:bg-gray-800 px-2.5 py-1.5 flex items-center justify-between shadow-xs border border-gray-200 dark:border-gray-700 min-h-[34px]">
                      <div className="flex items-center gap-1.5 min-w-0 flex-1 mr-2">
                        <span className="font-semibold text-xs text-gray-500 dark:text-gray-400 shrink-0 w-8">4. (+)</span>
                        <span className="font-medium text-xs text-gray-800 dark:text-gray-200 truncate">SGST</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <input
                          disabled={isViewOnly}
                          type="number"
                          step="0.01"
                          value="2.5"
                          className="w-16 h-7 text-xs text-right font-medium px-1.5 py-0.5 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none"
                          readOnly
                        />
                        <input
                          disabled={isViewOnly}
                          type="number"
                          step="0.01"
                          value={totalSgstSundries.toFixed(2)}
                          className="w-20 h-7 text-xs text-right font-semibold px-1.5 py-0.5 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none"
                          readOnly
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Loyalty Discount Sundry */}
                {isRedeemActive && loyaltyDiscountAmount > 0 && (
                  <div className="sm:col-span-2">
                    <div className="rounded-md bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1.5 flex items-center justify-between shadow-xs border border-emerald-200 dark:border-emerald-800 min-h-[34px]">
                      <div className="flex items-center gap-1.5 min-w-0 flex-1 mr-2">
                        <span className="font-bold text-xs text-emerald-700 dark:text-emerald-400 shrink-0 w-8">5. (-)</span>
                        <span className="font-medium text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 truncate">
                          <FiAward className="w-3.5 h-3.5 shrink-0" />
                          Loyalty Discount ({redeemPoints} pts)
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] text-emerald-600/80">
                          @ ₹{loyaltyInfo?.pointValueInRs || 1}/pt
                        </span>
                        <span className="font-bold text-emerald-700 dark:text-emerald-400 text-xs">
                          - ₹{loyaltyDiscountAmount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>


            {/* Tax Summary Section - Mobile Responsive */}
            <div className="bg-slate-50 dark:bg-gray-800/80 p-2 sm:p-2.5 mt-2 border border-slate-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 text-xs rounded-lg">
              {/* Tax Summary Table - Responsive */}
              <div className="overflow-x-auto">
                {/* Desktop Table */}
                <table className="min-w-full border-collapse w-full hidden sm:table">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                      <th className="px-2 py-1 text-left font-semibold border-b border-gray-200 dark:border-gray-600">Tax Rate</th>
                      <th className="px-2 py-1 text-left font-semibold border-b border-gray-200 dark:border-gray-600">Taxable Amt.</th>
                      {isCentralSale ? (
                        <th className="px-2 py-1 text-left font-semibold border-b border-gray-200 dark:border-gray-600">IGST</th>
                      ) : (
                        <>
                          <th className="px-2 py-1 text-left font-semibold border-b border-gray-200 dark:border-gray-600">CGST</th>
                          <th className="px-2 py-1 text-left font-semibold border-b border-gray-200 dark:border-gray-600">SGST</th>
                        </>
                      )}
                      <th className="px-2 py-1 border-b border-gray-200 dark:border-gray-600"></th>
                      <th className="px-2 py-1 text-right font-semibold border-b border-gray-200 dark:border-gray-600">
                        Total Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="px-2 py-1 border-b border-gray-200 dark:border-gray-600">5%</td>
                      <td className="px-2 py-1 border-b border-gray-200 dark:border-gray-600">₹{totalAmount.toFixed(2)}</td>
                      {isCentralSale ? (
                        <td className="px-2 py-1 border-b border-gray-200 dark:border-gray-600">₹{totalIgstSundries.toFixed(2)}</td>
                      ) : (
                        <>
                          <td className="px-2 py-1 border-b border-gray-200 dark:border-gray-600">₹{totalCgstSundries.toFixed(2)}</td>
                          <td className="px-2 py-1 border-b border-gray-200 dark:border-gray-600">₹{totalSgstSundries.toFixed(2)}</td>
                        </>
                      )}
                      <td className="px-2 py-1 border-b border-gray-200 dark:border-gray-600"></td>
                      <td className="px-2 py-1 text-right border-b border-gray-200 dark:border-gray-600"><strong>₹{totalNetAmount.toFixed(2)}</strong></td>
                    </tr>
                  </tbody>
                </table>

                {/* Mobile View: Card-based Layout */}
                <div className="sm:hidden bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                  <div className="bg-blue-100 dark:bg-gray-800 px-3 py-2 rounded-t-lg">
                    <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Tax Summary</h4>
                  </div>
                  <div className="p-3 space-y-3">
                    {/* Tax Rate and Taxable Amount */}
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Tax Rate:</span>
                      <span className="text-sm font-medium">5%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Taxable Amount:</span>
                      <span className="text-sm font-medium">₹{totalAmount.toFixed(2)}</span>
                    </div>

                    {/* Tax Components */}
                    {isCentralSale ? (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">IGST (5%):</span>
                        <span className="text-sm font-medium">₹{totalIgstSundries.toFixed(2)}</span>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-400">CGST (2.5%):</span>
                          <span className="text-sm font-medium">₹{totalCgstSundries.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-400">SGST (2.5%):</span>
                          <span className="text-sm font-medium">₹{totalSgstSundries.toFixed(2)}</span>
                        </div>
                      </>
                    )}

                    {/* Total Tax */}
                    <div className="border-t border-gray-200 dark:border-gray-600 pt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Total Tax:</span>
                        <span className="text-sm font-semibold">
                          ₹{(isCentralSale ? totalIgstSundries : totalCgstSundries + totalSgstSundries).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Net Amount */}
                    <div className="bg-blue-50 dark:bg-gray-700 px-3 py-2 rounded border-t border-gray-200 dark:border-gray-600">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-gray-800 dark:text-gray-200">Total Amount:</span>
                        <span className="text-sm font-bold text-blue-600 dark:text-blue-400">₹{totalNetAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tax Summary Checkbox */}
              <div className="flex items-center space-x-2 mb-4 mt-4 sm:mt-2">
                <input type="checkbox" id="taxSummary" defaultChecked className="form-checkbox h-4 w-4 text-blue-600 transition duration-150 ease-in-out" />
                <label htmlFor="taxSummary" className="text-sm select-none">Tax Summary</label>
              </div>

              {/* Button Group - Responsive */}
              <div className="flex flex-col sm:flex-row justify-end gap-2 text-xs mt-2">
                <button
                  className="bg-green-100 border border-green-400 px-2 py-2 rounded shadow-sm hover:bg-green-200 w-full sm:w-auto transition"
                  onClick={saveSaleOrder}
                >
                  Save
                </button>
              </div>
            </div>
          </CardBody>
        </Card>
      </Scrollbars>
      <CustomerPendingOrdersModal
        isOpen={isPendingOrdersModalOpen}
        onClose={() => setIsPendingOrdersModalOpen(false)}
        customerName={selectedCustomer?.label || selectedCustomer?.name}
        orders={pendingOrders}
        onSelectOrders={handleSelectSaleOrders}
        onSelectOrder={handleSelectSaleOrders}
      />
    </>
  );
};

export default SaleDrawer;

