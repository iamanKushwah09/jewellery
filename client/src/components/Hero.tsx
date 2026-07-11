'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const heroSlides = [
  {
    id: 1,
    tag: "TIMELESS ELEGANCE",
    title: "Finest Gold Collections",
    subtitle: "Crafted with 22K hallmarked gold — each piece a testament to unmatched artistry and enduring beauty",
    cta: "Explore Gold Jewellery",
    link: "/",
    image: "/images/hero/hero1.png",
    bg: "bg-gradient-to-r from-black/70 via-black/40 to-transparent",
    accentColor: "#C9920A",
  },
  {
    id: 2,
    tag: "BRIDAL COLLECTIONS",
    title: "Your Dream Bridal Set",
    subtitle: "Adorn your most precious moments with our handcrafted bridal jewellery — timeless, radiant and unforgettable",
    cta: "Shop Bridal Jewellery",
    link: "/",
    image: "/images/hero/hero2.png",
    bg: "bg-gradient-to-r from-[#4A1010]/80 via-[#6B1A1A]/40 to-transparent",
    accentColor: "#E8B84B",
  },
  {
    id: 3,
    tag: "DIAMOND SOLITAIRES",
    title: "Pure Diamond Brilliance",
    subtitle: "Certified diamonds of unparalleled brilliance — for moments that deserve nothing but the very best",
    cta: "Discover Diamonds",
    link: "/",
    image: "/images/hero/hero3.png",
    bg: "bg-gradient-to-r from-black/75 via-gray-900/40 to-transparent",
    accentColor: "#F5E6C8",
  },
];

export default function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const goToSlide = (index: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentSlide(index);
    setTimeout(() => setIsTransitioning(false), 800);
  };

  const nextSlide = () => goToSlide((currentSlide + 1) % heroSlides.length);
  const prevSlide = () => goToSlide((currentSlide - 1 + heroSlides.length) % heroSlides.length);

  return (
    <section className="relative w-full overflow-hidden" style={{ height: 'clamp(480px, 65vw, 750px)' }}>
      {heroSlides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
            index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
        >
          {/* Background Image */}
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url(${slide.image})`,
              transform: index === currentSlide ? 'scale(1)' : 'scale(1.05)',
              transition: 'transform 8s ease-out',
            }}
          />
          {/* Gradient Overlay */}
          <div className={`absolute inset-0 ${slide.bg}`} />

          {/* Gold border line at bottom */}
          <div
            className="absolute bottom-0 left-0 right-0 h-1"
            style={{ background: `linear-gradient(90deg, transparent, ${slide.accentColor}, transparent)` }}
          />

          {/* Content */}
          <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-12 lg:px-20 max-w-7xl mx-auto">
            <div className="max-w-3xl">
              {/* Tag */}
              <div className="inline-flex items-center mb-4 sm:mb-6">
                <div className="h-px w-8 sm:w-12 mr-3" style={{ background: slide.accentColor }} />
                <span
                  className="text-[10px] sm:text-xs font-bold tracking-[0.25em] sm:tracking-[0.4em] uppercase"
                  style={{ color: slide.accentColor }}
                >
                  {slide.tag}
                </span>
                <div className="h-px w-8 sm:w-12 ml-3" style={{ background: slide.accentColor }} />
              </div>

              {/* Title */}
              <h1
                className="text-4xl sm:text-6xl md:text-7xl font-bold text-white tracking-tight leading-none mb-4 sm:mb-6 drop-shadow-2xl"
                style={{ fontFamily: 'var(--font-cormorant), "Cormorant Garamond", Georgia, serif', fontStyle: 'italic' }}
              >
                {slide.title}
              </h1>

              {/* Subtitle */}
              <p className="text-sm sm:text-lg md:text-xl text-white/85 font-light tracking-wide mb-8 sm:mb-10 drop-shadow-lg max-w-2xl leading-relaxed">
                {slide.subtitle}
              </p>

              {/* CTA Button */}
              <Link
                href={slide.link}
                className="inline-flex items-center gap-3 px-8 sm:px-12 py-4 sm:py-5 font-semibold text-sm sm:text-base uppercase tracking-[0.2em] transition-all active:scale-95 shadow-2xl group"
                style={{
                  background: `linear-gradient(135deg, ${slide.accentColor}, #8B6508)`,
                  color: 'white',
                  borderRadius: '0',
                }}
              >
                {slide.cta}
                <span className="transform group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/25 backdrop-blur-md text-white p-3 sm:p-4 transition-all z-20 border border-white/20 hover:border-white/40"
        style={{ borderRadius: '0' }}
      >
        <ChevronLeftIcon className="h-5 w-5 sm:h-7 sm:w-7" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/25 backdrop-blur-md text-white p-3 sm:p-4 transition-all z-20 border border-white/20 hover:border-white/40"
        style={{ borderRadius: '0' }}
      >
        <ChevronRightIcon className="h-5 w-5 sm:h-7 sm:w-7" />
      </button>

      {/* Slide Counter & Dots */}
      <div className="absolute bottom-6 sm:bottom-10 left-6 sm:left-12 lg:left-20 flex items-center space-x-4 z-20">
        <span className="text-white/60 text-xs font-bold tracking-widest">
          {String(currentSlide + 1).padStart(2, '0')} / {String(heroSlides.length).padStart(2, '0')}
        </span>
        <div className="flex space-x-2">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className="transition-all duration-500"
              style={{
                height: '2px',
                width: index === currentSlide ? '32px' : '12px',
                background: index === currentSlide
                  ? heroSlides[currentSlide].accentColor
                  : 'rgba(255,255,255,0.4)',
                border: 'none',
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}