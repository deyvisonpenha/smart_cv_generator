'use client';
import { Mail, Phone, MapPin, Linkedin, Globe } from 'lucide-react';
import { ContactInfo } from '@/types';
import { EditableField } from '@/components/ui/EditableField';
import { useAppStore } from '@/store/useAppStore';

export function CVHeader({ contact }: { contact: ContactInfo }) {
    const { updateContact } = useAppStore();

    return (
        <div className="text-center mb-5">
            {/* Name */}
            <div className="text-[22pt] font-bold leading-tight mb-1">
                <EditableField
                    value={contact.name}
                    onChange={(v) => updateContact({ name: v })}
                    placeholder="Your Name"
                    bold
                    className="text-center"
                />
            </div>

            {/* Title */}
            {(contact.title !== undefined) && (
                <div className="text-[11pt] text-zinc-500 mb-2">
                    <EditableField
                        value={contact.title ?? ''}
                        onChange={(v) => updateContact({ title: v })}
                        placeholder="Professional Title"
                        className="text-center"
                    />
                </div>
            )}

            {/* Contact line */}
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-[9pt] text-zinc-500">
                {contact.location !== undefined && (
                    <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <EditableField
                            value={contact.location ?? ''}
                            onChange={(v) => updateContact({ location: v })}
                            placeholder="Location"
                        />
                    </span>
                )}
                {contact.phone !== undefined && (
                    <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 shrink-0" />
                        <EditableField
                            value={contact.phone ?? ''}
                            onChange={(v) => updateContact({ phone: v })}
                            placeholder="Phone"
                        />
                    </span>
                )}
                {contact.email !== undefined && (
                    <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3 shrink-0" />
                        <EditableField
                            value={contact.email ?? ''}
                            onChange={(v) => updateContact({ email: v })}
                            placeholder="Email"
                        />
                    </span>
                )}
                {contact.linkedin !== undefined && (
                    <span className="flex items-center gap-1">
                        <Linkedin className="w-3 h-3 shrink-0" />
                        <EditableField
                            value={contact.linkedin ?? ''}
                            onChange={(v) => updateContact({ linkedin: v })}
                            placeholder="LinkedIn"
                        />
                    </span>
                )}
                {contact.portfolio !== undefined && (
                    <span className="flex items-center gap-1">
                        <Globe className="w-3 h-3 shrink-0" />
                        <EditableField
                            value={contact.portfolio ?? ''}
                            onChange={(v) => updateContact({ portfolio: v })}
                            placeholder="Portfolio"
                        />
                    </span>
                )}
            </div>
        </div>
    );
}
