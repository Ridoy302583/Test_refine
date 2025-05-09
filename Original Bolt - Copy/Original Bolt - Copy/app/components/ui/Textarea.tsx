import { forwardRef } from 'react';
import { classNames } from '~/utils/classNames';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  rows?: number;
  multiline?: boolean;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, rows = 3, multiline = true, ...props }, ref) => {
    // If multiline is false, force rows to 1
    const effectiveRows = multiline ? rows : 1;
    
    return (
      <textarea
        rows={effectiveRows}
        className={classNames(
          'flex w-full rounded-md border border-alpha-white-10 bg-transparent px-3 py-2 text-sm ring-offset-transparent placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-none focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50',
          multiline === false ? 'overflow-hidden resize-none' : '',
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';

export { Textarea };