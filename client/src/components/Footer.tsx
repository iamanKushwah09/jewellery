'use client';

import Link from 'next/link';
import { Facebook, Twitter, Instagram, Youtube, Send, Mail, Phone, MapPin, Diamond } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    company: [
      { name: 'About Us', href: '/about' },
      { name: 'Contact', href: '/contact' },
    ],
    support: [
      { name: 'Shipping Info', href: '/shipping' },
      { name: 'Returns & Exchange', href: '/returns' },
    ],
    legal: [
      { name: 'Privacy Policy', href: '/privacy' },
      { name: 'Terms of Service', href: '/terms' },
      { name: 'Accessibility', href: '/accessibility' },
    ],
  };

  const socialLinks = [
    { name: 'Facebook', href: '#', icon: Facebook },
    { name: 'Twitter', href: '#', icon: Twitter },
    { name: 'Instagram', href: '#', icon: Instagram },
    { name: 'YouTube', href: '#', icon: Youtube },
  ];

  const trustBadges = [
    { label: 'BIS Hallmarked', sub: 'Pure gold certified' },
    { label: '22K / 18K Gold', sub: 'Premium purity' },
    { label: 'Free Returns', sub: '15-day exchange' },
  ];

  return (
    <footer
      className="relative text-white overflow-hidden border-t"
      style={{
        background: 'linear-gradient(to bottom, #1A1209, #0D0A04)',
        borderColor: 'rgba(201,146,10,0.2)',
      }}
    >
      {/* Decorative Gold Glow */}
      <div
        className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl -translate-y-1/2 pointer-events-none"
        style={{ background: 'rgba(201,146,10,0.06)' }}
      />
      <div
        className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full blur-3xl translate-y-1/3 pointer-events-none"
        style={{ background: 'rgba(107,26,26,0.08)' }}
      />

      {/* Gold Divider Line at Top */}
      <div
        className="h-px w-full"
        style={{ background: 'linear-gradient(90deg, transparent, #C9920A, #E8B84B, #C9920A, transparent)' }}
      />

      {/* Trust Badges Row */}
      <div
        className="border-b"
        style={{ borderColor: 'rgba(201,146,10,0.12)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="grid grid-cols-3 gap-4 md:gap-8">
            {trustBadges.map((badge, i) => (
              <div key={i} className="flex items-center gap-2 sm:gap-3 justify-center">
                <Diamond className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" style={{ color: '#C9920A' }} />
                <div>
                  <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-white">{badge.label}</p>
                  <p className="text-[9px] sm:text-[10px] tracking-wide" style={{ color: 'rgba(201,146,10,0.7)' }}>{badge.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8">

          {/* Brand & Contact Info */}
          <div className="lg:col-span-4 flex flex-col">
            <div className="flex flex-col mb-6">
              {/* Logo / Brand */}
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-10 h-10 flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #8B6508, #C9920A)', borderRadius: '2px' }}
                >
                  <Diamond className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span
                    className="block text-xl font-bold tracking-[0.12em] text-white uppercase"
                    style={{ fontFamily: '"Cormorant Garamond", Georgia, serif', letterSpacing: '0.18em' }}
                  >
                    Vellora
                  </span>
                  <span className="block text-[9px] tracking-[0.35em] uppercase" style={{ color: '#C9920A' }}>
                    JEWELS
                  </span>
                </div>
              </div>
              <p
                className="text-xs italic tracking-widest mt-1"
                style={{ color: 'rgba(232, 184, 75, 0.7)', fontFamily: '"Cormorant Garamond", Georgia, serif' }}
              >
                "Crafting Moments, Forever."
              </p>
            </div>

            <div className="text-gray-400 space-y-4 text-sm leading-relaxed">
              <p className="flex items-start gap-3 group">
                <MapPin className="w-5 h-5 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" style={{ color: '#C9920A' }} />
                <span>Vellora Jewels, MG Road,<br />Connaught Place, New Delhi — 110001</span>
              </p>
              <p className="flex items-center gap-3 group">
                <Phone className="w-5 h-5 shrink-0 group-hover:scale-110 transition-transform" style={{ color: '#C9920A' }} />
                <span>+91 11 4321 8765 / +91 98765 43210</span>
              </p>
              <p className="flex items-center gap-3 group">
                <Mail className="w-5 h-5 shrink-0 group-hover:scale-110 transition-transform" style={{ color: '#C9920A' }} />
                <a
                  href="mailto:hello@Vellorajewels.com"
                  className="transition-colors hover:text-amber-400"
                >
                  hello@Vellorajewels.com
                </a>
              </p>
            </div>
          </div>

          {/* Links Section */}
          <div className="lg:col-span-4 grid grid-cols-2 sm:grid-cols-3 gap-8">
            {/* Company */}
            <div>
              <h3
                className="text-sm font-bold tracking-wider mb-6 uppercase"
                style={{ color: '#C9920A' }}
              >
                Company
              </h3>
              <ul className="space-y-3">
                {footerLinks.company.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-gray-400 text-sm hover:text-amber-400 transition-all hover:translate-x-1 inline-block"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            {/* Support */}
            <div>
              <h3
                className="text-sm font-bold tracking-wider mb-6 uppercase"
                style={{ color: '#C9920A' }}
              >
                Support
              </h3>
              <ul className="space-y-3">
                {footerLinks.support.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-gray-400 text-sm hover:text-amber-400 transition-all hover:translate-x-1 inline-block"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Newsletter Section */}
          <div className="lg:col-span-4 flex flex-col">
            <h3
              className="text-sm font-bold tracking-wider mb-4 uppercase"
              style={{ color: '#C9920A' }}
            >
              Stay Updated
            </h3>
            <p className="text-gray-400 mb-6 text-sm leading-relaxed">
              Subscribe to discover exclusive jewellery collections, festive offers, and handcrafted new arrivals.
            </p>
            <form className="relative group" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="Enter your email address..."
                className="w-full px-5 py-3.5 border outline-none transition-all backdrop-blur-sm text-white placeholder-gray-500 text-sm"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  borderColor: 'rgba(201,146,10,0.25)',
                  borderRadius: '0',
                  outline: 'none',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#C9920A')}
                onBlur={(e) => (e.target.style.borderColor = 'rgba(201,146,10,0.25)')}
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1.5 bottom-1.5 px-4 text-white flex items-center justify-center transition-colors active:scale-95"
                style={{ background: 'linear-gradient(135deg, #8B6508, #C9920A)', borderRadius: '0' }}
                aria-label="Subscribe"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            {/* Social Links */}
            <div className="flex items-center space-x-4 mt-8">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.name}
                    href={social.href}
                    className="w-10 h-10 flex items-center justify-center text-gray-400 transition-all hover:text-white border"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      borderColor: 'rgba(201,146,10,0.2)',
                      borderRadius: '0',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = '#C9920A';
                      (e.currentTarget as HTMLElement).style.borderColor = '#C9920A';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
                      (e.currentTarget as HTMLElement).style.borderColor = 'rgba(201,146,10,0.2)';
                    }}
                    aria-label={social.name}
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          className="mt-14 pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4"
          style={{ borderColor: 'rgba(201,146,10,0.12)' }}
        >
          <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 text-sm text-gray-500">
            <p>
              © {currentYear} Vellora Jewels. All rights reserved.
            </p>
            <span className="hidden md:inline-block w-1 h-1 rounded-full bg-gray-700" />
            <p>
              Developed by{' '}
              <a
                href="https://logicfirst.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-amber-400 font-semibold transition-colors tracking-wide text-white"
              >
                Logicfirst
              </a>
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span
              className="text-sm tracking-wide italic"
              style={{
                fontFamily: '"Cormorant Garamond", Georgia, serif',
                color: '#C9920A',
              }}
            >
              Crafting Moments, Forever.
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}