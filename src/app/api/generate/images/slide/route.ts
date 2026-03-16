import { NextResponse } from 'next/server';
import * as db from '@/lib/db';
import { generateCarouselSlide } from '@/lib/image-gen';

export const maxDuration = 120;

// POST { clientId, row, slideIndex, totalSlides } → génère 1 slide de carrousel
export async function POST(request: Request) {
  try {
    const { clientId, row, slideIndex, totalSlides } = await request.json();

    const client = await db.getClientById(clientId);
    if (!client) {
      return NextResponse.json({ error: 'Client non trouvé' }, { status: 404 });
    }

    const profile = await db.readProfile(client);
    const calendar = await db.readCalendar(client);
    const entry = calendar.find((e) => e.row === row);
    if (!entry) {
      return NextResponse.json({ error: 'Post non trouvé' }, { status: 404 });
    }

    console.log(`[SlideAPI] Generating slide ${slideIndex + 1}/${totalSlides} for row ${row}...`);

    const imageUrl = await generateCarouselSlide(profile, entry, client.sheetId, slideIndex, totalSlides);

    console.log(`[SlideAPI] Slide ${slideIndex + 1} generated: ${imageUrl}`);
    return NextResponse.json({ slideIndex, imageUrl });
  } catch (error: any) {
    console.error('[SlideAPI] Error:', error);
    return NextResponse.json({
      error: `Erreur slide ${(await request.clone().json().catch(() => ({}))).slideIndex ?? '?'}: ${error.message}`,
    }, { status: 500 });
  }
}

// PUT { clientId, row, urls } → sauvegarde toutes les URLs carrousel dans Airtable
export async function PUT(request: Request) {
  try {
    const { clientId, row, urls } = await request.json();

    if (!urls || urls.length === 0) {
      return NextResponse.json({ error: 'Aucune URL à sauvegarder' }, { status: 400 });
    }

    const client = await db.getClientById(clientId);
    if (!client) {
      return NextResponse.json({ error: 'Client non trouvé' }, { status: 404 });
    }

    const imageUrl = urls[0];
    const extraImages = urls.slice(1);

    console.log(`[SlideAPI] Saving ${urls.length} carousel URLs for row ${row}...`);

    await db.updateEntry(client, row, {
      image_url: imageUrl,
      extra_images: extraImages,
    });

    return NextResponse.json({ success: true, saved: urls.length });
  } catch (error: any) {
    console.error('[SlideAPI] Save error:', error);
    return NextResponse.json({ error: `Erreur sauvegarde: ${error.message}` }, { status: 500 });
  }
}
