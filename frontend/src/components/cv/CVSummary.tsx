'use client';
import { useAppStore } from '@/store/useAppStore';
import { EditableField } from '@/components/ui/EditableField';

export function CVSummary({ summary, title }: { summary: string; title: string }) {
    const { updateSummary } = useAppStore();

    return (
        <div>
            <div className="text-[8.5pt] font-bold tracking-widest uppercase text-zinc-400 pb-1 mb-2">
                {title}
            </div>
            <div className="text-[10.5pt] leading-relaxed text-zinc-800">
                <EditableField
                    value={summary}
                    onChange={updateSummary}
                    multiline
                    placeholder="Write a professional summary…"
                />
            </div>
        </div>
    );
}
