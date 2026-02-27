import { google } from 'googleapis';
import type { ClientProfile, CalendarEntry, Client } from '@/types';

function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

function getSheets() {
  return google.sheets({ version: 'v4', auth: getAuth() });
}

// Tout est dans un seul spreadsheet (le Master)
const SHEET_ID = process.env.MASTER_SHEET_ID!;

// Helper : slug du nom client pour nommer les onglets
function slug(name: string): string {
  return name.replace(/[^a-zA-Z0-9àâäéèêëïîôùûüç ]/g, '').replace(/\s+/g, '_').substring(0, 30);
}

// === Liste des clients (onglet "Clients") ===

export async function getClients(): Promise<Client[]> {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'Clients!A2:E',
  });
  const rows = res.data.values || [];
  return rows.map((row) => ({
    id: row[0],
    name: row[1],
    sheetId: row[2],       // slug du client (sert de préfixe d'onglet)
    viewToken: row[3],
    createdAt: row[4],
  }));
}

export async function addClient(client: Client): Promise<void> {
  const sheets = getSheets();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: 'Clients!A:E',
    valueInputOption: 'RAW',
    requestBody: {
      values: [[client.id, client.name, client.sheetId, client.viewToken, client.createdAt]],
    },
  });
}

export async function getClientByToken(token: string): Promise<Client | null> {
  const clients = await getClients();
  return clients.find((c) => c.viewToken === token) ?? null;
}

export async function getClientById(id: string): Promise<Client | null> {
  const clients = await getClients();
  return clients.find((c) => c.id === id) ?? null;
}

// === Profil client (onglet "Profil_{slug}") ===

function profilTab(clientSlug: string) {
  return `Profil_${clientSlug}`;
}

function calendarTab(clientSlug: string) {
  return `Cal_${clientSlug}`;
}

export async function readProfile(clientSlug: string): Promise<ClientProfile> {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${profilTab(clientSlug)}!A2:B`,
  });
  const rows = res.data.values || [];
  const profile: Record<string, string> = {};
  for (const row of rows) {
    if (row[0]) profile[row[0]] = row[1] || '';
  }
  return profile as unknown as ClientProfile;
}

export async function writeProfile(clientSlug: string, profile: ClientProfile): Promise<void> {
  const sheets = getSheets();
  const entries = Object.entries(profile);
  const values = entries.map(([key, value]) => [key, value]);

  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${profilTab(clientSlug)}!A1:B${values.length + 1}`,
    valueInputOption: 'RAW',
    requestBody: {
      values: [['clé', 'valeur'], ...values],
    },
  });
}

// === Calendrier client (onglet "Cal_{slug}") ===

const CALENDAR_HEADERS = ['date', 'type', 'theme', 'titre', 'legende', 'hashtags', 'image_prompt', 'image_url', 'statut', 'feedback'];

export async function readCalendar(clientSlug: string): Promise<CalendarEntry[]> {
  const sheets = getSheets();
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${calendarTab(clientSlug)}!A2:J`,
    });
    const rows = res.data.values || [];
    return rows.map((row, i) => ({
      row: i + 2,
      date: row[0] || '',
      type: row[1] || '',
      theme: row[2] || '',
      titre: row[3] || '',
      legende: row[4] || '',
      hashtags: row[5] || '',
      image_prompt: row[6] || '',
      image_url: row[7] || '',
      statut: (row[8] || 'brouillon') as CalendarEntry['statut'],
      feedback: row[9] || '',
    }));
  } catch {
    return [];
  }
}

export async function writeCalendar(clientSlug: string, entries: CalendarEntry[]): Promise<void> {
  const sheets = getSheets();
  const values = entries.map((e) => [
    e.date, e.type, e.theme, e.titre, e.legende, e.hashtags,
    e.image_prompt, e.image_url, e.statut || 'brouillon', e.feedback || '',
  ]);

  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${calendarTab(clientSlug)}!A1:J${values.length + 1}`,
    valueInputOption: 'RAW',
    requestBody: {
      values: [CALENDAR_HEADERS, ...values],
    },
  });
}

export async function updateEntry(clientSlug: string, row: number, data: Partial<CalendarEntry>): Promise<void> {
  const sheets = getSheets();
  const tab = calendarTab(clientSlug);
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${tab}!A${row}:J${row}`,
  });
  const existing = res.data.values?.[0] || Array(10).fill('');

  const fieldMap: Record<string, number> = {
    date: 0, type: 1, theme: 2, titre: 3, legende: 4,
    hashtags: 5, image_prompt: 6, image_url: 7, statut: 8, feedback: 9,
  };

  for (const [key, value] of Object.entries(data)) {
    if (key in fieldMap && key !== 'row') {
      existing[fieldMap[key]] = value;
    }
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${tab}!A${row}:J${row}`,
    valueInputOption: 'RAW',
    requestBody: { values: [existing] },
  });
}

// === Création des onglets pour un nouveau client ===

export async function createClientTabs(clientName: string): Promise<string> {
  const sheets = getSheets();
  const clientSlug = slug(clientName);

  // Add 2 new tabs: Profil_{slug} and Cal_{slug}
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: {
      requests: [
        { addSheet: { properties: { title: profilTab(clientSlug) } } },
        { addSheet: { properties: { title: calendarTab(clientSlug) } } },
      ],
    },
  });

  // Write headers
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${profilTab(clientSlug)}!A1:B1`,
    valueInputOption: 'RAW',
    requestBody: { values: [['clé', 'valeur']] },
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${calendarTab(clientSlug)}!A1:J1`,
    valueInputOption: 'RAW',
    requestBody: { values: [CALENDAR_HEADERS] },
  });

  return clientSlug;
}
