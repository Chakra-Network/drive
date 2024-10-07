import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DelayedComponentProps {
  children: React.ReactNode;
  // eslint-disable-next-line react/require-default-props
  delay?: number;
  // eslint-disable-next-line react/require-default-props
  fadeDuration?: number;
  // eslint-disable-next-line react/require-default-props
  className?: string;
}

export default function DelayedComponent({
  children,
  delay = 1000,
  fadeDuration = 0.3,
  className = '',
}: DelayedComponentProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: fadeDuration }}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
