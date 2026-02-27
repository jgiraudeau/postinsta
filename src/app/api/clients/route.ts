import { NextResponse } from 'next/server';
import { getClients, addClient, createClientTabs, writeProfile } from '@/lib/sheets';
import type { ClientProfile } from '@/types';
import { randomUUID } from 'crypto';

export async function GET() {
  try {
    const clients = await getClients();
    return NextResponse.json({ clients });
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json({ error: 'Erreur lors du chargement des clients' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, profile } = (await request.json()) as {
      name: string;
      profile: ClientProfile;
    };

    // Create tabs in the master sheet for this client
    const clientSlug = await createClientTabs(name);
    await writeProfile(clientSlug, profile);

    const client = {
      id: randomUUID(),
      name,
      sheetId: clientSlug,  // slug used as tab prefix
      viewToken: randomUUID(),
      createdAt: new Date().toISOString(),
    };
    await addClient(client);

    return NextResponse.json({ client });
  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json({ error: 'Erreur lors de la création du client' }, { status: 500 });
  }
}
