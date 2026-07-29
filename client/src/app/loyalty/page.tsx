'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/types';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5056/api';

// ──── Type Definitions ────────────────────────────────────────────────────────
interface LedgerEntry {
  _id: string;
  sourceType: string;
  pointsEarned: number;
  pointsRedeemed: number;
  earnedDate: string;
  expiryDate?: string;
  invoiceId?: string;
}

interface IssuedCoupon {
  _id: string;
  couponCode: string;
  couponValue: number;
  description: string;
  targetType: string;
  expiryDate: string;
  isUsed: boolean;
}

interface Tier {
  _id: string;
  name: string;
  saleStart: number;
  saleEnd: number;
  perPointValue: number;
  expireDays: number;
  discountPercentage?: number;
}

interface EarningRule {
  icon: string;
  title: string;
  subtitle: string;
  badge?: string;
}

// ──── Helper ──────────────────────────────────────────────────────────────────
function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function daysLeft(dateStr?: string) {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff <= 0) return 0;
  return Math.ceil(diff / 86400000);
}

function sourceLabel(type: string) {
  const map: Record<string, string> = {
    item: '🏷️ Item Rule', item_group: '📦 Group Rule',
    sale_slab: '🛒 Sale Slab', visit_slab: '📅 Visit Rule',
    lumpsum: '💰 Lumpsum', sale: '🛒 Purchase',
  };
  return map[type] || type;
}

