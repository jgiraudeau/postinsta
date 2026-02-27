'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import type { Client, ClientProfile, CalendarEntry } from '@/types';

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [client, setClient] = useState<Client | null>(null);
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [calendar, setCalendar] = useState<CalendarEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/clients/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setClient(data.client);
        setProfile(data.profile);
        setCalendar(data.calendar || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-8 text-gray-500">Chargement...</div>;
  if (!client) return <div className="p-8 text-red-500">Client non trouvé</div>;

  const stats = {
    total: calendar.length,
    brouillon: calendar.filter((e) => e.statut === 'brouillon').length,
    validé: calendar.filter((e) => e.statut === 'validé').length,
    rejeté: calendar.filter((e) => e.statut === 'rejeté').length,
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link href="/dashboard" className="mb-4 inline-block text-sm text-gray-500 hover:text-gray-700">
        ← Retour au dashboard
      </Link>

      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">{client.name}</h1>
          {profile && (
            <p className="mt-1 text-gray-500">
              {profile.secteur} · {profile.rythme}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Link
            href={`/client/${id}/calendar`}
            className="rounded-lg border px-4 py-2 hover:bg-gray-50"
          >
            Calendrier
          </Link>
          <Link
            href={`/client/${id}/generate`}
            className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
          >
            Générer
          </Link>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-4 gap-4">
        {[
          { label: 'Total posts', value: stats.total, color: 'bg-gray-100' },
          { label: 'Brouillons', value: stats.brouillon, color: 'bg-yellow-50' },
          { label: 'Validés', value: stats.validé, color: 'bg-green-50' },
          { label: 'Rejetés', value: stats.rejeté, color: 'bg-red-50' },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl ${s.color} p-4 text-center`}>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-sm text-gray-600">{s.label}</p>
          </div>
        ))}
      </div>

      {profile && (
        <div className="rounded-xl border bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">Profil</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {Object.entries(profile).map(([key, value]) =>
              value ? (
                <div key={key}>
                  <p className="text-xs font-medium uppercase text-gray-400">{key.replace(/_/g, ' ')}</p>
                  <p className="text-sm">{value}</p>
                </div>
              ) : null
            )}
          </div>
        </div>
      )}

      <div className="mt-6 rounded-xl border bg-white p-4">
        <p className="text-sm text-gray-500">Lien de partage client :</p>
        <code className="mt-1 block text-sm text-blue-600">/view/{client.viewToken}</code>
      </div>
    </div>
  );
}
