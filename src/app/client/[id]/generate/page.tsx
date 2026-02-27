'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';

type Step = 'idle' | 'calendar' | 'captions' | 'images';

export default function GeneratePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [step, setStep] = useState<Step>('idle');
  const [progress, setProgress] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState('');
  const [result, setResult] = useState('');
  const [batchProgress, setBatchProgress] = useState({ done: 0, total: 0 });
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  function startTimer() {
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
  }

  function stopTimer() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }

  // Génération un par un (légendes et images)
  async function generateBatch(type: 'captions' | 'images') {
    const label = type === 'images' ? 'images' : 'légendes';
    setStep(type);
    setError('');
    setResult('');
    setBatchProgress({ done: 0, total: 0 });
    startTimer();
    setProgress(`Récupération des ${label} à générer...`);

    try {
      const listRes = await fetch(`/api/generate/${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: id }),
      });

      if (!listRes.ok) {
        const data = await listRes.json();
        throw new Error(data.error || 'Erreur');
      }

      const { pending, total } = await listRes.json();
      if (total === 0) {
        stopTimer();
        setResult(`Aucune ${type === 'images' ? 'image' : 'légende'} à générer.`);
        setProgress('');
        setStep('idle');
        return;
      }

      setBatchProgress({ done: 0, total });

      let done = 0;
      for (const item of pending) {
        setProgress(`${type === 'images' ? 'Image' : 'Légende'} ${done + 1}/${total} : "${item.titre}"...`);

        const res = await fetch(`/api/generate/${type}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientId: id, row: item.row }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({ error: 'Erreur serveur' }));
          console.error(`Erreur ${type} row ${item.row}:`, data.error);
        }

        done++;
        setBatchProgress({ done, total });
      }

      stopTimer();
      setResult(`Terminé ! ${done} ${label} générée${done > 1 ? 's' : ''}.`);
      setProgress('');
      setStep('idle');
    } catch (err) {
      stopTimer();
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      setStep('idle');
      setProgress('');
    }
  }

  // Calendrier : un seul appel (assez rapide)
  async function generateCalendar() {
    setStep('calendar');
    setError('');
    setResult('');
    setBatchProgress({ done: 0, total: 0 });
    startTimer();
    setProgress('Génération du calendrier...');

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5 * 60 * 1000);

      const res = await fetch('/api/generate/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: id }),
        signal: controller.signal,
      });

      clearTimeout(timeout);
      stopTimer();

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error('Le serveur a mis trop de temps (timeout Vercel). Réessayez.');
      }

      if (!res.ok) {
        throw new Error(data.error || 'Erreur de génération');
      }

      setResult(`Terminé ! ${data.count || 0} posts planifiés.`);
      setProgress('');
      setStep('idle');
    } catch (err) {
      stopTimer();
      if (err instanceof DOMException && err.name === 'AbortError') {
        setError('Timeout — la génération a pris trop de temps. Réessayez.');
      } else {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      }
      setStep('idle');
      setProgress('');
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <button onClick={() => router.back()} className="mb-4 text-sm text-gray-500 hover:text-gray-700">
        ← Retour
      </button>
      <h1 className="mb-6 text-2xl font-bold">Générer du contenu</h1>

      <div className="space-y-4">
        <div className="rounded-xl border bg-white p-6">
          <h2 className="text-lg font-semibold">1. Calendrier éditorial</h2>
          <p className="mt-1 text-sm text-gray-500">
            Génère les thèmes, titres et dates pour le mois à venir
          </p>
          <button
            onClick={() => generateCalendar()}
            disabled={step !== 'idle'}
            className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {step === 'calendar' ? 'En cours...' : 'Générer le calendrier'}
          </button>
        </div>

        <div className="rounded-xl border bg-white p-6">
          <h2 className="text-lg font-semibold">2. Légendes & hashtags</h2>
          <p className="mt-1 text-sm text-gray-500">
            Génère les textes un par un pour chaque post
          </p>
          <button
            onClick={() => generateBatch('captions')}
            disabled={step !== 'idle'}
            className="mt-3 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
          >
            {step === 'captions' ? 'En cours...' : 'Générer les légendes'}
          </button>
        </div>

        <div className="rounded-xl border bg-white p-6">
          <h2 className="text-lg font-semibold">3. Images</h2>
          <p className="mt-1 text-sm text-gray-500">
            Génère les visuels un par un (environ 7s par image)
          </p>
          <button
            onClick={() => generateBatch('images')}
            disabled={step !== 'idle'}
            className="mt-3 rounded-lg bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-700 disabled:opacity-50"
          >
            {step === 'images' ? 'En cours...' : 'Générer les images'}
          </button>
        </div>
      </div>

      {progress && (
        <div className="mt-6 rounded-lg bg-blue-50 p-4">
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            <span className="text-sm text-blue-700">{progress}</span>
          </div>
          {batchProgress.total > 0 && (
            <div className="mt-3">
              <div className="h-2 w-full rounded-full bg-blue-200">
                <div
                  className="h-2 rounded-full bg-blue-600 transition-all"
                  style={{ width: `${(batchProgress.done / batchProgress.total) * 100}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-blue-500">
                {batchProgress.done}/{batchProgress.total} — {elapsed}s écoulées
              </p>
            </div>
          )}
          {batchProgress.total === 0 && (
            <p className="mt-2 text-xs text-blue-500">{elapsed}s écoulées...</p>
          )}
        </div>
      )}
      {result && (
        <div className="mt-6 rounded-lg bg-green-50 p-4 text-sm text-green-700">{result}</div>
      )}
      {error && (
        <div className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      <div className="mt-6">
        <button
          onClick={() => router.push(`/client/${id}/calendar`)}
          className="text-sm text-blue-600 hover:underline"
        >
          Voir le calendrier →
        </button>
      </div>
    </div>
  );
}
