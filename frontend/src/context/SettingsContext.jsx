import { createContext, useContext, useState, useEffect } from 'react';
import { getSettings } from '../services/cartService';

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSettings()
      .then((data) => {
        if (data && typeof data === 'object') {
          const settingsMap = {};
          if (Array.isArray(data)) {
            data.forEach(item => {
              if (item.key) settingsMap[item.key] = item.value;
            });
          } else if (data.settings && Array.isArray(data.settings)) {
            data.settings.forEach(item => {
              if (item.key) settingsMap[item.key] = item.value;
            });
          } else {
            Object.assign(settingsMap, data);
          }
          setSettings(settingsMap);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const showStock = settings.show_stock === '1' || settings.show_stock === 1 || settings.show_stock === true;

  const value = {
    settings,
    showStock,
    loading,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
