import type { ClientProfile, CalendarEntry } from '@/types';

export function captionPrompt(profile: ClientProfile, entry: CalendarEntry): string {
  return `Tu es un expert en copywriting Instagram.

Écris une légende Instagram pour ce post :

**Client** : ${profile.nom_client}
**Secteur** : ${profile.secteur}
**Ton** : ${profile.tone_of_voice}
**Hashtags de base** : ${profile.hashtags_base}
**Style CTA** : ${profile.cta_style}

**Post** :
- Date : ${entry.date}
- Type : ${entry.type}
- Thème : ${entry.theme}
- Titre : ${entry.titre}

Retourne UNIQUEMENT un objet JSON (pas de texte avant/après) :
{
  "legende": "La légende complète avec emojis, sauts de ligne, CTA...",
  "hashtags": "#hashtag1 #hashtag2 #hashtag3..."
}

La légende doit :
- Avoir un hook accrocheur en première ligne
- Inclure 3-5 paragraphes courts
- Finir avec un CTA clair
- Être adaptée au ton du client

Les hashtags : mix de ${profile.hashtags_base} + hashtags spécifiques au thème (15-20 au total).`;
}
