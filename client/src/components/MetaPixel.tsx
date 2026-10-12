'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { fbPixel } from '../lib/fbPixel';

/**
 * MetaPixel — Client component for Facebook/Meta Pixel.
 * 
 * Responsibilities:
 * 1. Initializes the pixel script on first mount
 * 2. Fires PageView on every route change (SPA navigation)
 * 3. Skips initialization if Pixel ID is not configured
 * 
 * Place this component inside your root layout, wrapped in <Suspense>.
 */
export default function MetaPixel() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize pixel once on mount
  useEffect(() => {
    fbPixel.initPixel();
    // Fire initial PageView after init
    fbPixel.pageView();
  }, []);

  // Track page views on route changes
  useEffect(() => {
    fbPixel.pageView();
  }, [pathname, searchParams]);

  return null;
}
