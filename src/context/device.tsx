'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type DeviceType = {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
};

const DeviceContext = createContext<DeviceType | undefined>(undefined);

export function DeviceProvider({ children }: { children: React.ReactNode }) {
  const [device, setDevice] = useState<DeviceType>({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
  });

  const updateDevice = () => {
    const width = window.innerWidth;
    setDevice({
      isMobile: width < 768,
      isTablet: width >= 768 && width <= 1024,
      isDesktop: width > 1024,
    });
  };

  useEffect(() => {
    updateDevice();
    window.addEventListener('resize', updateDevice);
    return () => window.removeEventListener('resize', updateDevice);
  }, []);

  return <DeviceContext.Provider value={device}>{children}</DeviceContext.Provider>;
}

export const useDevice = () => {
  const context = useContext(DeviceContext);
  if (context === undefined) {
    throw new Error('useDevice must be used within a DeviceProvider');
  }
  return context;
};
