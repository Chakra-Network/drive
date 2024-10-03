import React, { useEffect, useState } from 'react';

interface DelayedComponentProps {
  children: React.ReactNode;
  // eslint-disable-next-line react/require-default-props
  delay?: number;
}

export default function DelayedComponent({ children, delay = 1000 }: DelayedComponentProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  if (!visible) {
    return null;
  }

  return children;
}
