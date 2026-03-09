import { NextResponse } from 'next/server';
import { getClients, addClient, createClientTabs, writeProfile } from '@/lib/airtable';
import { requireAuth } from '@/lib/request-helpers';
import type { ClientProfile } from '@/types';
import { randomUUID } from 'crypto';

export async function GET() {
  try {
    const user = await requireAuth();
    const userId = user.role === 'ADMIN' ? undefined : user.userId;
    const clients = await getClients(userId);
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
    const { name, profile } = (await request.json()) as {
      name: string;
      profile: ClientProfile;
    };

    const clientSlug = await createClientTabs(name);
    await writeProfile(clientSlug, profile);

    const client = {
      id: randomUUID(),
      name,
      sheetId: clientSlug,
      viewToken: randomUUID(),
      userId: user.userId,
      createdAt: new Date().toISOString(),
    };
    await addClient(client);

    return NextResponse.json({ client });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    console.error('Error creating client:', error);
    return NextResponse.json({ error: 'Erreur lors de la création du client' }, { status: 500 });
  }
}
