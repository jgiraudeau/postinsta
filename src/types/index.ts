// === Types PostInsta ===

export interface Client {
  id: string;
  name: string;
  sheetId: string;
  viewToken: string;
  createdAt: string;
}

export interface ClientProfile {
  nom_client: string;
  secteur: string;
  tone_of_voice: string;
  couleurs: string;
  typo: string;
  logo_url: string;
  exemples_posts: string;
  rythme: string;
  jours_publication: string;
  types_contenu: string;
  themes_recurrents: string;
  hashtags_base: string;
  cta_style: string;
}

export interface CalendarEntry {
  row?: number;
  date: string;
  type: string;
  theme: string;
  titre: string;
  legende: string;
  hashtags: string;
  image_prompt: string;
  image_url: string;
  statut: 'brouillon' | 'validé' | 'rejeté' | 'publié';
  feedback: string;
}

export interface CaptionResult {
  legende: string;
  hashtags: string;
}

export interface GenerateCalendarRequest {
  clientId: string;
}

export interface GenerateCaptionsRequest {
  clientId: string;
  entryIds: number[];
}

export interface GenerateImagesRequest {
  clientId: string;
  entryIds: number[];
}

export interface FeedbackRequest {
  token: string;
  entryRow: number;
  feedback: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}
