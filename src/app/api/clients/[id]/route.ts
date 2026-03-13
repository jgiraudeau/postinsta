import { NextResponse } from 'next/server';
import * as db from '@/lib/db';
import { requireAuth } from '@/lib/request-helpers';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const hasAccess = await db.canAccessClient(id, user.userId, user.role === 'ADMIN');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const client = await db.getClientById(id);
    if (!client) {
      return NextResponse.json({ error: 'Client non trouvé' }, { status: 404 });
    }

    const profile = await db.readProfile(client);
    const calendar = await db.readCalendar(client);

    return NextResponse.json({ client, profile, calendar });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    console.error('Error fetching client:', error);
    return NextResponse.json({ error: 'Erreur' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const { airtableInterfaceUrl, canva_template_id } = await request.json();

    const hasAccess = await db.canAccessClient(id, user.userId, user.role === 'ADMIN');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    await db.updateClient(id, { airtableInterfaceUrl, canva_template_id });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    console.error('Error updating client:', error);
    return NextResponse.json({ error: 'Erreur' }, { status: 500 });
  }
}
