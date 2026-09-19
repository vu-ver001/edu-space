import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import './Tooltip.css';

interface TooltipProps {
  content?: React.ReactNode;
  children: React.ReactElement<any>;
  maxWidth?: number;
  placement?: 'top' | 'bottom' | 'auto';
  disabled?: boolean;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  maxWidth = 360,
  placement = 'auto',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; actualPlacement: 'top' | 'bottom' }>({
    top: 0,
    left: 0,
    actualPlacement: 'top',
  });

  const triggerRef = useRef<HTMLElement | null>(null);

  const calculatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();

    let actualPlacement: 'top' | 'bottom' = 'top';
    if (placement === 'auto') {
      actualPlacement = rect.top < 110 ? 'bottom' : 'top';
    } else {
      actualPlacement = placement;
    }

    // Horizontal center with bounds check
    const rawLeft = rect.left + rect.width / 2;
    const halfMax = maxWidth / 2;
    const padding = 16;
    const minLeft = halfMax + padding;
    const maxLeft = window.innerWidth - halfMax - padding;
    const left = Math.max(minLeft, Math.min(rawLeft, maxLeft));

    let top = 0;
    if (actualPlacement === 'top') {
      top = rect.top - 8;
    } else {
      top = rect.bottom + 8;
    }

    setCoords({ top, left, actualPlacement });
  }, [maxWidth, placement]);

  const handleMouseEnter = () => {
    if (disabled || !content) return;
    calculatePosition();
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    setIsOpen(false);
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleScrollOrResize = () => {
      setIsOpen(false);
    };

    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen]);

  const clonedChild = React.cloneElement(children, {
    ref: (node: HTMLElement | null) => {
      triggerRef.current = node;
      const { ref } = children as any;
      if (typeof ref === 'function') ref(node);
      else if (ref) (ref as React.MutableRefObject<any>).current = node;
    },
    onMouseEnter: (e: React.MouseEvent) => {
      handleMouseEnter();
      children.props.onMouseEnter?.(e);
    },
    onMouseLeave: (e: React.MouseEvent) => {
      handleMouseLeave();
      children.props.onMouseLeave?.(e);
    },
    onFocus: (e: React.FocusEvent) => {
      handleMouseEnter();
      children.props.onFocus?.(e);
    },
    onBlur: (e: React.FocusEvent) => {
      handleMouseLeave();
      children.props.onBlur?.(e);
    },
  });

  if (disabled || !content) {
    return children;
  }

  return (
    <>
      {clonedChild}
      {isOpen &&
        createPortal(
          <div
            className={`edu-portal-tooltip edu-tooltip-${coords.actualPlacement}`}
            style={{
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              maxWidth: `${maxWidth}px`,
            }}
            role="tooltip"
          >
            <div className="edu-tooltip-content">{content}</div>
            <div className="edu-tooltip-arrow" />
          </div>,
          document.body
        )}
    </>
  );
};
