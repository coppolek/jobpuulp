import React, { useEffect, useRef } from 'react';
import { Percent } from 'lucide-react';

interface AdSenseBannerProps {
  adClient: string;
  adSlot: string;
  adFormat?: string;
  fullWidthResponsive?: boolean;
  style?: React.CSSProperties;
  isPreview?: boolean;
}

export function AdSenseBanner({
  adClient,
  adSlot,
  adFormat = 'auto',
  fullWidthResponsive = true,
  style = { display: 'block', minHeight: '90px' },
  isPreview = false
}: AdSenseBannerProps) {
  const adRef = useRef<HTMLModElement>(null);
  const initiated = useRef(false);

  useEffect(() => {
    if (isPreview) return;

    // 1. Ensure the AdSense script is in the document
    const scriptId = 'adsense-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adClient}`;
      script.async = true;
      script.crossOrigin = 'anonymous';
      document.head.appendChild(script);
    }

    // 2. Initialize the ad unit
    const timer = setTimeout(() => {
      if (!initiated.current && adRef.current) {
        try {
          const adsbygoogle = (window as any).adsbygoogle || [];
          adsbygoogle.push({});
          initiated.current = true;
        } catch (err) {
          console.warn('AdSense push error:', err);
        }
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [adClient, adSlot, isPreview]);

  // If in preview or local development mode, render a high-fidelity visual mock of the AdSense unit
  const isDev = window.location.hostname === 'localhost' || window.location.hostname.includes('run.app');
  
  if (isPreview || isDev) {
    return (
      <div className="w-full overflow-hidden rounded-xl border border-dashed border-amber-300 bg-amber-50/50 p-4 transition-all hover:border-amber-400">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-amber-100 pb-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded bg-amber-500 text-[10px] font-bold text-white uppercase">Ad</span>
            <span className="text-xs font-semibold text-amber-800 tracking-wide uppercase font-mono">Google AdSense Unit</span>
          </div>
          <div className="text-[10px] font-mono text-amber-600 bg-amber-100 px-2 py-0.5 rounded">
            Format: {adFormat} &bull; Responsive: {fullWidthResponsive ? 'Yes' : 'No'}
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-3">
          <div className="space-y-1">
            <div className="text-xs font-medium text-gray-500">Publisher ID</div>
            <div className="text-sm font-mono font-semibold text-gray-800">{adClient || 'ca-pub-XXXXXXXXXXXXXXXX'}</div>
          </div>
          <div className="space-y-1">
            <div className="text-xs font-medium text-gray-500">Ad Slot ID</div>
            <div className="text-sm font-mono font-semibold text-gray-800">{adSlot || 'XXXXXXXXXX'}</div>
          </div>
          <div className="text-xs text-amber-700 italic bg-white border border-amber-100 rounded-lg px-3 py-1.5 shadow-sm max-w-xs">
            {isPreview ? 'Preview of live Google AdSense placeholder.' : 'AdSense active (placeholder displayed in Dev/Preview mode).'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-xl bg-white border border-gray-100 p-2 my-4 shadow-sm">
      <div className="text-[9px] font-semibold text-gray-400 mb-1 tracking-wider uppercase text-right mr-2">Advertisement</div>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={style}
        data-ad-client={adClient}
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive={fullWidthResponsive ? "true" : "false"}
      />
    </div>
  );
}
