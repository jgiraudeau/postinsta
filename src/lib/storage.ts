import { put } from '@vercel/blob';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const IS_PROD = process.env.BLOB_READ_WRITE_TOKEN;

export async function saveImage(buffer: Buffer, filename: string): Promise<string> {
  if (IS_PROD) {
    // Vercel Blob en production
    const blob = await put(`postinsta/${filename}`, buffer, {
      access: 'public',
      contentType: 'image/png',
    });
    return blob.url;
  }

  // Stockage local en dev
  const dir = path.join(process.cwd(), 'public', 'images');
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), buffer);
  return `/images/${filename}`;
}
