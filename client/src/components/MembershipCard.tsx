'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5056/api';

const TIER_STYLES: Record<string, { bg: string; border: string; badge: string; icon: string; textColor: string }> = {
  default: {
    bg: 'from-gray-700 to-gray-900',
    border: 'border-gray-500',
    badge: 'bg-gray-600',
    icon: '🏅',
    textColor: 'text-gray-100'
  },
  Silver: {
    bg: 'from-slate-400 to-slate-600',
    border: 'border-slate-300',
    badge: 'bg-slate-500',
    icon: '🥈',
    textColor: 'text-white'
  },
  Gold: {
    bg: 'from-yellow-500 to-amber-700',
    border: 'border-yellow-400',
    badge: 'bg-yellow-600',
    icon: '🥇',
    textColor: 'text-white'
  },
  Diamond: {
    bg: 'from-cyan-500 to-blue-700',
    border: 'border-cyan-400',
    badge: 'bg-cyan-600',
    icon: '💎',
    textColor: 'text-white'
  },
  Platinum: {
    bg: 'from-purple-500 to-purple-900',
    border: 'border-purple-400',
    badge: 'bg-purple-600',
    icon: '👑',
    textColor: 'text-white'
  },
};

interface MembershipCardProps {
  customerId: string;
}

export default function MembershipCard({ customerId }: MembershipCardProps) {
  const [membership, setMembership] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!customerId) return;
    fetch(`${API_BASE}/loyalty-program/my-membership/${customerId}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) setMembership(data.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [customerId]);

  if (loading) {
    return (
      <div className="rounded-2xl bg-gray-100 animate-pulse h-40 mb-6" />
    );
  }

  // No membership or expired
  if (!membership?.isActive) {
    return (
      <div className="mb-6 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gray-200 flex items-center justify-center text-2xl">🏅</div>
          <div>
            <p className="font-semibold text-gray-700">No Active Membership</p>
            <p className="text-sm text-gray-500 mt-0.5">
              {membership?.isExpired ? 'Your membership has expired.' : 'Upgrade to unlock exclusive discounts and rewards.'}
            </p>
          </div>
        </div>
        <Link
          href="/loyalty"
          className="flex-shrink-0 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-colors"
        >
          View Plans →
        </Link>
      </div>
    );
  }

  const tier = membership.tier;
  const expiry = membership.expiry ? new Date(membership.expiry) : null;
  const now = new Date();
  const daysLeft = expiry ? Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;
  const isExpiringSoon = daysLeft !== null && daysLeft <= 30;

  const style = TIER_STYLES[tier.name] || TIER_STYLES.default;

  return (
    <div className={`mb-6 rounded-2xl bg-gradient-to-br ${style.bg} border ${style.border} p-6 shadow-xl relative overflow-hidden`}>
      {/* Decorative circles */}
      <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10 pointer-events-none" />
      <div className="absolute -bottom-10 -right-4 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />

      <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Tier icon */}
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl shadow-inner flex-shrink-0">
            {style.icon}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-bold uppercase tracking-widest ${style.textColor} opacity-80`}>Current Plan</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${style.badge} text-white`}>
                Active
              </span>
            </div>
            <h3 className={`text-2xl font-extrabold ${style.textColor}`}>{tier.name} Member</h3>
            {tier.discountPercentage > 0 && (
              <p className={`text-sm mt-0.5 ${style.textColor} opacity-90`}>
                🎁 {tier.discountPercentage}% discount on all orders
              </p>
            )}
          </div>
        </div>

        {/* Expiry */}
        <div className={`text-right flex-shrink-0`}>
          {expiry && (
            <>
              <p className={`text-xs ${style.textColor} opacity-70 mb-1`}>
                {isExpiringSoon ? '⚠️ Expiring soon' : 'Valid until'}
              </p>
              <p className={`text-base font-bold ${style.textColor} ${isExpiringSoon ? 'animate-pulse' : ''}`}>
                {expiry.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
              {daysLeft !== null && (
                <p className={`text-xs mt-1 ${style.textColor} opacity-70`}>
                  {daysLeft} day{daysLeft !== 1 ? 's' : ''} remaining
                </p>
              )}
            </>
          )}
          <Link
            href="/loyalty"
            className={`inline-block mt-2 text-xs font-semibold underline underline-offset-2 ${style.textColor} opacity-80 hover:opacity-100 transition-opacity`}
          >
            Upgrade / Renew →
          </Link>
        </div>
      </div>

      {/* Benefits bar */}
      {tier.slabRules?.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/20 flex flex-wrap gap-3">
          {tier.slabRules.map((rule: any, i: number) => (
            <span key={i} className="px-3 py-1 rounded-full bg-white/15 text-white text-xs font-semibold backdrop-blur-sm">
              +{rule.value}{rule.pointType === 'percentage' ? '%' : ' pts'} on ₹{rule.saleStart}–₹{rule.saleEnd}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
