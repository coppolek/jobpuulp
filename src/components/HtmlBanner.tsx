import React, { useEffect, useRef } from 'react';

interface HtmlBannerProps {
  htmlCode: string;
}

export function HtmlBanner({ htmlCode }: HtmlBannerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      // Clear existing
      containerRef.current.innerHTML = '';
      
      try {
        // createContextualFragment allows executing script tags that are injected
        const fragment = document.createRange().createContextualFragment(htmlCode);
        containerRef.current.appendChild(fragment);
      } catch (err) {
        console.error('Error rendering HTML banner:', err);
        containerRef.current.innerHTML = htmlCode; // Fallback
      }
    }
  }, [htmlCode]);

  return <div ref={containerRef} className="w-full overflow-hidden" />;
}
