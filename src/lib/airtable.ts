import type { ClientProfile, CalendarEntry, Client } from '@/types';

const AIRTABLE_PAT = process.env.AIRTABLE_PAT!;
const BASE_ID = 'app0cKx7hU4iAYBVA';
const CALENDAR_TABLE_ID = 'tblDMssxxDTM41LAX';

// === Airtable API helpers ===

async function airtableFetch(path: string, options?: RequestInit) {
  const res = await fetch(`https://api.airtable.com/v0/${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${AIRTABLE_PAT}`,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Airtable error ${res.status}: ${err}`);
  }
  return res.json();
}

// Field name mapping: Airtable field names -> CalendarEntry keys
const FIELD_MAP = {
  'Sujet du post': 'titre',
  'date de publication': 'date',
  'statut': 'statut',
  'Type de publication': 'type',
  'thème': 'theme',
  'contenu': 'legende',
  'Hashtags': 'hashtags',
  'Image': 'image_url',
  'Image Prompt': 'image_prompt',
  'Feedback': 'feedback',
  'Visuels Client': 'visuels_client',
  'Client': 'client',
  'persona': 'persona',
} as const;

// Reverse mapping: CalendarEntry keys -> Airtable field names
const REVERSE_FIELD_MAP: Record<string, string> = {};
for (const [airtableField, entryKey] of Object.entries(FIELD_MAP)) {
  REVERSE_FIELD_MAP[entryKey] = airtableField;
}

// Status mapping: PostInsta -> Airtable
const STATUS_TO_AIRTABLE: Record<string, string> = {
  'brouillon': 'brouillons',
  'validé': 'approuvés ',
  'rejeté': 'Idées ',
  'publié': 'publié ',
  'planifié': 'planifié',
};

const STATUS_FROM_AIRTABLE: Record<string, CalendarEntry['statut']> = {
  'Idées ': 'brouillon',
  'brouillons': 'brouillon',
  'approuvés ': 'validé',
  'planifié': 'validé',
  'publié ': 'publié',
};

// === Parse Airtable record -> CalendarEntry ===

function recordToEntry(record: { id: string; fields: Record<string, unknown> }): CalendarEntry & { airtableId: string; visuels_client?: string[] } {
  const f = record.fields;

  // Extract image URLs from attachment fields
  const imageAttachments = f['Image'] as Array<{ url: string }> | undefined;
  const imageUrls = imageAttachments?.map(a => a.url) || [];

  const clientAttachments = f['Visuels Client'] as Array<{ url: string }> | undefined;
  const clientUrls = clientAttachments?.map(a => a.url) || [];

  const airtableStatus = (f['statut'] as string) || 'brouillons';

  return {
    airtableId: record.id,
    date: f['date de publication'] ? (f['date de publication'] as string).split('T')[0] : '',
    type: (f['Type de publication'] as string) || 'post',
    theme: (f['thème'] as string) || '',
    titre: (f['Sujet du post'] as string) || '',
    legende: (f['contenu'] as string) || '',
    hashtags: (f['Hashtags'] as string) || '',
    image_prompt: (f['Image Prompt'] as string) || '',
    image_url: imageUrls.join(','),
    statut: STATUS_FROM_AIRTABLE[airtableStatus] || 'brouillon',
    feedback: (f['Feedback'] as string) || '',
    visuels_client: clientUrls,
  };
}

// === Clients (stored in a separate "Clients" table or we use the Client field) ===
// For now, clients are managed by the Client field in the calendar table
// and the existing Prisma User model for auth. We keep the same interface.

// Simple in-memory client registry using Airtable records
// Clients are identified by unique values in the "Client" field

export async function getClients(userId?: string): Promise<Client[]> {
  // Get distinct client names from the calendar table
  const data = await airtableFetch(
    `${BASE_ID}/${CALENDAR_TABLE_ID}?fields%5B%5D=Client&fields%5B%5D=persona`
  );

  const clientNames = new Set<string>();
  for (const record of data.records) {
    const name = record.fields['Client'];
    if (name) clientNames.add(name);
  }

  return Array.from(clientNames).map((name, i) => ({
    id: `client_${i}`,
    name,
    sheetId: name, // use name as slug for compatibility
    viewToken: Buffer.from(name).toString('base64url'),
    userId: userId || '',
    createdAt: new Date().toISOString(),
  }));
}

export async function addClient(client: Client): Promise<void> {
  // Check if a [Config] record already exists (created by createClientTabs)
  const formula = encodeURIComponent(`AND({Client}="${client.name}",FIND("[Config]",{Sujet du post}))`);
  const existing = await airtableFetch(
    `${BASE_ID}/${CALENDAR_TABLE_ID}?filterByFormula=${formula}&maxRecords=1`
  );

  if (existing.records.length === 0) {
    // Create a placeholder config record for the new client
    await airtableFetch(`${BASE_ID}/${CALENDAR_TABLE_ID}`, {
      method: 'POST',
      body: JSON.stringify({
        typecast: true,
        records: [{
          fields: {
            'Sujet du post': `[Config] ${client.name}`,
            'Client': client.name,
            'statut': 'Idées ',
          },
        }],
      }),
    });
  }
}

export async function getClientByToken(token: string): Promise<Client | null> {
  const clients = await getClients();
  return clients.find((c) => c.viewToken === token) ?? null;
}

export async function getClientById(id: string): Promise<Client | null> {
  const clients = await getClients();
  return clients.find((c) => c.id === id) ?? null;
}

export async function canAccessClient(clientId: string, userId: string, isAdmin: boolean): Promise<boolean> {
  if (isAdmin) return true;
  return true; // simplified - all authenticated users can access all clients
}

// === Client Profile ===
// Stored as JSON in the "Profil JSON" field of the [Config] record

export async function readProfile(clientSlug: string): Promise<ClientProfile> {
  const formula = encodeURIComponent(`AND({Client}="${clientSlug}",FIND("[Config]",{Sujet du post}))`);
  const data = await airtableFetch(
    `${BASE_ID}/${CALENDAR_TABLE_ID}?filterByFormula=${formula}&maxRecords=1`
  );

  const profilJson = data.records[0]?.fields?.['Profil JSON'] || '';
  if (profilJson) {
    try {
      return JSON.parse(profilJson) as ClientProfile;
    } catch {
      // fallback below
    }
  }

  return {
    nom_client: clientSlug,
    secteur: '',
    tone_of_voice: '',
    couleurs: '',
    typo: '',
    logo_url: '',
    exemples_posts: '',
    rythme: '3 posts par semaine',
    jours_publication: 'lundi, mercredi, vendredi',
    types_contenu: 'post, carousel, story',
    themes_recurrents: '',
    hashtags_base: '',
    cta_style: '',
  };
}

export async function writeProfile(clientSlug: string, profile: ClientProfile): Promise<void> {
  const formula = encodeURIComponent(`AND({Client}="${clientSlug}",FIND("[Config]",{Sujet du post}))`);
  const data = await airtableFetch(
    `${BASE_ID}/${CALENDAR_TABLE_ID}?filterByFormula=${formula}&maxRecords=1`
  );

  const profileJson = JSON.stringify(profile);

  if (data.records.length > 0) {
    await airtableFetch(`${BASE_ID}/${CALENDAR_TABLE_ID}/${data.records[0].id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        fields: { 'Profil JSON': profileJson, 'persona': profile.tone_of_voice },
      }),
    });
  }
}

