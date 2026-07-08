import React from 'react';
import { AdSenseBanner } from './AdSenseBanner';
import { HtmlBanner } from './HtmlBanner';

interface BannerRendererProps {
  banners: any[];
  position: 'before_search' | 'after_search' | 'job_popup';
}

export function BannerRenderer({ banners, position }: BannerRendererProps) {
  const positionBanners = banners.filter(b => {
    if (position === 'before_search') {
      return b.position === 'before_search' || !b.position;
    }
    return b.position === position;
  });

  if (positionBanners.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-4 w-full">
      {positionBanners.map((banner) => (
        <div key={banner.id} className="w-full">
          {banner.type === 'adsense' ? (
            <AdSenseBanner 
              adClient={banner.adClient}
              adSlot={banner.adSlot}
              adFormat={banner.adFormat || 'auto'}
              fullWidthResponsive={banner.fullWidthResponsive !== false}
            />
          ) : banner.type === 'html' ? (
             <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-200 p-2">
               <HtmlBanner htmlCode={banner.htmlCode} />
             </div>
          ) : (
            <div className="w-full overflow-hidden rounded-2xl shadow-sm border border-gray-200 bg-white">
              {banner.linkUrl ? (
                <a href={banner.linkUrl} target="_blank" rel="noopener noreferrer" className="block w-full">
                  <img src={banner.imageUrl} alt="Advertisement" className="w-full h-auto max-h-48 object-cover" />
                </a>
              ) : (
                <img src={banner.imageUrl} alt="Advertisement" className="w-full h-auto max-h-48 object-cover" />
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