// ──── Sub-components ──────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color }: { icon: string; label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className={`relative bg-white rounded-2xl shadow-sm border border-gray-100 p-5 overflow-hidden`}>
      <div className={`absolute top-0 right-0 w-24 h-24 rounded-full opacity-5 ${color} -translate-y-1/2 translate-x-1/2`} />
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3 ${color} bg-opacity-10`}>
        {icon}
      </div>
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-bold text-gray-900">{title}</h2>
      {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
    </div>
  );
}

// ──── Main Page ───────────────────────────────────────────────────────────────
export default function LoyaltyProgramPage() {
  const router = useRouter();
  const user = useSelector((state: RootState) => state.auth.user) as any;

  const [tiers, setTiers] = useState<Tier[]>([]);
  const [balance, setBalance] = useState(0);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [coupons, setCoupons] = useState<IssuedCoupon[]>([]);
  const [config, setConfig] = useState<any>(null);
  const [earningRules, setEarningRules] = useState<EarningRule[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'coupons' | 'how-it-works'>('overview');
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Find customer's current tier
  const customerTier = tiers.find(t =>
    user?.loyaltyTier === t._id || user?.loyaltyTier?._id === t._id
  );

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    loadAll();
  }, [user]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const customerId = (user as any)?._id;
      const headers = { 'Content-Type': 'application/json' };

      const [tiersRes, configRes] = await Promise.all([
        fetch(`${API_BASE}/loyalty-program/tiers`).then(r => r.json()),
        fetch(`${API_BASE}/loyalty-program/config`).then(r => r.json()),
      ]);

      if (tiersRes.success) setTiers(tiersRes.data || []);
      if (configRes.success) setConfig(configRes.data);

      if (customerId) {
        const [balRes, couponRes, itemGroupRes, itemRes, saleRes, visitRes, lumpsumRes] = await Promise.all([
          fetch(`${API_BASE}/loyalty-program/points-balance/${customerId}`).then(r => r.json()),
          fetch(`${API_BASE}/loyalty-program/customer-coupons/${customerId}`).then(r => r.json()),
          fetch(`${API_BASE}/loyalty-program/item-group-rules`).then(r => r.json()),
          fetch(`${API_BASE}/loyalty-program/item-rules`).then(r => r.json()),
          fetch(`${API_BASE}/loyalty-program/sale-rules`).then(r => r.json()),
          fetch(`${API_BASE}/loyalty-program/visit-rules`).then(r => r.json()),
          fetch(`${API_BASE}/loyalty-program/lumpsum-rules`).then(r => r.json()),
        ]);

        if (balRes.success) {
          setBalance(balRes.balance || 0);
          setLedger(balRes.entries || []);
        }
        if (couponRes.success) setCoupons(couponRes.data || []);

        // Build earning rules display from real data
        const rules: EarningRule[] = [];
        (itemGroupRes.data || []).forEach((r: any) => {
          rules.push({ icon: '📦', title: `${r.itemGroupId?.name || 'Item Group'} — ${r.pointsValue}${r.calcType === 'percentage' ? '%' : ' pts'}`, subtitle: `Earn ${r.calcType === 'percentage' ? `${r.pointsValue}% of purchase` : `${r.pointsValue} fixed pts`}${r.expDays ? ` · Valid ${r.expDays} days` : ''}`, badge: 'Group' });
        });
        (itemRes.data || []).forEach((r: any) => {
          rules.push({ icon: '🏷️', title: `${r.itemId?.name || 'Item'} — ${r.pointsValue}${r.calcType === 'percentage' ? '%' : ' pts'}`, subtitle: `Earn ${r.calcType === 'percentage' ? `${r.pointsValue}% of item price` : `${r.pointsValue} fixed pts`}${r.expDays ? ` · Valid ${r.expDays} days` : ''}`, badge: 'Item' });
        });
        (saleRes.data || []).forEach((r: any) => {
          rules.push({ icon: '🛒', title: `₹${r.saleFrom}–₹${r.saleTo} Purchase`, subtitle: `${r.discountValue}${r.discountType === 'percentage' ? '% off' : '₹ off'}${r.freeCouponsAmount ? ` + ₹${r.freeCouponsAmount} coupon` : ''}`, badge: r.membershipId?.name || 'All' });
        });
        (visitRes.data || []).forEach((r: any) => {
          rules.push({ icon: '📅', title: `Visit ${r.visitFrom}–${r.visitTo}`, subtitle: `${r.discountValue}${r.discountType === 'percentage' ? '% off' : '₹ off'}${r.freeCouponsAmount ? ` + ₹${r.freeCouponsAmount} coupon` : ''}`, badge: r.membershipId?.name || 'All' });
        });
        (lumpsumRes.data || []).forEach((r: any) => {
          rules.push({ icon: '💰', title: `${r.membershipId?.name || 'Member'} — ₹${r.saleAmount}+ order`, subtitle: `Earn ${r.points} bonus pts · Valid ${r.expireDays} days`, badge: 'Lumpsum' });
        });
        setEarningRules(rules);
      }
    } catch (err) {
      console.error('Failed to load loyalty data:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const pointValue = config?.pointValueInRs || 0.8;
  const balanceInRs = (balance * pointValue).toFixed(2);
  const activeCoupons = coupons.filter(c => !c.isUsed && new Date(c.expiryDate) > new Date());
  const usedCoupons = coupons.filter(c => c.isUsed);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4" />
          <p className="text-gray-500 font-medium">Loading your loyalty dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <p className="text-indigo-200 text-sm font-medium mb-1">Welcome back, {user?.name?.split(' ')[0] || 'Member'}</p>
              <h1 className="text-3xl font-extrabold">Your Loyalty Dashboard</h1>
              {customerTier && (
                <div className="mt-2 inline-flex items-center gap-2 bg-white/20 backdrop-blur rounded-full px-4 py-1.5 text-sm font-semibold">
                  🏅 <span>{customerTier.name} Member</span>
                </div>
              )}
            </div>
            {/* Points Balance Card */}
            <div className="bg-white/15 backdrop-blur border border-white/30 rounded-2xl px-8 py-5 text-center min-w-[180px]">
              <p className="text-indigo-100 text-xs uppercase tracking-widest mb-1">Points Balance</p>
              <p className="text-5xl font-black">{balance.toLocaleString()}</p>
              <p className="text-indigo-200 text-sm mt-1">≈ ₹{balanceInRs} value</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard icon="⭐" label="Total Points" value={balance.toLocaleString()} sub={`Worth ₹${balanceInRs}`} color="bg-indigo-500" />
          <StatCard icon="🎟️" label="Active Coupons" value={activeCoupons.length} sub="Available to use" color="bg-green-500" />
          <StatCard icon="💳" label="My Tier" value={customerTier?.name || 'None'} sub={customerTier ? `Sale ₹${customerTier.saleStart}–₹${customerTier.saleEnd}` : 'Get a membership'} color="bg-purple-500" />
          <StatCard icon="📊" label="Point Value" value={`₹${pointValue}`} sub="Per 1 point" color="bg-orange-500" />
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 bg-white rounded-xl border border-gray-200 p-1 mb-6 overflow-x-auto">
          {[
            { key: 'overview', label: 'Overview', icon: '🏠' },
            { key: 'history', label: 'Points History', icon: '📋' },
            { key: 'coupons', label: `Coupons (${activeCoupons.length})`, icon: '🎟️' },
            { key: 'how-it-works', label: 'How to Earn', icon: '🎯' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.key
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ── OVERVIEW TAB ─────────────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Membership Tier Comparison */}
            <div>
              <SectionTitle title="Membership Tiers" subtitle="Your earning potential based on cumulative purchase amount" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {tiers.map((tier, i) => {
                  const isActive = customerTier?._id === tier._id;
                  return (
                    <div key={tier._id} className={`rounded-2xl border-2 p-5 transition-all ${isActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 bg-white'}`}>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-2xl">{i === 0 ? '🥈' : i === 1 ? '🥇' : '💎'}</span>
                        {isActive && <span className="text-xs font-bold bg-indigo-600 text-white px-3 py-1 rounded-full">Your Tier</span>}
                      </div>
                      <h3 className="font-bold text-gray-900 text-lg">{tier.name}</h3>
                      <p className="text-xs text-gray-500 mb-3">₹{tier.saleStart.toLocaleString()} – ₹{tier.saleEnd.toLocaleString()} cumulative</p>
                      <div className="space-y-1.5 text-xs text-gray-600">
                        <div className="flex items-center gap-1.5">
                          <span className="text-green-500">✓</span>
                          <span>1 point = ₹{tier.perPointValue || pointValue}</span>
                        </div>
                        {tier.expireDays > 0 && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-green-500">✓</span>
                            <span>Points valid for {tier.expireDays} days</span>
                          </div>
                        )}
                        {tier.discountPercentage && tier.discountPercentage > 0 && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-green-500">✓</span>
                            <span>{tier.discountPercentage}% flat discount</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Active Coupons preview */}
            {activeCoupons.length > 0 && (
              <div>
                <SectionTitle title="Active Coupons" subtitle="Available to redeem on your next purchase" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activeCoupons.slice(0, 4).map(c => (
                    <div key={c._id} className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-green-600 font-semibold uppercase tracking-wide mb-0.5">₹{c.couponValue} off</p>
                        <p className="text-sm font-bold text-gray-900 font-mono">{c.couponCode}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{c.description || 'Loyalty Coupon'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400">{daysLeft(c.expiryDate)} days left</p>
                        <button onClick={() => copyCode(c.couponCode)} className="mt-1 text-xs bg-green-600 text-white px-3 py-1 rounded-lg font-medium hover:bg-green-700 transition-colors">
                          {copiedCode === c.couponCode ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {activeCoupons.length > 4 && (
                  <button onClick={() => setActiveTab('coupons')} className="mt-3 text-sm text-indigo-600 font-medium hover:underline">
                    View all {activeCoupons.length} coupons →
                  </button>
                )}
              </div>
            )}

            {/* Recent Points History */}
            {ledger.length > 0 && (
              <div>
                <SectionTitle title="Recent Activity" />
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  {ledger.slice(0, 5).map((entry, i) => {
                    const net = entry.pointsEarned - entry.pointsRedeemed;
                    return (
                      <div key={entry._id} className={`flex items-center justify-between px-4 py-3 ${i < ledger.length - 1 ? 'border-b border-gray-100' : ''}`}>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-indigo-50 rounded-full flex items-center justify-center text-sm">
                            {entry.sourceType === 'item' ? '🏷️' : entry.sourceType === 'sale_slab' ? '🛒' : entry.sourceType === 'visit_slab' ? '📅' : entry.sourceType === 'lumpsum' ? '💰' : '⭐'}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800">{sourceLabel(entry.sourceType)}</p>
                            <p className="text-xs text-gray-400">{timeAgo(entry.earnedDate)}{entry.expiryDate ? ` · Expires ${new Date(entry.expiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` : ''}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`font-bold text-sm ${net > 0 ? 'text-green-600' : 'text-red-500'}`}>
                            {net > 0 ? '+' : ''}{net} pts
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <button onClick={() => setActiveTab('history')} className="mt-3 text-sm text-indigo-600 font-medium hover:underline">
                  View full history →
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── HISTORY TAB ──────────────────────────────────────────────────── */}
        {activeTab === 'history' && (
          <div>
            <SectionTitle title="Points History" subtitle="All points earned and redeemed on your account" />
            {ledger.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
                <p className="text-4xl mb-3">📋</p>
                <p className="text-gray-500">No points activity yet. Make your first purchase to start earning!</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="grid grid-cols-5 gap-4 px-4 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  <span className="col-span-2">Source</span>
                  <span className="text-center">Earned</span>
                  <span className="text-center">Redeemed</span>
                  <span className="text-right">Expires</span>
                </div>
                {ledger.map((entry, i) => {
                  const left = daysLeft(entry.expiryDate);
                  return (
                    <div key={entry._id} className={`grid grid-cols-5 gap-4 px-4 py-3 items-center ${i < ledger.length - 1 ? 'border-b border-gray-100' : ''} hover:bg-gray-50 transition-colors`}>
                      <div className="col-span-2 flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-50 rounded-full flex items-center justify-center text-sm flex-shrink-0">
                          {entry.sourceType === 'item' ? '🏷️' : entry.sourceType === 'sale_slab' ? '🛒' : entry.sourceType === 'visit_slab' ? '📅' : '⭐'}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{sourceLabel(entry.sourceType)}</p>
                          <p className="text-xs text-gray-400">{timeAgo(entry.earnedDate)}</p>
                        </div>
                      </div>
                      <span className="text-center text-sm font-semibold text-green-600">+{entry.pointsEarned}</span>
                      <span className="text-center text-sm font-semibold text-red-500">{entry.pointsRedeemed > 0 ? `-${entry.pointsRedeemed}` : '—'}</span>
                      <div className="text-right">
                        {entry.expiryDate ? (
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${(left || 0) < 7 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                            {left === 0 ? 'Expired' : `${left}d left`}
                          </span>
                        ) : <span className="text-xs text-gray-400">No expiry</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── COUPONS TAB ──────────────────────────────────────────────────── */}
        {activeTab === 'coupons' && (
          <div className="space-y-6">
            {/* Active Coupons */}
            <div>
              <SectionTitle title="Active Coupons" subtitle="Use these coupon codes at checkout for instant savings" />
              {activeCoupons.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
                  <p className="text-4xl mb-3">🎟️</p>
                  <p className="text-gray-500">No active coupons. Shop more to earn coupons automatically!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {activeCoupons.map(c => (
                    <div key={c._id} className="relative bg-white border-2 border-dashed border-green-300 rounded-2xl p-5 overflow-hidden">
                      <div className="absolute top-0 right-0 w-20 h-20 bg-green-50 rounded-full translate-x-1/2 -translate-y-1/2" />
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-2xl font-extrabold text-green-600 mb-1">₹{c.couponValue} OFF</div>
                          <p className="text-xs text-gray-500 mb-3">{c.description || 'Loyalty Coupon'}</p>
                          <div className="bg-gray-100 rounded-lg px-3 py-2 font-mono font-bold text-gray-900 text-sm tracking-widest inline-block">
                            {c.couponCode}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-3">
                          {c.targetType !== 'all' && (
                            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full block mb-2">{c.targetType}</span>
                          )}
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${(daysLeft(c.expiryDate) || 0) < 7 ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                            {daysLeft(c.expiryDate)}d left
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => copyCode(c.couponCode)}
                        className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
                      >
                        {copiedCode === c.couponCode ? (
                          <><span>✓</span> Copied!</>
                        ) : (
                          <><span>📋</span> Copy Code</>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Used Coupons */}
            {usedCoupons.length > 0 && (
              <div>
                <SectionTitle title="Used Coupons" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {usedCoupons.map(c => (
                    <div key={c._id} className="bg-gray-50 border border-gray-200 rounded-xl p-4 opacity-60">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-mono text-sm text-gray-500 line-through">{c.couponCode}</p>
                          <p className="text-xs text-gray-400">₹{c.couponValue} · {c.description}</p>
                        </div>
                        <span className="text-xs bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full font-medium">Used</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── HOW IT WORKS TAB ─────────────────────────────────────────────── */}
        {activeTab === 'how-it-works' && (
          <div className="space-y-6">
            {/* Redemption Info */}
            {config && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5">
                <h3 className="font-bold text-indigo-900 mb-3 flex items-center gap-2"><span>💡</span> Redemption Rules</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-indigo-800">
                  <div className="flex items-start gap-2"><span>✓</span><span>1 point = ₹{config.pointValueInRs || 0.8} discount</span></div>
                  {config.minPointToRedeem > 0 && <div className="flex items-start gap-2"><span>✓</span><span>Minimum {config.minPointToRedeem} points to redeem</span></div>}
                  {config.minInvoiceAmountToRedeem > 0 && <div className="flex items-start gap-2"><span>✓</span><span>Minimum ₹{config.minInvoiceAmountToRedeem} invoice required</span></div>}
                  <div className="flex items-start gap-2"><span>✓</span><span>Redeem at: {config.redeemLevel?.replace('_', ' ')}</span></div>
                  {config.requireOTPForRedemption && <div className="flex items-start gap-2"><span>✓</span><span>OTP required for redemption</span></div>}
                  <div className="flex items-start gap-2"><span>✓</span><span>Points mode: {config.pointsMode === 'priority' ? 'Best rule wins' : 'All rules add up'}</span></div>
                </div>
              </div>
            )}

            {/* Active Earning Rules */}
            <div>
              <SectionTitle title="Active Earning Rules" subtitle="Points you can earn on every purchase" />
              {earningRules.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                  <p className="text-4xl mb-3">🎯</p>
                  <p className="text-gray-500">No earning rules configured yet. Contact admin to set up rules.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {earningRules.map((rule, i) => (
                    <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 flex items-start gap-3 hover:border-indigo-300 transition-colors">
                      <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                        {rule.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold text-gray-900 leading-tight">{rule.title}</p>
                          {rule.badge && (
                            <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full flex-shrink-0">{rule.badge}</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{rule.subtitle}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Priority Order */}
            {config?.rulePriorityOrder && config.rulePriorityOrder.length > 0 && (
              <div>
                <SectionTitle title="Rule Priority Order" subtitle="When multiple rules match, the highest priority rule wins" />
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  {config.rulePriorityOrder.map((rule: string, i: number) => (
                    <div key={rule} className={`flex items-center gap-4 px-4 py-3 ${i < config.rulePriorityOrder.length - 1 ? 'border-b border-gray-100' : ''}`}>
                      <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                        {i + 1}
                      </div>
                      <span className="text-sm text-gray-700 font-medium capitalize">{rule.replace('_', ' ')}</span>
                      {i === 0 && <span className="ml-auto text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full">Highest</span>}
                      {i === config.rulePriorityOrder.length - 1 && <span className="ml-auto text-xs bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full">Lowest</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
