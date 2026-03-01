/**
 * @file ProgramDetailMockup.tsx
 * @description UI Layout Mockup for Program Detail/Edit form with dummy data
 * This is for design review - full functionality will be implemented after approval
 * @author VLS Team
 * @date 2026-02-15
 */
import React, { useState } from 'react';
import {
  X,
  Save,
  Lock,
  Unlock,
  Eye,
  Send,
  Image as ImageIcon,
  Globe,
  Users,
  Star,
  Info,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react';

/**
 * Dummy program data for mockup
 */
const MOCK_PROGRAM = {
  id: 'PGM123456',
  vrioId: 'VRIO789',
  programType: 'MV',
  contentLock: false,
  published: true,
  version: 3,
  targetPlatform: 'both',

  // Titles
  englishTitle: 'The Dark Knight',
  englishShortTitle: 'Dark Knight',
  spanishTitle: 'El Caballero Oscuro',
  portugueseTitle: 'O Cavaleiro das Trevas',

  // Descriptions
  englishDescription: 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.',
  englishShortDescription: 'Batman faces the Joker in an epic battle for Gotham.',

  // Basic info
  releaseYear: 2008,
  runTime: 152,
  originalAirDate: '2008-07-18',
  originalAudioLang: 'English',

  // Ratings
  mpaaRating: 'PG-13',
  usaParentalRating: 'TV-14',
  advisories: ['Violence', 'Brief Language'],

  // Genres
  genres: ['Action', 'Crime', 'Drama', 'Thriller'],

  // Cast & Crew
  cast: [
    { name: 'Christian Bale', role: 'Bruce Wayne / Batman', order: 1 },
    { name: 'Heath Ledger', role: 'Joker', order: 2 },
    { name: 'Aaron Eckhart', role: 'Harvey Dent', order: 3 },
    { name: 'Michael Caine', role: 'Alfred', order: 4 },
  ],
  crew: [
    { name: 'Christopher Nolan', role: 'Director' },
    { name: 'Hans Zimmer', role: 'Music' },
    { name: 'Wally Pfister', role: 'Cinematographer' },
  ],

  // External refs
  externalRefs: {
    tmsId: 'MV005033320000',
    rootId: 'SH000000010000',
    gracenoteId: 'TMS-123456',
  },

  // Images
  images: [
    { id: '1', ratio: '16:9', published: true, url: 'https://via.placeholder.com/400x225?text=16:9+Published' },
    { id: '2', ratio: '16:9', published: false, url: 'https://via.placeholder.com/400x225?text=16:9+Draft' },
    { id: '3', ratio: '2:3', published: true, url: 'https://via.placeholder.com/200x300?text=2:3+Published' },
    { id: '4', ratio: '2:3', published: false, url: 'https://via.placeholder.com/200x300?text=2:3+Draft' },
  ],
};

interface TabProps {
  label: string;
  active: boolean;
  onClick: () => void;
  count?: number;
}

const Tab: React.FC<TabProps> = ({ label, active, onClick, count }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
      active
        ? 'border-[var(--color-primary-500)] text-[var(--color-primary-600)] dark:text-[var(--color-primary-400)]'
        : 'border-transparent text-[var(--color-neutral-500)] hover:text-[var(--color-neutral-700)] dark:hover:text-[var(--color-neutral-300)]'
    }`}
  >
    {label}
    {count !== undefined && <span className="ml-1.5 text-xs opacity-60">({count})</span>}
  </button>
);

const ProgramDetailMockup: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('details');
  const [showVersions, setShowVersions] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'es' | 'pt'>('en');

  const tabs = [
    { id: 'details', label: 'Details', count: undefined },
    { id: 'images', label: 'Images', count: 4 },
    { id: 'cast', label: 'Cast & Crew', count: 8 },
    { id: 'metadata', label: 'Metadata', count: undefined },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white dark:bg-[var(--color-neutral-800)] rounded-2xl shadow-2xl flex max-w-7xl w-full h-[90vh] overflow-hidden">

        {/* Main Content */}
        <div className="flex-1 flex flex-col">

          {/* Header */}
          <div className="px-6 py-4 border-b border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)]">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs font-semibold">
                    Movie
                  </span>
                  {MOCK_PROGRAM.published && (
                    <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs font-semibold">
                      Published
                    </span>
                  )}
                  {MOCK_PROGRAM.contentLock && (
                    <Lock size={16} className="text-amber-500" />
                  )}
                  <span className="text-xs text-[var(--color-neutral-500)]">
                    Version {MOCK_PROGRAM.version}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-[var(--color-neutral-800)] dark:text-white mb-1">
                  {MOCK_PROGRAM.englishTitle}
                </h2>
                <p className="text-sm text-[var(--color-neutral-500)]">
                  {MOCK_PROGRAM.id} • {MOCK_PROGRAM.vrioId} • {MOCK_PROGRAM.releaseYear}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button className="p-2 rounded-lg hover:bg-[var(--color-neutral-100)] dark:hover:bg-[var(--color-neutral-700)] text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-400)]" title="Preview">
                  <Eye size={18} />
                </button>
                <button className="p-2 rounded-lg hover:bg-[var(--color-neutral-100)] dark:hover:bg-[var(--color-neutral-700)] text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-400)]" title="Toggle Lock">
                  <Unlock size={18} />
                </button>
                <button className="px-4 py-2 bg-[var(--color-primary-600)] text-white rounded-lg hover:bg-[var(--color-primary-700)] text-sm font-medium flex items-center gap-2">
                  <Save size={16} />
                  Save
                </button>
                <button className="px-4 py-2 bg-[var(--color-accent-500)] text-white rounded-lg hover:bg-[var(--color-accent-600)] text-sm font-medium flex items-center gap-2">
                  <Send size={16} />
                  Publish
                </button>
                <button className="p-2 rounded-lg hover:bg-[var(--color-neutral-100)] dark:hover:bg-[var(--color-neutral-700)] text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-400)]">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)] -mb-px">
              {tabs.map((tab) => (
                <Tab
                  key={tab.id}
                  label={tab.label}
                  active={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  count={tab.count}
                />
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-auto p-6">

            {/* Details Tab */}
            {activeTab === 'details' && (
              <div className="max-w-4xl space-y-6">

                {/* Basic Information */}
                <section>
                  <h3 className="text-lg font-semibold text-[var(--color-neutral-800)] dark:text-white mb-4 flex items-center gap-2">
                    <Info size={20} className="text-[var(--color-primary-500)]" />
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)] mb-1.5">
                        Program Type
                      </label>
                      <select className="w-full px-3 py-2 rounded-lg border border-[var(--color-neutral-300)] dark:border-[var(--color-neutral-600)] bg-white dark:bg-[var(--color-neutral-900)] text-sm">
                        <option>Movie</option>
                        <option>Series</option>
                        <option>Show</option>
                        <option>Sport</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)] mb-1.5">
                        Release Year
                      </label>
                      <input
                        type="number"
                        defaultValue={MOCK_PROGRAM.releaseYear}
                        className="w-full px-3 py-2 rounded-lg border border-[var(--color-neutral-300)] dark:border-[var(--color-neutral-600)] bg-white dark:bg-[var(--color-neutral-900)] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)] mb-1.5">
                        Runtime (minutes)
                      </label>
                      <input
                        type="number"
                        defaultValue={MOCK_PROGRAM.runTime}
                        className="w-full px-3 py-2 rounded-lg border border-[var(--color-neutral-300)] dark:border-[var(--color-neutral-600)] bg-white dark:bg-[var(--color-neutral-900)] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)] mb-1.5">
                        Original Air Date
                      </label>
                      <input
                        type="date"
                        defaultValue={MOCK_PROGRAM.originalAirDate}
                        className="w-full px-3 py-2 rounded-lg border border-[var(--color-neutral-300)] dark:border-[var(--color-neutral-600)] bg-white dark:bg-[var(--color-neutral-900)] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)] mb-1.5">
                        Original Audio Language
                      </label>
                      <select className="w-full px-3 py-2 rounded-lg border border-[var(--color-neutral-300)] dark:border-[var(--color-neutral-600)] bg-white dark:bg-[var(--color-neutral-900)] text-sm">
                        <option>English</option>
                        <option>Spanish</option>
                        <option>Portuguese</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)] mb-1.5">
                        Target Platform
                      </label>
                      <select className="w-full px-3 py-2 rounded-lg border border-[var(--color-neutral-300)] dark:border-[var(--color-neutral-600)] bg-white dark:bg-[var(--color-neutral-900)] text-sm">
                        <option value="both">Both (OTT + DTH)</option>
                        <option value="ott">OTT Only</option>
                        <option value="dth">DTH Only</option>
                      </select>
                    </div>
                  </div>
                </section>

                {/* Titles - Multi-language */}
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-[var(--color-neutral-800)] dark:text-white flex items-center gap-2">
                      <Globe size={20} className="text-[var(--color-primary-500)]" />
                      Titles
                    </h3>
                    <div className="flex gap-1 bg-[var(--color-neutral-100)] dark:bg-[var(--color-neutral-700)] rounded-lg p-1">
                      {['en', 'es', 'pt'].map((lang) => (
                        <button
                          key={lang}
                          onClick={() => setSelectedLanguage(lang as any)}
                          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                            selectedLanguage === lang
                              ? 'bg-white dark:bg-[var(--color-neutral-800)] text-[var(--color-primary-600)] shadow-sm'
                              : 'text-[var(--color-neutral-600)]'
                          }`}
                        >
                          {lang.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)] mb-1.5">
                        Title
                        <span className="text-xs text-[var(--color-neutral-400)] ml-2">(Max 120 characters)</span>
                      </label>
                      <input
                        type="text"
                        defaultValue={
                          selectedLanguage === 'en' ? MOCK_PROGRAM.englishTitle :
                          selectedLanguage === 'es' ? MOCK_PROGRAM.spanishTitle :
                          MOCK_PROGRAM.portugueseTitle
                        }
                        maxLength={120}
                        className="w-full px-3 py-2 rounded-lg border border-[var(--color-neutral-300)] dark:border-[var(--color-neutral-600)] bg-white dark:bg-[var(--color-neutral-900)] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)] mb-1.5">
                        Short Title
                        <span className="text-xs text-[var(--color-neutral-400)] ml-2">(Max 100 characters)</span>
                      </label>
                      <input
                        type="text"
                        defaultValue={selectedLanguage === 'en' ? MOCK_PROGRAM.englishShortTitle : ''}
                        maxLength={100}
                        className="w-full px-3 py-2 rounded-lg border border-[var(--color-neutral-300)] dark:border-[var(--color-neutral-600)] bg-white dark:bg-[var(--color-neutral-900)] text-sm"
                      />
                    </div>
                  </div>
                </section>

                {/* Descriptions - Multi-language */}
                <section>
                  <h3 className="text-lg font-semibold text-[var(--color-neutral-800)] dark:text-white mb-4">
                    Descriptions
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)] mb-1.5">
                        Description
                        <span className="text-xs text-[var(--color-neutral-400)] ml-2">(Max 500 characters)</span>
                      </label>
                      <textarea
                        defaultValue={selectedLanguage === 'en' ? MOCK_PROGRAM.englishDescription : ''}
                        maxLength={500}
                        rows={4}
                        className="w-full px-3 py-2 rounded-lg border border-[var(--color-neutral-300)] dark:border-[var(--color-neutral-600)] bg-white dark:bg-[var(--color-neutral-900)] text-sm resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)] mb-1.5">
                        Short Description
                        <span className="text-xs text-[var(--color-neutral-400)] ml-2">(Max 250 characters)</span>
                      </label>
                      <textarea
                        defaultValue={selectedLanguage === 'en' ? MOCK_PROGRAM.englishShortDescription : ''}
                        maxLength={250}
                        rows={2}
                        className="w-full px-3 py-2 rounded-lg border border-[var(--color-neutral-300)] dark:border-[var(--color-neutral-600)] bg-white dark:bg-[var(--color-neutral-900)] text-sm resize-none"
                      />
                    </div>
                  </div>
                </section>

                {/* Ratings & Advisories */}
                <section>
                  <h3 className="text-lg font-semibold text-[var(--color-neutral-800)] dark:text-white mb-4 flex items-center gap-2">
                    <Star size={20} className="text-[var(--color-primary-500)]" />
                    Ratings & Advisories
                  </h3>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)] mb-1.5">
                        MPAA Rating
                      </label>
                      <select className="w-full px-3 py-2 rounded-lg border border-[var(--color-neutral-300)] dark:border-[var(--color-neutral-600)] bg-white dark:bg-[var(--color-neutral-900)] text-sm">
                        <option>G</option>
                        <option>PG</option>
                        <option selected>PG-13</option>
                        <option>R</option>
                        <option>NC-17</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)] mb-1.5">
                        TV Parental Rating
                      </label>
                      <select className="w-full px-3 py-2 rounded-lg border border-[var(--color-neutral-300)] dark:border-[var(--color-neutral-600)] bg-white dark:bg-[var(--color-neutral-900)] text-sm">
                        <option>TV-G</option>
                        <option>TV-PG</option>
                        <option selected>TV-14</option>
                        <option>TV-MA</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)] mb-1.5">
                        Brazil Rating
                      </label>
                      <select className="w-full px-3 py-2 rounded-lg border border-[var(--color-neutral-300)] dark:border-[var(--color-neutral-600)] bg-white dark:bg-[var(--color-neutral-900)] text-sm">
                        <option>L</option>
                        <option>10</option>
                        <option>12</option>
                        <option selected>14</option>
                        <option>16</option>
                        <option>18</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)] mb-2">
                      Content Advisories
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {MOCK_PROGRAM.advisories.map((advisory) => (
                        <span
                          key={advisory}
                          className="px-3 py-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-medium flex items-center gap-1.5"
                        >
                          {advisory}
                          <button className="hover:bg-amber-200 dark:hover:bg-amber-800 rounded-full p-0.5">
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                      <button className="px-3 py-1.5 rounded-full border-2 border-dashed border-[var(--color-neutral-300)] dark:border-[var(--color-neutral-600)] text-[var(--color-neutral-500)] text-xs font-medium hover:border-[var(--color-primary-500)] hover:text-[var(--color-primary-600)] flex items-center gap-1">
                        <Plus size={12} />
                        Add Advisory
                      </button>
                    </div>
                  </div>
                </section>

                {/* Genres */}
                <section>
                  <h3 className="text-lg font-semibold text-[var(--color-neutral-800)] dark:text-white mb-4">
                    Genres
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {MOCK_PROGRAM.genres.map((genre) => (
                      <span
                        key={genre}
                        className="px-3 py-1.5 rounded-full bg-[var(--color-primary-100)] dark:bg-[var(--color-primary-900)]/30 text-[var(--color-primary-700)] dark:text-[var(--color-primary-400)] text-sm font-medium flex items-center gap-1.5"
                      >
                        {genre}
                        <button className="hover:bg-[var(--color-primary-200)] dark:hover:bg-[var(--color-primary-800)] rounded-full p-0.5">
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                    <button className="px-3 py-1.5 rounded-full border-2 border-dashed border-[var(--color-neutral-300)] dark:border-[var(--color-neutral-600)] text-[var(--color-neutral-500)] text-sm font-medium hover:border-[var(--color-primary-500)] hover:text-[var(--color-primary-600)] flex items-center gap-1">
                      <Plus size={14} />
                      Add Genre
                    </button>
                  </div>
                </section>

              </div>
            )}

            {/* Images Tab */}
            {activeTab === 'images' && (
              <div className="max-w-6xl">
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-[var(--color-neutral-800)] dark:text-white flex items-center gap-2">
                    <ImageIcon size={20} className="text-[var(--color-primary-500)]" />
                    Program Images
                  </h3>
                  <button className="px-4 py-2 bg-[var(--color-primary-600)] text-white rounded-lg hover:bg-[var(--color-primary-700)] text-sm font-medium flex items-center gap-2">
                    <Upload size={16} />
                    Upload Images
                  </button>
                </div>

                {/* 16:9 Images */}
                <section className="mb-8">
                  <h4 className="text-md font-semibold text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)] mb-3">
                    16:9 Landscape
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    {MOCK_PROGRAM.images.filter(img => img.ratio === '16:9').map((image) => (
                      <div
                        key={image.id}
                        className="relative group rounded-xl overflow-hidden border-2 border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)] hover:border-[var(--color-primary-400)] transition-colors"
                      >
                        <img src={image.url} alt="" className="w-full h-auto" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button className="p-2 bg-white rounded-lg hover:bg-gray-100">
                            <Eye size={16} />
                          </button>
                          <button className="p-2 bg-white rounded-lg hover:bg-gray-100">
                            <Trash2 size={16} className="text-red-600" />
                          </button>
                        </div>
                        {image.published && (
                          <span className="absolute top-2 right-2 px-2 py-1 rounded bg-green-500 text-white text-xs font-semibold">
                            Published
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </section>

                {/* 2:3 Portrait Images */}
                <section>
                  <h4 className="text-md font-semibold text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)] mb-3">
                    2:3 Portrait
                  </h4>
                  <div className="grid grid-cols-5 gap-4">
                    {MOCK_PROGRAM.images.filter(img => img.ratio === '2:3').map((image) => (
                      <div
                        key={image.id}
                        className="relative group rounded-xl overflow-hidden border-2 border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)] hover:border-[var(--color-primary-400)] transition-colors"
                      >
                        <img src={image.url} alt="" className="w-full h-auto" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button className="p-2 bg-white rounded-lg hover:bg-gray-100">
                            <Eye size={16} />
                          </button>
                          <button className="p-2 bg-white rounded-lg hover:bg-gray-100">
                            <Trash2 size={16} className="text-red-600" />
                          </button>
                        </div>
                        {image.published && (
                          <span className="absolute top-2 right-2 px-2 py-1 rounded bg-green-500 text-white text-xs font-semibold">
                            Published
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            )}

            {/* Cast & Crew Tab */}
            {activeTab === 'cast' && (
              <div className="max-w-4xl">
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-[var(--color-neutral-800)] dark:text-white flex items-center gap-2">
                    <Users size={20} className="text-[var(--color-primary-500)]" />
                    Cast & Crew
                  </h3>
                  <button className="px-4 py-2 bg-[var(--color-primary-600)] text-white rounded-lg hover:bg-[var(--color-primary-700)] text-sm font-medium flex items-center gap-2">
                    <Plus size={16} />
                    Add Person
                  </button>
                </div>

                {/* Cast */}
                <section className="mb-8">
                  <h4 className="text-md font-semibold text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)] mb-3">
                    Cast
                  </h4>
                  <div className="space-y-2">
                    {MOCK_PROGRAM.cast.map((person, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-4 p-3 rounded-lg border border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)] hover:border-[var(--color-primary-300)] transition-colors"
                      >
                        <span className="text-sm text-[var(--color-neutral-400)] w-8">#{person.order}</span>
                        <div className="flex-1">
                          <p className="font-medium text-[var(--color-neutral-800)] dark:text-white text-sm">
                            {person.name}
                          </p>
                          <p className="text-xs text-[var(--color-neutral-500)]">{person.role}</p>
                        </div>
                        <button className="p-2 hover:bg-[var(--color-neutral-100)] dark:hover:bg-[var(--color-neutral-700)] rounded-lg">
                          <Trash2 size={16} className="text-red-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Crew */}
                <section>
                  <h4 className="text-md font-semibold text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)] mb-3">
                    Crew
                  </h4>
                  <div className="space-y-2">
                    {MOCK_PROGRAM.crew.map((person, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-4 p-3 rounded-lg border border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)] hover:border-[var(--color-primary-300)] transition-colors"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-[var(--color-neutral-800)] dark:text-white text-sm">
                            {person.name}
                          </p>
                          <p className="text-xs text-[var(--color-neutral-500)]">{person.role}</p>
                        </div>
                        <button className="p-2 hover:bg-[var(--color-neutral-100)] dark:hover:bg-[var(--color-neutral-700)] rounded-lg">
                          <Trash2 size={16} className="text-red-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            )}

            {/* Metadata Tab */}
            {activeTab === 'metadata' && (
              <div className="max-w-4xl space-y-6">
                <section>
                  <h3 className="text-lg font-semibold text-[var(--color-neutral-800)] dark:text-white mb-4">
                    External References
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)] mb-1.5">
                        TMS ID
                      </label>
                      <input
                        type="text"
                        defaultValue={MOCK_PROGRAM.externalRefs.tmsId}
                        className="w-full px-3 py-2 rounded-lg border border-[var(--color-neutral-300)] dark:border-[var(--color-neutral-600)] bg-white dark:bg-[var(--color-neutral-900)] text-sm"
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)] mb-1.5">
                        Root ID
                      </label>
                      <input
                        type="text"
                        defaultValue={MOCK_PROGRAM.externalRefs.rootId}
                        className="w-full px-3 py-2 rounded-lg border border-[var(--color-neutral-300)] dark:border-[var(--color-neutral-600)] bg-white dark:bg-[var(--color-neutral-900)] text-sm"
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)] mb-1.5">
                        Gracenote ID
                      </label>
                      <input
                        type="text"
                        defaultValue={MOCK_PROGRAM.externalRefs.gracenoteId}
                        className="w-full px-3 py-2 rounded-lg border border-[var(--color-neutral-300)] dark:border-[var(--color-neutral-600)] bg-white dark:bg-[var(--color-neutral-900)] text-sm"
                        readOnly
                      />
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-semibold text-[var(--color-neutral-800)] dark:text-white mb-4">
                    System Information
                  </h3>
                  <div className="bg-[var(--color-neutral-50)] dark:bg-[var(--color-neutral-900)] rounded-lg p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-400)]">Created:</span>
                      <span className="font-medium text-[var(--color-neutral-800)] dark:text-white">2024-01-15 10:30 AM</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-400)]">Last Modified:</span>
                      <span className="font-medium text-[var(--color-neutral-800)] dark:text-white">2024-02-10 3:45 PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-400)]">Modified By:</span>
                      <span className="font-medium text-[var(--color-neutral-800)] dark:text-white">john.doe@company.com</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-400)]">Provider:</span>
                      <span className="font-medium text-[var(--color-neutral-800)] dark:text-white">Gracenote</span>
                    </div>
                  </div>
                </section>
              </div>
            )}

          </div>
        </div>

        {/* Version History Sidebar */}
        <div className={`border-l border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)] transition-all ${showVersions ? 'w-80' : 'w-0 overflow-hidden'}`}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[var(--color-neutral-800)] dark:text-white text-sm">
                Version History
              </h3>
              <button onClick={() => setShowVersions(false)} className="p-1 hover:bg-[var(--color-neutral-100)] dark:hover:bg-[var(--color-neutral-700)] rounded">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-2">
              {[3, 2, 1].map((version) => (
                <div
                  key={version}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    version === 3
                      ? 'border-[var(--color-primary-400)] bg-[var(--color-primary-50)] dark:bg-[var(--color-primary-900)]/10'
                      : 'border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)] hover:border-[var(--color-neutral-300)]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm text-[var(--color-neutral-800)] dark:text-white">
                      Version {version}
                    </span>
                    {version === 3 && (
                      <span className="px-2 py-0.5 rounded bg-green-100 text-green-700 text-xs font-semibold">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--color-neutral-500)]">
                    Feb {10 + version}, 2024
                  </p>
                  <p className="text-xs text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-400)] mt-1">
                    by john.doe
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProgramDetailMockup;
