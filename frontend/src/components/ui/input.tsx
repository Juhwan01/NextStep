import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", label, error, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm text-white/60 font-medium">{label}</label>
        )}
        <input
          ref={ref}
          className={`w-full px-4 py-3 bg-white/5 backdrop-blur-[8px] border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-[#00d4ff]/50 focus:shadow-[0_0_15px_rgba(0,212,255,0.15)] transition-all duration-300 ${error ? "border-red-500/50" : ""} ${className}`}
          {...props}
        />
        {error && <span className="text-sm text-red-400">{error}</span>}
      </div>
    );
  }
);

Input.displayName = "Input";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = "", label, error, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm text-white/60 font-medium">{label}</label>
        )}
        <textarea
          ref={ref}
          className={`w-full px-4 py-3 bg-white/5 backdrop-blur-[8px] border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-[#00d4ff]/50 focus:shadow-[0_0_15px_rgba(0,212,255,0.15)] transition-all duration-300 resize-none ${error ? "border-red-500/50" : ""} ${className}`}
          {...props}
        />
        {error && <span className="text-sm text-red-400">{error}</span>}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

export { Input, Textarea };
export type { InputProps, TextareaProps };
