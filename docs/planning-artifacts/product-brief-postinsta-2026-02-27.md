---
stepsCompleted: [1, 2, 3, 4, 5, 6]
status: complete
inputDocuments: []
date: 2026-02-27
author: Jacques
---

# Product Brief: PostInsta

## Executive Summary

**PostInsta** est un outil de production de contenu Instagram piloté par l'IA, conçu pour un prestataire (Jacques) qui gère la communication Instagram de ses clients (5 max). L'application génère automatiquement un calendrier éditorial, puis produit l'ensemble des contenus — visuels (templates + charte graphique), textes et reels/vidéos — en respectant le profil de communication de chaque client, son tone of voice et ses exemples existants. La source de vérité est un Google Sheets par client. Chaque contenu passe par une validation humaine avant publication.

---

## Core Vision

### Problem Statement

Les indépendants et petites structures doivent publier régulièrement sur Instagram pour rester visibles, mais créer du contenu de qualité est chronophage. Même avec des outils comme Canva, le processus reste manuel : trouver l'idée, écrire le texte, concevoir le visuel, maintenir la cohérence éditoriale. En tant que prestataire, gérer plusieurs clients multiplie ce problème.

### Problem Impact

- Perte de visibilité et d'engagement par manque de régularité
- Temps disproportionné passé sur la création vs. le coeur de métier
- Incohérence entre les publications (ton, style visuel, messages)
- Difficulté à scaler le service au-delà de quelques clients

### Why Existing Solutions Fall Short

- **Canva** : excellent pour le design mais pas d'automatisation du contenu, pas de calendrier éditorial intelligent
- **Outils de planification** (Later, Hootsuite) : programment mais ne créent pas le contenu
- **ChatGPT/IA générique** : génère du texte mais sans contexte structuré, sans cohérence sur la durée, sans visuels
- **Aucun outil** ne combine : profil client structuré + calendrier auto-généré + production multi-format (image, texte, reel) + mise à jour de la source de données

### Proposed Solution

PostInsta est un système de production éditorial complet en 5 étapes :
1. **Profil client structuré** dans Google Sheets (nom, secteur, tone of voice, couleurs, typo, logo, exemples de posts, types de publication)
2. **Calendrier éditorial auto-généré** selon le rythme et les types de contenu souhaités
3. **Validation humaine** du calendrier avant production
4. **Production automatisée au fil de l'eau** via des prompts spécialisés alimentés par les variables de la table :
   - Prompt images : visuels à partir de templates + charte graphique client
   - Prompt texte : légendes, hashtags, CTA selon le tone of voice
   - Prompt reels : vidéos IA (Runway/Pika), templates animés, ou script + instructions selon le type
5. **Mise à jour de la table** avec les contenus produits + validation avant publication

### Key Differentiators

- **Data-driven** : tout part de variables structurées dans Google Sheets (pas de prompts génériques)
- **Multi-format** : images + texte + reels dans un seul flux de production
- **Système, pas outil** : production continue pilotée par un calendrier, pas du one-shot
- **Tone of voice garanti** : les prompts intègrent les exemples et le profil du client
- **Google Sheets comme hub** : source unique de vérité, visible par le prestataire et le client
- **Validation humaine intégrée** : rien ne part sans approbation
- **Multi-clients** : gestion de jusqu'à 5 clients avec des profils distincts

---

## Target Users

### Primary Users

