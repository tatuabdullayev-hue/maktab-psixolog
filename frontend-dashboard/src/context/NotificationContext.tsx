import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '../api/client';

interface NotificationContextValue {
  unattended: number;
  refresh: () => void;
}

const NotificationContext = createContext<NotificationContextValue>({
  unattended: 0,
  refresh: () => {},
});

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [unattended, setUnattended] = useState(0);

  const refresh = useCallback(() => {
    api
      .get('/notes/unattended-count', {
        params: { school: '53-maktab', district: 'Chortoq tumani' },
      })
      .then(({ data }) => setUnattended(data.count ?? 0))
      .catch(() => {});
  }, []);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 60_000);
    return () => clearInterval(timer);
  }, [refresh]);

  return (
    <NotificationContext.Provider value={{ unattended, refresh }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
