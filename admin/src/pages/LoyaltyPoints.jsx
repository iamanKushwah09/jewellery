import React, { useState, useEffect } from "react";
import {
  FiUsers,
  FiSettings,
  FiAward,
  FiPackage,
  FiTag,
  FiShoppingCart,
  FiCalendar,
  FiDollarSign,
  FiGift,
  FiPlusCircle,
  FiAlertCircle,
  FiSearch,
  FiEdit3,
  FiClock,
  FiCheck,
  FiX,
  FiRefreshCw,
  FiPhone,
  FiMail,
  FiSliders,
  FiTrendingUp,
  FiDatabase,
  FiArrowUpRight,
  FiArrowDownLeft,
  FiPlus,
  FiMinus,
} from "react-icons/fi";
import {
  Card,
  CardBody,
  Table,
  TableCell,
  TableContainer,
  TableFooter,
  TableHeader,
  Pagination,
  TableRow,
  Button,
  Input,
  Label,
  Select,
  Badge,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@windmill/react-ui";
import PageTitle from "@/components/Typography/PageTitle";
import AnimatedContent from "@/components/common/AnimatedContent";
import LoyaltyServices from "@/services/LoyaltyServices";
import ItemGroupServices from "@/services/ItemGroupServices";
import ItemServices from "@/services/ItemServices";
import BrandServices from "@/services/BrandServices";
import TableLoading from "@/components/preloader/TableLoading";
import NotFound from "@/components/table/NotFound";
import {
  ItemGroupRulesTab,
  ItemRulesTab,
  SaleRulesTab,
  VisitRulesTab,
  LumpsumRulesTab,
  CouponTemplatesTab,
} from "@/components/loyalty/LoyaltyRulesTabs";
import { notifySuccess, notifyError } from "@/utils/toast";

const LoyaltyPoints = () => {
  const [activeTab, setActiveTab] = useState("customers");

  // States for Customers & Parties
  const [data, setData] = useState([]);
  const [totalResults, setTotalResults] = useState(0);
  const [page, setPage] = useState(1);
  const resultsPerPage = 20;
  const [loading, setLoading] = useState(false);

  // Filter & Search states
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [groupType, setGroupType] = useState("All");
  const [hasPointsFilter, setHasPointsFilter] = useState("all");
  const [tierFilter, setTierFilter] = useState("all");

  // Points Adjustment Modal State (Dedicated MCA-Grade Window)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [modalMode, setModalMode] = useState("set"); // "set" | "earn" | "redeem"
  const [modalPoints, setModalPoints] = useState("");
  const [modalReason, setModalReason] = useState("");
  const [isSavingPoints, setIsSavingPoints] = useState(false);

  // History Modal state
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyData, setHistoryData] = useState(null);

  // States for Config
  const [config, setConfig] = useState({
    pointValueInRs: 0.8,
    considerGST: true,
    pointCalculationOn: "current_invoice",
    minInvoiceAmountToRedeem: 0,
    minPointToRedeem: 0,
    pointsMode: "priority",
    enabledModes: {
      pointWise: true,
      saleWise: true,
      visitWise: true,
      lumpsum: true,
    },
  });

  // States for Tiers
  const [tiers, setTiers] = useState([]);
  const [newTier, setNewTier] = useState({ name: "", purchasePrice: 0, discountPercentage: 0, validityDays: 365 });
  const [editingTier, setEditingTier] = useState(null);

  // States for dropdowns (items, brands, item groups)
  const [itemGroups, setItemGroups] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [allBrands, setAllBrands] = useState([]);

  // Debounce search input by 350ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 350);
    return () => clearTimeout(handler);
  }, [search]);

  // When filters or page change, load customers
  useEffect(() => {
    if (activeTab === "customers") {
      fetchLoyaltyPoints();
    }
  }, [activeTab, page, debouncedSearch, groupType, hasPointsFilter, tierFilter]);

  useEffect(() => {
    // Always load tiers + catalog data — needed across tabs
    fetchTiers();
    fetchCatalogData();
    if (activeTab === "config") fetchConfig();
  }, [activeTab]);

  const fetchCatalogData = async () => {
    try {
      const [igRes, itemRes, brandRes] = await Promise.all([
        ItemGroupServices.getActiveItemGroup(),
        ItemServices.getAllItem({ limit: 500 }),
        BrandServices.getActiveBrand(),
      ]);

      const igArr = Array.isArray(igRes) ? igRes : igRes?.itemGroups || igRes?.data || [];
      setItemGroups(igArr);

      const itemArr = Array.isArray(itemRes) ? itemRes : itemRes?.items || itemRes?.data || [];
      setAllItems(itemArr);

      const brandArr = Array.isArray(brandRes) ? brandRes : brandRes?.brands || brandRes?.data || [];
      setAllBrands(brandArr);
    } catch (err) {
      console.error("Failed to load catalog data:", err);
    }
  };

  const fetchLoyaltyPoints = async () => {
    setLoading(true);
    try {
      const res = await LoyaltyServices.getAllLoyaltyPoints({
        page,
        limit: resultsPerPage,
        search: debouncedSearch,
        groupType: groupType === "All" ? "" : groupType,
        hasPoints: hasPointsFilter,
        tierId: tierFilter,
      });
      setData(res?.data || []);
      setTotalResults(res?.total || 0);
    } catch (err) {
      console.error("Failed to fetch loyalty points:", err);
      notifyError(err?.message || "Failed to load customers & points");
    } finally {
      setLoading(false);
    }
  };

  const fetchConfig = async () => {
    try {
      const res = await LoyaltyServices.getConfig();
      if (res.data) setConfig(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const saveConfig = async () => {
    try {
      await LoyaltyServices.updateConfig(config);
      notifySuccess("Configuration saved successfully!");
    } catch (err) {
      console.error(err);
      notifyError(err.message || "Failed to save configuration");
    }
  };

  const fetchTiers = async () => {
    try {
      const res = await LoyaltyServices.getTiers();
      if (res.data) setTiers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateTier = async () => {
    if (!newTier.name) return;
    try {
      await LoyaltyServices.createTier(newTier);
      setNewTier({ name: "", purchasePrice: 0, discountPercentage: 0, validityDays: 365 });
      notifySuccess("Membership tier created successfully!");
      fetchTiers();
    } catch (err) {
      console.error(err);
      notifyError(err.message || "Failed to create tier");
    }
  };

  const handleOpenEditModal = (item) => {
    setSelectedCustomer(item);
    setModalMode("set");
    setModalPoints(item.totalPoints !== undefined ? item.totalPoints : 0);
    setModalReason("");
    setIsEditModalOpen(true);
  };

  const handleSaveModalPoints = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!selectedCustomer) return;

    const custId = selectedCustomer.customerId || selectedCustomer.customer?._id;
    const num = Number(modalPoints);
    if (isNaN(num) || num < 0) {
      notifyError("Please enter a valid non-negative number of points");
      return;
    }

    const currentPts = Number(selectedCustomer.totalPoints) || 0;
    if (modalMode === "redeem" && num > currentPts) {
      notifyError(`Cannot deduct more points than party's available balance (${currentPts} pts)`);
      return;
    }

    setIsSavingPoints(true);
    try {
      const res = await LoyaltyServices.adjustLoyaltyPoints({
        customerId: custId,
        points: num,
        type: modalMode,
        description: modalReason.trim() || undefined,
      });

      let newBalance = num;
      if (res?.data?.totalPoints !== undefined) {
        newBalance = res.data.totalPoints;
      } else if (modalMode === "set") {
        newBalance = num;
      } else if (modalMode === "earn") {
        newBalance = currentPts + num;
      } else if (modalMode === "redeem") {
        newBalance = Math.max(0, currentPts - num);
      }

      // Optimistic update in table
      setData((prev) =>
        prev.map((row) => {
          const rowCustId = row.customerId || row.customer?._id;
          if (rowCustId === custId) {
            return { ...row, totalPoints: newBalance, hasRecord: true };
          }
          return row;
        })
      );

      // Also update selectedCustomer
      setSelectedCustomer((prev) => prev ? { ...prev, totalPoints: newBalance, hasRecord: true } : null);

      notifySuccess(`Loyalty points successfully updated to ${newBalance.toLocaleString("en-IN")} pts!`);
      setIsEditModalOpen(false);
    } catch (err) {
      console.error(err);
      notifyError(err?.response?.data?.message || err?.message || "Failed to update points");
    } finally {
      setIsSavingPoints(false);
    }
  };

  const handleOpenHistoryModal = async (item) => {
    setSelectedCustomer(item);
    setIsHistoryModalOpen(true);
    setHistoryLoading(true);
    setHistoryData(null);
    try {
      const targetCustomerId = item.customerId || item.customer?._id;
      const res = await LoyaltyServices.getCustomerLoyaltyPoints(targetCustomerId);
      setHistoryData(res);
    } catch (err) {
      console.error(err);
      notifyError("Failed to load loyalty ledger history");
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleAssignTier = async (customerId, tierId) => {
    if (!tierId) {
      if (!window.confirm("Are you sure you want to remove the membership tier for this customer?")) return;
    }
    try {
      const res = await LoyaltyServices.assignTier({ customerId, tierId });
      notifySuccess(tierId ? "Tier assigned successfully!" : "Tier removed successfully!");

      const selectedTierObj = tiers.find((t) => t._id === tierId) || null;
      setData((prev) =>
        prev.map((row) => {
          const rowCustId = row.customerId || row.customer?._id;
          if (rowCustId === customerId) {
            return {
              ...row,
              customer: {
                ...row.customer,
                loyaltyTier: selectedTierObj,
                loyaltyTierExpiry: tierId ? res?.data?.loyaltyTierExpiry || new Date(Date.now() + 365 * 86400000).toISOString() : null,
              },
            };
          }
          return row;
        })
      );
    } catch (err) {
      console.error(err);
      notifyError(err.message || "Failed to assign tier");
    }
  };

  const handleDeleteTier = async (id) => {
    if (!window.confirm('Delete this tier? All customers assigned to it will lose their membership.')) return;
    try {
      await LoyaltyServices.deleteTier(id);
      notifySuccess("Tier deleted successfully!");
      fetchTiers();
    } catch (err) {
      console.error(err);
      notifyError(err.message || "Failed to delete tier");
    }
  };

  const handleSaveTier = async () => {
    if (!editingTier) return;
    try {
      await LoyaltyServices.updateTier(editingTier._id, {
        name: editingTier.name,
        purchasePrice: Number(editingTier.purchasePrice),
        discountPercentage: Number(editingTier.discountPercentage),
        validityDays: Number(editingTier.validityDays),
      });
      setEditingTier(null);
      notifySuccess("Membership tier updated successfully!");
      fetchTiers();
    } catch (err) {
      console.error(err);
      notifyError(err.message || "Failed to update tier");
    }
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Loyalty Program Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Configure loyalty rules, tiers, coupons &amp; redemption settings</p>
        </div>
      </div>

      {/* Modern Tab Navigation */}
      <div className="mb-6 overflow-x-auto">
        <div className="flex gap-2 min-w-max bg-gray-100 dark:bg-gray-800 rounded-xl p-1.5">
          {[
            { key: "customers", label: "Customers", icon: FiUsers },
            { key: "config",    label: "Global Config", icon: FiSettings },
            { key: "tiers",     label: "Tiers", icon: FiAward },
            { key: "itemGroup", label: "Item Group", icon: FiPackage },
            { key: "item",      label: "Items", icon: FiTag },
            { key: "sale",      label: "Sale Slabs", icon: FiShoppingCart },
            { key: "visit",     label: "Visit Rules", icon: FiCalendar },
            { key: "lumpsum",   label: "Lumpsum", icon: FiDollarSign },
            { key: "coupons",   label: "Coupons", icon: FiGift },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                activeTab === tab.key
                  ? "bg-white dark:bg-gray-700 shadow-sm font-semibold text-[var(--primary-color)]"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-white/50"
              }`}
              style={activeTab === tab.key ? { color: "var(--primary-color)" } : undefined}
            >
              <span className="text-base leading-none flex items-center"><tab.icon size={16} /></span>
              <span>{tab.label}</span>
              {activeTab === tab.key && (
                <span
                  className="ml-1 w-1.5 h-1.5 rounded-full inline-block"
                  style={{ backgroundColor: "var(--primary-color)" }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      <AnimatedContent>
        {activeTab === "customers" && (
          <div className="space-y-4 mb-8">
            {/* Search and Filters Bar */}
            <Card className="shadow-xs border border-gray-100 dark:border-gray-700">
              <CardBody className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                  {/* Search Bar */}
                  <div className="md:col-span-4">
                    <Label>
                      <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">Search Party / Customer</span>
                      <div className="relative mt-1">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400 z-10">
                          <FiSearch size={16} />
                        </span>
                        <Input
                          type="text"
                          value={search}
                          onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1);
                          }}
                          placeholder="Search name, code, phone, email..."
                          className="has-icon-left page-search-input !pl-10 !pr-8 w-full text-sm h-10"
                          style={{ paddingLeft: "2.6rem" }}
                        />
                        {search && (
                          <button
                            type="button"
                            onClick={() => {
                              setSearch("");
                              setPage(1);
                            }}
                            className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-400 hover:text-gray-600"
                          >
                            <FiX size={15} />
                          </button>
                        )}
                      </div>
                    </Label>
                  </div>

                  {/* Party Type Filter */}
                  <div className="md:col-span-2">
                    <Label>
                      <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">Party Type</span>
                      <Select
                        className="mt-1 text-sm"
                        value={groupType}
                        onChange={(e) => {
                          setGroupType(e.target.value);
                          setPage(1);
                        }}
                      >
                        <option value="All">All Parties</option>
                        <option value="Customer">Customer</option>
                        <option value="Vendor">Vendor</option>
                        <option value="Other">Other</option>
                      </Select>
                    </Label>
                  </div>

                  {/* Points Filter */}
                  <div className="md:col-span-2">
                    <Label>
                      <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">Points Balance</span>
                      <Select
                        className="mt-1 text-sm"
                        value={hasPointsFilter}
                        onChange={(e) => {
                          setHasPointsFilter(e.target.value);
                          setPage(1);
                        }}
                      >
                        <option value="all">All Records</option>
                        <option value="yes">With Points (&gt; 0)</option>
                        <option value="no">Zero Points (0 pts)</option>
                      </Select>
                    </Label>
                  </div>

                  {/* Tier Filter */}
                  <div className="md:col-span-3">
                    <Label>
                      <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">Membership Tier</span>
                      <Select
                        className="mt-1 text-sm"
                        value={tierFilter}
                        onChange={(e) => {
                          setTierFilter(e.target.value);
                          setPage(1);
                        }}
                      >
                        <option value="all">All Tiers</option>
                        <option value="none">No Tier Assigned</option>
                        {tiers.map((t) => (
                          <option key={t._id} value={t._id}>
                            {t.name}
                          </option>
                        ))}
                      </Select>
                    </Label>
                  </div>

                  {/* Refresh / Reset Action */}
                  <div className="md:col-span-1 flex items-center gap-1">
                    <Button
                      layout="outline"
                      size="small"
                      onClick={() => fetchLoyaltyPoints()}
                      className="w-full flex items-center justify-center h-10"
                      title="Refresh list"
                    >
                      <FiRefreshCw size={15} className={loading ? "animate-spin text-purple-600" : ""} />
                    </Button>
                  </div>
                </div>

                {/* Sub-bar: Count & Summary */}
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex flex-wrap items-center justify-between text-xs text-gray-500 dark:text-gray-400 gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-700 dark:text-gray-200">
                      Total Parties: {totalResults.toLocaleString("en-IN")}
                    </span>
                    {(search || groupType !== "All" || hasPointsFilter !== "all" || tierFilter !== "all") && (
                      <span className="bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full font-medium">
                        Filtered Active
                      </span>
                    )}
                  </div>
                  <div>
                    <span>
                      Page {page} of {Math.ceil(totalResults / resultsPerPage) || 1}
                    </span>
                    <span className="ml-2 text-gray-400">({resultsPerPage} parties per page)</span>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Customers & Points Table */}
            <TableContainer className="rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
              {loading ? (
                <TableLoading row={8} col={6} width={180} height={20} />
              ) : data.length === 0 ? (
                <NotFound title="No parties found matching your search or filter criteria." />
              ) : (
                <Table>
                  <TableHeader>
                    <tr>
                      <TableCell>Party / Customer</TableCell>
                      <TableCell>Contact Details</TableCell>
                      <TableCell>Total Points</TableCell>
                      <TableCell>Current Tier</TableCell>
                      <TableCell>Assign Tier</TableCell>
                      <TableCell className="text-right">Actions</TableCell>
                    </tr>
                  </TableHeader>
                  <tbody className="bg-white divide-y dark:divide-gray-700 dark:bg-gray-800">
                    {data.map((item) => {
                      const customer = item.customer || {};
                      const custId = item.customerId || customer._id;
                      const custName = customer.name || customer.print_name || "Unnamed Party";
                      const group = customer.group_type || "Customer";
                      const currentPoints = item.totalPoints || 0;
                      const rsEquivalent = (currentPoints * (Number(config.pointValueInRs) || 0.8)).toFixed(2);
                      const isExpired = customer.loyaltyTierExpiry && new Date(customer.loyaltyTierExpiry) < new Date();
                      return (
                        <TableRow key={item._id || custId} className="hover:bg-gray-50/60 dark:hover:bg-gray-750 transition-colors">
                          {/* Party / Customer Name */}
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                                {custName}
                              </span>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                {customer.code && (
                                  <span className="text-[11px] font-mono text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.2 rounded">
                                    {customer.code}
                                  </span>
                                )}
                                <span
                                  className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded tracking-wider ${
                                    group === "Customer"
                                      ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                                      : group === "Vendor"
                                      ? "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                                      : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                                  }`}
                                >
                                  {group}
                                </span>
                              </div>
                            </div>
                          </TableCell>

                          {/* Contact Info */}
                          <TableCell>
                            <div className="flex flex-col text-xs text-gray-600 dark:text-gray-300 space-y-0.5">
                              {customer.mobile ? (
                                <span className="flex items-center gap-1 font-mono">
                                  <FiPhone size={11} className="text-gray-400" /> {customer.mobile}
                                </span>
                              ) : null}
                              {customer.email ? (
                                <span className="flex items-center gap-1 truncate max-w-[200px]" title={customer.email}>
                                  <FiMail size={11} className="text-gray-400" /> {customer.email}
                                </span>
                              ) : null}
                              {!customer.mobile && !customer.email && (
                                <span className="text-gray-400 italic">No contact info</span>
                              )}
                            </div>
                          </TableCell>

                          {/* Total Points */}
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="inline-flex items-center gap-1 text-sm font-bold font-mono px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 w-fit">
                                <FiAward size={13} className="text-emerald-600 dark:text-emerald-400" />
                                {currentPoints.toLocaleString("en-IN")} pts
                              </span>
                              <span className="text-[11px] text-gray-400 mt-0.5">
                                ≈ ₹{rsEquivalent}
                              </span>
                            </div>
                          </TableCell>

                          {/* Current Tier */}
                          <TableCell>
                            {customer.loyaltyTier ? (
                              <div className="flex flex-col">
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 w-fit">
                                  {customer.loyaltyTier?.name || "Active Tier"}
                                </span>
                                {customer.loyaltyTierExpiry && (
                                  <p
                                    className={`text-[11px] mt-1 flex items-center gap-1 ${
                                      isExpired ? "text-red-500 font-semibold" : "text-gray-400"
                                    }`}
                                  >
                                    {isExpired ? <FiAlertCircle size={11} className="text-red-500" /> : null}
                                    {isExpired ? "Expired: " : "Expires: "}
                                    {new Date(customer.loyaltyTierExpiry).toLocaleDateString("en-IN")}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400 italic">None</span>
                            )}
                          </TableCell>

                          {/* Assign Tier */}
                          <TableCell>
                            <Select
                              className="text-xs py-1 h-8 max-w-[170px]"
                              value={customer.loyaltyTier?._id || customer.loyaltyTier || ""}
                              onChange={(e) => handleAssignTier(customer._id, e.target.value)}
                            >
                              <option value="">None / Remove Tier</option>
                              {tiers.map((t) => (
                                <option key={t._id} value={t._id}>
                                  {t.name}
                                </option>
                              ))}
                            </Select>
                          </TableCell>

                          {/* Actions */}
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Edit Points Button (Opens Dedicated MCA-Level Modal Window) */}
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(item)}
                                className="p-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 transition-all flex items-center gap-1 text-xs font-semibold hover:shadow-xs active:scale-95"
                                title="Edit / Adjust Points in Dedicated Window"
                              >
                                <FiEdit3 size={13} className="text-emerald-600 dark:text-emerald-400" />
                                <span>Edit Points</span>
                              </button>

                              {/* Ledger History Button */}
                              <button
                                type="button"
                                onClick={() => handleOpenHistoryModal(item)}
                                className="p-2 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 transition-all flex items-center gap-1 text-xs font-semibold hover:shadow-xs active:scale-95"
                                title="View Points Ledger History"
                              >
                                <FiClock size={13} className="text-blue-600 dark:text-blue-400" />
                                <span>History</span>
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </tbody>
                </Table>
              )}

              {totalResults > resultsPerPage && (
                <TableFooter>
                  <Pagination
                    totalResults={totalResults}
                    resultsPerPage={resultsPerPage}
                    onChange={(p) => setPage(p)}
                    label="Customer Loyalty navigation"
                  />
                </TableFooter>
              )}
            </TableContainer>
          </div>
        )}


        {activeTab === "config" && (
          <Card className="mb-8 shadow-md">
            <CardBody>
              <h2 className="mb-4 text-lg font-semibold text-gray-600 dark:text-gray-300">Global Configuration</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Label>
                  <span>1 Point Value in Rs</span>
                  <Input type="number" className="mt-1" value={config.pointValueInRs} onChange={(e) => setConfig({...config, pointValueInRs: e.target.value})} />
                </Label>
                <Label>
                  <span>Consider GST</span>
                  <Select className="mt-1" value={config.considerGST} onChange={(e) => setConfig({...config, considerGST: e.target.value === 'true'})}>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </Select>
                </Label>
                <Label>
                  <span>Point Calculation On</span>
                  <Select className="mt-1" value={config.pointCalculationOn} onChange={(e) => setConfig({...config, pointCalculationOn: e.target.value})}>
                    <option value="current_invoice">Current Invoice</option>
                    <option value="sale_invoice">Sale Invoice</option>
                  </Select>
                </Label>
                <Label>
                  <span>Min Invoice Amount to Redeem</span>
                  <Input type="number" className="mt-1" value={config.minInvoiceAmountToRedeem} onChange={(e) => setConfig({...config, minInvoiceAmountToRedeem: e.target.value})} />
                </Label>
                
                {/* Advanced Rule Behavior */}
                <div className="md:col-span-2 mt-4">
                  <h3 className="mb-2 text-md font-semibold text-gray-600 dark:text-gray-300">Rule Engine Behavior</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Label>
                      <span>If multiple rules match an invoice:</span>
                      <Select className="mt-1" value={config.pointsMode || 'priority'} onChange={(e) => setConfig({...config, pointsMode: e.target.value})}>
                        <option value="additive">Additive (Combine points from all rules)</option>
                        <option value="priority">Highest Priority (Only apply the single rule giving max points)</option>
                      </Select>
                    </Label>
                  </div>
                </div>

                <div className="md:col-span-2 mt-2">
                  <h3 className="mb-2 text-md font-semibold text-gray-600 dark:text-gray-300">Enable / Disable Earning Modes</h3>
                  <div className="flex flex-wrap gap-4">
                    <Label check>
                      <Input type="checkbox" checked={config.enabledModes?.pointWise ?? true} onChange={(e) => setConfig({...config, enabledModes: {...config.enabledModes, pointWise: e.target.checked}})} />
                      <span className="ml-2">Point Wise (Item/Group)</span>
                    </Label>
                    <Label check>
                      <Input type="checkbox" checked={config.enabledModes?.saleWise ?? true} onChange={(e) => setConfig({...config, enabledModes: {...config.enabledModes, saleWise: e.target.checked}})} />
                      <span className="ml-2">Sale Wise Slabs</span>
                    </Label>
                    <Label check>
                      <Input type="checkbox" checked={config.enabledModes?.visitWise ?? true} onChange={(e) => setConfig({...config, enabledModes: {...config.enabledModes, visitWise: e.target.checked}})} />
                      <span className="ml-2">Visit Wise Slabs</span>
                    </Label>
                    <Label check>
                      <Input type="checkbox" checked={config.enabledModes?.lumpsum ?? true} onChange={(e) => setConfig({...config, enabledModes: {...config.enabledModes, lumpsum: e.target.checked}})} />
                      <span className="ml-2">Lumpsum (Total Sale)</span>
                    </Label>
                  </div>
                </div>
              </div>
              <div className="mt-6">
                <Button onClick={saveConfig}>Save Configuration</Button>
              </div>
            </CardBody>
          </Card>
        )}

        {activeTab === "tiers" && (
          <Card className="mb-8 shadow-md">
            <CardBody>
              <h2 className="mb-2 text-lg font-semibold text-gray-600 dark:text-gray-300">Membership Tiers</h2>
              <p className="text-sm text-gray-400 mb-4">Configure each membership plan: name, purchase price, discount %, and validity period in days.</p>
              
              {/* Add New Tier */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-3 flex items-center gap-1.5"><FiPlusCircle size={14} /> Add New Tier</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Label>
                    <span className="text-xs">Tier Name</span>
                    <Input placeholder="e.g. Silver" value={newTier.name} onChange={(e) => setNewTier({...newTier, name: e.target.value})} className="mt-1" />
                  </Label>
                  <Label>
                    <span className="text-xs">Purchase Price (₹)</span>
                    <Input type="number" placeholder="e.g. 500" value={newTier.purchasePrice} onChange={(e) => setNewTier({...newTier, purchasePrice: e.target.value})} className="mt-1" />
                  </Label>
                  <Label>
                    <span className="text-xs">Discount (%)</span>
                    <Input type="number" placeholder="e.g. 10" value={newTier.discountPercentage} onChange={(e) => setNewTier({...newTier, discountPercentage: e.target.value})} className="mt-1" />
                  </Label>
                  <Label>
                    <span className="text-xs">Validity (Days)</span>
                    <Input type="number" placeholder="e.g. 365" value={newTier.validityDays} onChange={(e) => setNewTier({...newTier, validityDays: e.target.value})} className="mt-1" />
                  </Label>
                </div>
                <div className="mt-3">
                  <Button onClick={handleCreateTier}>Add Tier</Button>
                </div>
              </div>

              {/* Tiers Table with Inline Edit */}
              <TableContainer>
                <Table>
                  <TableHeader>
                    <tr>
                      <TableCell>Tier Name</TableCell>
                      <TableCell>Purchase Price (₹)</TableCell>
                      <TableCell>Discount (%)</TableCell>
                      <TableCell>Validity (Days)</TableCell>
                      <TableCell>Actions</TableCell>
                    </tr>
                  </TableHeader>
                  <tbody className="bg-white divide-y dark:divide-gray-700 dark:bg-gray-800">
                    {tiers?.map((t) => {
                      const isEditing = editingTier?._id === t._id;
                      return (
                        <TableRow key={t._id}>
                          <TableCell>
                            {isEditing ? (
                              <Input value={editingTier.name} onChange={(e) => setEditingTier({...editingTier, name: e.target.value})} />
                            ) : (
                              <span className="text-sm font-semibold">{t.name}</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {isEditing ? (
                              <Input type="number" value={editingTier.purchasePrice} onChange={(e) => setEditingTier({...editingTier, purchasePrice: e.target.value})} />
                            ) : (
                              <span className="text-sm">₹{t.purchasePrice}</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {isEditing ? (
                              <Input type="number" value={editingTier.discountPercentage} onChange={(e) => setEditingTier({...editingTier, discountPercentage: e.target.value})} />
                            ) : (
                              <span className="text-sm">{t.discountPercentage}%</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {isEditing ? (
                              <Input type="number" value={editingTier.validityDays} onChange={(e) => setEditingTier({...editingTier, validityDays: e.target.value})} />
                            ) : (
                              <span className="text-sm">{t.validityDays} days</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              {isEditing ? (
                                <>
                                  <Button size="small" onClick={handleSaveTier}>Save</Button>
                                  <Button size="small" layout="outline" onClick={() => setEditingTier(null)}>Cancel</Button>
                                </>
                              ) : (
                                <>
                                  <Button size="small" layout="outline" onClick={() => setEditingTier({ ...t })}>Edit</Button>
                                  <Button size="small" layout="outline" onClick={() => handleDeleteTier(t._id)}>Delete</Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </tbody>
                </Table>
              </TableContainer>
            </CardBody>
          </Card>
        )}

        {activeTab === "itemGroup" && (
          <ItemGroupRulesTab itemGroups={itemGroups} />
        )}

        {activeTab === "item" && (
          <ItemRulesTab items={allItems} />
        )}

        {activeTab === "sale" && (
          <SaleRulesTab tiers={tiers} items={allItems} />
        )}

        {activeTab === "visit" && (
          <VisitRulesTab tiers={tiers} />
        )}

        {activeTab === "lumpsum" && (
          <LumpsumRulesTab tiers={tiers} />
        )}

        {activeTab === "coupons" && (
          <CouponTemplatesTab items={allItems} brands={allBrands} />
        )}

      </AnimatedContent>



      {/* ========================================================= */}
      {/* 1. SIMPLE LOYALTY POINTS EDIT MODAL                       */}
      {/* ========================================================= */}
      {isEditModalOpen && selectedCustomer && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => !isSavingPoints && setIsEditModalOpen(false)}
          className="max-w-md w-full"
        >
          <ModalHeader onClose={() => !isSavingPoints && setIsEditModalOpen(false)}>
            <div className="flex flex-col">
              <span className="text-base font-bold text-gray-800 dark:text-gray-100 flex items-center gap-1.5">
                <FiEdit3 className="text-purple-600" size={16} /> Edit Loyalty Points
              </span>
              <span className="text-xs text-gray-500 font-normal mt-0.5">
                Party: <strong className="text-gray-700 dark:text-gray-300">{selectedCustomer.customer?.name || "Customer"}</strong>
                {selectedCustomer.customer?.code && ` (${selectedCustomer.customer.code})`}
              </span>
            </div>
          </ModalHeader>

          <ModalBody className="custom-modal px-6 py-4">
            <form id="points-adjust-form" onSubmit={handleSaveModalPoints} className="space-y-4">
              {/* Current Balance Bar */}
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-between text-xs">
                <span className="text-gray-500 dark:text-gray-400 font-medium">Current Points Balance:</span>
                <span className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
                  {(Number(selectedCustomer.totalPoints) || 0).toLocaleString("en-IN")} pts
                </span>
              </div>

              {/* Action Type */}
              <Label>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Action</span>
                <Select
                  className="mt-1 text-sm"
                  value={modalMode}
                  onChange={(e) => setModalMode(e.target.value)}
                >
                  <option value="set">Set Total Balance</option>
                  <option value="earn">Add Points (+)</option>
                  <option value="redeem">Deduct Points (-)</option>
                </Select>
              </Label>

              {/* Points Input */}
              <Label>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  {modalMode === "set"
                    ? "New Total Points"
                    : modalMode === "earn"
                    ? "Points to Add"
                    : "Points to Deduct"}
                </span>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={modalPoints}
                  onChange={(e) => setModalPoints(e.target.value)}
                  placeholder="Enter points"
                  className="mt-1 text-sm font-semibold font-mono"
                  autoFocus
                />
              </Label>

              {/* Remarks / Reason */}
              <Label>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Reason / Remarks (Optional)
                </span>
                <Input
                  type="text"
                  value={modalReason}
                  onChange={(e) => setModalReason(e.target.value)}
                  placeholder="e.g. Bonus, correction, settlement"
                  className="mt-1 text-sm"
                />
              </Label>
            </form>
          </ModalBody>

          <ModalFooter>
            <Button
              layout="outline"
              size="small"
              onClick={() => setIsEditModalOpen(false)}
              disabled={isSavingPoints}
            >
              Cancel
            </Button>
            <Button
              size="small"
              type="submit"
              form="points-adjust-form"
              disabled={
                isSavingPoints ||
                modalPoints === "" ||
                isNaN(Number(modalPoints)) ||
                Number(modalPoints) < 0 ||
                (modalMode === "redeem" && Number(modalPoints) > (Number(selectedCustomer.totalPoints) || 0))
              }
              className="flex items-center gap-1.5"
            >
              {isSavingPoints ? (
                <>
                  <FiRefreshCw size={13} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <FiCheck size={14} />
                  <span>Save Points</span>
                </>
              )}
            </Button>
          </ModalFooter>
        </Modal>
      )}

      {/* ========================================================= */}
      {/* 2. LOYALTY POINTS HISTORY (LEDGER) MODAL                   */}
      {/* ========================================================= */}
      {isHistoryModalOpen && selectedCustomer && (
        <Modal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} className="max-w-2xl">
          <ModalHeader onClose={() => setIsHistoryModalOpen(false)}>
            <div className="flex flex-col">
              <span className="text-base font-bold text-gray-800 dark:text-gray-100 flex items-center gap-1.5">
                <FiClock size={16} className="text-purple-600" /> Points Transaction History
              </span>
              <span className="text-xs text-gray-500 font-normal mt-0.5">
                Party: <strong className="text-gray-700 dark:text-gray-300">{selectedCustomer.customer?.name}</strong>
                {selectedCustomer.customer?.code && ` (${selectedCustomer.customer.code})`}
              </span>
            </div>
          </ModalHeader>

          <ModalBody>
            <div className="space-y-4 py-1">
              {/* Top Summary Banner */}
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-400 block">Current Balance</span>
                  <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                    {(selectedCustomer.totalPoints || 0).toLocaleString("en-IN")} pts
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-400 block">Total Ledger Entries</span>
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-300 font-mono">
                    {historyData?.transactions?.length || 0} Records
                  </span>
                </div>
              </div>

              {/* Transactions List */}
              {historyLoading ? (
                <div className="py-12 flex flex-col items-center justify-center text-gray-400 space-y-2">
                  <FiRefreshCw size={24} className="animate-spin text-purple-600" />
                  <span className="text-xs">Loading loyalty transaction ledger...</span>
                </div>
              ) : !historyData?.transactions || historyData.transactions.length === 0 ? (
                <div className="py-12 text-center text-gray-400 space-y-1">
                  <FiAward size={32} className="mx-auto text-gray-300 dark:text-gray-600" />
                  <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">No point transactions yet</p>
                  <p className="text-xs">This party has not earned or redeemed points through invoices or manual adjustment yet.</p>
                </div>
              ) : (
                <div className="max-h-[360px] overflow-y-auto rounded-lg border border-gray-100 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
                  {historyData.transactions.map((tx, idx) => {
                    const earned = Number(tx.pointsEarned) || 0;
                    const redeemed = Number(tx.pointsRedeemed) || 0;
                    const rawPts = Number(tx.points) || 0;
                    const isCredit = earned > 0 || tx.type === "earn" || tx.type === "earned" || rawPts > 0;
                    const ptsValue = earned > 0 ? earned : (redeemed > 0 ? redeemed : Math.abs(rawPts));

                    const dateStr = tx.date || tx.createdAt ? new Date(tx.date || tx.createdAt).toLocaleString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    }) : "N/A";

                    return (
                      <div key={tx._id || idx} className="p-3 hover:bg-gray-50/80 dark:hover:bg-gray-750 transition-colors flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-start gap-2.5">
                          <span
                            className={`p-1.5 rounded-full mt-0.5 ${
                              isCredit
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                                : "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400"
                            }`}
                          >
                            {isCredit ? <FiArrowDownLeft size={12} /> : <FiArrowUpRight size={12} />}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-800 dark:text-gray-200 capitalize">
                                {isCredit ? "Points Earned / Added" : "Points Redeemed / Deducted"}
                              </span>
                              {tx.orderId && (
                                <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-1.5 py-0.2 rounded font-mono text-[10px]">
                                  Ref #{tx.orderId}
                                </span>
                              )}
                            </div>
                            <p className="text-gray-500 dark:text-gray-400 mt-0.5 text-[11px]">
                              {tx.description || tx.reason || (isCredit ? "Points added" : "Points redeemed")}
                            </p>
                            <span className="text-[10px] text-gray-400 mt-0.5 block">
                              {dateStr}
                            </span>
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <span
                            className={`text-sm font-bold font-mono block ${
                              isCredit
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-rose-600 dark:text-rose-400"
                            }`}
                          >
                            {isCredit ? `+${ptsValue}` : `-${ptsValue}`} pts
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </ModalBody>

          <ModalFooter>
            <Button
              layout="outline"
              size="small"
              onClick={() => setIsHistoryModalOpen(false)}
            >
              Close
            </Button>
            <Button
              size="small"
              onClick={() => {
                const target = selectedCustomer;
                setIsHistoryModalOpen(false);
                if (target) {
                  handleOpenEditModal(target);
                }
              }}
              className="flex items-center gap-1.5"
            >
              <FiEdit3 size={13} />
              <span>Adjust Points</span>
            </Button>
          </ModalFooter>
        </Modal>
      )}
    </>
  );
};

export default LoyaltyPoints;