**Persona : Jacques — Le prestataire com digitale**
- Gère la communication Instagram de 3 à 5 clients
- Workflow hebdomadaire : le lundi, ouvre l'app, valide le calendrier et les contenus de la semaine pour chaque client
- Cherche à automatiser la production sans perdre le contrôle qualité
- Utilise déjà les APIs IA (Claude, génération d'images, vidéo) et Google Sheets
- Besoins : gagner du temps, scaler son activité, maintenir la cohérence éditoriale par client
- Frustration actuelle : chaque post est un processus manuel même avec Canva et l'IA
- Moment "aha!" : ouvrir l'app le lundi et voir 5 posts prêts à valider pour chaque client, cohérents avec leur identité

**Parcours type :**
1. **Onboarding client** : entretien visio → le client envoie sa charte ou complète un formulaire dans l'app (logo, couleurs, typo, tone of voice, exemples de posts)
2. **Setup** : Jacques configure le profil dans Google Sheets, définit le rythme et les types de contenu
3. **Chaque lundi** : l'app génère le calendrier + les contenus → Jacques valide/ajuste → les contenus sont prêts
4. **Au quotidien** : publication selon le planning validé

### Secondary Users

**Persona : Sylvie — La cliente solopreneuse**
- Coach bien-être, 45 ans, pas tech-savvy
- A besoin d'Instagram mais n'a ni le temps ni les compétences pour créer du contenu
- Délègue tout à Jacques mais veut voir ce qui sera publié
- Accède à l'app pour consulter le calendrier et donner son feedback
- Besoins : visibilité sur ce qui va être posté, pouvoir dire "j'aime" ou "à modifier"
- Moment "aha!" : voir son calendrier du mois avec tous les visuels prêts, dans SON style

**Parcours type :**
1. **Onboarding** : visio avec Jacques → complète le formulaire profil (ou Jacques le fait pour elle)
2. **Chaque semaine/mois** : reçoit une notification → consulte le calendrier dans l'app → valide ou commente
3. **Au quotidien** : voit ses posts publiés sur Instagram, cohérents et réguliers

### User Journey

```
Onboarding          Hebdo (lundi)        Quotidien
─────────────       ──────────────       ──────────
Visio + Formulaire  Jacques ouvre app    Posts publiés
→ Profil client     → Valide calendrier  selon planning
→ Config Sheets     → Ajuste contenus
→ Rythme défini     → Sylvie consulte
                    → Feedback/validation
```

---

## Success Metrics

### User Success — Jacques (prestataire)
- Temps de production par client divisé par 3
- Taux de validation au premier jet > 70%
- Nombre de contenus produits automatiquement vs. manuellement

### User Success — Client final (Sylvie)
- Régularité de publication maintenue (ex: 3 posts/semaine sans interruption > 90% des semaines)
- Satisfaction client sur la cohérence du contenu

### Business Objectives
- Pouvoir gérer 5 clients sans augmenter le temps de travail
- Réduire le coût de production par contenu

### Key Performance Indicators
- **3 mois** : 1 client en production complète via PostInsta
- **6 mois** : 3 clients gérés via l'app
- **Taux validation premier jet** : > 70%
- **Régularité publication** : > 90% des semaines

---

## MVP Scope

### Core Features (v1)

1. **Formulaire onboarding client** (interface web)
   - Nom, secteur, tone of voice, couleurs, typo, logo
   - Exemples de posts existants (upload ou liens)
   - Rythme souhaité (ex: 3 posts/semaine)
   - Types de contenu (posts image, carrousel, reels)

2. **Intégration Google Sheets**
   - Lecture du profil client depuis Sheets
   - Écriture du calendrier éditorial dans Sheets
   - Mise à jour des statuts (généré, validé, publié)

3. **Génération du calendrier éditorial**
   - Proposer N semaines de contenu planifié
   - Thèmes, formats, dates selon le rythme défini

4. **Génération de contenu — Texte**
   - Légendes Instagram + hashtags + CTA
   - Prompt alimenté par les variables du profil

5. **Génération de contenu — Images**
   - Visuels à partir de templates + charte graphique
   - Prompt image alimenté par les variables du profil

6. **Dashboard de validation**
   - Vue calendrier avec preview des contenus
   - Actions : valider / demander modification / rejeter
   - Accès client (vue lecture + feedback)

### Out of Scope for MVP (v2+)

- Génération de reels/vidéos (Runway, Pika)
- Publication automatique sur Instagram (API Instagram)
- Analytics / suivi des performances
- Bot Telegram/WhatsApp
- Multi-prestataire (SaaS)

### MVP Success Criteria

- 1 client réel en production complète
- Calendrier + textes + images générés et validés en < 1h/semaine
- Le client peut consulter et donner son feedback dans l'app

### Future Vision

- **v2** : Reels/vidéos IA + publication automatique Instagram
- **v3** : Analytics + recommandations basées sur les performances
- **v4** : Ouverture SaaS pour d'autres prestataires
