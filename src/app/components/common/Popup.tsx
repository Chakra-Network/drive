import React, { useCallback, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';

type PopupProps = {
  children: React.ReactNode;
  zIndex: number;
  alignItems: 'start' | 'center' | 'end' | 'none';
  onClose: () => void;
};

export default function Popup({ children, zIndex, alignItems, onClose }: PopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    const popupElement = popupRef.current;
    if (popupElement) {
      popupElement.focus();
    }

    // Add event listener for Escape key
    const handleEscape = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);

    // Clean up
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  if (typeof window !== 'object') {
    return (
      <div
        role="presentation"
        className="fixed inset-0 bg-black bg-opacity-30 flex justify-center backdrop-blur-sm w-screen h-screen"
        style={{ zIndex, alignItems }}
        onClick={handleBackdropClick}
      >
        <div
          ref={popupRef}
          role="dialog"
          aria-modal="true"
          className="focus:outline-none"
          tabIndex={-1}
        >
          {children}
        </div>
      </div>
    );
  }

  return ReactDOM.createPortal(
    <div
      role="presentation"
      className="fixed inset-0 bg-black bg-opacity-30 flex justify-center backdrop-blur-sm w-screen h-screen"
      style={{ zIndex, alignItems }}
      onClick={handleBackdropClick}
    >
      <div
        ref={popupRef}
        role="dialog"
        aria-modal="true"
        className="focus:outline-none"
        tabIndex={-1}
      >
        {children}
      </div>
    </div>,
    document === undefined ? new Element() : document.body
  );
}
