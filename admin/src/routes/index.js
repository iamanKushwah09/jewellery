import DeleteSettings from "@/pages/DeleteSettings";
import { lazy } from "react";
// Lazy load your components as before
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Attributes = lazy(() => import("@/pages/Attributes"));
const ChildAttributes = lazy(() => import("@/pages/ChildAttributes"));
const Products = lazy(() => import("@/pages/Products"));
const ProductDetails = lazy(() => import("@/pages/ProductDetails"));
const Category = lazy(() => import("@/pages/Category"));
const ChildCategory = lazy(() => import("@/pages/ChildCategory"));
const Staff = lazy(() => import("@/pages/Staff"));
const Customers = lazy(() => import("@/pages/Customers"));
const CustomerOrder = lazy(() => import("@/pages/CustomerOrder"));
const Orders = lazy(() => import("@/pages/Orders"));
const OrderInvoice = lazy(() => import("@/pages/OrderInvoice"));
const Coupons = lazy(() => import("@/pages/Coupons"));
const Page404 = lazy(() => import("@/pages/404"));
const ComingSoon = lazy(() => import("@/pages/ComingSoon"));
const EditProfile = lazy(() => import("@/pages/EditProfile"));
const Languages = lazy(() => import("@/pages/Languages"));
const Currencies = lazy(() => import("@/pages/Currencies"));
const Setting = lazy(() => import("@/pages/Setting"));
const ThemeSettings = lazy(() => import("@/pages/ThemeSettings"));
const StoreHome = lazy(() => import("@/pages/StoreHome"));
const StoreSetting = lazy(() => import("@/pages/StoreSetting"));
const Notifications = lazy(() => import("@/pages/Notifications"));
const Role = lazy(() => import("@/pages/Role"));
const VendorGroup = lazy(() => import("@/pages/VendorGroup"));
const ItemGroup = lazy(() => import("@/pages/ItemGroup"));
const Item = lazy(() => import("@/pages/Item"));
const ItemDetails = lazy(() => import("@/pages/ItemDetails"));
const Brand = lazy(() => import("@/pages/Brand"));
const Offer = lazy(() => import("@/pages/Offer"));
const Shipping = lazy(() => import("@/pages/Shipping"));
const Unit = lazy(() => import("@/pages/Unit"));
const Banner = lazy(() => import("@/pages/Banner"));
const PromoCode = lazy(() => import("@/pages/PromoCode"));
const AttributeGroup = lazy(() => import("@/pages/AttributeGroup"));
const AttributeValue = lazy(() => import("@/pages/AttributeValue"));
const CataLog = lazy(() => import("@/pages/Catalog"));
const Dispatch = lazy(() => import("@/pages/Dispatch"));
const Stock = lazy(() => import("@/pages/Stock"));
const Inventory = lazy(() => import("@/pages/Inventory"));
const POS = lazy(() => import("@/pages/POS"));
const SalesMan = lazy(() => import("@/pages/SalesMan"));
const PartyLedger = lazy(() => import("@/pages/PartyLedger"));
const Sale = lazy(() => import("@/pages/Sale"));
const SaleOrder = lazy(() => import("@/pages/SaleOrder"));
const SaleOrderDetails = lazy(() => import("@/pages/SaleOrderDetails"));
const BillReceivable = lazy(() => import("@/pages/BillReceivable"));
const WhatsappSetting = lazy(() => import("@/pages/WhatsappSetting"));
const LoyaltyPoints = lazy(() => import("@/pages/LoyaltyPoints"));
const FlipkartSync = lazy(() => import("@/pages/FlipkartSync"));
const AmazonSync = lazy(() => import("@/pages/AmazonSync"));
const ShopifySync = lazy(() => import("@/pages/ShopifySync"));
const WooCommerceSync = lazy(() => import("@/pages/WooCommerceSync"));

const ShippingSettings = lazy(() => import("@/pages/Shipping/ShippingSettings"));
const PharmacySettings = lazy(() => import("@/pages/Shipping/PharmacySettings"));
const ShippingRulesList = lazy(() => import("@/pages/Shipping/ShippingRulesList"));
const AddShippingRule = lazy(() => import("@/pages/Shipping/AddShippingRule"));
const EditShippingRule = lazy(() => import("@/pages/Shipping/EditShippingRule"));

