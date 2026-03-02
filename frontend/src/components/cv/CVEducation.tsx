'use client';
import { EducationEntry } from '@/types';
import { EditableField } from '@/components/ui/EditableField';
import { useAppStore } from '@/store/useAppStore';

export function CVEducation({ education, title }: { education: EducationEntry[]; title: string }) {
    // Education entries are typically few and rarely edited; simple per-field updates via store
    const { generatedCV, setGeneratedCV } = useAppStore();

    const updateField = (index: number, field: keyof EducationEntry, value: string) => {
        if (!generatedCV) return;
        const updated = (generatedCV.education as any).map((edu: EducationEntry, i: number) =>
            i === index ? { ...edu, [field]: value } : edu
        );
        setGeneratedCV({ ...generatedCV, education: updated });
    };

    return (
        <div>
            <div className="text-[8.5pt] font-bold tracking-widest uppercase text-zinc-400 pb-1 mb-2">
                {title}
            </div>
            <div className="space-y-3">
                {education.map((edu, i) => (
                    <div key={i}>
                        <div className="flex justify-between items-baseline gap-2 flex-wrap">
                            <div className="font-semibold text-[10pt] text-zinc-900">
                                <EditableField
                                    value={edu.degree}
                                    onChange={(v) => updateField(i, 'degree', v)}
                                    bold
                                    placeholder="Degree"
                                />
                            </div>
                            <div className="text-[9pt] text-zinc-400 flex gap-1">
                                <EditableField
                                    value={edu.start_date}
                                    onChange={(v) => updateField(i, 'start_date', v)}
                                    placeholder="MM/YYYY"
                                    className="w-20"
                                />
                                <span>–</span>
                                <EditableField
                                    value={edu.end_date}
                                    onChange={(v) => updateField(i, 'end_date', v)}
                                    placeholder="MM/YYYY"
                                    className="w-20"
                                />
                            </div>
                        </div>
                        <div className="text-[9.5pt] text-zinc-500">
                            <EditableField
                                value={edu.institution}
                                onChange={(v) => updateField(i, 'institution', v)}
                                placeholder="Institution"
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
