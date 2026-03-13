import { NextResponse } from 'next/server';
import * as db from '@/lib/db';
import { requireAuth } from '@/lib/request-helpers';
import type { ClientProfile, Client } from '@/types';
import { randomUUID } from 'crypto';

export async function GET() {
  try {
    const user = await requireAuth();
    const userId = user.role === 'ADMIN' ? undefined : user.userId;
    const clients = await db.getClients(userId);
    return NextResponse.json({ clients });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    console.error('Error fetching clients:', error);
    return NextResponse.json({ error: 'Erreur lors du chargement des clients' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const { name, profile, source, airtableInterfaceUrl } = (await request.json()) as {
      name: string;
      profile: ClientProfile;
      source?: 'sheets' | 'airtable';
      airtableInterfaceUrl?: string;
    };

    const client: Client = {
      id: randomUUID(),
      name,
      sheetId: name, // slug ou name
      viewToken: randomUUID(),
      userId: user.userId,
      createdAt: new Date().toISOString(),
      source: source || 'sheets',
      airtableInterfaceUrl: airtableInterfaceUrl || '',
    };

    await db.addClient(client);
    await db.writeProfile(client, profile);

    return NextResponse.json({ client });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    console.error('Error creating client:', error);
    return NextResponse.json({ error: 'Erreur lors de la création du client' }, { status: 500 });
  }
}
