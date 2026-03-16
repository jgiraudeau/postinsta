'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import type { CalendarEntry } from '@/types';
import { 
  CheckCircle2, 
  XCircle, 
  MessageSquare, 
  Calendar as CalendarIcon, 
  Instagram, 
  Clock, 
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  Send,
  Check,
  X,
  ExternalLink,
  LayoutGrid,
  List,
  MessageCircle,
  Play,
  Film
} from 'lucide-react';

const STATUS_CONFIG: Record<string, { color: string; label: string; icon: any }> = {
  brouillon: { color: 'bg-amber-100 text-amber-700 border-amber-200', label: 'À valider', icon: Clock },
  validé: { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: 'Approuvé', icon: CheckCircle2 },
  rejeté: { color: 'bg-rose-100 text-rose-700 border-rose-200', label: 'À revoir', icon: XCircle },
  publié: { color: 'bg-blue-100 text-blue-700 border-blue-200', label: 'Publié', icon: Instagram },
};

export default function ClientViewPage() {
  const { token } = useParams<{ token: string }>();
  const [entries, setEntries] = useState<CalendarEntry[]>([]);
  const [clientName, setClientName] = useState('');
  const [airtableInterfaceUrl, setAirtableInterfaceUrl] = useState('');
  const [canvaTemplateId, setCanvaTemplateId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');
  const [viewMode, setViewMode] = useState<'gallery' | 'table'>('gallery');
  
  const [carouselIndex, setCarouselIndex] = useState<Record<number, number>>({});
  const [commentingRow, setCommentingRow] = useState<number | null>(null);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState<number | null>(null); // row number

  useEffect(() => {
    fetch(`/api/calendar/${token}`)
      .then((r) => {
        if (!r.ok) throw new Error('Lien de partage invalide ou expiré');
        return r.json();
      })
      .then((data) => {
        setEntries(data.calendar || []);
        setClientName(data.clientName || 'Client');
        setAirtableInterfaceUrl(data.airtableInterfaceUrl || '');
        setCanvaTemplateId(data.canva_template_id || '');
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [token]);

  async function handleAction(row: number, updates: { statut?: CalendarEntry['statut']; feedback?: string }) {
    setSubmitting(row);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, entryRow: row, ...updates }),
      });

      if (res.ok) {
        setEntries((prev) =>
          prev.map((e) => (e.row === row ? { ...e, ...updates } : e))
        );
        if (updates.feedback !== undefined) {
          setCommentingRow(null);
          setCommentText('');
        }
      }
    } catch (err) {
      console.error('Action error:', err);
    } finally {
      setSubmitting(null);
    }
  }

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
        <p className="font-medium text-slate-500">Préparation de votre calendrier...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-center">
      <div className="max-w-md rounded-2xl bg-white p-8 shadow-xl border border-rose-100">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-rose-600">
          <XCircle size={32} />
        </div>
        <h1 className="mb-2 text-xl font-bold text-slate-900">Oups !</h1>
        <p className="text-slate-500">{error}</p>
      </div>
    </div>
  );

  const filteredEntries = activeTab === 'pending' 
    ? entries.filter(e => e.statut === 'brouillon' || e.statut === 'rejeté')
    : entries;

  const stats = {
    pending: entries.filter(e => e.statut === 'brouillon').length,
    total: entries.length
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header Premium */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg shadow-blue-200">
              <Instagram size={22} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">{clientName}</h1>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Espace Validation</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-6">
            <div className="text-right">
              <p className="text-xs text-slate-400 font-medium">Statut du mois</p>
              <p className="text-sm font-bold text-slate-700">{stats.total - stats.pending} / {stats.total} validés</p>
            </div>
            {airtableInterfaceUrl && (
              <a
                href={airtableInterfaceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg bg-orange-50 px-3 py-2 text-xs font-bold text-orange-700 border border-orange-100 transition-all hover:bg-orange-100"
              >
                <ExternalLink size={14} /> Vue Airtable
              </a>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* Navigation Tabs and View Switching */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="inline-flex rounded-xl bg-slate-200/50 p-1">
              <button
                onClick={() => setActiveTab('pending')}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-all ${
                  activeTab === 'pending' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                À valider <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-[10px]">{stats.pending}</span>
              </button>
              <button
                onClick={() => setActiveTab('all')}
                className={`rounded-lg px-4 py-2 text-sm font-bold transition-all ${
                  activeTab === 'all' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tout voir
              </button>
            </div>

            <div className="inline-flex rounded-xl bg-slate-200/50 p-1">
              <button
                onClick={() => setViewMode('gallery')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'gallery' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Vue Galerie"
              >
                <LayoutGrid size={18} />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'table' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Vue Tableau (style Airtable)"
              >
                <List size={18} />
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-slate-500 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm w-fit">
            <CalendarIcon size={14} className="text-blue-500" />
            <span>Mars 2026</span>
          </div>
        </div>

        {/* Content View */}
        {filteredEntries.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-slate-200 py-20 text-center bg-white">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-500">
              <Check size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Tout est en ordre !</h3>
            <p className="text-slate-500">Vous avez validé tous les contenus proposés.</p>
          </div>
        ) : viewMode === 'gallery' ? (
          <div className="space-y-8">
            {filteredEntries.map((entry) => {
              const config = STATUS_CONFIG[entry.statut] || STATUS_CONFIG.brouillon;
              const StatusIcon = config.icon;
              const isActionable = entry.statut === 'brouillon' || entry.statut === 'rejeté';

              return (
                <div 
                  key={entry.row} 
                  className={`group relative overflow-hidden rounded-3xl bg-white shadow-sm border transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/5 ${
                    entry.statut === 'validé' ? 'border-emerald-100 shadow-emerald-500/5' : 'border-slate-200'
                  }`}
                >
                  <div className="flex flex-col md:flex-row">
                    {/* Visual Section */}
                    {(() => {
                      const allImages = entry.image_url
                        ? [entry.image_url, ...(entry.extra_images || [])]
                        : [];
                      const currentSlide = carouselIndex[entry.row ?? 0] || 0;
                      const totalSlides = allImages.length;

                      return (
                        <div className={`relative ${entry.type === 'story' || entry.type === 'reel' ? 'aspect-[9/16]' : 'aspect-square'} w-full md:w-96 lg:w-[28rem] shrink-0 bg-slate-100 overflow-hidden`}>
                          {allImages.length > 0 ? (
                            <img
                              src={allImages[currentSlide]}
                              alt={`${entry.titre} - slide ${currentSlide + 1}`}
                              className="h-full w-full object-cover transition-all duration-300"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                target.parentElement?.classList.add('flex', 'items-center', 'justify-center');
                                const placeholder = document.createElement('div');
                                placeholder.className = 'text-slate-400 text-center';
                                placeholder.innerHTML = '<p class="text-xs">Image indisponible</p>';
                                target.parentElement?.appendChild(placeholder);
                              }}
                            />
                          ) : (
                            <div className="flex h-full w-full flex-col items-center justify-center text-slate-400">
                              <ImageIcon size={48} strokeWidth={1} />
                              <p className="mt-2 text-xs font-medium">Visuel en cours</p>
                            </div>
                          )}

                          {/* Carousel Navigation */}
                          {totalSlides > 1 && (
                            <>
                              <button
                                onClick={() => setCarouselIndex(prev => ({ ...prev, [entry.row ?? 0]: (currentSlide - 1 + totalSlides) % totalSlides }))}
                                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg hover:bg-white hover:scale-110 transition-all"
                              >
                                <ChevronLeft size={20} />
                              </button>
                              <button
                                onClick={() => setCarouselIndex(prev => ({ ...prev, [entry.row ?? 0]: (currentSlide + 1) % totalSlides }))}
                                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg hover:bg-white hover:scale-110 transition-all"
                              >
                                <ChevronRight size={20} />
                              </button>
                              {/* Slide counter */}
                              <div className="absolute bottom-3 right-3 bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded-full backdrop-blur-sm">
                                {currentSlide + 1}/{totalSlides}
                              </div>
                              {/* Dots */}
                              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                                {allImages.map((_, i) => (
                                  <button
                                    key={i}
                                    onClick={() => setCarouselIndex(prev => ({ ...prev, [entry.row ?? 0]: i }))}
                                    className={`w-2 h-2 rounded-full transition-all ${i === currentSlide ? 'bg-white scale-125' : 'bg-white/50'}`}
                                  />
                                ))}
                              </div>
                            </>
                          )}

                          {/* Floating Badge */}
                          <div className={`absolute left-4 top-4 flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md shadow-sm ${config.color}`}>
                            <StatusIcon size={12} />
                            {config.label}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Content Section */}
                    <div className="flex flex-1 flex-col p-6 sm:p-8">
                      <div className="mb-4 flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-400 uppercase tracking-widest">
                         <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md">
                           <CalendarIcon size={12} className="text-blue-500" />
                           {entry.date}
                         </div>
                         <div className="bg-slate-50 px-2 py-1 rounded-md">{entry.type}</div>
                      </div>

                      <h2 className="mb-4 text-xl font-bold text-slate-900 leading-tight">{entry.titre}</h2>
                      
                      <div className="mb-6 relative">
                        <div className="rounded-2xl bg-slate-50/50 p-4 border border-slate-100">
                          <p className="text-[10px] font-bold uppercase text-slate-400 mb-2">Légende Instagram</p>
                          <p className="whitespace-pre-line text-[15px] leading-relaxed text-slate-700 italic">
                            "{entry.legende || "(Texte en attente)"}"
                          </p>
                          {entry.hashtags && (
                            <p className="mt-4 text-sm font-medium text-blue-600/80">
                              {entry.hashtags}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Script Display for Videos */}
                      {entry.script && (
                        <div className="mb-6">
                           <div className="rounded-2xl bg-indigo-50/50 p-4 border border-indigo-100">
                             <div className="flex items-center gap-2 mb-2 text-indigo-700">
                               <Play size={14} className="fill-current" />
                               <p className="text-[10px] font-bold uppercase tracking-wider">Script & Storyboard</p>
                             </div>
                             <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
                               {entry.script}
                             </p>
                           </div>
                        </div>
                      )}

                      {/* Carousel Indicator & Canva Integration */}
                      {entry.type === 'carousel' && (
                        <div className="mb-6 space-y-3">
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 bg-slate-50 w-fit px-3 py-1 rounded-full border border-slate-100">
                             <LayoutGrid size={12} /> Format Carrousel (slides multiples)
                          </div>
                          
                          {canvaTemplateId && (
                            <div className="flex flex-col sm:flex-row gap-2">
                              <a
                                href={canvaTemplateId.startsWith('http') ? canvaTemplateId : `https://www.canva.com/brand/templates/${canvaTemplateId}/edit`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#00C4CC] to-[#7d2ae8] px-4 py-3 text-white font-bold text-sm shadow-lg hover:opacity-90 transition-all border border-white/10"
                              >
                                <ImageIcon size={18} />
                                Ouvrir dans Canva
                              </a>
                              <button
                                onClick={() => {
                                  const slides = entry.image_prompt.split(/Slide \d+\s*:/i).filter(s => s.trim().length > 0);
                                  const text = slides.map((s, i) => `Slide ${i+1} : ${s.trim()}`).join("\n\n");
                                  navigator.clipboard.writeText(text);
                                  alert("Contenu des slides copié !");
                                }}
                                className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-[#7d2ae8] border-2 border-[#7d2ae8]/20 font-bold text-sm hover:bg-slate-50 transition-all"
                              >
                                <List size={18} />
                                Copier le contenu des slides
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Feedback Display */}
                      {entry.feedback && (
                        <div className="mb-6 flex items-start gap-3 rounded-2xl bg-amber-50/50 p-4 border border-amber-100 text-sm text-amber-800">
                          <MessageSquare size={16} className="mt-0.5 shrink-0" />
                          <div>
                            <span className="font-bold">Remarque transmise :</span> {entry.feedback}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="mt-auto flex flex-wrap items-center gap-3 border-t border-slate-100 pt-6">
                        {isActionable ? (
                          <>
                            <button
                              onClick={() => handleAction(entry.row!, { statut: 'validé' })}
                              disabled={!!submitting}
                              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-700 hover:-translate-y-0.5 disabled:opacity-50"
                            >
                              <Check size={18} /> Approuver
                            </button>
                            <button
                              onClick={() => setCommentingRow(entry.row!)}
                              className="flex items-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 transition-all hover:border-blue-600 hover:text-blue-600 hover:-translate-y-0.5"
                            >
                              <MessageSquare size={18} /> Commenter
                            </button>
                          </>
                        ) : entry.statut === 'validé' ? (
                          <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm bg-emerald-50 px-4 py-2 rounded-xl">
                            <CheckCircle2 size={18} /> Ce post est validé
                            <button 
                              onClick={() => handleAction(entry.row!, { statut: 'rejeté' })}
                              className="ml-4 text-[11px] uppercase tracking-wider text-slate-400 hover:text-rose-500"
                            >
                              Annuler ?
                            </button>
                          </div>
                        ) : null}
                      </div>

                      {/* Comment Input */}
                      {commentingRow === entry.row && (
                        <div className="mt-6 animate-in fade-in slide-in-from-top-4 duration-300">
                          <label className="mb-2 block text-xs font-bold uppercase text-slate-400">Votre retour pour modifications :</label>
                          <textarea
                            autoFocus
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            placeholder="Que souhaiteriez-vous changer ?"
                            className="w-full rounded-2xl border-2 border-blue-100 bg-white p-4 text-sm focus:border-blue-600 focus:outline-none transition-all"
                            rows={3}
                          />
                          <div className="mt-3 flex gap-2">
                            <button
                              onClick={() => handleAction(entry.row!, { feedback: commentText, statut: 'rejeté' })}
                              disabled={!commentText.trim() || !!submitting}
                              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-md shadow-blue-600/10 hover:bg-blue-700 disabled:opacity-50"
                            >
                              <Send size={16} /> Envoyer le retour
                            </button>
                            <button
                              onClick={() => { setCommentingRow(null); setCommentText(''); }}
                              className="rounded-xl px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-800"
                            >
                              Annuler
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Table View (Airtable Style) */
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 transition-colors">
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Visual</th>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap">Date & Type</th>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 min-w-[200px]">Sujet & Légende</th>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Statut</th>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEntries.map((entry) => {
                  const config = STATUS_CONFIG[entry.statut] || STATUS_CONFIG.brouillon;
                  const StatusIcon = config.icon;
                  const isActionable = entry.statut === 'brouillon' || entry.statut === 'rejeté';

                  return (
                    <tr key={entry.row} className="transition-colors hover:bg-slate-50/30">
                      <td className="px-5 py-4">
                        <div className="h-14 w-14 overflow-hidden rounded-lg bg-slate-100 border border-slate-200">
                          {entry.image_url ? (
                            <img src={entry.image_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-slate-300">
                              <ImageIcon size={20} />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-bold text-slate-900 whitespace-nowrap">{entry.date}</span>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{entry.type}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="max-w-[300px] lg:max-w-md">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{entry.titre}</h4>
                            {entry.script && (
                              <span className="flex items-center gap-1 rounded bg-indigo-50 px-1.5 py-0.5 text-[9px] font-bold uppercase text-indigo-600 border border-indigo-100">
                                <Play size={8} className="fill-current" /> Script
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-500 line-clamp-2 italic">
                            {entry.script ? `"${entry.script.substring(0, 100)}..."` : entry.legende}
                          </p>
                          {entry.feedback && (
                            <div className="mt-2 flex items-center gap-2 text-[11px] text-amber-600 bg-amber-50 rounded px-2 py-0.5 w-fit">
                              <MessageCircle size={10} /> {entry.feedback}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className={`flex items-center gap-1.5 w-fit rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider shadow-sm ${config.color}`}>
                          <StatusIcon size={12} />
                          {config.label}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {isActionable ? (
                            <>
                              <button 
                                onClick={() => handleAction(entry.row!, { statut: 'validé' })}
                                className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                                title="Approuver"
                              >
                                <Check size={16} />
                              </button>
                              <button 
                                onClick={() => setCommentingRow(entry.row!)}
                                className="p-2 rounded-lg bg-slate-50 text-slate-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                title="Commenter"
                              >
                                <MessageSquare size={16} />
                              </button>
                            </>
                          ) : entry.statut === 'validé' ? (
                            <button 
                              onClick={() => handleAction(entry.row!, { statut: 'rejeté' })}
                              className="p-1 text-[10px] font-bold uppercase text-slate-300 hover:text-rose-500 transition-colors"
                            >
                              Annuler ?
                            </button>
                          ) : null}
                        </div>
                        {/* Inline comment for table view */}
                        {commentingRow === entry.row && (
                          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                            <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200">
                              <div className="mb-4 flex items-center gap-3">
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                                  <MessageSquare size={20} />
                                </div>
                                <div>
                                  <h3 className="font-bold text-slate-900">Retour client</h3>
                                  <p className="text-xs text-slate-500">{entry.titre}</p>
                                </div>
                              </div>
                              <textarea
                                autoFocus
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                placeholder="Que souhaiteriez-vous changer ?"
                                className="w-full rounded-2xl border-2 border-slate-100 bg-white p-4 text-sm focus:border-blue-600 focus:outline-none transition-all"
                                rows={4}
                              />
                              <div className="mt-6 flex gap-3">
                                <button
                                  onClick={() => handleAction(entry.row!, { feedback: commentText, statut: 'rejeté' })}
                                  disabled={!commentText.trim() || !!submitting}
                                  className="flex-1 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/10 hover:bg-blue-700 disabled:opacity-50 transition-all"
                                >
                                  Envoyer les modifications
                                </button>
                                <button
                                  onClick={() => { setCommentingRow(null); setCommentText(''); }}
                                  className="flex-1 rounded-xl bg-slate-100 py-3 text-sm font-bold text-slate-600 hover:bg-slate-200 transition-all"
                                >
                                  Fermer
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>

      <footer className="mt-20 border-t border-slate-200 bg-white py-12 text-center text-slate-400">
        <div className="flex items-center justify-center gap-2 mb-2">
           <div className="h-2 w-2 rounded-full bg-blue-600"></div>
           <p className="text-sm font-bold text-slate-900 tracking-tight">PostInsta <span className="text-blue-600">Pro</span></p>
        </div>
        <p className="text-xs">Système automatisé de création de contenus · 2026</p>
      </footer>
    </div>
  );
}

