import React, { createContext, useContext, useEffect, useState } from 'react';
import { API_URL, ENDPOINTS, WASTE_TYPES, POINTS_PER_KG, CASH_PER_KG } from '@/constants/config';

export interface WasteCategory {
  label: string;
  value: string;
  icon: string;
  color: string;
}

interface AppConfig {
  wasteCategories: WasteCategory[];
  pointsPerKg: Record<string, number>;
  cashPerKg: Record<string, number>;
  maxOfferImages: number;
  maxVideoDuration: number;
}

const DEFAULTS: AppConfig = {
  wasteCategories:  WASTE_TYPES,
  pointsPerKg:      POINTS_PER_KG,
  cashPerKg:        CASH_PER_KG,
  maxOfferImages:   6,
  maxVideoDuration: 60,
};

const AppConfigContext = createContext<AppConfig>(DEFAULTS);

export function AppConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<AppConfig>(DEFAULTS);

  useEffect(() => {
    fetch(`${API_URL}${ENDPOINTS.APP_CONFIG}`)
      .then(r => r.json())
      .then(res => {
        if (!res.success) return;
        const d = res.data;
        setConfig({
          wasteCategories:  d.waste_categories  ?? DEFAULTS.wasteCategories,
          pointsPerKg:      d.points_per_kg     ?? DEFAULTS.pointsPerKg,
          cashPerKg:        d.cash_per_kg       ?? DEFAULTS.cashPerKg,
          maxOfferImages:   d.max_offer_images  ?? DEFAULTS.maxOfferImages,
          maxVideoDuration: d.max_video_duration ?? DEFAULTS.maxVideoDuration,
        });
      })
      .catch(() => {}); // keep defaults on network error
  }, []);

  return <AppConfigContext.Provider value={config}>{children}</AppConfigContext.Provider>;
}

export const useAppConfig = () => useContext(AppConfigContext);