// === Calendar ===

export async function readCalendar(clientSlug: string): Promise<CalendarEntry[]> {
  const formula = encodeURIComponent(`{Client}="${clientSlug}"`);
  const data = await airtableFetch(
    `${BASE_ID}/${CALENDAR_TABLE_ID}?filterByFormula=${formula}&sort%5B0%5D%5Bfield%5D=date+de+publication&sort%5B0%5D%5Bdirection%5D=asc`
  );

  return data.records
    .map(recordToEntry)
    .filter((e: CalendarEntry) => !e.titre.startsWith('[Config]'))
    .map((e: CalendarEntry, i: number) => ({ ...e, row: i + 2 }));
}

export async function writeCalendar(clientSlug: string, entries: CalendarEntry[]): Promise<void> {
  // Create records in batches of 10 (Airtable limit)
  const batchSize = 10;

  for (let i = 0; i < entries.length; i += batchSize) {
    const batch = entries.slice(i, i + batchSize);
    const records = batch.map(e => ({
      fields: {
        'Sujet du post': e.titre,
        'date de publication': e.date ? `${e.date}T12:00:00.000Z` : undefined,
        'Type de publication': e.type || 'post',
        'thème': e.theme,
        'contenu': e.legende,
        'Hashtags': e.hashtags,
        'Image Prompt': e.image_prompt,
        'statut': STATUS_TO_AIRTABLE[e.statut] || 'brouillons',
        'Client': clientSlug,
        'Feedback': e.feedback || '',
      },
    }));

    await airtableFetch(`${BASE_ID}/${CALENDAR_TABLE_ID}`, {
      method: 'POST',
      body: JSON.stringify({ typecast: true, records }),
    });
  }
}

export async function updateEntry(clientSlug: string, row: number, data: Partial<CalendarEntry>): Promise<void> {
  // In Airtable, we use the airtableId instead of row number
  // The row parameter is used as an index into the calendar
  const calendar = await readCalendar(clientSlug);
  const entry = calendar[row - 2]; // row is 1-indexed with header, so row 2 = index 0

  if (!entry) {
    throw new Error(`Entry not found at row ${row}`);
  }

  const airtableId = (entry as CalendarEntry & { airtableId: string }).airtableId;
  const fields: Record<string, unknown> = {};

  if (data.legende !== undefined) fields['contenu'] = data.legende;
  if (data.hashtags !== undefined) fields['Hashtags'] = data.hashtags;
  if (data.image_url !== undefined) {
    // For image attachments, we need to provide URL objects
    const urls = data.image_url.split(',').filter(Boolean);
    if (urls.length > 0) {
      fields['Image'] = urls.map(url => ({ url }));
    }
  }
  if (data.image_prompt !== undefined) fields['Image Prompt'] = data.image_prompt;
  if (data.statut !== undefined) fields['statut'] = STATUS_TO_AIRTABLE[data.statut] || 'brouillons';
  if (data.feedback !== undefined) fields['Feedback'] = data.feedback;
  if (data.titre !== undefined) fields['Sujet du post'] = data.titre;
  if (data.type !== undefined) fields['Type de publication'] = data.type;
  if (data.theme !== undefined) fields['thème'] = data.theme;
  if (data.date !== undefined) fields['date de publication'] = `${data.date}T12:00:00.000Z`;

  await airtableFetch(`${BASE_ID}/${CALENDAR_TABLE_ID}/${airtableId}`, {
    method: 'PATCH',
    body: JSON.stringify({ typecast: true, fields }),
  });
}

// === Création client (compatibilité) ===

export async function createClientTabs(clientName: string): Promise<string> {
  // In Airtable, create the [Config] record for this client
  await airtableFetch(`${BASE_ID}/${CALENDAR_TABLE_ID}`, {
    method: 'POST',
    body: JSON.stringify({
      typecast: true,
      records: [{
        fields: {
          'Sujet du post': `[Config] ${clientName}`,
          'Client': clientName,
          'statut': 'Idées ',
        },
      }],
    }),
  });
  return clientName;
}
