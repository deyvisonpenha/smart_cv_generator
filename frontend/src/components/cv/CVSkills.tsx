'use client';
import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

export function CVSkills({ skills }: { skills: string[] }) {
    const { updateSkills } = useAppStore();
    const [adding, setAdding] = useState(false);
    const [newSkill, setNewSkill] = useState('');

    const removeSkill = (index: number) => {
        updateSkills(skills.filter((_, i) => i !== index));
    };

    const commitAdd = () => {
        const trimmed = newSkill.trim();
        if (trimmed) updateSkills([...skills, trimmed]);
        setNewSkill('');
        setAdding(false);
    };

    return (
        <div>
            <div className="text-[8.5pt] font-bold tracking-widest uppercase text-zinc-400 border-b border-zinc-200 pb-1 mb-3">
                Key Skills
            </div>
            <div className="flex flex-wrap gap-1.5">
                {skills.map((skill, i) => (
                    <span
                        key={i}
                        className="group flex items-center gap-1 text-[9.5pt] bg-zinc-100 text-zinc-700 rounded px-2 py-0.5"
                    >
                        {skill}
                        <button
                            onClick={() => removeSkill(i)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400 hover:text-red-400"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </span>
                ))}

                {adding ? (
                    <input
                        autoFocus
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        onBlur={commitAdd}
                        onKeyDown={(e) => { if (e.key === 'Enter') commitAdd(); if (e.key === 'Escape') setAdding(false); }}
                        className="text-[9.5pt] px-2 py-0.5 rounded border border-indigo-400 outline-none bg-white text-zinc-800 w-28"
                        placeholder="Skill…"
                    />
                ) : (
                    <button
                        onClick={() => setAdding(true)}
                        className="flex items-center gap-1 text-[9pt] text-zinc-400 hover:text-indigo-500 transition-colors px-1"
                    >
                        <Plus className="w-3.5 h-3.5" /> Add skill
                    </button>
                )}
            </div>
        </div>
    );
}
