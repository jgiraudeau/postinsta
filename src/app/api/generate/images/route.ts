import { NextResponse } from 'next/server';
import * as db from '@/lib/db';
import { generateImage, generateCarouselImages } from '@/lib/image-gen';

export const maxDuration = 300;

// POST avec { clientId } → retourne la liste des posts à générer
// POST avec { clientId, row } → génère UNE seule image pour ce row
export async function POST(request: Request) {
  try {
    const { clientId, row } = await request.json();

    const client = await db.getClientById(clientId);
    if (!client) {
      return NextResponse.json({ error: 'Client non trouvé' }, { status: 404 });
    }

    const profile = await db.readProfile(client);
    const calendar = await db.readCalendar(client);
    const toGenerate = calendar.filter((e) => !e.image_url.trim() && e.statut !== 'rejeté');

    // Mode listing : retourne juste les rows à traiter
    if (!row) {
      const pending = toGenerate.map((e) => ({ row: e.row, titre: e.titre }));
      return NextResponse.json({ pending, total: pending.length });
    }

    // Mode génération : génère une seule image
    const entry = toGenerate.find((e) => e.row === row);
    if (!entry) {
      return NextResponse.json({ error: 'Post non trouvé ou déjà généré' }, { status: 404 });
    }

    console.log(`[API] Generating image for row ${entry.row} (type: ${entry.type})...`);
    try {
      if (entry.type === 'carousel') {
        // Carrousel : générer toutes les slides
        const { imageUrl, extraImages } = await generateCarouselImages(profile, entry, client.sheetId);
        console.log(`[API] Carousel generated: ${1 + extraImages.length} slides. Updating database...`);
        await db.updateEntry(client, entry.row!, { image_url: imageUrl, extra_images: extraImages });
        return NextResponse.json({ row: entry.row, image_url: imageUrl, extra_images: extraImages });
      } else {
        // Post simple : une seule image
        const imageUrl = await generateImage(profile, entry, client.sheetId);
        console.log(`[API] Image generated: ${imageUrl}. Updating database...`);
        await db.updateEntry(client, entry.row!, { image_url: imageUrl });
        return NextResponse.json({ row: entry.row, image_url: imageUrl });
      }
    } catch (genError: any) {
      console.error('[API] Generation failed:', genError);
      return NextResponse.json({ error: `Erreur génération: ${genError.message}` }, { status: 500 });
    }
  } catch (error) {
    console.error('Error generating image details:', error);
    if (error instanceof Error) {
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
    }
    return NextResponse.json({ 
      error: 'Erreur lors de la génération des images',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}
