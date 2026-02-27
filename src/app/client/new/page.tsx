'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ClientProfile } from '@/types';

const FIELDS: { key: keyof ClientProfile; label: string; placeholder: string; multiline?: boolean }[] = [
  { key: 'nom_client', label: 'Nom du client', placeholder: 'Ex: Boulangerie Martin' },
  { key: 'secteur', label: 'Secteur', placeholder: 'Ex: Boulangerie artisanale' },
  { key: 'tone_of_voice', label: 'Ton de voix', placeholder: 'Ex: Chaleureux, authentique, gourmand' },
  { key: 'couleurs', label: 'Couleurs de marque', placeholder: 'Ex: #D4A574, #2C1810, blanc' },
  { key: 'typo', label: 'Typographie', placeholder: 'Ex: Serif élégant, manuscrite' },
  { key: 'logo_url', label: 'URL du logo', placeholder: 'https://...' },
  { key: 'exemples_posts', label: 'Exemples de posts existants', placeholder: 'Liens ou descriptions', multiline: true },
  { key: 'rythme', label: 'Rythme de publication', placeholder: 'Ex: 3 fois par semaine' },
  { key: 'jours_publication', label: 'Jours de publication', placeholder: 'Ex: Lundi, Mercredi, Vendredi' },
  { key: 'types_contenu', label: 'Types de contenu', placeholder: 'Ex: Carrousel, Photo, Reel, Story' },
  { key: 'themes_recurrents', label: 'Thèmes récurrents', placeholder: 'Ex: Recettes, Coulisses, Saison' },
  { key: 'hashtags_base', label: 'Hashtags de base', placeholder: 'Ex: #boulangerie #artisan #painmaison' },
  { key: 'cta_style', label: 'Style de CTA', placeholder: 'Ex: Question engageante, invitation à visiter' },
];

const emptyProfile = (): ClientProfile =>
  Object.fromEntries(FIELDS.map((f) => [f.key, ''])) as unknown as ClientProfile;

export default function NewClientPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ClientProfile>(emptyProfile());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function updateField(key: keyof ClientProfile, value: string) {
    setProfile((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile.nom_client.trim()) {
      setError('Le nom du client est requis');
      return;
    }

    setLoading(true);
    setError('');

    const res = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: profile.nom_client, profile }),
    });

    if (res.ok) {
      const data = await res.json();
      router.push(`/client/${data.client.id}`);
    } else {
      const data = await res.json();
      setError(data.error || 'Erreur lors de la création');
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Nouveau client</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {FIELDS.map((field) => (
          <div key={field.key}>
            <label className="mb-1 block text-sm font-medium">{field.label}</label>
            {field.multiline ? (
              <textarea
                value={profile[field.key]}
                onChange={(e) => updateField(field.key, e.target.value)}
                placeholder={field.placeholder}
                rows={3}
                className="w-full rounded-lg border px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            ) : (
              <input
                type="text"
                value={profile[field.key]}
                onChange={(e) => updateField(field.key, e.target.value)}
                placeholder={field.placeholder}
                className="w-full rounded-lg border px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            )}
          </div>
        ))}

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border px-4 py-2 hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Création...' : 'Créer le client'}
          </button>
        </div>
      </form>
    </div>
  );
}
