'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import type { CalendarEntry } from '@/types';

const STATUS_COLORS: Record<string, string> = {
  brouillon: 'bg-yellow-100 text-yellow-800',
  validé: 'bg-green-100 text-green-800',
  rejeté: 'bg-red-100 text-red-800',
  publié: 'bg-blue-100 text-blue-800',
};

export default function CalendarPage() {
  const { id } = useParams<{ id: string }>();
  const [entries, setEntries] = useState<CalendarEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/clients/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setEntries(data.calendar || []);
        setLoading(false);
      });
  }, [id]);

  async function handleValidate(row: number, statut: 'validé' | 'rejeté') {
    await fetch('/api/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId: id, row, statut }),
    });
    setEntries((prev) =>
      prev.map((e) => (e.row === row ? { ...e, statut } : e))
    );
  }

  if (loading) return <div className="p-8 text-gray-500">Chargement...</div>;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href={`/client/${id}`} className="text-sm text-gray-500 hover:text-gray-700">
            ← Retour
          </Link>
          <h1 className="text-2xl font-bold">Calendrier éditorial</h1>
        </div>
        <Link
          href={`/client/${id}/generate`}
          className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
        >
          Générer du contenu
        </Link>
      </div>

      {entries.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
          <p className="text-gray-500">Aucun contenu dans le calendrier</p>
          <Link href={`/client/${id}/generate`} className="mt-2 inline-block text-blue-600 hover:underline">
            Générer un calendrier
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <div key={entry.row} className="rounded-xl border bg-white p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-500">{entry.date}</span>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">{entry.type}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_COLORS[entry.statut] || ''}`}>
                      {entry.statut}
                    </span>
                  </div>
                  <h3 className="mt-1 font-semibold">{entry.titre}</h3>
                  <p className="mt-1 text-sm text-gray-600">{entry.theme}</p>
                  {entry.legende && (
                    <p className="mt-2 whitespace-pre-line text-sm">{entry.legende}</p>
                  )}
                  {entry.hashtags && (
                    <p className="mt-1 text-sm text-blue-500">{entry.hashtags}</p>
                  )}
                </div>
                {entry.image_url && (
                  <img
                    src={entry.image_url}
                    alt={entry.titre}
                    className="ml-4 h-24 w-24 rounded-lg object-cover"
                  />
                )}
              </div>
              {entry.statut === 'brouillon' && (
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => handleValidate(entry.row!, 'validé')}
                    className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700"
                  >
                    Valider
                  </button>
                  <button
                    onClick={() => handleValidate(entry.row!, 'rejeté')}
                    className="rounded-lg bg-red-100 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-200"
                  >
                    Rejeter
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
