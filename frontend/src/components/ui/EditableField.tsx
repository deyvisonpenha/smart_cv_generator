'use client';
import { useRef, useEffect, useState } from 'react';

interface EditableFieldProps {
    value: string;
    onChange: (value: string) => void;
    className?: string;
    multiline?: boolean;
    placeholder?: string;
    bold?: boolean;
}

export function EditableField({
    value,
    onChange,
    className = '',
    multiline = false,
    placeholder = '',
    bold = false,
}: EditableFieldProps) {
    const [localValue, setLocalValue] = useState(value);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Sync if parent changes externally
    useEffect(() => { setLocalValue(value); }, [value]);

    // Auto-resize textarea
    useEffect(() => {
        if (multiline && textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [localValue, multiline]);

    const sharedStyle: React.CSSProperties = {
        background: 'transparent',
        border: 'none',
        outline: 'none',
        width: '100%',
        fontFamily: 'inherit',
        fontSize: 'inherit',
        lineHeight: 'inherit',
        color: 'inherit',
        fontWeight: bold ? 700 : 'inherit',
        padding: 0,
    };

    const handleBlur = () => {
        if (localValue !== value) onChange(localValue);
    };

    const baseClass = `rounded px-0.5 border border-transparent hover:border-indigo-300/40 focus:border-indigo-400/70 focus:bg-indigo-50/5 transition-colors ${className}`;

    if (multiline) {
        return (
            <textarea
                ref={textareaRef}
                value={localValue}
                placeholder={placeholder}
                onChange={(e) => setLocalValue(e.target.value)}
                onBlur={handleBlur}
                rows={1}
                className={baseClass}
                style={{ ...sharedStyle, resize: 'none', overflow: 'hidden' }}
            />
        );
    }

    return (
        <input
            type="text"
            value={localValue}
            placeholder={placeholder}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={handleBlur}
            className={baseClass}
            style={sharedStyle}
        />
    );
}
