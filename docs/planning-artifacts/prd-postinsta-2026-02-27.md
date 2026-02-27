---
title: PostInsta PRD
status: complete
date: 2026-02-27
author: Jacques
source: product-brief-postinsta-2026-02-27.md
---

# PRD — PostInsta MVP

## 1. Objectif

Outil de production de contenu Instagram piloté par IA pour un prestataire gérant jusqu'à 5 clients. Génère calendrier éditorial + textes + images à partir d'un profil client structuré dans Google Sheets.

---

## 2. Stack technique

| Composant | Choix |
|-----------|-------|
| Frontend | Next.js (App Router) + Tailwind CSS |
| Backend | Next.js API Routes |
| Base de données | Google Sheets (via API) |
| Auth | Simple login (1 admin + invitations client par lien) |
| LLM (texte) | Anthropic Claude API |
| Génération images | API image (DALL-E / Flux) |
| Hébergement | Vercel |
| Stockage images | Vercel Blob ou Cloudinary |

---

## 3. Structure Google Sheets

### Onglet "Profil"
| Champ | Exemple |
|-------|---------|
| nom_client | Sylvie Cabral |
| secteur | Coach bien-être |
| tone_of_voice | Chaleureux, inspirant, accessible |
| couleurs | #E8B4B8, #4A7C59, #F5F0E8 |
| typo | Montserrat |
| logo_url | https://... |
| exemples_posts | URLs ou descriptions de 3-5 posts existants |
| rythme | 3 posts/semaine |
| jours_publication | lundi, mercredi, vendredi |
| types_contenu | post_image, carrousel, citation |
| themes_recurrents | bien-être, développement personnel, témoignages |
| hashtags_base | #coaching #bienetre #devperso |
| cta_style | Question ouverte en fin de légende |

### Onglet "Calendrier"
| Champ | Description |
|-------|-------------|
| date | Date de publication |
| type | post_image / carrousel / citation / tips |
| theme | Thème du contenu |
| titre | Titre ou accroche |
| legende | Texte complet de la légende |
| hashtags | Hashtags générés |
| image_prompt | Prompt utilisé pour générer l'image |
| image_url | URL de l'image générée |
| statut | brouillon / generé / validé / modifié / publié |
| feedback | Commentaire du prestataire ou client |

---

## 4. Fonctionnalités MVP

### F1 — Onboarding client (formulaire web)
**User story :** En tant que Jacques, je remplis un formulaire pour créer le profil d'un nouveau client, qui alimente automatiquement le Google Sheets.

**Critères d'acceptation :**
- Formulaire avec tous les champs du profil (nom, secteur, tone of voice, couleurs, typo, logo, exemples, rythme, jours, types, thèmes, hashtags, CTA)
- Écriture automatique dans l'onglet "Profil" du Sheets du client
- Upload logo possible (stocké sur Vercel Blob / Cloudinary)

### F2 — Génération du calendrier éditorial
**User story :** En tant que Jacques, je clique sur "Générer le calendrier" pour un client et l'app me propose N semaines de contenu planifié.

**Critères d'acceptation :**
- Lecture du profil depuis Sheets
- Appel Claude API avec prompt incluant : profil, tone of voice, thèmes, rythme, types de contenu
- Génération de 4 semaines de calendrier (dates + types + thèmes + titres)
- Écriture dans l'onglet "Calendrier" du Sheets avec statut "brouillon"
- Affichage dans l'interface web en vue calendrier

### F3 — Génération des textes (légendes)
**User story :** En tant que Jacques, je sélectionne un ou plusieurs posts du calendrier et je lance la génération des légendes.

**Critères d'acceptation :**
- Appel Claude API avec prompt incluant : profil, tone of voice, exemples, thème du post, type de contenu
- Génération : légende complète + hashtags + CTA
- Mise à jour du Sheets (colonnes legende, hashtags)
- Statut passe à "generé"
- Preview dans l'interface

### F4 — Génération des images
**User story :** En tant que Jacques, je lance la génération des visuels pour les posts qui ont déjà un texte.

**Critères d'acceptation :**
- Appel API image avec prompt construit à partir de : charte graphique (couleurs, typo), thème, type de post
- Image générée stockée (Vercel Blob / Cloudinary)
- URL de l'image inscrite dans le Sheets
- Preview dans l'interface à côté du texte

### F5 — Dashboard de validation
**User story :** En tant que Jacques, je vois tous les contenus de la semaine pour un client et je peux les valider, modifier ou rejeter.

