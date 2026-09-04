import React, { useRef } from 'react';
import { Calendar } from 'lucide-react';
import { formatToYYYYMMDD } from '../services/api';

/**
 * DateInput component that guarantees display as Year-Month-Date (YYYY-MM-DD)
 * regardless of OS/browser regional settings, with a clickable calendar picker button.
 */
export default function DateInput({
  name,
  value,
  onChange,
  required = false,
  placeholder = 'YYYY-MM-DD',
  min,
  max,
  className = '',
  disabled = false
}) {
  const hiddenDateInputRef = useRef(null);
  const formattedValue = formatToYYYYMMDD(value) || value || '';

  const handleTextChange = (e) => {
    const rawVal = e.target.value;
    onChange({
      target: {
        name,
        value: rawVal
      }
    });
  };

  const handleBlur = (e) => {
    const rawVal = e.target.value;
    const formatted = formatToYYYYMMDD(rawVal);
    if (formatted !== rawVal) {
      onChange({
        target: {
          name,
          value: formatted
        }
      });
    }
  };

  const handleCalendarChange = (e) => {
    const selectedDate = e.target.value;
    if (selectedDate) {
      onChange({
        target: {
          name,
          value: formatToYYYYMMDD(selectedDate)
        }
      });
    }
  };

  const openCalendarPicker = () => {
    if (hiddenDateInputRef.current && !disabled) {
      if (typeof hiddenDateInputRef.current.showPicker === 'function') {
        try {
          hiddenDateInputRef.current.showPicker();
          return;
        } catch (e) {}
      }
      hiddenDateInputRef.current.focus();
      hiddenDateInputRef.current.click();
    }
  };

  return (
    <div
      className={"date-input-wrapper " + className}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        width: '100%'
      }}
    >
      <input
        type="text"
        name={name}
        required={required}
        placeholder={placeholder}
        value={formattedValue}
        disabled={disabled}
        onChange={handleTextChange}
        onBlur={handleBlur}
        pattern="^\d{4}-\d{2}-\d{2}$"
        title="Format: YYYY-MM-DD (Year-Month-Date)"
        style={{
          width: '100%',
          paddingRight: '2.5rem',
          fontFamily: 'inherit',
          boxSizing: 'border-box'
        }}
      />
      <button
        type="button"
        onClick={openCalendarPicker}
        disabled={disabled}
        tabIndex={-1}
        title="Choose date from calendar"
        style={{
          position: 'absolute',
          right: '0.65rem',
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'none',
          border: 'none',
          padding: '0.2rem',
          cursor: disabled ? 'not-allowed' : 'pointer',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '4px'
        }}
      >
        <Calendar size={18} />
      </button>
      <input
        ref={hiddenDateInputRef}
        type="date"
        tabIndex={-1}
        aria-hidden="true"
        min={min}
        max={max}
        value={/^\d{4}-\d{2}-\d{2}$/.test(formattedValue) ? formattedValue : ''}
        onChange={handleCalendarChange}
        style={{
          position: 'absolute',
          opacity: 0,
          pointerEvents: 'none',
          width: 0,
          height: 0,
          bottom: 0,
          right: '1rem',
          border: 0,
          padding: 0
        }}
      />
    </div>
  );
}
