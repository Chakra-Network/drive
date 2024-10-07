'use client';

import Notification from '@/app/components/common/Notification';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type NotificationParams = {
  title: string;
  message: string;
  type: 'success' | 'error';
};

type NotificationContextType = {
  setNotification: (params: NotificationParams) => void;
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notification, setNotificationState] = useState<NotificationParams | undefined>(undefined);
  const [visible, setVisible] = useState<boolean>(true);

  useEffect(() => {
    if (!visible) {
      const timeout = setTimeout(() => {
        setNotificationState(undefined);
      }, 1000);
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [visible]);

  useEffect(() => {
    if (notification) {
      setVisible(true);
      const timeout = setTimeout(() => {
        setVisible(false);
      }, 5000);

      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [notification]);

  const setNotification = useCallback((params: NotificationParams) => {
    setNotificationState(params);
  }, []);

  const contextValue = useMemo(() => ({ setNotification }), [setNotification]);

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      {notification && (
        <Notification
          title={notification.title}
          message={notification.message}
          type={notification.type}
          visible={visible}
        />
      )}
    </NotificationContext.Provider>
  );
}

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
};
