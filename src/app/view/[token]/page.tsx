'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import type { CalendarEntry } from '@/types';

const STATUS_COLORS: Record<string, string> = {
  brouillon: 'bg-yellow-100 text-yellow-800',
  validé: 'bg-green-100 text-green-800',
  rejeté: 'bg-red-100 text-red-800',
  publié: 'bg-blue-100 text-blue-800',
};

export default function ClientViewPage() {
  const { token } = useParams<{ token: string }>();
  const [entries, setEntries] = useState<CalendarEntry[]>([]);
  const [clientName, setClientName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedbackRow, setFeedbackRow] = useState<number | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetch(`/api/calendar/${token}`)
      .then((r) => {
        if (!r.ok) throw new Error('Lien invalide');
        return r.json();
      })
      .then((data) => {
        setEntries(data.calendar || []);
        setClientName(data.clientName || '');
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [token]);

  async function sendFeedback(row: number) {
    setSending(true);
    await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, entryRow: row, feedback: feedbackText }),
    });
    setEntries((prev) =>
      prev.map((e) => (e.row === row ? { ...e, feedback: feedbackText } : e))
    );
    setFeedbackRow(null);
    setFeedbackText('');
    setSending(false);
  }

  if (loading) return <div className="p-8 text-gray-500">Chargement...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold">Calendrier — {clientName}</h1>
      <p className="mb-6 text-sm text-gray-500">
        Consultez vos contenus et laissez vos commentaires
      </p>

      <div className="space-y-4">
        {entries.map((entry) => (
          <div key={entry.row} className="rounded-xl border bg-white p-5">
            <div className="flex items-start gap-4">
              {entry.image_url && (
                <img
                  src={entry.image_url}
                  alt={entry.titre}
                  className="h-32 w-32 rounded-lg object-cover"
                />
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">{entry.date}</span>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">{entry.type}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_COLORS[entry.statut] || ''}`}>
                    {entry.statut}
                  </span>
                </div>
                <h3 className="mt-1 font-semibold">{entry.titre}</h3>
                {entry.legende && (
                  <p className="mt-2 whitespace-pre-line text-sm">{entry.legende}</p>
                )}
                {entry.hashtags && (
                  <p className="mt-1 text-sm text-blue-500">{entry.hashtags}</p>
                )}

                {entry.feedback && (
                  <div className="mt-3 rounded-lg bg-gray-50 p-3 text-sm">
                    <span className="font-medium">Votre feedback :</span> {entry.feedback}
                  </div>
                )}

                {feedbackRow === entry.row ? (
                  <div className="mt-3 space-y-2">
                    <textarea
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      placeholder="Votre commentaire..."
                      rows={3}
                      className="w-full rounded-lg border px-3 py-2 text-sm"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => sendFeedback(entry.row!)}
                        disabled={sending || !feedbackText.trim()}
                        className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white disabled:opacity-50"
                      >
                        {sending ? 'Envoi...' : 'Envoyer'}
                      </button>
                      <button
                        onClick={() => { setFeedbackRow(null); setFeedbackText(''); }}
                        className="rounded-lg border px-3 py-1.5 text-sm"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setFeedbackRow(entry.row!)}
                    className="mt-2 text-sm text-blue-600 hover:underline"
                  >
                    Laisser un commentaire
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
