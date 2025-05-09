import { forwardRef, type CSSProperties } from 'react';
import { classNames } from '~/utils/classNames';

// Extend CSS Properties type to allow custom properties
interface CustomCSSProperties extends CSSProperties {
  [key: `--${string}`]: string | number;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options?: Array<{
    value: string;
    label: string;
    disabled?: boolean;
  }>;
  optionsBgColor?: string;
  optionsTextColor?: string;
  activeOptionBgColor?: string;
  activeOptionTextColor?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ 
    className, 
    options = [], 
    optionsBgColor = 'bg-gray-900',
    optionsTextColor = 'text-white',
    activeOptionBgColor = 'bg-gray-700',
    activeOptionTextColor = 'text-white',
    ...props 
  }, ref) => {
    const styleId = 'custom-select-style';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.innerHTML = `
        select.custom-select option {
          background-color: var(--options-bg-color);
          color: var(--options-text-color);
        }
        select.custom-select option:checked {
          background-color: var(--active-option-bg-color);
          color: var(--active-option-text-color);
        }
      `;
      document.head.appendChild(style);
    }

    // Convert Tailwind classes to CSS variables
    const getBgColor = (twClass: string): string => {
      // This is a simplified approach - in a real implementation you'd need to map Tailwind classes to CSS colors
      const colorMap: Record<string, string> = {
        'bg-gray-900': '#111827',
        'bg-gray-700': '#374151',
        'bg-blue-600': '#2563eb',
      };
      return colorMap[twClass] || '#111827';
    };

    const getTextColor = (twClass: string): string => {
      const colorMap: Record<string, string> = {
        'text-white': '#ffffff',
        'text-gray-900': '#111827',
      };
      return colorMap[twClass] || '#ffffff';
    };

    return (
      <select
        className={classNames(
          'custom-select',
          'flex h-10 w-full rounded-md border border-alpha-white-10 bg-transparent px-3 py-2 text-sm ring-offset-transparent file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-none focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        ref={ref}
        style={{
          // Apply CSS variables for option styling
          '--options-bg-color': getBgColor(optionsBgColor),
          '--options-text-color': getTextColor(optionsTextColor),
          '--active-option-bg-color': getBgColor(activeOptionBgColor),
          '--active-option-text-color': getTextColor(activeOptionTextColor),
        } as CustomCSSProperties}
        {...props}
      >
        {options.map((option) => (
          <option 
            key={option.value} 
            value={option.value} 
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
        {props.children}
      </select>
    );
  }
);

Select.displayName = 'Select';

export { Select };