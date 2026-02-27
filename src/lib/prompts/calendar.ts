import type { ClientProfile } from '@/types';

export function calendarPrompt(profile: ClientProfile): string {
  return `Tu es un expert en stratégie de contenu Instagram.

Génère un calendrier éditorial pour 1 mois (4 semaines) pour ce client :

**Client** : ${profile.nom_client}
**Secteur** : ${profile.secteur}
**Ton** : ${profile.tone_of_voice}
**Rythme** : ${profile.rythme}
**Jours de publication** : ${profile.jours_publication}
**Types de contenu** : ${profile.types_contenu}
**Thèmes récurrents** : ${profile.themes_recurrents}
**Style CTA** : ${profile.cta_style}

Retourne UNIQUEMENT un tableau JSON (pas de texte avant/après) avec ce format :
[
  {
    "date": "2026-03-03",
    "type": "carousel",
    "theme": "conseil pratique",
    "titre": "5 astuces pour...",
    "image_prompt": "description détaillée pour génération d'image"
  }
]

Respecte le rythme et les jours de publication. Varie les types de contenu. Les image_prompt doivent être détaillés et adaptés au secteur.`;
}
