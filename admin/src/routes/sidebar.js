import {
  FiGrid,
  FiCompass,
  FiSettings,
  FiSlack,
  FiFileText,
  FiShare2,
  FiArchive,
  FiRadio,
} from "react-icons/fi";
import { FaUserShield , FaLuggageCart, FaShippingFast } from "react-icons/fa";
import { BsCart4 } from "react-icons/bs";
import { FaBuildingUser } from "react-icons/fa6";
import { RiCustomerService2Fill } from "react-icons/ri";
import { FaUserTie } from "react-icons/fa";
import { MdShowChart } from "react-icons/md";
import { SiFlipkart, SiShopify, SiWoocommerce } from "react-icons/si";
import { FaAmazon } from "react-icons/fa";

const sidebar = [
  {
    path: "/dashboard",
    icon: FiGrid,
    name: "Dashboard",
    permission: "view_dashboard",
  },
  {
    icon: FiShare2,
    name: "Marketplace Sync",
    permission: "view_dashboard",
    routes: [
      {
        path: "/flipkart-sync",
        name: "Flipkart",
        permission: "view_dashboard",
      },
      {
        path: "/amazon-sync",
        name: "Amazon",
        permission: "view_dashboard",
      },
      {
        path: "/shopify-sync",
        name: "Shopify",
        permission: "view_dashboard",
      },
      {
        path: "/woocommerce-sync",
        name: "WooCommerce",
        permission: "view_dashboard",
      },
    ],
  },
  // {
  //   path: "/catalogs",
  //   icon: FiSlack,
  //   name: "Catalog",
  //   permission: "view_catalog",
  // },
  // {
  //   icon: FiSlack,
  //   name: "Catalog",
  //   permission: "view_catalog",
  //   routes: [
  //     { path: "/products", name: "Products", permission: "view_products" },
  //     // { path: "/categories", name: "Categories", permission: "view_categories" },
  //     { path: "/attributes", name: "Attributes", permission: "view_attributes" },
  //     { path: "/coupons", name: "Coupons", permission: "view_coupons" },
  //   ],
  // },
  {
    path: "/vendor-group",
    icon: FaBuildingUser,
    name: "Vendor Group",
    permission: "view_vendor_groups",
  },
  {
    path: "/vendors",
    icon: RiCustomerService2Fill,
    name: "Vendor",
    permission: "view_customers",
  },
  {
    path: "/sales-man",
    icon: FaUserTie,
    name: "Sales Man",
    permission: "view_sales_man",
  },
  {
    icon: FiRadio,
    name: "SalesmanVisit",
    permission: "view_sales_man",
    routes: [
      {
        path: "/salesman-visits",
        name: "Visit List",
        permission: "view_sales_man",
      },
      {
        path: "/salesman-routes",
        name: "Route List",
        permission: "view_sales_man",
      },
      {
        path: "/salesman-tracking",
        name: "Real-Time Tracking",
        permission: "view_sales_man",
      },
      {
        path: "/salesman-collections",
        name: "Collection Report",
        permission: "view_sales_man",
      },
    ],
  },
  {
    path: "/stock",
    icon: MdShowChart,
    name: "Stock",
    permission: "view_stock",
  },
  {
    path: "/inventory",
    icon: FiArchive,
    name: "Inventory",
    permission: "view_stock",
  },
  {
    path: "/loyalty-points",
    icon: FiCompass, // Using FiCompass for now, could use a better icon
    name: "Loyalty Mgmt",
    permission: "view_dashboard", // Using a general permission so admins can see it
  },
  {
    icon: BsCart4,
    name: "Item",
    permission: "view_item_groups",
    routes: [
      {
        path: "/item-group",
        name: "Item Group",
        permission: "view_item_groups",
      },
      { path: "/item", name: "Item", permission: "view_items" },
      { path: "/brand", name: "Brand", permission: "view_brands" },
      { path: "/category", name: "Category", permission: "view_categories" },
      { path: "/unit", name: "Unit", permission: "view_units" },
      {
        path: "/attribute-group",
        name: "Attribute group",
        permission: "view_attribute_groups",
      },
      {
        path: "/attribute-value",
        name: "Attribute value",
        permission: "view_attribute_values",
      },
    ],
  },
  {
    icon: FiCompass,
    name: "Orders",
    permission: "view_orders",
    routes: [
      {
        path: "/sale",
        name: "Sale",
        permission: "view_sale_order",
      },
      {
        path: "/sale-order",
        name: "Sale Order",
        permission: "view_orders",
      },
    ],
  },
  {
    icon: FiFileText,
    name: "Reports",
    permission: "view_report",
    routes: [
      {
        path: "/party-ledger",
        name: "PartyLedger",
        permission: "view_party_ledger",
      },
      {
        path: "/bill-receivable",
        name: "BillReceivable",
        permission: "view_party_ledger",
      },
    ],
  },

  // {
  //   icon: BiSolidOffer,
  //   name: "Promotion",
  //   permission: "view_item_groups",
  //   routes: [
  //     { path: "/banner", name: "Banner", permission: "view_banners" },
  //     { path: "/offer", name: "Offer", permission: "view_offers" },
  //     { path: "/promo-code", name: "Promo Code", permission: "view_promo_codes" },
  //   ],
  // },
  // {
  //   icon: FaShippingFast,
  //   name: "Shipping Mgmt",
  //   permission: "view_shippings",
  //   routes: [
  //     { path: "/shipping-settings", name: "Strategy Settings", permission: "view_shippings" },
  //     { path: "/pharmacy-settings", name: "Pharmacy Location", permission: "view_shippings" },
  //     { path: "/shipping-rules-list", name: "Shipping Rules", permission: "view_shippings" },
  //   ],
  // },

  {
    path: "/dispatch",
    icon: FaLuggageCart,
    name: "Dispatch",
    permission: "view_dispatchs",
  },
  {
    icon: FaUserShield,
    name: "Administration",
    permission: "view_item_groups",
    routes: [
      { path: "/our-staff", name: "Users", permission: "view_staff" },
      { path: "/role", name: "Role", permission: "view_roles" },
    ],
  },

  // {
  //   path: "/sale-order",
  //   icon: MdPointOfSale,
  //   name: "Sale Order",
  //   permission: "view_sale_order",
  // },
  {
    icon: FiSettings,
    name: "Settings",
    permission: "view_settings",
    routes: [
      { path: "/settings", name: "Settings", permission: "view_settings" },
      {
        path: "/theme-settings",
        name: "Theme & Colors",
        permission: "view_settings",
      },
      {
        path: "/delete-settings",
        name: "Delete Setting",
        permission: "view_settings",
      },
      {
        path: "/whatsapp-setting",
        name: "Whatsapp Setting",
        permission: "manage_whatsapp_setting",
      },
    ],
  },
];

