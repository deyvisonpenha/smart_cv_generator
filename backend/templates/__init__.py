from .base import CVTemplate
from .classic import CLASSIC

PRESENT_WORD: dict[str, str] = {
    "en": "Present",
    "pt-br": "Presente",
    "es": "Actualidad",
    "de": "Heute",
    "fr": "Présent",
}

TEMPLATES: dict[str, CVTemplate] = {
    "classic": CLASSIC,
}


def get_template(template_id: str, language: str) -> CVTemplate:
    """Return a copy of the template with the correct `present_word` for the given language."""
    template = TEMPLATES.get(template_id, CLASSIC).model_copy()
    template.present_word = PRESENT_WORD.get(language, "Present")
    return template


__all__ = ["CVTemplate", "TEMPLATES", "get_template", "PRESENT_WORD"]
