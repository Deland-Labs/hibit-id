import { forwardRef, HTMLAttributes } from "react";
import { twMerge } from "tailwind-merge";
import SvgCopy from '../assets/copy.svg?react';

export interface CopyButtonProps extends HTMLAttributes<HTMLButtonElement> {
  copyText: string
}

const CopyButton = forwardRef<HTMLButtonElement, CopyButtonProps>(({ copyText, className, ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={twMerge('btn btn-ghost btn-xs btn-square p-0', className)}
      {...props}
      onClick={() => {
        navigator.clipboard.writeText(copyText ?? '');
        alert('copied')
      }}
    >
      <SvgCopy className="size-full" />
    </button>
  )
})

export default CopyButton;
