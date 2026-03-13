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

**Types de publication disponibles** :
- "post" : image unique carrée (1:1) — idéal pour annonces, citations, produits
- "carousel" : série de 3 à 5 slides (1:1) — idéal pour listes, tutoriels, storytelling, avant/après
- "story" : format vertical (9:16) — idéal pour coulisses, promos flash, sondages
- "quote" : citation inspirante sur fond graphique
- "infographie" : visuel informatif avec données clés

Retourne UNIQUEMENT un tableau JSON (pas de texte avant/après) avec ce format :
[
  {
    "date": "2026-03-03",
    "type": "post",
    "theme": "conseil pratique",
    "titre": "Titre du post",
    "image_prompt": "description détaillée pour génération d'image"
  },
  {
    "date": "2026-03-05",
    "type": "carousel",
    "theme": "tutoriel",
    "titre": "5 astuces pour...",
    "image_prompt": "Slide 1 (couverture) : titre accrocheur sur fond coloré. Slide 2 : astuce 1 avec icône. Slide 3 : astuce 2 avec illustration. Slide 4 : astuce 3 avec exemple. Slide 5 : CTA et logo",
    "slides_count": 5
  }
]

Règles :
- Respecte le rythme et les jours de publication
- Varie les types : environ 40% posts, 30% carousels, 20% stories, 10% quotes/infographies
- Les carousels doivent avoir entre 3 et 5 slides
- Pour les carousels, le champ image_prompt doit décrire CHAQUE slide séparément (Slide 1 : ..., Slide 2 : ..., etc.)
- Privilégie les descriptions visuelles (scènes, objets, ambiances). 
- ÉVITE le texte incrusté dans les images autant que possible. Si du texte est indispensable (ex: titre, mot-clé), garde-le extrêmement court (1 à 3 mots maximum) pour éviter les fautes d'orthographe de l'IA.
- Les image_prompt doivent être détaillés, visuels et adaptés au secteur du client
- Les dates commencent à partir de demain`;
}
