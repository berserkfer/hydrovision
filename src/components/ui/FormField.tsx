import { cn } from "@/lib/utils";

interface FormFieldProps {
  id: string;
  label: string;
  children: React.ReactNode;
  required?: boolean;
  className?: string;
}

export function FormField({ id, label, children, required, className }: FormFieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputClassName = cn(
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 shadow-sm",
  "outline-none transition-all duration-200",
  "hover:border-slate-300 hover:shadow-md",
  "focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/25",
  "disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
);

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
}

export function TextInput({ id, className, ...props }: TextInputProps) {
  return <input id={id} className={cn(inputClassName, className)} {...props} />;
}

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  id: string;
}

export function TextArea({ id, className, ...props }: TextAreaProps) {
  return (
    <textarea
      id={id}
      className={cn(
        "min-h-[88px] w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm",
        "outline-none transition-all duration-200",
        "hover:border-slate-300 hover:shadow-md",
        "focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/25",
        className
      )}
      {...props}
    />
  );
}

export { inputClassName };
