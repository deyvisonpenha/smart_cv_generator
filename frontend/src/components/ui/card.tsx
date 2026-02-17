import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
    return (
        <div className={cn("bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm", className)}>
            {children}
        </div>
    );
}
