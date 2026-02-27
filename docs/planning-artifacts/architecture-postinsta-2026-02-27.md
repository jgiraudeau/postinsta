---
title: Architecture PostInsta MVP
status: complete
date: 2026-02-27
author: Jacques
inputDocuments:
  - product-brief-postinsta-2026-02-27.md
  - prd-postinsta-2026-02-27.md
---

# Architecture — PostInsta MVP

## 1. Vue d'ensemble

```
┌─────────────────────────────────────────────────────────┐
│                    VERCEL (Next.js)                       │
│                                                          │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │ Frontend  │  │  API Routes  │  │  Scheduled Jobs   │  │
│  │ (React)   │  │  /api/*      │  │  (Vercel Cron)    │  │
│  └─────┬─────┘  └──────┬───────┘  └────────┬──────────┘  │
│        │               │                    │             │
└────────┼───────────────┼────────────────────┼─────────────┘
         │               │                    │
         │    ┌──────────┼────────────────────┤
         │    │          │                    │
    ┌────▼────▼──┐  ┌───▼────────┐  ┌───────▼────────┐
    │  Google    │  │  Claude    │  │  Image API     │
    │  Sheets   │  │  API       │  │  (DALL-E/Flux) │
    │  API      │  │  (Anthropic)│  │                │
    └───────────┘  └────────────┘  └────────┬───────┘
                                            │
                                   ┌────────▼────────┐
                                   │  Vercel Blob /  │
                                   │  Cloudinary     │
                                   └─────────────────┘
```

---

## 2. Structure du projet

