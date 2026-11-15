import { KeyboardEvent, useEffect, useRef, useState } from 'react';

/** Single option rendered by {@link Select}. */
export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  /** DOM id of the trigger button; the value span gets `${id}-value`. */
  id: string;
  /** Id of the external label element that names the control. */
  labelId: string;
  options: SelectOption[];
  /** Currently selected value; an empty string or unknown value shows the placeholder. */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

/**
 * Styled listbox select (`custom-select`) with keyboard navigation and outside-click closing.
 * Opens only when there is at least one option.
 */
export function Select({ id, labelId, options, value, onChange, placeholder = '' }: SelectProps) {
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const listboxRef = useRef<HTMLUListElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const selectedOption = options.find((option) => option.value === value);
  const valueId = `${id}-value`;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target;

      if (!(target instanceof Node)) {
        return;
      }

      if (triggerRef.current?.contains(target) || listboxRef.current?.contains(target)) {
        return;
      }

      setIsOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);

    return () => {
      document.removeEventListener('mousedown', onPointerDown);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !listboxRef.current) {
      return;
    }

    const activeElement = listboxRef.current.querySelector<HTMLElement>(`[data-option-index="${activeIndex}"]`);
    activeElement?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, isOpen]);

  const open = () => {
    if (options.length === 0) {
      return;
    }

    const selectedIndex = options.findIndex((option) => option.value === value);
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
  };

  const moveActive = (direction: -1 | 1) => {
    if (options.length === 0) {
      return;
    }

    setActiveIndex((currentIndex) => {
      const lastIndex = options.length - 1;

      if (direction === 1) {
        return currentIndex >= lastIndex ? 0 : currentIndex + 1;
      }

      return currentIndex <= 0 ? lastIndex : currentIndex - 1;
    });
  };

  const choose = (nextValue: string) => {
    onChange(nextValue);
    close();
    triggerRef.current?.focus();
  };

  const chooseActive = () => {
    const option = options[activeIndex];
    if (option) {
      choose(option.value);
    }
  };

  const handleTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();

      if (!isOpen) {
        open();
        return;
      }

      moveActive(event.key === 'ArrowDown' ? 1 : -1);
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();

      if (!isOpen) {
        open();
        return;
      }

      chooseActive();
      return;
    }

    if (event.key === 'Escape') {
      close();
    }
  };

  const handleListboxKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      moveActive(event.key === 'ArrowDown' ? 1 : -1);
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      chooseActive();
      return;
    }

    if (event.key === 'Escape') {
      close();
      triggerRef.current?.focus();
    }
  };

  return (
    <div className="custom-select">
      <button
        id={id}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-labelledby={`${labelId} ${valueId}`}
        className="text-input custom-select__trigger"
        onClick={() => (isOpen ? close() : open())}
        onKeyDown={handleTriggerKeyDown}
        ref={triggerRef}
        type="button"
      >
        <span className={selectedOption ? undefined : 'custom-select__placeholder'} id={valueId}>
          {selectedOption?.label ?? placeholder}
        </span>
        <span aria-hidden="true" className="custom-select__arrow">▼</span>
      </button>

      <ul
        aria-labelledby={labelId}
        className="custom-select__options"
        hidden={!isOpen}
        onKeyDown={handleListboxKeyDown}
        ref={listboxRef}
        role="listbox"
        tabIndex={-1}
      >
        {options.map((option, index) => (
          <li
            aria-selected={option.value === value}
            className={activeIndex === index ? 'is-active' : undefined}
            data-option-index={index}
            key={option.value}
            onClick={() => choose(option.value)}
            onMouseEnter={() => setActiveIndex(index)}
            role="option"
          >
            {option.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
