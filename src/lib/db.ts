import * as sheets from './sheets';
import * as airtable from './airtable';
import type { Client, ClientProfile, CalendarEntry } from '@/types';

// === Dispatcher logic ===

export async function getClients(userId?: string): Promise<Client[]> {
  // We use Google Sheets as the master registry for ALL clients
  return sheets.getClients(userId);
}

export async function getClientById(id: string): Promise<Client | null> {
  return sheets.getClientById(id);
}

export async function getClientByToken(token: string): Promise<Client | null> {
  return sheets.getClientByToken(token);
}

export async function addClient(client: Client): Promise<void> {
  // 1. Add to the Master Registry (Sheets)
  await sheets.addClient(client);

  // 2. Initialize the backend storage (Sheets tabs or Airtable records)
  if (client.source === 'airtable') {
    await airtable.addClient(client);
  } else {
    await sheets.createClientTabs(client.name);
  }
}

export async function readProfile(client: Client): Promise<ClientProfile> {
  if (client.source === 'airtable') {
    return airtable.readProfile(client.sheetId, client.name);
  }
  return sheets.readProfile(client.sheetId);
}

export async function writeProfile(client: Client, profile: ClientProfile): Promise<void> {
  if (client.source === 'airtable') {
    return airtable.writeProfile(client.sheetId, profile, client.name);
  }
  return sheets.writeProfile(client.sheetId, profile);
}

export async function readCalendar(client: Client): Promise<CalendarEntry[]> {
  if (client.source === 'airtable') {
    return airtable.readCalendar(client.sheetId, client.name);
  }
  return sheets.readCalendar(client.sheetId);
}

export async function writeCalendar(client: Client, entries: CalendarEntry[]): Promise<void> {
  if (client.source === 'airtable') {
    return airtable.writeCalendar(client.sheetId, entries, client.name);
  }
  return sheets.writeCalendar(client.sheetId, entries);
}

export async function updateEntry(client: Client, row: number, data: Partial<CalendarEntry>): Promise<void> {
  if (client.source === 'airtable') {
    return airtable.updateEntry(client.sheetId, row, data, client.name);
  }
  return sheets.updateEntry(client.sheetId, row, data);
}

export async function canAccessClient(clientId: string, userId: string, isAdmin: boolean): Promise<boolean> {
  return sheets.canAccessClient(clientId, userId, isAdmin);
}
