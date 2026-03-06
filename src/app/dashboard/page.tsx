'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Client } from '@/types';

interface UserInfo {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'USER';
}

export default function DashboardPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/auth/me').then((r) => r.json()),
      fetch('/api/clients').then((r) => r.json()),
    ])
      .then(([userData, clientsData]) => {
        setUser(userData);
        setClients(clientsData.clients || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">PostInsta</h1>
          {user && (
            <p className="text-sm text-gray-500 mt-1">
              {user.name} {user.role === 'ADMIN' && <span className="text-purple-600 font-medium">(Admin)</span>}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {user?.role === 'ADMIN' && (
            <Link
              href="/admin/users"
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Utilisateurs
            </Link>
          )}
          <Link
            href="/client/new"
            className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
          >
            + Nouveau client
          </Link>
          <button
            onClick={handleLogout}
            className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            Déconnexion
          </button>
        </div>
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
