'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Client } from '@/types';

export default function DashboardPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/clients')
      .then((r) => r.json())
      .then((data) => {
        setClients(data.clients || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">PostInsta</h1>
        <Link
          href="/client/new"
          className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
        >
          + Nouveau client
        </Link>
      </div>

      {loading ? (
        <p className="text-gray-500">Chargement...</p>
      ) : clients.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
          <p className="text-lg text-gray-500">Aucun client pour le moment</p>
          <Link href="/client/new" className="mt-2 inline-block text-blue-600 hover:underline">
            Ajouter votre premier client
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {clients.map((client) => (
            <Link
              key={client.id}
              href={`/client/${client.id}`}
              className="rounded-xl border bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <h2 className="text-xl font-semibold">{client.name}</h2>
              <p className="mt-1 text-sm text-gray-500">
                Créé le {new Date(client.createdAt).toLocaleDateString('fr-FR')}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
