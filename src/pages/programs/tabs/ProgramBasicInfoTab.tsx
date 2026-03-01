/**
 * @file ProgramBasicInfoTab.tsx
 * @description Basic information tab with titles, descriptions, ratings, genres, awards, and external refs
 * @author VLS Team
 * @date 2026-02-15
 */
import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, Plus, X, AlertCircle, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../../context/AppContext';
import type { Program, Title, Description, Award, ExternalRef } from '../../../types';

// MPAA and TV Rating codes relevant for SSLA market
const MPAA_RATINGS = ['G', 'PG', 'PG-13', 'R', 'NC-17', 'NR'];
const TV_RATINGS = ['TVY', 'TVY7', 'TVG', 'TVPG', 'TV14', 'TVMA'];

interface ProgramBasicInfoTabProps {
  program: Partial<Program>;
  onChange: (field: string, value: any) => void;
  readOnly: boolean;
}

// ─── Helper: CSS classes for inputs ───
const inputReadOnlyClass = 'w-full px-3 py-2 text-sm rounded-lg border border-[var(--color-neutral-300)] dark:border-[var(--color-neutral-600)] bg-[var(--color-neutral-100)] dark:bg-[var(--color-neutral-800)] text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)]';
const inputEditableClass = 'w-full px-3 py-2 text-sm rounded-lg border border-[var(--color-neutral-300)] dark:border-[var(--color-neutral-600)] bg-white dark:bg-[var(--color-neutral-900)] text-[var(--color-neutral-800)] dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]';
const textareaEditableClass = 'w-full px-3 py-2 text-sm rounded-lg border border-[var(--color-neutral-300)] dark:border-[var(--color-neutral-600)] bg-white dark:bg-[var(--color-neutral-900)] text-[var(--color-neutral-800)] dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] resize-vertical';
const textareaReadOnlyClass = 'w-full px-3 py-2 text-sm rounded-lg border border-[var(--color-neutral-300)] dark:border-[var(--color-neutral-600)] bg-[var(--color-neutral-100)] dark:bg-[var(--color-neutral-800)] text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)] resize-none';

