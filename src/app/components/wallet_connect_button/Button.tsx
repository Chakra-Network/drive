import React from 'react';
import type { CSSProperties, MouseEvent, PropsWithChildren, ReactElement } from 'react';

export interface ButtonProps
  extends PropsWithChildren<{
    className?: string;
    disabled?: boolean;
    endIcon?: ReactElement;
    onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
    startIcon?: ReactElement;
    style?: CSSProperties;
    tabIndex?: number;
  }> {}

export function Button({
  className = '',
  disabled = false,
  endIcon,
  onClick,
  startIcon,
  style,
  tabIndex = 0,
  children,
}: ButtonProps): React.ReactElement {
  return (
    <button
      className={`chakra-wallet-adapter-button ${className}`}
      disabled={disabled}
      style={style}
      onClick={onClick}
      tabIndex={tabIndex}
      type="button"
    >
      {startIcon && <div className="wallet-adapter-button-start-icon">{startIcon}</div>}
      {children}
      {endIcon && <i className="wallet-adapter-button-end-icon">{endIcon}</i>}
    </button>
  );
}