```
postinsta/
├── src/
│   ├── app/
│   │   ├── layout.tsx                 # Layout principal
│   │   ├── page.tsx                   # Redirect → /dashboard
│   │   ├── login/page.tsx             # Login admin
│   │   ├── dashboard/page.tsx         # Liste clients
│   │   ├── client/
│   │   │   ├── new/page.tsx           # Formulaire onboarding
│   │   │   └── [id]/
│   │   │       ├── page.tsx           # Detail client (profil + stats)
│   │   │       ├── calendar/page.tsx  # Vue calendrier + validation
│   │   │       └── generate/page.tsx  # Lancer génération
│   │   ├── view/
│   │   │   └── [token]/page.tsx       # Vue client (lecture + feedback)
│   │   └── api/
│   │       ├── auth/
│   │       │   └── login/route.ts
│   │       ├── clients/
│   │       │   ├── route.ts           # GET list, POST create
│   │       │   └── [id]/
│   │       │       ├── route.ts       # GET detail, PUT update
│   │       │       └── profile/route.ts
│   │       ├── generate/
│   │       │   ├── calendar/route.ts  # POST → Claude API → calendrier
│   │       │   ├── captions/route.ts  # POST → Claude API → légendes
│   │       │   └── images/route.ts    # POST → Image API → visuels
│   │       ├── calendar/
│   │       │   └── [id]/route.ts      # GET/PUT calendrier d'un client
│   │       ├── validate/
│   │       │   └── route.ts           # POST valider/rejeter un contenu
│   │       └── feedback/
│   │           └── route.ts           # POST feedback client
│   ├── lib/
│   │   ├── sheets.ts                  # Google Sheets API wrapper
│   │   ├── claude.ts                  # Anthropic Claude API wrapper
│   │   ├── image-gen.ts               # Image generation API wrapper
│   │   ├── storage.ts                 # Vercel Blob / Cloudinary
│   │   ├── prompts/
│   │   │   ├── calendar.ts            # Prompt template calendrier
│   │   │   ├── caption.ts             # Prompt template légende
│   │   │   └── image.ts               # Prompt template image
│   │   └── auth.ts                    # Auth helpers (JWT simple)
│   ├── components/
│   │   ├── ClientCard.tsx
│   │   ├── CalendarView.tsx
│   │   ├── PostPreview.tsx
│   │   ├── ValidationActions.tsx
│   │   ├── OnboardingForm.tsx
│   │   └── FeedbackForm.tsx
│   └── types/
│       └── index.ts                   # Types TypeScript
├── public/
├── .env.local                         # API keys
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## 3. Modèle de données (Google Sheets)

### Un Google Sheets par client

**Pourquoi Sheets et pas une DB ?**
- Le client peut voir/éditer directement s'il veut
- Pas de coût d'hébergement DB
- Export/import facile
- Suffisant pour 5 clients

### Mapping Sheets → App

L'app stocke un **index local** (fichier JSON ou un Sheets "master") qui mappe :

```typescript
interface Client {
  id: string;              // UUID généré à l'onboarding
  name: string;
  sheetId: string;         // ID du Google Sheets du client
  viewToken: string;       // Token pour l'accès client
  createdAt: string;
}
```

**Option retenue** : Un Google Sheets "PostInsta Master" avec un onglet "Clients" qui liste tous les clients et leurs sheetId.

---

## 4. Authentification

### Admin (Jacques)
- Login simple : email + mot de passe
- JWT stocké en cookie httpOnly
- Middleware Next.js qui protège `/dashboard`, `/client/*`, `/api/*` (sauf `/api/feedback`)

### Client (Sylvie)
- Pas de login : accès via lien unique `/view/[token]`
- Le token est un UUID stocké dans le Sheets Master
- Rate limiting sur les feedbacks pour éviter les abus

---

## 5. APIs externes — Wrappers

### `lib/sheets.ts`
```typescript
// Fonctions principales
readProfile(sheetId: string): Promise<ClientProfile>
writeCalendar(sheetId: string, entries: CalendarEntry[]): Promise<void>
updateEntry(sheetId: string, row: number, data: Partial<CalendarEntry>): Promise<void>
readCalendar(sheetId: string): Promise<CalendarEntry[]>
createClientSheet(clientName: string): Promise<string>  // retourne sheetId
```

### `lib/claude.ts`
```typescript
// Fonctions principales
generateCalendar(profile: ClientProfile): Promise<CalendarEntry[]>
generateCaption(profile: ClientProfile, entry: CalendarEntry): Promise<CaptionResult>
```

### `lib/image-gen.ts`
```typescript
// Fonctions principales
generateImage(profile: ClientProfile, entry: CalendarEntry): Promise<string>  // retourne URL
```

### `lib/storage.ts`
```typescript
// Fonctions principales
uploadImage(buffer: Buffer, filename: string): Promise<string>  // retourne URL publique
```

---

## 6. Flux de données détaillé

### Onboarding
```
Formulaire → POST /api/clients
  → Crée un Google Sheets (via Sheets API)
  → Écrit le profil dans l'onglet "Profil"
  → Ajoute le client dans le Sheets Master
  → Retourne clientId + sheetId
```

### Génération calendrier
```
Bouton "Générer" → POST /api/generate/calendar { clientId }
  → Lit le profil depuis Sheets
  → Construit le prompt avec les variables du profil
  → Appel Claude API → JSON calendrier
  → Parse le JSON
  → Écrit dans l'onglet "Calendrier" du Sheets
  → Retourne les entrées au frontend
```

### Génération textes
```
Sélection posts → POST /api/generate/captions { clientId, entryIds[] }
  → Lit le profil + les entrées sélectionnées depuis Sheets
  → Pour chaque entrée : prompt légende → Claude API → résultat
  → Met à jour chaque ligne dans Sheets (légende, hashtags, statut)
  → Retourne les résultats
```

### Génération images
```
Sélection posts → POST /api/generate/images { clientId, entryIds[] }
  → Lit le profil + les entrées depuis Sheets
  → Pour chaque entrée : prompt image → API Image → buffer
  → Upload sur Vercel Blob/Cloudinary → URL
  → Met à jour le Sheets (image_url, statut)
  → Retourne les URLs
```

---

## 7. Variables d'environnement

```env
# Auth
ADMIN_EMAIL=jacques.giraudeau@gmail.com
ADMIN_PASSWORD_HASH=xxx
JWT_SECRET=xxx

# Google Sheets
GOOGLE_SERVICE_ACCOUNT_EMAIL=xxx@xxx.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
MASTER_SHEET_ID=xxx

# Anthropic
ANTHROPIC_API_KEY=sk-ant-xxx

# Image Generation
OPENAI_API_KEY=sk-xxx          # Pour DALL-E
# ou FAL_API_KEY=xxx           # Pour Flux

# Storage
BLOB_READ_WRITE_TOKEN=xxx      # Vercel Blob
# ou CLOUDINARY_URL=xxx
```

---

## 8. Décisions techniques

| Décision | Choix | Raison |
|----------|-------|--------|
| DB vs Sheets | Google Sheets | Client peut voir directement, pas de coût DB, suffisant pour 5 clients |
| 1 Sheet vs N Sheets | 1 Sheet par client + 1 Master | Isolation des données, partage facile avec le client |
| Auth client | Token URL (pas de login) | Simplicité pour des clients non-tech |
| Image storage | Vercel Blob | Déjà sur Vercel, intégration native, pas de compte supplémentaire |
| Génération séquentielle vs batch | Séquentielle avec feedback | Permet de voir la progression, plus fiable |
| Prompts | Templates TypeScript avec variables | Type-safe, facile à itérer, versionné dans le code |

---

## 9. Risques et mitigations

| Risque | Impact | Mitigation |
|--------|--------|------------|
| Quota Google Sheets API | Blocage si trop d'appels | Cache côté app, batch les écritures |
| Coût Claude API | Budget élevé si beaucoup de contenus | Monitoring des tokens, prompts optimisés |
| Qualité images IA | Visuels pas au niveau attendu | Itérer les prompts, possibilité de regénérer |
| Latence génération | UX lente si tout est synchrone | Génération asynchrone avec statut de progression |
| Sheets comme "DB" | Limitations si scale | Prévu : migration vers vraie DB si > 5 clients (v4 SaaS) |