const ProgramBasicInfoTab: React.FC<ProgramBasicInfoTabProps> = ({
  program,
  onChange,
  readOnly,
}) => {
  const navigate = useNavigate();
  const [showOtherTitles, setShowOtherTitles] = useState(false);
  const [showAddTitle, setShowAddTitle] = useState(false);
  const [showAddDesc, setShowAddDesc] = useState(false);
  const [showAddAward, setShowAddAward] = useState(false);
  const [showAddExtRef, setShowAddExtRef] = useState(false);
  // New title form
  const [newTitle, setNewTitle] = useState<Partial<Title>>({ lang: 'es', type: 'full', subType: '', value: '' });
  // New description form
  const [newDesc, setNewDesc] = useState<Partial<Description>>({ lang: 'es', type: 'full', value: '' });
  // New award form
  const [newAward, setNewAward] = useState<Partial<Award>>({ award: '', category: '', year: '', recipient: '', won: false });
  // New external ref form
  const [newExtRef, setNewExtRef] = useState<Partial<ExternalRef>>({ system: '', refName: '', id: '' });

  const { ratingLookup, getGenreName } = useApp();

  // ─── Title prioritization for SSLA ───
  const findPublishedTitle = (lang: 'es' | 'en'): Title | undefined => {
    const titles = program.titles || [];
    if (lang === 'es') {
      return titles.find(t => t.type === 'full' && t.subType === 'main' && t.lang === 'es')
        || titles.find(t => t.type === 'full' && t.subType === 'main' && t.lang === 'es-ES')
        || titles.find(t => t.type === 'full' && t.subType === 'main')
        || titles.find(t => t.type === 'full' && (t.lang === 'es' || t.lang === 'es-ES'))
        || titles.find(t => t.type === 'original')
        || titles[0];
    }
    // English
    return titles.find(t => t.type === 'full' && t.subType === 'main' && t.lang === 'en')
      || titles.find(t => t.type === 'full' && t.subType === 'main' && t.lang === 'en-EN')
      || titles.find(t => t.type === 'original' && program.originalAudiolang === 'en');
  };

  const publishedTitleES = findPublishedTitle('es');
  const publishedTitleEN = findPublishedTitle('en');

  // Other titles = all titles not matching the published ones
  const otherTitles = (program.titles || []).filter(
    t => t !== publishedTitleES && t !== publishedTitleEN
  );

  // ─── Filter ratings: MPAA and TV only ───
  const filteredRatings = useMemo(() => {
    return (program.ratings || []).filter(r => {
      const lookup = ratingLookup.get(r.id);
      if (lookup) {
        return lookup.code === 'MPAA' || lookup.code === 'TVPG';
      }
      // Fallback: check rating value directly
      const rv = r.rating || '';
      return MPAA_RATINGS.includes(rv) || TV_RATINGS.includes(rv);
    });
  }, [program.ratings, ratingLookup]);

  const getMpaaRating = (): string => {
    for (const r of filteredRatings) {
      const lookup = ratingLookup.get(r.id);
      if (lookup?.code === 'MPAA') return lookup.rating;
      if (r.rating && MPAA_RATINGS.includes(r.rating)) return r.rating;
    }
    return '';
  };

  const getTvRating = (): string => {
    for (const r of filteredRatings) {
      const lookup = ratingLookup.get(r.id);
      if (lookup?.code === 'TVPG') return lookup.rating;
      if (r.rating && TV_RATINGS.includes(r.rating)) return r.rating;
    }
    return '';
  };

  // ─── External refs sorted with Gracenote rootId first ───
  const sortedExternalRefs = useMemo(() => {
    const refs = [...(program.externalRefs || [])];
    refs.sort((a, b) => {
      const aIsGnRoot = a.system === 'gracenote' && a.refName === 'rootId' ? -1 : 0;
      const bIsGnRoot = b.system === 'gracenote' && b.refName === 'rootId' ? -1 : 0;
      if (aIsGnRoot !== bIsGnRoot) return aIsGnRoot - bIsGnRoot;
      const aIsGn = a.system === 'gracenote' ? -1 : 0;
      const bIsGn = b.system === 'gracenote' ? -1 : 0;
      return aIsGn - bIsGn;
    });
    return refs;
  }, [program.externalRefs]);

  // ─── CRUD helpers ───
  const addTitle = () => {
    if (!newTitle.value?.trim()) return;
    const titles = [...(program.titles || []), { ...newTitle, length: newTitle.value?.length || 0 } as Title];
    onChange('titles', titles);
    setNewTitle({ lang: 'es', type: 'full', subType: '', value: '' });
    setShowAddTitle(false);
  };

  const removeTitle = (index: number) => {
    const titles = [...(program.titles || [])];
    titles.splice(index, 1);
    onChange('titles', titles);
  };

  const addDescription = () => {
    if (!newDesc.value?.trim()) return;
    const descs = [...(program.descriptions || []), { ...newDesc, length: newDesc.value?.length || 0 } as Description];
    onChange('descriptions', descs);
    setNewDesc({ lang: 'es', type: 'full', value: '' });
    setShowAddDesc(false);
  };

  const removeDescription = (index: number) => {
    const descs = [...(program.descriptions || [])];
    descs.splice(index, 1);
    onChange('descriptions', descs);
  };

  const addAward = () => {
    if (!newAward.award?.trim()) return;
    const awards = [...(program.awards || []), newAward as Award];
    onChange('awards', awards);
    setNewAward({ award: '', category: '', year: '', recipient: '', won: false });
    setShowAddAward(false);
  };

  const removeAward = (index: number) => {
    const awards = [...(program.awards || [])];
    awards.splice(index, 1);
    onChange('awards', awards);
  };

  const addExternalRef = () => {
    if (!newExtRef.system?.trim() || !newExtRef.id?.trim()) return;
    const refs = [...(program.externalRefs || []), newExtRef as ExternalRef];
    onChange('externalRefs', refs);
    setNewExtRef({ system: '', refName: '', id: '' });
    setShowAddExtRef(false);
  };

  const removeExternalRef = (index: number) => {
    const refs = [...(program.externalRefs || [])];
    refs.splice(index, 1);
    onChange('externalRefs', refs);
  };

  // ─── Description form helper: find or create description by lang+size ───
  const getDescriptionByLangSize = (lang: string, maxLen: number): Description | undefined => {
    return (program.descriptions || []).find(d => d.lang === lang && (d.size === maxLen || d.length === maxLen));
  };

  const updateDescriptionField = (lang: string, maxLen: number, value: string) => {
    const descs = [...(program.descriptions || [])];
    const idx = descs.findIndex(d => d.lang === lang && (d.size === maxLen || d.length === maxLen));
    if (idx >= 0) {
      descs[idx] = { ...descs[idx], value, length: value.length };
    } else {
      descs.push({ lang, value, type: 'full', size: maxLen, length: value.length });
    }
    onChange('descriptions', descs);
  };

  return (
    <div className="max-w-5xl space-y-8">
      {/* ═══════════════ TITLE (Published) ═══════════════ */}
      <section className="p-4 rounded-lg border-2 border-[var(--color-primary-300)] bg-[var(--color-primary-50)] dark:bg-[var(--color-primary-900)]/10">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-semibold text-[var(--color-neutral-800)] dark:text-white">
            Title
          </h2>
          <span className="px-2 py-0.5 text-xs font-semibold rounded bg-[var(--color-primary-600)] text-white">
            Published
          </span>
        </div>

        {/* Spanish Title (Mandatory for SSLA) */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)] mb-1">
            Spanish Title <span className="text-red-500">*</span>
          </label>
          {publishedTitleES ? (
            <input
              type="text"
              value={publishedTitleES.value || ''}
              onChange={(e) => {
                const titles = (program.titles || []).map(t =>
                  t === publishedTitleES ? { ...t, value: e.target.value, length: e.target.value.length } : t
                );
                onChange('titles', titles);
              }}
              readOnly={readOnly}
              className={readOnly ? inputReadOnlyClass : inputEditableClass}
            />
          ) : (
            <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
              <AlertCircle size={16} />
              No Spanish title found. Add a title with type=full, subType=main, lang=es.
            </div>
          )}
          {publishedTitleES && (
            <div className="flex items-center gap-2 mt-1 text-xs text-[var(--color-neutral-500)]">
              <span className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-semibold">
                {publishedTitleES.lang?.toUpperCase()}
              </span>
              <span>type={publishedTitleES.type}</span>
              {publishedTitleES.subType && <span>subType={publishedTitleES.subType}</span>}
              <span>{publishedTitleES.value?.length || 0} chars</span>
            </div>
          )}
        </div>

        {/* English Title (Optional for SSLA) */}
        <div>
          <label className="block text-sm font-medium text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)] mb-1">
            English Title <span className="text-[var(--color-neutral-400)]">(optional)</span>
          </label>
          {publishedTitleEN ? (
            <input
              type="text"
              value={publishedTitleEN.value || ''}
              onChange={(e) => {
                const titles = (program.titles || []).map(t =>
                  t === publishedTitleEN ? { ...t, value: e.target.value, length: e.target.value.length } : t
                );
                onChange('titles', titles);
              }}
              readOnly={readOnly}
              className={readOnly ? inputReadOnlyClass : inputEditableClass}
            />
          ) : (
            <div className="text-sm text-[var(--color-neutral-500)]">
              No English title found.
            </div>
          )}
          {publishedTitleEN && (
            <div className="flex items-center gap-2 mt-1 text-xs text-[var(--color-neutral-500)]">
              <span className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-semibold">
                {publishedTitleEN.lang?.toUpperCase()}
              </span>
              <span>type={publishedTitleEN.type}</span>
              {publishedTitleEN.subType && <span>subType={publishedTitleEN.subType}</span>}
              <span>{publishedTitleEN.value?.length || 0} chars</span>
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════ OTHER TITLES (Collapsible) ═══════════════ */}
      <section>
        <button
          onClick={() => setShowOtherTitles(!showOtherTitles)}
          className="flex items-center gap-2 text-lg font-semibold text-[var(--color-neutral-800)] dark:text-white mb-4 hover:text-[var(--color-primary-600)] transition-colors"
        >
          {showOtherTitles ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          Other Titles ({otherTitles.length})
        </button>

        {showOtherTitles && (
          <div className="space-y-3">
            {otherTitles.map((title, idx) => {
              const globalIndex = (program.titles || []).indexOf(title);
              return (
                <div key={idx} className="p-3 rounded-lg border border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)] bg-white dark:bg-[var(--color-neutral-900)]">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 text-xs font-semibold rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                        {title.lang?.toUpperCase() || 'UNK'}
                      </span>
                      <span className="px-2 py-0.5 text-xs rounded bg-[var(--color-neutral-100)] dark:bg-[var(--color-neutral-800)] text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-400)]">
                        {title.type || 'unknown'}
                      </span>
                      {title.subType && (
                        <span className="text-xs text-[var(--color-neutral-500)]">
                          sub: {title.subType}
                        </span>
                      )}
                    </div>
                    {!readOnly && (
                      <button
                        onClick={() => removeTitle(globalIndex)}
                        className="text-red-600 hover:text-red-700 dark:text-red-400 p-1"
                        title="Remove title"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                  <div className="text-sm text-[var(--color-neutral-800)] dark:text-white">
                    {title.value}
                  </div>
                  <div className="text-xs text-[var(--color-neutral-500)] mt-1">
                    {title.value?.length || 0} characters
                  </div>
                </div>
              );
            })}

            {/* Add Title Button / Form */}
            {!readOnly && !showAddTitle && (
              <button
                onClick={() => setShowAddTitle(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--color-primary-600)] hover:bg-[var(--color-primary-50)] dark:hover:bg-[var(--color-primary-900)]/10 rounded-lg border border-dashed border-[var(--color-primary-300)] w-full justify-center transition-colors"
              >
                <Plus size={16} /> Add Title
              </button>
            )}
            {!readOnly && showAddTitle && (
              <div className="p-4 rounded-lg border-2 border-dashed border-[var(--color-primary-300)] bg-[var(--color-primary-50)] dark:bg-[var(--color-primary-900)]/10 space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[var(--color-neutral-600)] mb-1">Language</label>
                    <select value={newTitle.lang} onChange={e => setNewTitle({...newTitle, lang: e.target.value})} className={inputEditableClass}>
                      <option value="es">ES</option>
                      <option value="en">EN</option>
                      <option value="pt">PT</option>
                      <option value="es-ES">ES-ES</option>
                      <option value="en-EN">EN-EN</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--color-neutral-600)] mb-1">Type</label>
                    <select value={newTitle.type} onChange={e => setNewTitle({...newTitle, type: e.target.value})} className={inputEditableClass}>
                      <option value="full">full</option>
                      <option value="original">original</option>
                      <option value="short">short</option>
                      <option value="episode">episode</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--color-neutral-600)] mb-1">SubType</label>
                    <input type="text" value={newTitle.subType || ''} onChange={e => setNewTitle({...newTitle, subType: e.target.value})} placeholder="e.g., main" className={inputEditableClass} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-neutral-600)] mb-1">Title Value</label>
                  <input type="text" value={newTitle.value || ''} onChange={e => setNewTitle({...newTitle, value: e.target.value})} placeholder="Enter title text" className={inputEditableClass} />
                </div>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setShowAddTitle(false)} className="px-3 py-1.5 text-sm text-[var(--color-neutral-600)] hover:bg-[var(--color-neutral-100)] rounded">Cancel</button>
                  <button onClick={addTitle} className="px-3 py-1.5 text-sm font-medium text-white bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] rounded">Add</button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ═══════════════ CORE INFORMATION ═══════════════ */}
      <section>
        <h2 className="text-lg font-semibold text-[var(--color-neutral-800)] dark:text-white mb-4">
          Core Information
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)] mb-2">Program Type</label>
            <input type="text" value={program.programType || ''} readOnly className={inputReadOnlyClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)] mb-2">Original Audio Language</label>
            <input
              type="text"
              value={program.originalAudiolang || ''}
              onChange={e => onChange('originalAudiolang', e.target.value)}
              readOnly={readOnly}
              className={readOnly ? inputReadOnlyClass : inputEditableClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)] mb-2">
              Release Year
            </label>
            <input
              type="number"
              value={program.releaseYear || program.yearOfRelease || ''}
              onChange={e => onChange('releaseYear', parseInt(e.target.value) || undefined)}
              readOnly={readOnly}
              className={readOnly ? inputReadOnlyClass : inputEditableClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)] mb-2">Market</label>
            <input type="text" value={program.market?.toUpperCase() || ''} readOnly className={inputReadOnlyClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)] mb-2">Runtime</label>
            <input
              type="number"
              value={program.runTime ? Math.round(program.runTime / 60) : ''}
              onChange={e => {
                const runtimeMinutes = parseInt(e.target.value);
                onChange('runTime', Number.isFinite(runtimeMinutes) ? runtimeMinutes * 60 : undefined);
              }}
              readOnly={readOnly}
              className={readOnly ? inputReadOnlyClass : inputEditableClass}
              placeholder="Duration in minutes"
            />
            {program.runTime ? (
              <div className="text-xs text-[var(--color-neutral-500)] mt-1">
                {Math.round(program.runTime / 60)} min
              </div>
            ) : null}
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)] mb-2">Color Code</label>
            <input
              type="text"
              value={program.colorCode || ''}
              onChange={e => onChange('colorCode', e.target.value)}
              readOnly={readOnly}
              className={readOnly ? inputReadOnlyClass : inputEditableClass}
            />
          </div>
        </div>
      </section>

      {/* ═══════════════ SERIES-SPECIFIC FIELDS ═══════════════ */}
      {(program.programType === 'SH' || program.programType === 'SP') && (
        <section>
          <h2 className="text-lg font-semibold text-[var(--color-neutral-800)] dark:text-white mb-4">
            Series Information
          </h2>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)] mb-2">
                Original Air Date
              </label>
              <input
                type="date"
                value={program.origAirDate || ''}
                onChange={e => onChange('origAirDate', e.target.value)}
                readOnly={readOnly}
                className={readOnly ? inputReadOnlyClass : inputEditableClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)] mb-2">
                Season Year
              </label>
              <input
                type="number"
                value={program.seasonYear || ''}
                onChange={e => onChange('seasonYear', parseInt(e.target.value) || undefined)}
                readOnly={readOnly}
                className={readOnly ? inputReadOnlyClass : inputEditableClass}
                placeholder="e.g., 2025"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)] mb-2">
                Series Program ID
                <span className="text-xs text-[var(--color-neutral-500)] ml-1">(parent series)</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={program.parentProgramId || program.seriesId || ''}
                  onChange={e => onChange('parentProgramId', e.target.value)}
                  readOnly={readOnly}
                  className={readOnly ? inputReadOnlyClass : inputEditableClass}
                  placeholder="Parent series ID (for series of series)"
                />
                {(program.parentProgramId || program.seriesId) && (
                  <button
                    onClick={() => navigate(`/programs/${program.parentProgramId || program.seriesId}`)}
                    className="p-2 text-[var(--color-primary-600)] hover:text-[var(--color-primary-700)] hover:bg-[var(--color-primary-50)] rounded-lg transition-colors"
                    title="Go to parent series"
                  >
                    <ExternalLink size={16} />
                  </button>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)] mb-2">
                Series Premiere
              </label>
              <input
                type="date"
                value={program.seriesPremiere || ''}
                onChange={e => onChange('seriesPremiere', e.target.value)}
                readOnly={readOnly}
                className={readOnly ? inputReadOnlyClass : inputEditableClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)] mb-2">
                Series Finale
              </label>
              <input
                type="date"
                value={program.seriesFinale || ''}
                onChange={e => onChange('seriesFinale', e.target.value)}
                readOnly={readOnly}
                className={readOnly ? inputReadOnlyClass : inputEditableClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)] mb-2">
                VRIO ID
              </label>
              <input
                type="text"
                value={program.vrioId || ''}
                readOnly
                className={inputReadOnlyClass}
              />
            </div>
          </div>

          {/* Season summary (episodes are in separate Episodes tab) */}
          {(program.seasons || []).length > 0 && (
            <div>
              <h3 className="text-md font-semibold text-[var(--color-neutral-800)] dark:text-white mb-3">
                Seasons ({(program.seasons || []).length})
              </h3>
              <div className="space-y-2">
                {(program.seasons || [])
                  .sort((a, b) => (a.seasonNumber || 0) - (b.seasonNumber || 0))
                  .map(season => (
                    <div
                      key={season.seasonNumber}
                      className="px-4 py-2 rounded-lg border border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)] bg-white dark:bg-[var(--color-neutral-900)] flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-[var(--color-neutral-800)] dark:text-white">
                          Season {season.seasonNumber}
                        </span>
                        {season.seasonYear && (
                          <span className="px-2 py-0.5 text-xs rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                            {season.seasonYear}
                          </span>
                        )}
                        {season.totalSeasonEpisodes != null && (
                          <span className="text-xs text-[var(--color-neutral-500)]">
                            {season.totalSeasonEpisodes} episodes
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[var(--color-neutral-500)]">
                        {season.seasonPremiere && new Date(season.seasonPremiere).toLocaleDateString()}
                        {season.seasonPremiere && season.seasonFinale && ' — '}
                        {season.seasonFinale && new Date(season.seasonFinale).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
              </div>
              <div className="mt-2 text-xs text-[var(--color-primary-600)]">
                See Episodes tab for full episode listing
              </div>
            </div>
          )}
          {(program.seasons || []).length === 0 && (
            <div className="text-sm text-[var(--color-neutral-500)]">
              No season metadata available. Check the Episodes tab for episode listing.
            </div>
          )}
        </section>
      )}

      {/* ═══════════════ EPISODE-SPECIFIC FIELDS ═══════════════ */}
      {(program.programType === 'EP' || program.programType === 'SE') && (
        <section>
          <h2 className="text-lg font-semibold text-[var(--color-neutral-800)] dark:text-white mb-4">
            Episode Information
          </h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)] mb-2">
                Series Program ID
                <span className="text-xs text-[var(--color-neutral-500)] ml-1">(parent)</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={program.seriesId || program.parentProgramId || ''}
                  readOnly
                  className={inputReadOnlyClass}
                />
                {(program.seriesId || program.parentProgramId) && (
                  <button
                    onClick={() => navigate(`/programs/${program.seriesId || program.parentProgramId}`)}
                    className="p-2 text-[var(--color-primary-600)] hover:text-[var(--color-primary-700)] hover:bg-[var(--color-primary-50)] rounded-lg transition-colors"
                    title="Go to parent series"
                  >
                    <ExternalLink size={16} />
                  </button>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)] mb-2">
                Series Title
              </label>
              <input
                type="text"
                value={
                  program.seriesTitles?.find(t => t.lang === 'es')?.value
                  || program.seriesTitles?.find(t => t.lang === 'en')?.value
                  || program.seriesTitles?.[0]?.value
                  || ''
                }
                readOnly
                className={inputReadOnlyClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)] mb-2">
                Episode Title
              </label>
              <input
                type="text"
                value={
                  (program.titles || []).find(t => t.type === 'episode' && (t.lang === 'es' || t.lang === 'es-ES'))?.value
                  || (program.titles || []).find(t => t.type === 'episode')?.value
                  || ''
                }
                onChange={e => {
                  const titles = [...(program.titles || [])];
                  const idx = titles.findIndex(t => t.type === 'episode');
                  if (idx >= 0) {
                    titles[idx] = { ...titles[idx], value: e.target.value, length: e.target.value.length };
                  } else {
                    titles.push({ lang: 'es', type: 'episode', value: e.target.value, length: e.target.value.length });
                  }
                  onChange('titles', titles);
                }}
                readOnly={readOnly}
                className={readOnly ? inputReadOnlyClass : inputEditableClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)] mb-2">
                Original Air Date
              </label>
              <input
                type="date"
                value={program.origAirDate || ''}
                onChange={e => onChange('origAirDate', e.target.value)}
                readOnly={readOnly}
                className={readOnly ? inputReadOnlyClass : inputEditableClass}
              />
            </div>
          </div>

          {/* Season/Episode Numbers */}
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)] mb-2">
                Season Number
              </label>
              <input
                type="number"
                value={program.seasonNumber || ''}
                onChange={e => onChange('seasonNumber', parseInt(e.target.value) || undefined)}
                readOnly={readOnly}
                className={readOnly ? inputReadOnlyClass : inputEditableClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)] mb-2">
                Episode Number
              </label>
              <input
                type="number"
                value={program.episodeNumber || ''}
                onChange={e => onChange('episodeNumber', parseInt(e.target.value) || undefined)}
                readOnly={readOnly}
                className={readOnly ? inputReadOnlyClass : inputEditableClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)] mb-2">
                Number in Series
              </label>
              <input
                type="number"
                value={program.numInSeries || ''}
                onChange={e => onChange('numInSeries', parseInt(e.target.value) || undefined)}
                readOnly={readOnly}
                className={readOnly ? inputReadOnlyClass : inputEditableClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)] mb-2">
                Season Year
              </label>
              <input
                type="number"
                value={program.seasonYear || ''}
                onChange={e => onChange('seasonYear', parseInt(e.target.value) || undefined)}
                readOnly={readOnly}
                className={readOnly ? inputReadOnlyClass : inputEditableClass}
              />
            </div>
          </div>

          {/* Alternate Episode Mappings */}
          {(program.episodeAltMappings || []).length > 0 && (
            <div>
              <h3 className="text-md font-semibold text-[var(--color-neutral-800)] dark:text-white mb-3">
                Alternate Season/Episode Mappings ({(program.episodeAltMappings || []).length})
              </h3>
              <div className="rounded-lg border border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)] overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[var(--color-neutral-50)] dark:bg-[var(--color-neutral-800)]">
                      <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-400)]">Region</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-400)]">Channel ID</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-400)]">Provider</th>
                      <th className="px-3 py-2 text-center text-xs font-semibold text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-400)]">Alt Season</th>
                      <th className="px-3 py-2 text-center text-xs font-semibold text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-400)]">Alt Episode</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(program.episodeAltMappings || []).map((mapping, idx) => (
                      <tr key={idx} className="border-t border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)]">
                        <td className="px-3 py-2 text-[var(--color-neutral-800)] dark:text-white">
                          {mapping.region}
                          {mapping.regionWide && (
                            <span className="ml-1 text-xs text-[var(--color-neutral-500)]">({mapping.regionWide})</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-[var(--color-neutral-800)] dark:text-white font-mono text-xs">
                          {mapping.channelId}
                        </td>
                        <td className="px-3 py-2 text-[var(--color-neutral-800)] dark:text-white">
                          {mapping.providerId}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className="px-2 py-0.5 text-xs font-semibold rounded bg-[var(--color-primary-100)] dark:bg-[var(--color-primary-900)]/30 text-[var(--color-primary-700)] dark:text-[var(--color-primary-300)]">
                            S{mapping.seasonNumber}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className="px-2 py-0.5 text-xs font-semibold rounded bg-[var(--color-accent-100)] dark:bg-[var(--color-accent-900)]/30 text-[var(--color-accent-700)] dark:text-[var(--color-accent-300)]">
                            E{mapping.episodeNumber}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Series VRIO IDs */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)] mb-2">
                Series VRIO ID
              </label>
              <input
                type="text"
                value={program.seriesVrioId || ''}
                readOnly
                className={inputReadOnlyClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)] mb-2">
                Season VRIO ID
              </label>
              <input
                type="text"
                value={program.seasonVrioId || ''}
                readOnly
                className={inputReadOnlyClass}
              />
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════ DESCRIPTIONS ═══════════════ */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[var(--color-neutral-800)] dark:text-white">
            Descriptions
          </h2>
        </div>

        {/* Quick form: ES 500, ES 250, EN 500, EN 250 */}
        <div className="space-y-4 mb-4">
          {[
            { lang: 'es', maxLen: 500, label: 'Spanish Description (500 chars)' },
            { lang: 'es', maxLen: 250, label: 'Spanish Short Description (250 chars)' },
            { lang: 'en', maxLen: 500, label: 'English Description (500 chars)' },
            { lang: 'en', maxLen: 250, label: 'English Short Description (250 chars)' },
          ].map(({ lang, maxLen, label }) => {
            const desc = getDescriptionByLangSize(lang, maxLen);
            const matchingDesc = (program.descriptions || []).find(d => d.lang === lang && (!d.size || d.size === maxLen) && (d.value?.length || 0) <= maxLen);
            const displayDesc = desc || matchingDesc;
            const currentValue = displayDesc?.value || '';
            return (
              <div key={`${lang}-${maxLen}`}>
                <label className="block text-sm font-medium text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)] mb-1">
                  {label}
                  <span className="text-xs text-[var(--color-neutral-500)] ml-2">
                    ({currentValue.length}/{maxLen})
                  </span>
                </label>
                <textarea
                  value={currentValue}
                  onChange={e => {
                    const val = e.target.value.slice(0, maxLen);
                    updateDescriptionField(lang, maxLen, val);
                  }}
                  readOnly={readOnly}
                  rows={maxLen <= 250 ? 2 : 4}
                  maxLength={maxLen}
                  className={readOnly ? textareaReadOnlyClass : textareaEditableClass}
                  placeholder={`Enter ${lang.toUpperCase()} description (max ${maxLen} chars)`}
                />
              </div>
            );
          })}
        </div>

        {/* Other descriptions */}
        <div className="space-y-2">
          {(program.descriptions || []).map((desc, index) => {
            // Skip the ones already shown in the quick form
            const isQuickForm = ['es', 'en'].includes(desc.lang || '') && [250, 500].includes(desc.size || 0);
            if (isQuickForm) return null;
            return (
              <div key={index} className="p-3 rounded-lg border border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)] bg-white dark:bg-[var(--color-neutral-900)]">
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-xs font-semibold rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      {desc.lang?.toUpperCase() || 'UNK'}
                    </span>
                    <span className="px-2 py-0.5 text-xs rounded bg-[var(--color-neutral-100)] dark:bg-[var(--color-neutral-800)] text-[var(--color-neutral-600)]">
                      {desc.type || 'unknown'}
                    </span>
                    <span className="text-xs text-[var(--color-neutral-500)]">
                      {desc.value?.length || 0} chars
                    </span>
                  </div>
                  {!readOnly && (
                    <button onClick={() => removeDescription(index)} className="text-red-600 hover:text-red-700 dark:text-red-400 p-1" title="Remove">
                      <X size={16} />
                    </button>
                  )}
                </div>
                <div className="text-sm text-[var(--color-neutral-800)] dark:text-white whitespace-pre-wrap line-clamp-3">
                  {desc.value}
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Description */}
        {!readOnly && !showAddDesc && (
          <button
            onClick={() => setShowAddDesc(true)}
            className="flex items-center gap-2 px-4 py-2 mt-3 text-sm font-medium text-[var(--color-primary-600)] hover:bg-[var(--color-primary-50)] rounded-lg border border-dashed border-[var(--color-primary-300)] w-full justify-center transition-colors"
          >
            <Plus size={16} /> Add Description
          </button>
        )}
        {!readOnly && showAddDesc && (
          <div className="mt-3 p-4 rounded-lg border-2 border-dashed border-[var(--color-primary-300)] bg-[var(--color-primary-50)] dark:bg-[var(--color-primary-900)]/10 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[var(--color-neutral-600)] mb-1">Language</label>
                <select value={newDesc.lang} onChange={e => setNewDesc({...newDesc, lang: e.target.value})} className={inputEditableClass}>
                  <option value="es">ES</option>
                  <option value="en">EN</option>
                  <option value="pt">PT</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--color-neutral-600)] mb-1">Type</label>
                <select value={newDesc.type} onChange={e => setNewDesc({...newDesc, type: e.target.value})} className={inputEditableClass}>
                  <option value="full">full</option>
                  <option value="short">short</option>
                  <option value="brief">brief</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--color-neutral-600)] mb-1">Description</label>
              <textarea value={newDesc.value || ''} onChange={e => setNewDesc({...newDesc, value: e.target.value})} rows={3} className={textareaEditableClass} placeholder="Enter description" />
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowAddDesc(false)} className="px-3 py-1.5 text-sm text-[var(--color-neutral-600)] hover:bg-[var(--color-neutral-100)] rounded">Cancel</button>
              <button onClick={addDescription} className="px-3 py-1.5 text-sm font-medium text-white bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] rounded">Add</button>
            </div>
          </div>
        )}
      </section>

      {/* ═══════════════ RATINGS (MPAA/TV only) ═══════════════ */}
      <section>
        <h2 className="text-lg font-semibold text-[var(--color-neutral-800)] dark:text-white mb-4">
          Ratings
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg border border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)] bg-white dark:bg-[var(--color-neutral-900)]">
            <label className="block text-sm font-medium text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)] mb-2">
              MPAA Rating
            </label>
            <div className="text-2xl font-bold text-[var(--color-neutral-800)] dark:text-white">
              {getMpaaRating() || <span className="text-sm font-normal text-[var(--color-neutral-500)]">Not rated</span>}
            </div>
          </div>
          <div className="p-4 rounded-lg border border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)] bg-white dark:bg-[var(--color-neutral-900)]">
            <label className="block text-sm font-medium text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)] mb-2">
              TV Rating
            </label>
            <div className="text-2xl font-bold text-[var(--color-neutral-800)] dark:text-white">
              {getTvRating() || <span className="text-sm font-normal text-[var(--color-neutral-500)]">Not rated</span>}
            </div>
          </div>
        </div>
        {filteredRatings.some(r => r.warning) && (
          <div className="mt-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <div className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-1">Content Warnings</div>
            <div className="text-sm text-amber-700 dark:text-amber-400">
              {filteredRatings.filter(r => r.warning).map(r => r.warning).join(', ')}
            </div>
          </div>
        )}
      </section>

      {/* ═══════════════ GENRES (comma-separated, English only) ═══════════════ */}
      <section>
        <h2 className="text-lg font-semibold text-[var(--color-neutral-800)] dark:text-white mb-4">
          Genres
        </h2>
        <div className="p-4 rounded-lg border border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)] bg-white dark:bg-[var(--color-neutral-900)]">
          {(program.genres || []).length > 0 ? (
            <div className="text-sm text-[var(--color-neutral-800)] dark:text-white">
              {(program.genres || []).map(id => getGenreName(id)).join(', ')}
            </div>
          ) : (
            <div className="text-sm text-[var(--color-neutral-500)]">No genres assigned</div>
          )}
        </div>
      </section>

      {/* ═══════════════ AWARDS ═══════════════ */}
      <section>
        <h2 className="text-lg font-semibold text-[var(--color-neutral-800)] dark:text-white mb-4">
          Awards ({(program.awards || []).length})
        </h2>
        <div className="space-y-3">
          {(program.awards || []).map((award, index) => (
            <div key={index} className="p-4 rounded-lg border border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)] bg-white dark:bg-[var(--color-neutral-900)]">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{award.won ? '🏆' : '🎖️'}</span>
                  <div>
                    <div className="font-semibold text-[var(--color-neutral-800)] dark:text-white">{award.award}</div>
                    <div className="text-sm text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-400)]">
                      {award.category} {award.year && `(${award.year})`}
                    </div>
                    {award.recipient && (
                      <div className="text-xs text-[var(--color-neutral-500)] mt-1">Recipient: {award.recipient}</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs font-semibold rounded ${
                    award.won
                      ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                      : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                  }`}>
                    {award.won ? 'Won' : 'Nominated'}
                  </span>
                  {!readOnly && (
                    <button onClick={() => removeAward(index)} className="text-red-600 hover:text-red-700 dark:text-red-400 p-1" title="Remove">
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {(program.awards || []).length === 0 && (
            <div className="text-sm text-[var(--color-neutral-500)]">No awards</div>
          )}

          {/* Add Award */}
          {!readOnly && !showAddAward && (
            <button
              onClick={() => setShowAddAward(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--color-primary-600)] hover:bg-[var(--color-primary-50)] rounded-lg border border-dashed border-[var(--color-primary-300)] w-full justify-center transition-colors"
            >
              <Plus size={16} /> Add Award
            </button>
          )}
          {!readOnly && showAddAward && (
            <div className="p-4 rounded-lg border-2 border-dashed border-[var(--color-primary-300)] bg-[var(--color-primary-50)] dark:bg-[var(--color-primary-900)]/10 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--color-neutral-600)] mb-1">Award <span className="text-red-500">*</span></label>
                  <input type="text" value={newAward.award || ''} onChange={e => setNewAward({...newAward, award: e.target.value})} placeholder="e.g., Academy Award" className={inputEditableClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-neutral-600)] mb-1">Category</label>
                  <input type="text" value={newAward.category || ''} onChange={e => setNewAward({...newAward, category: e.target.value})} placeholder="e.g., Best Picture" className={inputEditableClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-neutral-600)] mb-1">Year</label>
                  <input type="text" value={newAward.year || ''} onChange={e => setNewAward({...newAward, year: e.target.value})} placeholder="e.g., 2024" className={inputEditableClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-neutral-600)] mb-1">Recipient</label>
                  <input type="text" value={newAward.recipient || ''} onChange={e => setNewAward({...newAward, recipient: e.target.value})} className={inputEditableClass} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="awardWon" checked={!!newAward.won} onChange={e => setNewAward({...newAward, won: e.target.checked})} className="rounded" />
                <label htmlFor="awardWon" className="text-sm text-[var(--color-neutral-700)]">Won</label>
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowAddAward(false)} className="px-3 py-1.5 text-sm text-[var(--color-neutral-600)] hover:bg-[var(--color-neutral-100)] rounded">Cancel</button>
                <button onClick={addAward} className="px-3 py-1.5 text-sm font-medium text-white bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] rounded">Add</button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════ EXTERNAL REFERENCES ═══════════════ */}
      <section>
        <h2 className="text-lg font-semibold text-[var(--color-neutral-800)] dark:text-white mb-4">
          External References ({sortedExternalRefs.length})
        </h2>
        <div className="space-y-2">
          {sortedExternalRefs.map((ref, idx) => {
            const globalIndex = (program.externalRefs || []).indexOf(ref);
            const isGracenote = ref.system === 'gracenote';
            return (
              <div
                key={idx}
                className={`p-3 rounded-lg border ${
                  isGracenote
                    ? 'border-[var(--color-primary-300)] bg-[var(--color-primary-50)] dark:bg-[var(--color-primary-900)]/10'
                    : 'border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)] bg-white dark:bg-[var(--color-neutral-900)]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="grid grid-cols-3 gap-4 flex-1 text-sm">
                    <div>
                      <span className="text-xs text-[var(--color-neutral-500)]">System</span>
                      <div className="font-medium text-[var(--color-neutral-800)] dark:text-white">
                        {ref.system}
                        {isGracenote && <span className="ml-1 text-xs text-[var(--color-primary-600)]">★</span>}
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-[var(--color-neutral-500)]">Type</span>
                      <div className="text-[var(--color-neutral-800)] dark:text-white">{ref.refName || '—'}</div>
                    </div>
                    <div>
                      <span className="text-xs text-[var(--color-neutral-500)]">Value</span>
                      <div className="font-mono text-[var(--color-neutral-800)] dark:text-white break-all">{ref.id}</div>
                    </div>
                  </div>
                  {!readOnly && (
                    <button onClick={() => removeExternalRef(globalIndex)} className="text-red-600 hover:text-red-700 dark:text-red-400 p-1 ml-2" title="Remove">
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {sortedExternalRefs.length === 0 && (
            <div className="text-sm text-[var(--color-neutral-500)]">No external references</div>
          )}

          {/* Add External Ref */}
          {!readOnly && !showAddExtRef && (
            <button
              onClick={() => setShowAddExtRef(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--color-primary-600)] hover:bg-[var(--color-primary-50)] rounded-lg border border-dashed border-[var(--color-primary-300)] w-full justify-center transition-colors"
            >
              <Plus size={16} /> Add External Reference
            </button>
          )}
          {!readOnly && showAddExtRef && (
            <div className="p-4 rounded-lg border-2 border-dashed border-[var(--color-primary-300)] bg-[var(--color-primary-50)] dark:bg-[var(--color-primary-900)]/10 space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--color-neutral-600)] mb-1">System <span className="text-red-500">*</span></label>
                  <input type="text" value={newExtRef.system || ''} onChange={e => setNewExtRef({...newExtRef, system: e.target.value})} placeholder="e.g., gracenote" className={inputEditableClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-neutral-600)] mb-1">Type</label>
                  <input type="text" value={newExtRef.refName || ''} onChange={e => setNewExtRef({...newExtRef, refName: e.target.value})} placeholder="e.g., rootId" className={inputEditableClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-neutral-600)] mb-1">Value <span className="text-red-500">*</span></label>
                  <input type="text" value={newExtRef.id || ''} onChange={e => setNewExtRef({...newExtRef, id: e.target.value})} placeholder="ID value" className={inputEditableClass} />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowAddExtRef(false)} className="px-3 py-1.5 text-sm text-[var(--color-neutral-600)] hover:bg-[var(--color-neutral-100)] rounded">Cancel</button>
                <button onClick={addExternalRef} className="px-3 py-1.5 text-sm font-medium text-white bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] rounded">Add</button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default ProgramBasicInfoTab;
