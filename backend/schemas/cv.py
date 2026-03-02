from typing import List, Optional
from pydantic import BaseModel


class SkillGroup(BaseModel):
    category: str
    items: List[str]


class BulletPoint(BaseModel):
    text: str


class ExperienceEntry(BaseModel):
    job_title: str
    company: str
    location: Optional[str] = None
    start_date: str
    end_date: str
    bullets: List[BulletPoint]


class EducationEntry(BaseModel):
    degree: str
    institution: str
    start_date: str
    end_date: str


class ContactInfo(BaseModel):
    name: str
    title: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    linkedin: Optional[str] = None
    portfolio: Optional[str] = None


class CVData(BaseModel):
    contact: ContactInfo
    summary: str
    skills: List[SkillGroup]
    experience: List[ExperienceEntry]
    education: List[EducationEntry]
    optimization_report: str
    match_score: int
