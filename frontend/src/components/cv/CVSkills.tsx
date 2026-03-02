import { useState } from 'react';
import { X, Plus, GripVertical } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { SkillGroup } from '@/types';
import { EditableField } from '@/components/ui/EditableField';

export function CVSkills({ skills, title }: { skills: SkillGroup[], title: string }) {
    const { updateSkills } = useAppStore();

    const addGroup = () => {
        updateSkills([...skills, { category: 'Category', items: [] }]);
    };

    const removeGroup = (gi: number) => {
        updateSkills(skills.filter((_, i) => i !== gi));
    };

    const updateGroupCategory = (gi: number, category: string) => {
        const newSkills = [...skills];
        newSkills[gi] = { ...newSkills[gi], category };
        updateSkills(newSkills);
    };

    const addItem = (gi: number) => {
        const newSkills = [...skills];
        newSkills[gi] = { ...newSkills[gi], items: [...newSkills[gi].items, 'New Skill'] };
        updateSkills(newSkills);
    };

    const updateItem = (gi: number, ii: number, val: string) => {
        const newSkills = [...skills];
        const newItems = [...newSkills[gi].items];
        newItems[ii] = val;
        newSkills[gi] = { ...newSkills[gi], items: newItems };
        updateSkills(newSkills);
    };

    const removeItem = (gi: number, ii: number) => {
        const newSkills = [...skills];
        newSkills[gi] = { ...newSkills[gi], items: newSkills[gi].items.filter((_, i) => i !== ii) };
        updateSkills(newSkills);
    };

    return (
        <div>
            <div className="text-[8.5pt] font-bold tracking-widest uppercase text-zinc-400 pb-1 mb-2">
                {title}
            </div>
            <div className="space-y-3">
                {skills.map((group, gi) => (
                    <div key={gi} className="group relative">
                        <div className="flex items-baseline gap-2">
                            <div className="font-semibold text-[10pt] text-zinc-900 shrink-0">
                                <EditableField
                                    value={group.category}
                                    onChange={(v) => updateGroupCategory(gi, v)}
                                    bold
                                    placeholder="Category"
                                />
                                <span className="text-zinc-400">:</span>
                            </div>
                            <div className="flex-1 flex flex-wrap gap-x-2 gap-y-1 items-center">
                                {group.items.map((item, ii) => (
                                    <div key={ii} className="flex items-center gap-1 text-[9.5pt] text-zinc-700 bg-zinc-50 rounded px-1.5 py-0.5 border border-zinc-100/50 group/item">
                                        <EditableField
                                            value={item}
                                            onChange={(v) => updateItem(gi, ii, v)}
                                            placeholder="Skill"
                                            className="min-w-[40px]"
                                        />
                                        <button
                                            onClick={() => removeItem(gi, ii)}
                                            className="opacity-0 group-hover/item:opacity-100 transition-opacity text-zinc-300 hover:text-red-400"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                                <button
                                    onClick={() => addItem(gi)}
                                    className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-[8pt] text-zinc-400 hover:text-indigo-500 transition-all ml-1"
                                >
                                    <Plus className="w-3 h-3" />
                                </button>
                            </div>
                            <button
                                onClick={() => removeGroup(gi)}
                                className="absolute -left-6 top-0.5 opacity-0 group-hover:opacity-100 text-zinc-200 hover:text-red-400 transition-opacity"
                                title="Remove group"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                ))}
                <button
                    onClick={addGroup}
                    className="flex items-center gap-1 text-[8.5pt] text-zinc-300 hover:text-indigo-400 transition-all font-medium pt-1"
                >
                    <Plus className="w-3.5 h-3.5" /> Add category
                </button>
            </div>
        </div>
    );
}