**Critères d'acceptation :**
- Vue calendrier hebdomadaire/mensuelle par client
- Chaque post affiche : date, type, image preview, légende preview
- Actions : valider (statut → "validé"), demander modification (+ commentaire), rejeter
- Filtres par statut (brouillon, généré, validé, publié)

### F6 — Accès client (vue lecture)
**User story :** En tant que Sylvie (cliente), j'accède à mon calendrier via un lien et je peux voir les contenus et donner mon feedback.

**Critères d'acceptation :**
- Lien unique par client (token dans l'URL, pas de login complexe)
- Vue lecture seule du calendrier avec previews
- Possibilité de laisser un commentaire/feedback par post
- Feedback visible par Jacques dans le dashboard

---

## 5. Prompts IA (architecture)

### Prompt Calendrier
```
Variables injectées : {nom_client}, {secteur}, {tone_of_voice}, {themes_recurrents},
{rythme}, {jours_publication}, {types_contenu}, {exemples_posts}

Rôle : Tu es un expert en stratégie de contenu Instagram.
Tâche : Génère un calendrier éditorial de 4 semaines pour {nom_client}.
Contraintes : respecter le tone of voice, varier les types, maintenir la cohérence thématique.
Output : JSON avec date, type, theme, titre pour chaque post.
```

### Prompt Légende
```
Variables injectées : {nom_client}, {secteur}, {tone_of_voice}, {exemples_posts},
{theme}, {type_contenu}, {titre}, {hashtags_base}, {cta_style}

Rôle : Tu es un copywriter Instagram spécialisé en {secteur}.
Tâche : Rédige une légende Instagram pour un post de type {type_contenu} sur le thème {theme}.
Contraintes : tone of voice = {tone_of_voice}, inclure CTA style {cta_style}, max 2200 caractères.
Output : légende + 15-20 hashtags pertinents.
```

### Prompt Image
```
Variables injectées : {couleurs}, {typo}, {theme}, {type_contenu}, {titre}, {secteur}

Tâche : Génère un visuel Instagram carré (1080x1080) pour un post {type_contenu}.
Style : palette {couleurs}, ambiance {secteur}, professionnel et cohérent.
Contenu : illustrer le thème "{theme}" avec le titre "{titre}".
```

---

## 6. Pages de l'application

| Page | Route | Rôle |
|------|-------|------|
| Login | `/login` | Admin (Jacques) |
| Dashboard | `/dashboard` | Liste des clients + actions rapides |
| Client detail | `/client/[id]` | Profil + calendrier + contenus |
| Onboarding | `/client/new` | Formulaire nouveau client |
| Calendrier | `/client/[id]/calendar` | Vue calendrier + validation |
| Génération | `/client/[id]/generate` | Lancer génération (calendrier/texte/image) |
| Vue client | `/view/[token]` | Accès client lecture + feedback |

---

## 7. Workflow utilisateur complet

```
Jacques                          App                              Sheets
────────                         ───                              ──────
1. Crée client (formulaire)  →   Écrit profil               →    Onglet Profil
2. Clique "Générer calendrier" → Claude API → calendrier     →    Onglet Calendrier
3. Valide/ajuste calendrier   →  Met à jour statuts          →    Statut: validé
4. Clique "Générer textes"   →   Claude API → légendes       →    Colonnes légende/hashtags
5. Clique "Générer images"   →   API Image → visuels         →    Colonne image_url
6. Valide les contenus       →   Met à jour statuts          →    Statut: validé
7. Partage lien à Sylvie     →   Vue client lecture
8. Sylvie laisse feedback    →   Met à jour feedback          →    Colonne feedback
```

---

## 8. Dépendances & APIs

| Service | Usage | Clé requise |
|---------|-------|-------------|
| Google Sheets API | Lecture/écriture profils + calendrier | Service Account JSON |
| Anthropic Claude API | Génération texte (calendrier + légendes) | API Key |
| API Image (DALL-E/Flux) | Génération visuels | API Key |
| Vercel Blob / Cloudinary | Stockage images générées | Token |

---

## 9. Priorité d'implémentation

| Ordre | Feature | Effort estimé |
|-------|---------|---------------|
| 1 | Setup Next.js + Google Sheets API | S |
| 2 | F1 — Formulaire onboarding | M |
| 3 | F2 — Génération calendrier | M |
| 4 | F3 — Génération textes | M |
| 5 | F5 — Dashboard validation | L |
| 6 | F4 — Génération images | M |
| 7 | F6 — Vue client | S |
