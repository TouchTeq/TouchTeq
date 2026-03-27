'use client';

export function getMapUrl(address: string): string {
  const encodedAddress = encodeURIComponent(address);
  
  if (typeof navigator !== 'undefined') {
    const isApple = /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);
    if (isApple) {
      return `https://maps.apple.com/?q=${encodedAddress}`;
    }
  }
  
  return `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
}

export function openMap(address: string): void {
  window.open(getMapUrl(address), '_blank', 'noopener,noreferrer');
}

export const COMPANY_ADDRESS = '91 Sir George Grey St, Horizon, Roodepoort, 1724';
