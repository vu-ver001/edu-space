import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';
import { Tooltip } from './Tooltip';
import './FilterSelect.css';

export interface FilterSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface FilterSelectProps {
  value: string;
  options: FilterSelectOption[];
  onChange: (value: string) => void;
  ariaLabel: string;
  className?: string;
  disabled?: boolean;
  title?: string;
}

interface MenuPosition {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
  openAbove: boolean;
}

export const FilterSelect = ({
  value,
  options,
  onChange,
  ariaLabel,
  className = '',
  disabled = false,
  title,
}: FilterSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const controlRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();
  const selectedOption = options.find((option) => option.value === value) ?? options[0];

  const updateMenuPosition = () => {
    const control = controlRef.current;
    if (!control) return;

    const rect = control.getBoundingClientRect();
    const viewportPadding = 8;
    const preferredHeight = Math.min(280, options.length * 40 + 12);
    const spaceBelow = window.innerHeight - rect.bottom - viewportPadding;
    const spaceAbove = rect.top - viewportPadding;
    const openAbove = spaceBelow < Math.min(180, preferredHeight) && spaceAbove > spaceBelow;
    const availableHeight = openAbove ? spaceAbove - 6 : spaceBelow - 6;
    const width = Math.min(Math.max(rect.width, 240), window.innerWidth - viewportPadding * 2);
    const left = Math.min(
      Math.max(viewportPadding, rect.left),
      window.innerWidth - width - viewportPadding,
    );

    setMenuPosition({
      top: openAbove ? rect.top - 6 : rect.bottom + 6,
      left,
      width,
      maxHeight: Math.max(120, Math.min(preferredHeight, availableHeight)),
      openAbove,
    });
  };

  useEffect(() => {
    if (!isOpen) return;

    updateMenuPosition();
    const closeOnOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!controlRef.current?.contains(target) && !menuRef.current?.contains(target)) {
        setIsOpen(false);
      }
    };
    const closeOnViewportChange = () => setIsOpen(false);

    document.addEventListener('mousedown', closeOnOutsideClick);
    window.addEventListener('resize', closeOnViewportChange);
    window.addEventListener('scroll', closeOnViewportChange);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      window.removeEventListener('resize', closeOnViewportChange);
      window.removeEventListener('scroll', closeOnViewportChange);
    };
  }, [isOpen, options.length]);

  useEffect(() => {
    if (!isOpen || !menuPosition) return;
    window.requestAnimationFrame(() => {
      menuRef.current
        ?.querySelector<HTMLElement>('[data-selected="true"]')
        ?.scrollIntoView({ block: 'nearest' });
    });
  }, [isOpen, menuPosition]);

  const chooseOption = (option: FilterSelectOption) => {
    if (option.disabled) return;
    onChange(option.value);
    setIsOpen(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setIsOpen((current) => !current);
      return;
    }
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;

    event.preventDefault();
    const enabledOptions = options.filter((option) => !option.disabled);
    const currentIndex = enabledOptions.findIndex((option) => option.value === value);
    const direction = event.key === 'ArrowDown' ? 1 : -1;
    const nextIndex = Math.min(
      enabledOptions.length - 1,
      Math.max(0, (currentIndex < 0 ? 0 : currentIndex) + direction),
    );
    if (!isOpen) setIsOpen(true);
    if (enabledOptions[nextIndex]) onChange(enabledOptions[nextIndex].value);
  };

  return (
    <div ref={controlRef} className={`filter-select-control ${disabled ? 'disabled' : ''} ${className}`.trim()}>
      <button
        type="button"
        className={`filter-select-trigger ${isOpen ? 'open' : ''}`}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        aria-expanded={isOpen}
        disabled={disabled}
        title={title}
        onClick={() => setIsOpen((current) => !current)}
        onKeyDown={handleKeyDown}
      >
        <Tooltip content={selectedOption?.label} maxWidth={420} onlyWhenOverflow>
          <span>{selectedOption?.label ?? ''}</span>
        </Tooltip>
        <ChevronDown size={16} />
      </button>

      {isOpen && menuPosition && createPortal(
        <div
          ref={menuRef}
          id={listboxId}
          className="filter-select-menu"
          role="listbox"
          aria-label={ariaLabel}
          style={{
            top: menuPosition.top,
            left: menuPosition.left,
            width: menuPosition.width,
            maxHeight: menuPosition.maxHeight,
            transform: menuPosition.openAbove ? 'translateY(-100%)' : undefined,
          }}
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === value}
              data-selected={option.value === value}
              className={`filter-select-option ${option.value === value ? 'selected' : ''}`}
              disabled={option.disabled}
              onClick={() => chooseOption(option)}
            >
              <Tooltip content={option.label} maxWidth={460} onlyWhenOverflow>
                <span>{option.label}</span>
              </Tooltip>
              {option.value === value && <Check size={16} />}
            </button>
          ))}
        </div>,
        document.body,
      )}
    </div>
  );
};
