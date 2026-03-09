import { NextResponse } from 'next/server';
import { getClientById, readProfile, readCalendar, canAccessClient } from '@/lib/airtable';
import { requireAuth } from '@/lib/request-helpers';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const hasAccess = await canAccessClient(id, user.userId, user.role === 'ADMIN');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const client = await getClientById(id);
    if (!client) {
      return NextResponse.json({ error: 'Client non trouvé' }, { status: 404 });
    }

    const profile = await readProfile(client.sheetId);
    const calendar = await readCalendar(client.sheetId);

    return NextResponse.json({ client, profile, calendar });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    console.error('Error fetching client:', error);
    return NextResponse.json({ error: 'Erreur' }, { status: 500 });
  }
}
