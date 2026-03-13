'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ImageIcon, 
  ChevronRight, 
  Send, 
  Check, 
  X, 
  ExternalLink, 
  Edit2 
} from 'lucide-react';
import type { Client, ClientProfile, CalendarEntry } from '@/types';

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [client, setClient] = useState<Client | null>(null);
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [calendar, setCalendar] = useState<CalendarEntry[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [editingUrl, setEditingUrl] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [newCanvaId, setNewCanvaId] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetch(`/api/clients/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setClient(data.client);
        setProfile(data.profile);
        setCalendar(data.calendar || []);
        setNewUrl(data.client?.airtableInterfaceUrl || '');
        setNewCanvaId(data.client?.canva_template_id || '');
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  async function updateAirtableUrl() {
    if (!client) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/clients/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ airtableInterfaceUrl: newUrl, canva_template_id: newCanvaId }),
      });
      if (res.ok) {
        setClient({ ...client, airtableInterfaceUrl: newUrl, canva_template_id: newCanvaId });
        setEditingUrl(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  }

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
          {client.airtableInterfaceUrl && (
            <a
              href={client.airtableInterfaceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-orange-100 px-4 py-2 font-medium text-orange-700 hover:bg-orange-200"
            >
              Ouvrir Airtable
            </a>
          )}
        </div>
      </div>

      <div className="mb-8 grid grid-cols-2 md:grid-cols-4 gap-4">
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

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          {profile && (
            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold">Profil Marketing</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {Object.entries(profile).map(([key, value]) =>
                  value ? (
                    <div key={key} className="p-3 rounded-lg bg-slate-50/50 border border-slate-100">
                      <p className="text-[10px] font-bold uppercase text-gray-400 tracking-wider font-mono mb-1">{key.replace(/_/g, ' ')}</p>
                      <p className="text-sm text-gray-700 leading-relaxed font-medium">
                        {key === 'canva_template_id' ? (
                          <span className="flex items-center gap-2 text-blue-600">
                            <span className="bg-blue-100 px-1.5 py-0.5 rounded text-[10px] font-bold text-blue-700">CANVA</span> {value}
                          </span>
                        ) : value}
                      </p>
                    </div>
                  ) : null
                )}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">Liens & Partage</h2>
            
            <div className="mb-6">
              <p className="text-xs font-bold uppercase text-gray-400 mb-2">Lien de partage client</p>
              <div className="flex items-center gap-2 rounded-lg bg-blue-50 p-3 border border-blue-100">
                <code className="text-xs text-blue-700 font-bold overflow-hidden text-ellipsis">/view/{client.viewToken}</code>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/view/${client.viewToken}`);
                    alert('Lien copié !');
                  }}
                  className="shrink-0 text-blue-600 hover:text-blue-800"
                >
                  <Edit2 size={14} />
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between mb-2">
                 <p className="text-xs font-bold uppercase text-gray-400">URL Interface Airtable</p>
                 {!editingUrl && (
                   <button onClick={() => setEditingUrl(true)} className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-xs">
                     <Edit2 size={12} /> {client.airtableInterfaceUrl ? 'Modifier' : 'Ajouter'}
                   </button>
                 )}
              </div>
              
              {editingUrl ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    placeholder="Lien interface Airtable..."
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={newCanvaId}
                    onChange={(e) => setNewCanvaId(e.target.value)}
                    placeholder="ID Modèle Canva..."
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                  <div className="flex gap-2">
                    <button 
                      onClick={updateAirtableUrl}
                      disabled={updating}
                      className="flex-1 rounded-lg bg-blue-600 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {updating ? '...' : 'Enregistrer'}
                    </button>
                    <button 
                      onClick={() => setEditingUrl(false)}
                      className="flex-1 rounded-lg bg-gray-100 py-2 text-xs font-bold text-gray-600 hover:bg-gray-200"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase text-gray-400 mb-1">Interface Airtable</p>
                    {client.airtableInterfaceUrl ? (
                      <a 
                        href={client.airtableInterfaceUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="flex items-center gap-2 text-sm text-orange-600 hover:underline break-all bg-orange-50 p-2 rounded-lg border border-orange-100"
                      >
                        <ExternalLink size={14} />
                        Afficher l'interface
                      </a>
                    ) : (
                      <p className="text-xs text-gray-400 italic">Non configurée</p>
                    )}
                  </div>

                  <div>
                    <p className="text-[10px] font-bold uppercase text-gray-400 mb-1">Modèle Canva</p>
                    {client.canva_template_id ? (
                      <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 p-2 rounded-lg border border-blue-100">
                        <span className="bg-blue-600 text-white text-[9px] font-bold px-1 rounded">CANVA</span>
                        <span className="font-mono text-xs overflow-hidden text-ellipsis">{client.canva_template_id}</span>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic">Non configuré</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