const SalesmanVisits = lazy(() => import("@/pages/SalesmanVisits"));
const CreateSalesmanVisit = lazy(() => import("@/pages/CreateSalesmanVisit"));
const SalesmanRoutes = lazy(() => import("@/pages/SalesmanRoutes"));
const CreateSalesmanRoute = lazy(() => import("@/pages/CreateSalesmanRoute"));
const SalesmanTracking = lazy(() => import("@/pages/SalesmanTracking"));
const SalesmanCollectionReport = lazy(() => import("@/pages/SalesmanCollectionReport"));


// Define your routes
const allRoutes = [
  { path: "/dashboard", component: Dashboard, permission: "view_dashboard" },
  { path: "/products", component: Products, permission: "view_products" },
  { path: "/attributes", component: Attributes, permission: "view_attributes" },
  { path: "/attributes/:id", component: ChildAttributes, permission: "view_attributes" },
  { path: "/product/:id", component: ProductDetails, permission: "view_products" },
  // { path: "/categories", component: Category, permission: "view_categories" },
  { path: "/category", component: Category, permission: "view_categories" },
  { path: "/languages", component: Languages, permission: "view_languages" },
  { path: "/currencies", component: Currencies, permission: "view_currencies" },
  // { path: "/categories/:id", component: ChildCategory, permission: "view_categories" },
  { path: "/vendors", component: Customers, permission: "view_customers" },
  { path: "/customer-order/:id", component: CustomerOrder, permission: "view_orders" },
  { path: "/our-staff", component: Staff, permission: "view_staff" },
  { path: "/role", component: Role, permission: "view_roles" },
  { path: "/vendor-group", component: VendorGroup, permission: "view_vendor_groups" },
  { path: "/item-group", component: ItemGroup, permission: "view_item_groups" },
  { path: "/item", component: Item, permission: "view_items" },
  { path: "/item/:id", component: ItemDetails, permission: "view_items" },
  { path: "/brand", component: Brand, permission: "view_brands" },
  { path: "/offer", component: Offer, permission: "view_offers" },
  { path: "/shipping", component: Shipping, permission: "view_shippings" },
  { path: "/shipping-settings", component: ShippingSettings, permission: "view_shippings" },
  { path: "/pharmacy-settings", component: PharmacySettings, permission: "view_shippings" },
  { path: "/shipping-rules-list", component: ShippingRulesList, permission: "view_shippings" },
  { path: "/shipping-rules/add", component: AddShippingRule, permission: "view_shippings" },
  { path: "/shipping-rules/edit/:id", component: EditShippingRule, permission: "view_shippings" },
  { path: "/unit", component: Unit, permission: "view_units" },
  { path: "/banner", component: Banner, permission: "view_banners" },
  { path: "/promo-code", component: PromoCode, permission: "view_promo_codes" },
  { path: "/attribute-group", component: AttributeGroup, permission: "view_attribute_groups" },
  { path: "/attribute-value", component: AttributeValue, permission: "view_attribute_values" },
  { path: "/orders", component: Orders, permission: "view_orders" },
  { path: "/order/:id", component: OrderInvoice, permission: "view_orders" },
  { path: "/coupons", component: Coupons, permission: "view_coupons" },
  { path: "/settings", component: Setting, permission: "view_settings" },
  { path: "/theme-settings", component: ThemeSettings, permission: "view_settings" },
  {path: "/delete-settings", component: DeleteSettings, permission: "view_settings"},
  { path: "/store/customization", component: StoreHome, permission: "view_store" },
  { path: "/store/store-settings", component: StoreSetting, permission: "view_store" },
  { path: "/404", component: Page404 },
  { path: "/coming-soon", component: ComingSoon },
  { path: "/edit-profile", component: EditProfile, permission: "edit_profile" },
  { path: "/notifications", component: Notifications, permission: "view_notifications" },
  { path: "/catalogs", component: CataLog, permission: "view_catalog" },
  { path: "/dispatch", component: Dispatch, permission: "view_dispatchs" },
  { path: "/loyalty-points", component: LoyaltyPoints, permission: "view_dashboard" },
  { path: "/sales-man", component: SalesMan, permission: "view_sales_man" },
  { path: "/stock", component: Stock, permission: "view_stock" },
  { path: "/inventory", component: Inventory, permission: "view_stock" },
  { path: "/pos", component: POS, permission: "view_pos" },
  { path: "/sale", component: Sale, permission: "view_sale_order" },
  { path: "/sale-order", component: SaleOrder, permission: "view_orders" },
  { path: "/sale-order/:id", component: SaleOrderDetails, permission: "view_orders" },
  { path: "/party-ledger", component: PartyLedger, permission: "view_party_ledger" },
  { path: "/bill-receivable", component: BillReceivable, permission: "view_party_ledger" },
  { path: "/whatsapp-setting", component: WhatsappSetting, permission: "manage_whatsapp_setting" },
  { path: "/flipkart-sync", component: FlipkartSync, permission: "view_dashboard" },
  { path: "/amazon-sync", component: AmazonSync, permission: "view_dashboard" },
  { path: "/shopify-sync", component: ShopifySync, permission: "view_dashboard" },
  { path: "/woocommerce-sync", component: WooCommerceSync, permission: "view_dashboard" },
  { path: "/salesman-visits", component: SalesmanVisits, permission: "view_sales_man" },
  { path: "/salesman-visits/create", component: CreateSalesmanVisit, permission: "view_sales_man" },
  { path: "/salesman-visits/edit/:id", component: CreateSalesmanVisit, permission: "view_sales_man" },
  { path: "/salesman-routes", component: SalesmanRoutes, permission: "view_sales_man" },
  { path: "/salesman-routes/create", component: CreateSalesmanRoute, permission: "view_sales_man" },
  { path: "/salesman-tracking", component: SalesmanTracking, permission: "view_sales_man" },
  { path: "/salesman-collections", component: SalesmanCollectionReport, permission: "view_sales_man" },
];

