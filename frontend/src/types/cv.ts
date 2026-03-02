// ─── CV Data contract ────────────────────────────────────────────────────────
// This file mirrors the Pydantic schema in backend/schemas/cv.py exactly.
// Any change to either must be reflected in both.

export interface SkillGroup {
    category: string;
    items: string[];
}


export interface BulletPoint {
    text: string;
}

export interface ExperienceEntry {
    job_title: string;
    company: string;
    location?: string;
    start_date: string;
    end_date: string;
    bullets: BulletPoint[];
}

export interface EducationEntry {
    degree: string;
    institution: string;
    start_date: string;
    end_date: string;
}

export interface ContactInfo {
    name: string;
    title?: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    portfolio?: string;
}

export interface CVData {
    contact: ContactInfo;
    summary: string;
    skills: SkillGroup[];
    experience: ExperienceEntry[];
    education: EducationEntry[];
    optimization_report: string;
}
