'use client';

import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
interface SelectContextValue {
    value: string;
    onValueChange: (value: string) => void;
    open: boolean;
    setOpen: (open: boolean) => void;
    registerLabel: (value: string, label: string) => void;
    getLabel: (value: string) => string | undefined;
}

const SelectContext = React.createContext<SelectContextValue>({
    value: '',
    onValueChange: () => { },
    open: false,
    setOpen: () => { },
    registerLabel: () => { },
    getLabel: () => undefined,
});

// ---------------------------------------------------------------------------
// Select (Root)
// ---------------------------------------------------------------------------
interface SelectProps {
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    children?: React.ReactNode;
}

function Select({ value, defaultValue, onValueChange, children }: SelectProps) {
    const [internalValue, setInternalValue] = React.useState(defaultValue ?? '');
    const [open, setOpen] = React.useState(false);
    const labelsRef = React.useRef<Record<string, string>>({});

    const isControlled = value !== undefined;
    const currentValue = isControlled ? value : internalValue;

    const handleValueChange = (v: string) => {
        if (!isControlled) setInternalValue(v);
        onValueChange?.(v);
        setOpen(false);
    };

    const registerLabel = React.useCallback((v: string, label: string) => {
        labelsRef.current[v] = label;
    }, []);

    const getLabel = React.useCallback((v: string) => {
        return labelsRef.current[v];
    }, []);

    const ref = React.useRef<HTMLDivElement>(null);
    React.useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <SelectContext.Provider value={{ value: currentValue, onValueChange: handleValueChange, open, setOpen, registerLabel, getLabel }}>
            <div ref={ref} className="relative w-full">
                {children}
            </div>
        </SelectContext.Provider>
    );
}

// ---------------------------------------------------------------------------
// SelectGroup
// ---------------------------------------------------------------------------
function SelectGroup({ children }: { children?: React.ReactNode }) {
    return <div role="group">{children}</div>;
}

// ---------------------------------------------------------------------------
// SelectValue
// ---------------------------------------------------------------------------
interface SelectValueProps {
    placeholder?: string;
    className?: string;
}

function SelectValue({ placeholder, className }: SelectValueProps) {
    const { value, getLabel } = React.useContext(SelectContext);
    const label = getLabel(value);

    return (
        <span className={cn('flex-1 text-left truncate', !label && 'text-muted-foreground', className)}>
            {label ?? placeholder}
        </span>
    );
}

// ---------------------------------------------------------------------------
// SelectTrigger
// ---------------------------------------------------------------------------
interface SelectTriggerProps {
    children?: React.ReactNode;
    className?: string;
}

function SelectTrigger({ children, className }: SelectTriggerProps) {
    const { open, setOpen } = React.useContext(SelectContext);

    return (
        <button
            type="button"
            onClick={() => setOpen(!open)}
            className={cn(
                'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                className,
            )}
            aria-expanded={open}
        >
            {children}
            <ChevronDown
                className={cn('h-4 w-4 opacity-50 shrink-0 transition-transform duration-200', open && 'rotate-180')}
            />
        </button>
    );
}

// ---------------------------------------------------------------------------
// SelectContent
// ---------------------------------------------------------------------------
interface SelectContentProps {
    children?: React.ReactNode;
    className?: string;
    position?: 'popper' | 'item-aligned';
}

function SelectContent({ children, className }: SelectContentProps) {
    const { open } = React.useContext(SelectContext);

    if (!open) return null;

    return (
        <div
            className={cn(
                'absolute z-50 mt-1 w-full min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md',
                className,
            )}
        >
            <div className="p-1">{children}</div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// SelectLabel
// ---------------------------------------------------------------------------
interface SelectLabelProps {
    children?: React.ReactNode;
    className?: string;
}

function SelectLabel({ children, className }: SelectLabelProps) {
    return (
        <div className={cn('py-1.5 pl-8 pr-2 text-sm font-semibold', className)}>
            {children}
        </div>
    );
}

// ---------------------------------------------------------------------------
// SelectItem
// ---------------------------------------------------------------------------
interface SelectItemProps {
    value: string;
    children?: React.ReactNode;
    className?: string;
    disabled?: boolean;
}

function extractText(node: React.ReactNode): string {
    if (typeof node === 'string' || typeof node === 'number') return String(node);
    if (Array.isArray(node)) return node.map(extractText).join('');
    if (React.isValidElement(node)) {
        const el = node as React.ReactElement<{ children?: React.ReactNode }>;
        return extractText(el.props.children);
    }
    return '';
}

function SelectItem({ value, children, className, disabled }: SelectItemProps) {
    const { value: selectedValue, onValueChange, registerLabel } = React.useContext(SelectContext);
    const isSelected = selectedValue === value;

    // Registra o label no contexto raiz sempre que renderizar
    React.useEffect(() => {
        registerLabel(value, extractText(children));
    }, [value, children, registerLabel]);

    return (
        <div
            role="option"
            aria-selected={isSelected}
            aria-disabled={disabled}
            onClick={() => !disabled && onValueChange(value)}
            className={cn(
                'relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors',
                'hover:bg-secondary hover:text-accent-foreground',
                isSelected && 'bg-secondary/60',
                disabled && 'pointer-events-none opacity-50',
                className,
            )}
        >
            {isSelected && (
                <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <polyline points="20 6 9 17 4 12" />
                    </svg>
                </span>
            )}
            {children}
        </div>
    );
}

// ---------------------------------------------------------------------------
// SelectSeparator
// ---------------------------------------------------------------------------
function SelectSeparator({ className }: { className?: string }) {
    return <div className={cn('-mx-1 my-1 h-px bg-muted', className)} />;
}

// ---------------------------------------------------------------------------
// Stubs mantidos para compatibilidade de import
// ---------------------------------------------------------------------------
function SelectScrollUpButton(_props: { className?: string }) { return null; }
function SelectScrollDownButton(_props: { className?: string }) { return null; }

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------
export {
    Select,
    SelectGroup,
    SelectValue,
    SelectTrigger,
    SelectContent,
    SelectLabel,
    SelectItem,
    SelectSeparator,
    SelectScrollUpButton,
    SelectScrollDownButton,
};