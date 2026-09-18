import React, { useState, useEffect } from "react";
import { FiUsers, FiSettings, FiAward, FiPackage, FiTag, FiShoppingCart, FiCalendar, FiDollarSign, FiGift, FiPlusCircle, FiAlertCircle } from "react-icons/fi";
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
  Select
} from "@windmill/react-ui";
import PageTitle from "@/components/Typography/PageTitle";
import AnimatedContent from "@/components/common/AnimatedContent";
import LoyaltyServices from "@/services/LoyaltyServices";
import ItemGroupServices from "@/services/ItemGroupServices";
import ItemServices from "@/services/ItemServices";
import BrandServices from "@/services/BrandServices";
import {
  ItemGroupRulesTab,
  ItemRulesTab,
  SaleRulesTab,
  VisitRulesTab,
  LumpsumRulesTab,
  CouponTemplatesTab
} from "@/components/loyalty/LoyaltyRulesTabs";
import { notifySuccess, notifyError } from "@/utils/toast";

const LoyaltyPoints = () => {
  const [activeTab, setActiveTab] = useState("customers");
  
  // States for Customers
  const [data, setData] = useState([]);
  const [totalResults, setTotalResults] = useState(0);
  const [page, setPage] = useState(1);
  const resultsPerPage = 20;

  // States for Config
  const [config, setConfig] = useState({
    pointValueInRs: 0.8,
    considerGST: true,
    pointCalculationOn: 'current_invoice',
    minInvoiceAmountToRedeem: 0,
    minPointToRedeem: 0,
    pointsMode: 'priority',
    enabledModes: {
      pointWise: true,
      saleWise: true,
      visitWise: true,
      lumpsum: true
    }
  });

  // States for Tiers
  const [tiers, setTiers] = useState([]);
  const [newTier, setNewTier] = useState({ name: "", purchasePrice: 0, discountPercentage: 0, validityDays: 365 });
  const [editingTier, setEditingTier] = useState(null);

  // States for dropdowns (items, brands, item groups)
  const [itemGroups, setItemGroups] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [allBrands, setAllBrands] = useState([]);

  useEffect(() => {
    // Always load tiers + catalog data — needed across tabs
    fetchTiers();
    fetchCatalogData();
    if (activeTab === "customers") fetchLoyaltyPoints();
    if (activeTab === "config") fetchConfig();
  }, [activeTab, page]);

  const fetchCatalogData = async () => {
    try {
      const [igRes, itemRes, brandRes] = await Promise.all([
        ItemGroupServices.getActiveItemGroup(),
        ItemServices.getAllItem({ limit: 500 }),
        BrandServices.getActiveBrand()
      ]);

      // Item Groups — API returns array directly or { itemGroups: [] }
      const igArr = Array.isArray(igRes)
        ? igRes
        : (igRes?.itemGroups || igRes?.data || []);
      setItemGroups(igArr);

      // Items — getAllItem wraps in { items: [] }
      const itemArr = Array.isArray(itemRes)
        ? itemRes
        : (itemRes?.items || itemRes?.data || []);
      setAllItems(itemArr);

      // Brands — getActiveBrand returns array or { brands: [] } or { data: [] }
      const brandArr = Array.isArray(brandRes)
        ? brandRes
        : (brandRes?.brands || brandRes?.data || []);
      setAllBrands(brandArr);

    } catch (err) {
      console.error("Failed to load catalog data:", err);
    }
  };

  const fetchLoyaltyPoints = async () => {
    try {
      const res = await LoyaltyServices.getAllLoyaltyPoints(page, resultsPerPage);
      setData(res.data);
      setTotalResults(res.total);
    } catch (err) {
      console.error(err);
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

  const handleAssignTier = async (customerId, tierId) => {
    if (!tierId) {
      if (!window.confirm('Are you sure you want to remove the membership tier for this customer?')) return;
    }
    try {
      await LoyaltyServices.assignTier({ customerId, tierId });
      notifySuccess(tierId ? "Tier assigned successfully!" : "Tier removed successfully!");
      // Refresh the customer list so current tier shows immediately
      fetchLoyaltyPoints();
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
                  ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm font-semibold"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-white/50"
              }`}
            >
              <span className="text-base leading-none flex items-center"><tab.icon size={16} /></span>
              <span>{tab.label}</span>
              {activeTab === tab.key && (
                <span className="ml-1 w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
              )}
            </button>
          ))}
        </div>
      </div>

      <AnimatedContent>
        {activeTab === "customers" && (
          <TableContainer className="mb-8 rounded-b-lg">
            <Table>
              <TableHeader>
                <tr>
                  <TableCell>Customer Name</TableCell>
                  <TableCell>Email / Mobile</TableCell>
                  <TableCell>Total Points</TableCell>
                  <TableCell>Current Tier</TableCell>
                  <TableCell>Assign Tier</TableCell>
                </tr>
              </TableHeader>
              <tbody className="bg-white divide-y dark:divide-gray-700 dark:bg-gray-800">
                {data?.map((item) => (
                  <TableRow key={item._id}>
                    <TableCell><span className="text-sm">{item.customer?.name}</span></TableCell>
                    <TableCell><span className="text-sm">{item.customer?.email || item.customer?.mobile}</span></TableCell>
                    <TableCell><span className="text-sm font-semibold text-green-600">{item.totalPoints}</span></TableCell>
                    <TableCell>
                      {item.customer?.loyaltyTier ? (
                        <div>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
                            {item.customer.loyaltyTier?.name || item.customer.loyaltyTier}
                          </span>
                            <p className={`text-xs mt-1 flex items-center gap-1 ${new Date(item.customer.loyaltyTierExpiry) < new Date() ? 'text-red-500' : 'text-gray-400'}`}>
                              {new Date(item.customer.loyaltyTierExpiry) < new Date() ? <FiAlertCircle size={12} className="text-red-500" /> : null}
                              {new Date(item.customer.loyaltyTierExpiry) < new Date() ? 'Expired: ' : 'Expires: '}
                              {new Date(item.customer.loyaltyTierExpiry).toLocaleDateString('en-IN')}
                            </p>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">None</span>
                      )}
                    </TableCell>
                     <TableCell>
                       <Select 
                         className="mt-1" 
                         value={item.customer?.loyaltyTier?._id || item.customer?.loyaltyTier || ''} 
                         onChange={(e) => handleAssignTier(item.customer?._id, e.target.value)}
                       >
                         <option value="">None / Remove Tier</option>
                         {tiers.map(t => (
                           <option key={t._id} value={t._id}>{t.name}</option>
                         ))}
                       </Select>
                     </TableCell>
                  </TableRow>
                ))}
              </tbody>
            </Table>
            <TableFooter>
              <Pagination totalResults={totalResults} resultsPerPage={resultsPerPage} onChange={setPage} label="Table navigation" />
            </TableFooter>
          </TableContainer>
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
    </>
  );
};

export default LoyaltyPoints;
