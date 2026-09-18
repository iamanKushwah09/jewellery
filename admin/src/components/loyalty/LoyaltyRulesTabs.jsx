import React, { useState, useEffect } from "react";
import {
  Table, TableCell, TableContainer, TableHeader, TableRow,
  Button, Input, Label, Select
} from "@windmill/react-ui";
import {
  FiPackage,
  FiTag,
  FiShoppingCart,
  FiCalendar,
  FiDollarSign,
  FiGift,
  FiEdit2,
  FiPlusCircle,
  FiInbox,
  FiChevronDown
} from "react-icons/fi";
import LoyaltyServices from "@/services/LoyaltyServices";
import { notifySuccess, notifyError } from "@/utils/toast";

// ──── Shared UI components ────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0">
        {typeof Icon === 'function' ? <Icon size={20} /> : Icon}
      </div>
      <div>
        <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">{title}</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}

function FormPanel({ title, children, onSave, onCancel, isEditing }) {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-700 border border-blue-100 dark:border-gray-600 rounded-xl p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
          {isEditing ? <FiEdit2 size={15} className="text-blue-600 dark:text-blue-400" /> : <FiPlusCircle size={15} className="text-blue-600 dark:text-blue-400" />}
          <span>{title}</span>
        </h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {children}
      </div>
      <div className="mt-4 flex gap-2">
        <button
          onClick={onSave}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {isEditing ? "Update Rule" : "Add Rule"}
        </button>
        {isEditing && (
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 text-gray-700 dark:text-gray-200 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

function FieldLabel({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">{label}</label>
      {children}
    </div>
  );
}

function StyledInput({ ...props }) {
  return (
    <input
      {...props}
      className="w-full h-10 px-3 text-sm border border-gray-200 dark:border-gray-500 rounded-lg bg-white dark:bg-gray-600 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
    />
  );
}

function StyledSelect({ children, ...props }) {
  return (
    <select
      {...props}
      className="w-full h-10 px-3 text-sm border border-gray-200 dark:border-gray-500 rounded-lg bg-white dark:bg-gray-600 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
    >
      {children}
    </select>
  );
}

function Badge({ children, color = "blue" }) {
  const colors = {
    blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    green: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
    purple: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
    gray: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400",
    orange: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${colors[color]}`}>
      {children}
    </span>
  );
}

function EmptyState({ message }) {
  return (
    <tr>
      <td colSpan="10" className="py-12 text-center">
        <div className="flex justify-center mb-3 text-gray-400">
          <FiInbox size={38} />
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
      </td>
    </tr>
  );
}

function DropdownCheckboxList({ 
  options = [], 
  selectedIds = [], 
  onChange, 
  placeholder,
  isAllSelected = false,
  onAllSelectedChange
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = React.useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClose = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClose);
    return () => document.removeEventListener("mousedown", handleClose);
  }, [isOpen]);

  const handleToggleSelectAll = (checked) => {
    if (checked) {
      onChange(options.map(opt => opt._id));
      if (onAllSelectedChange) onAllSelectedChange(true);
    } else {
      onChange([]);
      if (onAllSelectedChange) onAllSelectedChange(false);
    }
  };

  const handleToggleOption = (id, checked) => {
    let nextIds;
    if (checked) {
      nextIds = [...selectedIds, id];
    } else {
      nextIds = selectedIds.filter(x => x !== id);
    }
    onChange(nextIds);
    
    if (nextIds.length === options.length && options.length > 0) {
      if (onAllSelectedChange) onAllSelectedChange(true);
    } else {
      if (onAllSelectedChange) onAllSelectedChange(false);
    }
  };

  const displayLabel = isAllSelected 
    ? "All Selected" 
    : selectedIds.length === 0 
      ? placeholder 
      : `${selectedIds.length} selected`;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-10 px-3 text-left text-sm border border-gray-200 dark:border-gray-500 rounded-lg bg-white dark:bg-gray-600 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 transition flex items-center justify-between"
      >
        <span className="truncate">{displayLabel}</span>
        <FiChevronDown size={14} className="text-gray-400 ml-1 flex-shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-500 rounded-lg p-2 bg-white dark:bg-gray-700 shadow-lg space-y-1">
          {options.length > 0 && (
            <div 
              className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-600 p-1.5 rounded transition-colors border-b border-gray-100 dark:border-gray-600 pb-2 mb-1"
              onClick={(e) => {
                e.preventDefault();
                handleToggleSelectAll(!isAllSelected);
              }}
            >
              <input
                type="checkbox"
                checked={isAllSelected}
                readOnly
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 pointer-events-none"
              />
              <span className="select-none">Select All</span>
            </div>
          )}

          {options.map(opt => {
            const isChecked = isAllSelected || selectedIds.includes(opt._id);
            return (
              <div 
                key={opt._id} 
                className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 p-1.5 rounded transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  handleToggleOption(opt._id, !isChecked);
                }}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  readOnly
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 pointer-events-none"
                />
                <span className="truncate select-none">{opt.name}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ActionButtons({ onEdit, onDelete }) {
  return (
    <div className="flex gap-1.5">
      <button onClick={onEdit} className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors" title="Edit">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6-6m2 2l-6 6H9v-2l6-6z" /></svg>
      </button>
      <button onClick={onDelete} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors" title="Delete">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
      </button>
    </div>
  );
}

function RuleCard({ children }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
      {children}
    </div>
  );
}

function TableHead({ cols }) {
  return (
    <thead>
      <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
        {cols.map((c, i) => (
          <th key={i} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {c}
          </th>
        ))}
      </tr>
    </thead>
  );
}

function TableRowStyled({ children }) {
  return (
    <tr className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
      {children}
    </tr>
  );
}

function TD({ children }) {
  return <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{children}</td>;
}


// ──── Item Group Rules Tab ────────────────────────────────────────────────────
export function ItemGroupRulesTab({ itemGroups = [] }) {
  const [rules, setRules] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const blankForm = { itemGroupId: "", itemGroupIds: [], isAllItemGroups: false, calcType: "percentage", pointsValue: 0, expDays: 0 };
  const [form, setForm] = useState(blankForm);

  useEffect(() => { fetchRules(); }, []);

  const fetchRules = async () => {
    try { const res = await LoyaltyServices.getItemGroupRules(); setRules(res.data || []); }
    catch (e) { console.error(e); }
  };

  const handleSave = async () => {
    try {
      const payload = { ...form };
      if (!payload.itemGroupId) delete payload.itemGroupId;

      if (editingId) {
        await LoyaltyServices.updateItemGroupRule(editingId, payload);
        notifySuccess("Item Group rule updated successfully!");
      } else {
        await LoyaltyServices.createItemGroupRule(payload);
        notifySuccess("Item Group rule added successfully!");
      }
      setForm(blankForm);
      setEditingId(null);
      fetchRules();
    } catch (e) { notifyError(e.message || "Failed to save rule"); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this rule?")) return;
    try {
      await LoyaltyServices.deleteItemGroupRule(id);
      notifySuccess("Item Group rule deleted!");
      fetchRules();
    } catch (e) { notifyError(e.message || "Failed to delete rule"); }
  };

  return (
    <RuleCard>
      <div className="p-5">
        <SectionHeader
          icon={FiPackage}
          title="Item Group Wise Points Configuration"
          subtitle="Define point rates per item group. Expiry here overrides the global setting."
        />
        <FormPanel
          title={editingId ? "Edit Rule" : "Add New Rule"}
          isEditing={!!editingId}
          onSave={handleSave}
          onCancel={() => { setEditingId(null); setForm(blankForm); }}
        >
          <FieldLabel label="Item Group(s)">
            <DropdownCheckboxList
              options={itemGroups}
              selectedIds={form.itemGroupIds}
              onChange={(nextIds) => setForm(prev => ({ ...prev, itemGroupIds: nextIds }))}
              isAllSelected={form.isAllItemGroups}
              onAllSelectedChange={(val) => setForm(prev => ({ ...prev, isAllItemGroups: val }))}
              placeholder="Select Groups"
            />
          </FieldLabel>
          <FieldLabel label="Calculation Type">
            <StyledSelect value={form.calcType} onChange={(e) => setForm({ ...form, calcType: e.target.value })}>
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Points</option>
            </StyledSelect>
          </FieldLabel>
          <FieldLabel label="Points Value">
            <StyledInput type="number" value={form.pointsValue} onChange={(e) => setForm({ ...form, pointsValue: e.target.value })} />
          </FieldLabel>
          <FieldLabel label="Expiry Days (0 = global)">
            <StyledInput type="number" value={form.expDays} onChange={(e) => setForm({ ...form, expDays: e.target.value })} />
          </FieldLabel>
        </FormPanel>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <TableHead cols={["#", "Item Group", "Calc Type", "Points", "Exp. Days", "Actions"]} />
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
            {rules.length === 0 && <EmptyState message="No item group rules configured yet." />}
            {rules.map((r, i) => (
              <TableRowStyled key={r._id}>
                <TD><span className="text-gray-400 font-mono">{i + 1}</span></TD>
                <TD>
                  <span className="font-medium">
                    {r.isAllItemGroups ? (
                      <Badge color="green">All Item Groups</Badge>
                    ) : r.itemGroupIds && r.itemGroupIds.length > 0 ? (
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {r.itemGroupIds.map(g => (
                          <Badge key={g._id} color="blue">{g.name}</Badge>
                        ))}
                      </div>
                    ) : (
                      r.itemGroupId?.name || <span className="text-gray-400 italic">Unknown</span>
                    )}
                  </span>
                </TD>
                <TD><Badge color="purple">{r.calcType === "percentage" ? "Percentage %" : "Fixed Pts"}</Badge></TD>
                <TD><span className="font-semibold text-green-600 dark:text-green-400">{r.pointsValue}{r.calcType === "percentage" ? "%" : " pts"}</span></TD>
                <TD>{r.expDays > 0 ? <Badge color="orange">{r.expDays} days</Badge> : <span className="text-gray-400 text-xs">Global</span>}</TD>
                <TD>
                  <ActionButtons
                    onEdit={() => {
                      setEditingId(r._id);
                      setForm({
                        itemGroupId: r.itemGroupId?._id || r.itemGroupId || "",
                        itemGroupIds: r.itemGroupIds ? r.itemGroupIds.map(g => g._id || g) : [],
                        isAllItemGroups: !!r.isAllItemGroups,
                        calcType: r.calcType,
                        pointsValue: r.pointsValue,
                        expDays: r.expDays
                      });
                    }}
                    onDelete={() => handleDelete(r._id)}
                  />
                </TD>
              </TableRowStyled>
            ))}
          </tbody>
        </table>
      </div>
    </RuleCard>
  );
}

// ──── Item Rules Tab ──────────────────────────────────────────────────────────
export function ItemRulesTab({ items = [] }) {
  const [rules, setRules] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const blankForm = { itemId: "", itemIds: [], isAllItems: false, calcType: "percentage", pointsValue: 0, expDays: 0 };
  const [form, setForm] = useState(blankForm);

  useEffect(() => { fetchRules(); }, []);

  const fetchRules = async () => {
    try { const res = await LoyaltyServices.getItemRules(); setRules(res.data || []); }
    catch (e) { console.error(e); }
  };

  const handleSave = async () => {
    try {
      const payload = { ...form };
      if (!payload.itemId) delete payload.itemId;
      
      if (editingId) {
        await LoyaltyServices.updateItemRule(editingId, payload);
        notifySuccess("Item rule updated successfully!");
      } else {
        await LoyaltyServices.createItemRule(payload);
        notifySuccess("Item rule added successfully!");
      }
      setForm(blankForm);
      setEditingId(null);
      fetchRules();
    } catch (e) { notifyError(e.message || "Failed to save rule"); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this rule?")) return;
    try {
      await LoyaltyServices.deleteItemRule(id);
      notifySuccess("Item rule deleted!");
      fetchRules();
    } catch (e) { notifyError(e.message || "Failed to delete rule"); }
  };

  return (
    <RuleCard>
      <div className="p-5">
        <SectionHeader
          icon={FiTag}
          title="Item Wise Points Configuration"
          subtitle="Highest priority — item-specific points override all other rules in Priority mode."
        />
        <FormPanel
          title={editingId ? "Edit Rule" : "Add New Rule"}
          isEditing={!!editingId}
          onSave={handleSave}
          onCancel={() => { setEditingId(null); setForm(blankForm); }}
        >
          <FieldLabel label="Item(s)">
            <DropdownCheckboxList
              options={items}
              selectedIds={form.itemIds}
              onChange={(nextIds) => setForm(prev => ({ ...prev, itemIds: nextIds }))}
              isAllSelected={form.isAllItems}
              onAllSelectedChange={(val) => setForm(prev => ({ ...prev, isAllItems: val }))}
              placeholder="Select Items"
            />
          </FieldLabel>
          <FieldLabel label="Calculation Type">
            <StyledSelect value={form.calcType} onChange={(e) => setForm({ ...form, calcType: e.target.value })}>
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Points</option>
            </StyledSelect>
          </FieldLabel>
          <FieldLabel label="Points Value">
            <StyledInput type="number" value={form.pointsValue} onChange={(e) => setForm({ ...form, pointsValue: e.target.value })} />
          </FieldLabel>
          <FieldLabel label="Expiry Days">
            <StyledInput type="number" value={form.expDays} onChange={(e) => setForm({ ...form, expDays: e.target.value })} />
          </FieldLabel>
        </FormPanel>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <TableHead cols={["#", "Item", "Calc Type", "Points", "Exp. Days", "Actions"]} />
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
            {rules.length === 0 && <EmptyState message="No item-level rules configured yet." />}
            {rules.map((r, i) => (
              <TableRowStyled key={r._id}>
                <TD><span className="text-gray-400 font-mono">{i + 1}</span></TD>
                <TD>
                  <span className="font-medium">
                    {r.isAllItems ? (
                      <Badge color="green">All Items</Badge>
                    ) : r.itemIds && r.itemIds.length > 0 ? (
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {r.itemIds.map(it => (
                          <Badge key={it._id} color="blue">{it.name}</Badge>
                        ))}
                      </div>
                    ) : (
                      r.itemId?.name || <span className="text-gray-400 italic">Unknown</span>
                    )}
                  </span>
                </TD>
                <TD><Badge color="purple">{r.calcType === "percentage" ? "Percentage %" : "Fixed Pts"}</Badge></TD>
                <TD><span className="font-semibold text-green-600 dark:text-green-400">{r.pointsValue}{r.calcType === "percentage" ? "%" : " pts"}</span></TD>
                <TD>{r.expDays > 0 ? <Badge color="orange">{r.expDays} days</Badge> : <span className="text-gray-400 text-xs">Global</span>}</TD>
                <TD>
                  <ActionButtons
                    onEdit={() => {
                      setEditingId(r._id);
                      setForm({
                        itemId: r.itemId?._id || r.itemId || "",
                        itemIds: r.itemIds ? r.itemIds.map(it => it._id || it) : [],
                        isAllItems: !!r.isAllItems,
                        calcType: r.calcType,
                        pointsValue: r.pointsValue,
                        expDays: r.expDays
                      });
                    }}
                    onDelete={() => handleDelete(r._id)}
                  />
                </TD>
              </TableRowStyled>
            ))}
          </tbody>
        </table>
      </div>
    </RuleCard>
  );
}

// ──── Sale Rules Tab ──────────────────────────────────────────────────────────
export function SaleRulesTab({ tiers = [], items = [] }) {
  const [rules, setRules] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const blank = { membershipId: "", saleFrom: 0, saleTo: 0, discountType: "percentage", discountValue: 0, giftConditionAmount: 0, giftItem: "", freeCouponsAmount: 0 };
  const [form, setForm] = useState(blank);

  useEffect(() => { fetchRules(); }, []);
  const fetchRules = async () => { try { const r = await LoyaltyServices.getSaleRules(); setRules(r.data || []); } catch (e) { console.error(e); } };

  const handleSave = async () => {
    try {
      const payload = {
        ...form,
        saleFrom: Number(form.saleFrom) || 0,
        saleTo: Number(form.saleTo) || 0,
        discountValue: Number(form.discountValue) || 0,
        giftConditionAmount: Number(form.giftConditionAmount) || 0,
        freeCouponsAmount: Number(form.freeCouponsAmount) || 0,
      };
      if (!payload.membershipId) delete payload.membershipId;
      if (!payload.giftItem) delete payload.giftItem;

      if (editingId) {
        await LoyaltyServices.updateSaleRule(editingId, payload);
        notifySuccess("Sale Slab updated successfully!");
      } else {
        await LoyaltyServices.createSaleRule(payload);
        notifySuccess("Sale Slab added successfully!");
      }
      setForm(blank); setEditingId(null); fetchRules();
    } catch (e) { notifyError(e.message || "Failed to save slab"); }
  };

  return (
    <RuleCard>
      <div className="p-5">
        <SectionHeader
          icon={FiShoppingCart}
          title="Sale Wise Slab Configuration"
          subtitle="Configure discounts, gift triggers & free coupons based on invoice total. Leave membership empty for a common slab."
        />
        <FormPanel
          title={editingId ? "Edit Slab" : "Add New Slab"}
          isEditing={!!editingId}
          onSave={handleSave}
          onCancel={() => { setEditingId(null); setForm(blank); }}
        >
          <FieldLabel label="Membership (empty = All Tiers)">
            <StyledSelect value={form.membershipId} onChange={(e) => setForm({ ...form, membershipId: e.target.value })}>
              <option value="">All Tiers (Common)</option>
              {tiers.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
            </StyledSelect>
          </FieldLabel>
          <FieldLabel label="Sale From (₹)"><StyledInput type="number" value={form.saleFrom} onChange={(e) => setForm({ ...form, saleFrom: e.target.value })} /></FieldLabel>
          <FieldLabel label="Sale To (₹)"><StyledInput type="number" value={form.saleTo} onChange={(e) => setForm({ ...form, saleTo: e.target.value })} /></FieldLabel>
          <FieldLabel label="Discount Type">
            <StyledSelect value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value })}>
              <option value="percentage">Percentage (%)</option>
              <option value="value">Fixed Value (₹)</option>
            </StyledSelect>
          </FieldLabel>
          <FieldLabel label="Discount Value"><StyledInput type="number" value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: e.target.value })} /></FieldLabel>
          <FieldLabel label="Gift Trigger Amount (₹)"><StyledInput type="number" value={form.giftConditionAmount} onChange={(e) => setForm({ ...form, giftConditionAmount: e.target.value })} /></FieldLabel>
          <FieldLabel label="Gift Item">
            <StyledSelect value={form.giftItem} onChange={(e) => setForm({ ...form, giftItem: e.target.value })}>
              <option value="">None</option>
              {items.map(it => <option key={it._id} value={it._id}>{it.name}</option>)}
            </StyledSelect>
          </FieldLabel>
          <FieldLabel label="Free Coupon Value (₹)"><StyledInput type="number" value={form.freeCouponsAmount} onChange={(e) => setForm({ ...form, freeCouponsAmount: e.target.value })} /></FieldLabel>
        </FormPanel>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <TableHead cols={["Membership", "Sale Range", "Discount", "Gift Trigger", "Gift Item", "Free Coupon", "Actions"]} />
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
            {rules.length === 0 && <EmptyState message="No sale slabs configured yet." />}
            {rules.map(r => (
              <TableRowStyled key={r._id}>
                <TD>{r.membershipId?.name ? <Badge color="blue">{r.membershipId.name}</Badge> : <span className="text-gray-400 text-xs">All Tiers</span>}</TD>
                <TD><span className="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">₹{r.saleFrom} – ₹{r.saleTo}</span></TD>
                <TD><span className="font-semibold text-green-600 dark:text-green-400">{r.discountValue}{r.discountType === "percentage" ? "%" : "₹"}</span></TD>
                <TD>{r.giftConditionAmount ? <span className="text-orange-600">₹{r.giftConditionAmount}+</span> : <span className="text-gray-400">—</span>}</TD>
                <TD>{r.giftItem?.name || <span className="text-gray-400">—</span>}</TD>
                <TD>{r.freeCouponsAmount ? <Badge color="green">₹{r.freeCouponsAmount}</Badge> : <span className="text-gray-400">—</span>}</TD>
                <TD>
                  <ActionButtons
                    onEdit={() => { setEditingId(r._id); setForm({ membershipId: r.membershipId?._id || "", saleFrom: r.saleFrom, saleTo: r.saleTo, discountType: r.discountType, discountValue: r.discountValue, giftConditionAmount: r.giftConditionAmount, giftItem: r.giftItem?._id || "", freeCouponsAmount: r.freeCouponsAmount }); }}
                    onDelete={async () => {
                      if (window.confirm("Delete?")) {
                        try {
                          await LoyaltyServices.deleteSaleRule(r._id);
                          notifySuccess("Sale Slab deleted!");
                          fetchRules();
                        } catch (e) { notifyError(e.message || "Failed to delete slab"); }
                      }
                    }}
                  />
                </TD>
              </TableRowStyled>
            ))}
          </tbody>
        </table>
      </div>
    </RuleCard>
  );
}

// ──── Visit Rules Tab ─────────────────────────────────────────────────────────
export function VisitRulesTab({ tiers = [] }) {
  const [rules, setRules] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const blank = { membershipId: "", visitFrom: 1, visitTo: 5, expireDays: 90, saleFrom: 0, saleTo: 0, discountType: "percentage", discountValue: 0, freeCouponsAmount: 0 };
  const [form, setForm] = useState(blank);

  useEffect(() => { fetchRules(); }, []);
  const fetchRules = async () => { try { const r = await LoyaltyServices.getVisitRules(); setRules(r.data || []); } catch (e) { console.error(e); } };

  const handleSave = async () => {
    try {
      const payload = { ...form };
      if (!payload.membershipId) delete payload.membershipId;

      if (editingId) {
        await LoyaltyServices.updateVisitRule(editingId, payload);
        notifySuccess("Visit Slab updated successfully!");
      } else {
        await LoyaltyServices.createVisitRule(payload);
        notifySuccess("Visit Slab added successfully!");
      }
      setForm(blank); setEditingId(null); fetchRules();
    } catch (e) { notifyError(e.message || "Failed to save rule"); }
  };

  return (
    <RuleCard>
      <div className="p-5">
        <SectionHeader
          icon={FiCalendar}
          title="Visit Wise Slab Configuration"
          subtitle="Trigger discounts and coupons based on how many times a customer has visited or ordered."
        />
        <FormPanel
          title={editingId ? "Edit Rule" : "Add New Rule"}
          isEditing={!!editingId}
          onSave={handleSave}
          onCancel={() => { setEditingId(null); setForm(blank); }}
        >
          <FieldLabel label="Membership (empty = All)">
            <StyledSelect value={form.membershipId} onChange={(e) => setForm({ ...form, membershipId: e.target.value })}>
              <option value="">All Tiers</option>
              {tiers.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
            </StyledSelect>
          </FieldLabel>
          <FieldLabel label="Visit From"><StyledInput type="number" value={form.visitFrom} onChange={(e) => setForm({ ...form, visitFrom: e.target.value })} /></FieldLabel>
          <FieldLabel label="Visit To"><StyledInput type="number" value={form.visitTo} onChange={(e) => setForm({ ...form, visitTo: e.target.value })} /></FieldLabel>
          <FieldLabel label="Expire Days"><StyledInput type="number" value={form.expireDays} onChange={(e) => setForm({ ...form, expireDays: e.target.value })} /></FieldLabel>
          <FieldLabel label="Sale From (₹)"><StyledInput type="number" value={form.saleFrom} onChange={(e) => setForm({ ...form, saleFrom: e.target.value })} /></FieldLabel>
          <FieldLabel label="Sale To (₹)"><StyledInput type="number" value={form.saleTo} onChange={(e) => setForm({ ...form, saleTo: e.target.value })} /></FieldLabel>
          <FieldLabel label="Discount Type">
            <StyledSelect value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value })}>
              <option value="percentage">%</option>
              <option value="value">₹ Fixed</option>
            </StyledSelect>
          </FieldLabel>
          <FieldLabel label="Discount Value"><StyledInput type="number" value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: e.target.value })} /></FieldLabel>
          <FieldLabel label="Free Coupon Value (₹)"><StyledInput type="number" value={form.freeCouponsAmount} onChange={(e) => setForm({ ...form, freeCouponsAmount: e.target.value })} /></FieldLabel>
        </FormPanel>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <TableHead cols={["Membership", "Visits", "Expire", "Sale Range", "Discount", "Coupon (₹)", "Actions"]} />
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
            {rules.length === 0 && <EmptyState message="No visit rules configured yet." />}
            {rules.map(r => (
              <TableRowStyled key={r._id}>
                <TD>{r.membershipId?.name ? <Badge color="blue">{r.membershipId.name}</Badge> : <span className="text-gray-400 text-xs">All Tiers</span>}</TD>
                <TD><Badge color="purple">{r.visitFrom}–{r.visitTo} visits</Badge></TD>
                <TD><span className="text-xs">{r.expireDays} days</span></TD>
                <TD><span className="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">{r.saleFrom ? `₹${r.saleFrom}–₹${r.saleTo}` : "Any"}</span></TD>
                <TD><span className="font-semibold text-green-600 dark:text-green-400">{r.discountValue}{r.discountType === "percentage" ? "%" : "₹"}</span></TD>
                <TD>{r.freeCouponsAmount ? <Badge color="green">₹{r.freeCouponsAmount}</Badge> : <span className="text-gray-400">—</span>}</TD>
                <TD>
                  <ActionButtons
                    onEdit={() => { setEditingId(r._id); setForm({ membershipId: r.membershipId?._id || "", visitFrom: r.visitFrom, visitTo: r.visitTo, expireDays: r.expireDays, saleFrom: r.saleFrom, saleTo: r.saleTo, discountType: r.discountType, discountValue: r.discountValue, freeCouponsAmount: r.freeCouponsAmount }); }}
                    onDelete={async () => {
                      if (window.confirm("Delete?")) {
                        try {
                          await LoyaltyServices.deleteVisitRule(r._id);
                          notifySuccess("Visit Slab deleted!");
                          fetchRules();
                        } catch (e) { notifyError(e.message || "Failed to delete rule"); }
                      }
                    }}
                  />
                </TD>
              </TableRowStyled>
            ))}
          </tbody>
        </table>
      </div>
    </RuleCard>
  );
}

// ──── Lumpsum Rules Tab ───────────────────────────────────────────────────────
export function LumpsumRulesTab({ tiers = [] }) {
  const [rules, setRules] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const blank = { membershipId: "", saleAmount: 0, points: 0, expireDays: 60 };
  const [form, setForm] = useState(blank);

  useEffect(() => { fetchRules(); }, []);
  const fetchRules = async () => { try { const r = await LoyaltyServices.getLumpsumRules(); setRules(r.data || []); } catch (e) { console.error(e); } };

  const handleSave = async () => {
    try {
      const payload = { ...form };
      if (!payload.membershipId) delete payload.membershipId;

      if (editingId) {
        await LoyaltyServices.updateLumpsumRule(editingId, payload);
        notifySuccess("Lumpsum Rule updated successfully!");
      } else {
        await LoyaltyServices.createLumpsumRule(payload);
        notifySuccess("Lumpsum Rule added successfully!");
      }
      setForm(blank); setEditingId(null); fetchRules();
    } catch (e) { notifyError(e.message || "Failed to save rule"); }
  };

  return (
    <RuleCard>
      <div className="p-5">
        <SectionHeader
          icon={FiDollarSign}
          title="Lumpsum Points Configuration"
          subtitle="Flat fixed points per membership tier when a minimum sale amount threshold is crossed."
        />
        <FormPanel
          title={editingId ? "Edit Rule" : "Add New Rule"}
          isEditing={!!editingId}
          onSave={handleSave}
          onCancel={() => { setEditingId(null); setForm(blank); }}
        >
          <FieldLabel label="Membership">
            <StyledSelect value={form.membershipId} onChange={(e) => setForm({ ...form, membershipId: e.target.value })}>
              <option value="">Select Tier</option>
              {tiers.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
            </StyledSelect>
          </FieldLabel>
          <FieldLabel label="Minimum Sale Amount (₹)"><StyledInput type="number" value={form.saleAmount} onChange={(e) => setForm({ ...form, saleAmount: e.target.value })} /></FieldLabel>
          <FieldLabel label="Points Awarded"><StyledInput type="number" value={form.points} onChange={(e) => setForm({ ...form, points: e.target.value })} /></FieldLabel>
          <FieldLabel label="Expire Days"><StyledInput type="number" value={form.expireDays} onChange={(e) => setForm({ ...form, expireDays: e.target.value })} /></FieldLabel>
        </FormPanel>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <TableHead cols={["Membership", "Min Sale (₹)", "Points", "Expire Days", "Actions"]} />
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
            {rules.length === 0 && <EmptyState message="No lumpsum rules configured yet." />}
            {rules.map(r => (
              <TableRowStyled key={r._id}>
                <TD>{r.membershipId?.name ? <Badge color="blue">{r.membershipId.name}</Badge> : <span className="text-gray-400 text-xs">—</span>}</TD>
                <TD><span className="font-mono">₹{r.saleAmount}</span></TD>
                <TD><span className="font-bold text-green-600 dark:text-green-400">{r.points} pts</span></TD>
                <TD><Badge color="orange">{r.expireDays} days</Badge></TD>
                <TD>
                  <ActionButtons
                    onEdit={() => { setEditingId(r._id); setForm({ membershipId: r.membershipId?._id || "", saleAmount: r.saleAmount, points: r.points, expireDays: r.expireDays }); }}
                    onDelete={async () => {
                      if (window.confirm("Delete?")) {
                        try {
                          await LoyaltyServices.deleteLumpsumRule(r._id);
                          notifySuccess("Lumpsum Rule deleted!");
                          fetchRules();
                        } catch (e) { notifyError(e.message || "Failed to delete rule"); }
                      }
                    }}
                  />
                </TD>
              </TableRowStyled>
            ))}
          </tbody>
        </table>
      </div>
    </RuleCard>
  );
}

// ──── Coupon Templates Tab ────────────────────────────────────────────────────
export function CouponTemplatesTab({ items = [], brands = [] }) {
  const [subView, setSubView] = useState("templates"); // 'templates' | 'issued'
  const [templates, setTemplates] = useState([]);
  const [issuedCoupons, setIssuedCoupons] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const blank = { targetType: "all", targetId: "", saleFrom: 0, saleTo: 0, nextSaleIssueValue: 0, couponValue: 0, description: "", expiryDays: 30 };
  const [form, setForm] = useState(blank);

  useEffect(() => {
    fetchTemplates();
    fetchIssuedCoupons();
  }, []);

  const fetchTemplates = async () => { try { const r = await LoyaltyServices.getCouponTemplates(); setTemplates(r.data || []); } catch (e) { console.error(e); } };
  const fetchIssuedCoupons = async () => { try { const r = await LoyaltyServices.getAllIssuedCoupons(); setIssuedCoupons(r.data || []); } catch (e) { console.error(e); } };

  const handleSave = async () => {
    try {
      const payload = {
        ...form,
        saleFrom: Number(form.saleFrom) || 0,
        saleTo: Number(form.saleTo) || 0,
        couponValue: Number(form.couponValue) || 0,
        nextSaleIssueValue: Number(form.nextSaleIssueValue) || 0,
        expiryDays: Number(form.expiryDays) || 30,
      };
      if (!payload.targetId) delete payload.targetId;

      if (editingId) {
        await LoyaltyServices.updateCoupon(editingId, payload);
        notifySuccess("Coupon Template updated successfully!");
      } else {
        await LoyaltyServices.createCoupon(payload);
        notifySuccess("Coupon Template added successfully!");
      }
      setForm(blank); setEditingId(null); fetchTemplates();
    } catch (e) { notifyError(e.message || "Failed to save template"); }
  };

  const targetOptions = form.targetType === "item" ? items : form.targetType === "brand" ? brands : [];

  return (
    <RuleCard>
      <div className="p-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <SectionHeader
            icon={FiGift}
            title="Coupons Management"
            subtitle="Manage coupon templates and view issued customer coupons."
          />
          <div className="flex gap-2 bg-gray-100 dark:bg-gray-700/50 p-1 rounded-lg">
            <button
              onClick={() => setSubView("templates")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                subView === "templates"
                  ? "bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
              }`}
            >
              Master Templates ({templates.length})
            </button>
            <button
              onClick={() => { setSubView("issued"); fetchIssuedCoupons(); }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                subView === "issued"
                  ? "bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
              }`}
            >
              Issued Coupons ({issuedCoupons.length})
            </button>
          </div>
        </div>

        {subView === "templates" && (
          <FormPanel
            title={editingId ? "Edit Coupon Template" : "Add New Coupon Template"}
            isEditing={!!editingId}
            onSave={handleSave}
            onCancel={() => { setEditingId(null); setForm(blank); }}
          >
            <FieldLabel label="Applies To">
              <StyledSelect value={form.targetType} onChange={(e) => setForm({ ...form, targetType: e.target.value, targetId: "" })}>
                <option value="all">All Products</option>
                <option value="item">Specific Item</option>
                <option value="brand">Specific Brand</option>
              </StyledSelect>
            </FieldLabel>
            {form.targetType !== "all" && (
              <FieldLabel label={`Select ${form.targetType === "item" ? "Item" : "Brand"}`}>
                <StyledSelect value={form.targetId} onChange={(e) => setForm({ ...form, targetId: e.target.value })}>
                  <option value="">Select Option</option>
                  {targetOptions.map(opt => <option key={opt._id} value={opt._id}>{opt.name}</option>)}
                </StyledSelect>
              </FieldLabel>
            )}
            <FieldLabel label="Min Order Sale (₹)"><StyledInput type="number" value={form.saleFrom} onChange={(e) => setForm({ ...form, saleFrom: e.target.value })} /></FieldLabel>
            <FieldLabel label="Max Order Sale (₹)"><StyledInput type="number" value={form.saleTo} onChange={(e) => setForm({ ...form, saleTo: e.target.value })} /></FieldLabel>
            <FieldLabel label="Coupon Discount Value (₹)"><StyledInput type="number" value={form.couponValue} onChange={(e) => setForm({ ...form, couponValue: e.target.value })} /></FieldLabel>
            <FieldLabel label="Min Sale to Redeem Coupon (₹)"><StyledInput type="number" value={form.nextSaleIssueValue} onChange={(e) => setForm({ ...form, nextSaleIssueValue: e.target.value })} /></FieldLabel>
            <FieldLabel label="Coupon Validity (Days)"><StyledInput type="number" value={form.expiryDays} onChange={(e) => setForm({ ...form, expiryDays: e.target.value })} /></FieldLabel>
            <FieldLabel label="Description / Note"><StyledInput type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="e.g. ₹50 OFF on Facewash" /></FieldLabel>
          </FormPanel>
        )}
      </div>

      <div className="overflow-x-auto">
        {subView === "templates" ? (
          <table className="w-full">
            <TableHead cols={["Applies To", "Sale Range", "Coupon (₹)", "Next Sale (₹)", "Expiry", "Description", "Actions"]} />
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
              {templates.length === 0 && <EmptyState message="No coupon templates configured yet." />}
              {templates.map(t => (
                <TableRowStyled key={t._id}>
                  <TD>
                    {t.targetType === "all"
                      ? <Badge color="gray">All Products</Badge>
                      : <Badge color="blue">{t.targetType}: {t.targetId?.name || t.targetId}</Badge>}
                  </TD>
                  <TD><span className="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">₹{t.saleFrom}–₹{t.saleTo}</span></TD>
                  <TD><span className="font-bold text-green-600 dark:text-green-400">₹{t.couponValue}</span></TD>
                  <TD><span className="text-sm">₹{t.nextSaleIssueValue || 0}</span></TD>
                  <TD><Badge color="orange">{t.expiryDays} days</Badge></TD>
                  <TD><span className="text-xs text-gray-500 max-w-[140px] truncate block">{t.description || "—"}</span></TD>
                  <TD>
                    <ActionButtons
                      onEdit={() => { setEditingId(t._id); setForm({ targetType: t.targetType, targetId: t.targetId?._id || "", saleFrom: t.saleFrom, saleTo: t.saleTo, nextSaleIssueValue: t.nextSaleIssueValue, couponValue: t.couponValue, description: t.description, expiryDays: t.expiryDays }); }}
                      onDelete={async () => {
                        if (window.confirm("Delete?")) {
                          try {
                            await LoyaltyServices.deleteCoupon(t._id);
                            notifySuccess("Coupon Template deleted!");
                            fetchTemplates();
                          } catch (e) { notifyError(e.message || "Failed to delete template"); }
                        }
                      }}
                    />
                  </TD>
                </TableRowStyled>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="w-full">
            <TableHead cols={["Customer", "Coupon Code", "Value", "Description", "Expiry Date", "Status"]} />
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
              {issuedCoupons.length === 0 && <EmptyState message="No customer coupons issued yet." />}
              {issuedCoupons.map(c => {
                const isExpired = new Date(c.expiryDate) < new Date();
                return (
                  <TableRowStyled key={c._id}>
                    <TD>
                      <div className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                        {c.customerId?.name || "Customer"}
                      </div>
                      <div className="text-[11px] text-gray-400">
                        {c.customerId?.mobile || c.customerId?.email || ""}
                      </div>
                    </TD>
                    <TD><span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded">{c.couponCode}</span></TD>
                    <TD><span className="font-bold text-green-600 dark:text-green-400">₹{c.couponValue}</span></TD>
                    <TD><span className="text-xs text-gray-500">{c.description || "Loyalty Coupon"}</span></TD>
                    <TD><span className="text-xs text-gray-600 dark:text-gray-300">{new Date(c.expiryDate).toLocaleDateString()}</span></TD>
                    <TD>
                      {c.isUsed ? (
                        <Badge color="gray">Used</Badge>
                      ) : isExpired ? (
                        <Badge color="red">Expired</Badge>
                      ) : (
                        <Badge color="green">Active</Badge>
                      )}
                    </TD>
                  </TableRowStyled>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </RuleCard>
  );
}
