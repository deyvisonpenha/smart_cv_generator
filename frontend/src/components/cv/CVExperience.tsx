'use client';
import { Plus, Trash2 } from 'lucide-react';
import { ExperienceEntry } from '@/types';
import { EditableField } from '@/components/ui/EditableField';
import { useAppStore } from '@/store/useAppStore';

export function CVExperience({ experience }: { experience: ExperienceEntry[] }) {
    const { updateExperience, updateBullet, addBullet, removeBullet } = useAppStore();

    return (
        <div>
            <div className="text-[8.5pt] font-bold tracking-widest uppercase text-zinc-400 border-b border-zinc-200 pb-1 mb-3">
                Professional Experience
            </div>
            <div className="space-y-5">
                {experience.map((exp, ei) => (
                    <div key={ei}>
                        {/* Title + dates */}
                        <div className="flex justify-between items-baseline gap-2 flex-wrap">
                            <div className="font-bold text-[10.5pt] text-zinc-900">
                                <EditableField
                                    value={exp.job_title}
                                    onChange={(v) => updateExperience(ei, { job_title: v })}
                                    bold
                                    placeholder="Job Title"
                                />
                            </div>
                            <div className="text-[9pt] text-zinc-400 whitespace-nowrap flex gap-1">
                                <EditableField
                                    value={exp.start_date}
                                    onChange={(v) => updateExperience(ei, { start_date: v })}
                                    placeholder="MM/YYYY"
                                    className="w-20"
                                />
                                <span>–</span>
                                <EditableField
                                    value={exp.end_date}
                                    onChange={(v) => updateExperience(ei, { end_date: v })}
                                    placeholder="Present"
                                    className="w-20"
                                />
                            </div>
                        </div>

                        {/* Company + location */}
                        <div className="text-[9.5pt] text-zinc-500 mb-1.5 flex gap-1.5">
                            <EditableField
                                value={exp.company}
                                onChange={(v) => updateExperience(ei, { company: v })}
                                placeholder="Company"
                            />
                            {exp.location !== undefined && (
                                <>
                                    <span className="text-zinc-300">,</span>
                                    <EditableField
                                        value={exp.location ?? ''}
                                        onChange={(v) => updateExperience(ei, { location: v })}
                                        placeholder="Location"
                                    />
                                </>
                            )}
                        </div>

                        {/* Bullets */}
                        <ul className="space-y-0.5 ml-3 list-disc text-[10pt] text-zinc-800">
                            {exp.bullets.map((bullet, bi) => (
                                <li key={bi} className="group flex items-start gap-1">
                                    <EditableField
                                        value={bullet.text}
                                        onChange={(v) => updateBullet(ei, bi, v)}
                                        multiline
                                        placeholder="Describe your achievement…"
                                        className="flex-1"
                                    />
                                    <button
                                        onClick={() => removeBullet(ei, bi)}
                                        className="opacity-0 group-hover:opacity-100 shrink-0 mt-0.5 text-zinc-300 hover:text-red-400 transition"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </li>
                            ))}
                        </ul>

                        <button
                            onClick={() => addBullet(ei)}
                            className="mt-1.5 flex items-center gap-1 text-[8.5pt] text-zinc-400 hover:text-indigo-500 transition-colors ml-3"
                        >
                            <Plus className="w-3 h-3" /> Add bullet
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