// Permissions for the user (example)
const userPermissions = [
  { path: "/dashboard", permission: "view_dashboard" },
  { path: "/flipkart-sync", permission: "view_dashboard" },
  { path: "/amazon-sync", permission: "view_dashboard" },
  { path: "/shopify-sync", permission: "view_dashboard" },
  { path: "/woocommerce-sync", permission: "view_dashboard" },
  { path: "/products", permission: "view_products" },
  { path: "/categories", permission: "view_categories" },
  { path: "/attributes", permission: "view_attributes" },
  { path: "/coupons", permission: "view_coupons" },
  { path: "/customers", permission: "view_customers" },
  { path: "/orders", permission: "view_orders" },
  { path: "/our-staff", permission: "view_our_staff" }, // Fixed permission
  {
    path: "/settings?settingTab=common-settings",
    permission: "manage_settings",
  },
  { path: "/whatsapp-setting", permission: "manage_whatsapp_setting" },
  { path: "/delete-settings", permission: "manage_delete_settings" },
  { path: "/theme-settings", permission: "view_settings" },
  { path: "#", permission: "view_international" },
  { path: "/languages", permission: "view_languages" },
  { path: "/currencies", permission: "view_currencies" },
  { path: "http://localhost:3000", permission: "view_store" },
  { path: "/store/customization", permission: "customize_store" },
  { path: "/store/store-settings", permission: "manage_store_settings" },
  { path: "/catalogs", permission: "view_catalog" },
  { path: "/sale", permission: "view_sale_order" },
  { path: "/sale-order", permission: "view_sale_order" },
  { path: "/party-ledger", permission: "view_party_ledger" },
  { path: "/bill-receivable", permission: "view_party_ledger" },
  { path: "/stock", permission: "view_stock" },
  { path: "/inventory", permission: "view_stock" },
  { path: "#", permission: "view_report" },
  { path: "#", permission: "view_shippings" },
];

const filterSidebar = (sidebarItems, userPermissions, adminInfo) => {
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
    if (isSalesman) {
      return sidebarItems
        .filter((item) => item.path !== "/sales-man")
        .map((item) => ({ ...item }));
    }
    return sidebarItems;
  }

  return sidebarItems
    .map((item) => {
      const copy = { ...item };
      if (copy.routes && Array.isArray(copy.routes)) {
        copy.routes = filterSidebar(copy.routes, userPermissions, adminInfo);
      }
      return copy;
    })
    .filter((item) => {
      // If user is a salesman, hide admin-only staff management
      if (isSalesman && item.path === "/sales-man") {
        return false;
      }

      // If user is a salesman, permit salesman visit menu and all tracking/route/collection routes
      if (isSalesman && item.permission === "view_sales_man") {
        return true;
      }

      const hasPermission = item.permission
        ? userPermissions.some((perm) => {
            if (!perm) return false;
            const permStr = typeof perm === 'object' ? perm.permission : perm;
            if (permStr === item.permission) return true;
            if (item.permission === "view_orders" && (permStr === "view_sale_order" || permStr === "Orders")) return true;
            if (item.permission === "view_sale_order" && (permStr === "view_orders" || permStr === "Orders")) return true;
            if (item.permission === "view_stock" && (permStr === "view_stock" || permStr === "view_items" || permStr === "view_item_groups" || permStr === "view_dashboard" || permStr === "Stock")) return true;
            if (item.permission === "view_sales_man" && (permStr === "view_sales_man" || permStr === "salesman")) return true;
            return false;
          })
        : true;

      if (item.routes) {
        return hasPermission || item.routes.length > 0;
      }
      return hasPermission;
    });
};

// Final filtered sidebar based on user permissions & admin info
const getFilteredSidebar = (userPermissions, adminInfo) =>
  filterSidebar(sidebar, userPermissions, adminInfo);
export default getFilteredSidebar;