// Filter routes based on user permissions & admin info
const filterRoutesByPermissions = (routes, userPermissions, adminInfo) => {
  const isSalesman = Boolean(
    adminInfo?.salesman_id ||
    (typeof adminInfo?.role === 'string' && adminInfo.role.toLowerCase().includes('salesman')) ||
    (typeof adminInfo?.roleName === 'string' && adminInfo.roleName.toLowerCase().includes('salesman')) ||
    (Array.isArray(userPermissions) && userPermissions.some(p => {
      const pVal = typeof p === 'object' ? (p.permission || Object.values(p)[0]) : p;
      return typeof pVal === 'string' && (pVal === 'view_sales_man' || pVal.toLowerCase().includes('salesman'));
    }))
  );

  if (!userPermissions || !Array.isArray(userPermissions) || userPermissions.length === 0) {
    return routes;
  }
  return routes.reduce((filtered, route) => {
    // If user is a salesman, allow view_sales_man routes
    if (isSalesman && route.permission === "view_sales_man") {
      filtered.push(route);
      return filtered;
    }

    const hasPermission = userPermissions?.some((userPerm) => {
      if (!userPerm) return false;
      const permStr = typeof userPerm === 'object' ? userPerm.permission : userPerm;
      if (permStr === route.permission) return true;
      if (route.permission === "view_orders" && (permStr === "view_sale_order" || permStr === "Orders")) return true;
      if (route.permission === "view_sale_order" && (permStr === "view_orders" || permStr === "Orders")) return true;
      if (route.permission === "view_stock" && (permStr === "view_stock" || permStr === "view_items" || permStr === "view_item_groups" || permStr === "view_dashboard" || permStr === "Stock")) return true;
      if (route.permission === "view_sales_man" && (permStr === "view_sales_man" || permStr === "salesman")) return true;
      return false;
    });
    // If the route does not have a permission, add it directly
    if (!route.permission || hasPermission) {
      filtered.push(route);
    }
    return filtered;
  }, []);
};
// Get user permissions
const getRoutes = (userPermissions, adminInfo) => filterRoutesByPermissions(allRoutes, userPermissions, adminInfo);
export default getRoutes;