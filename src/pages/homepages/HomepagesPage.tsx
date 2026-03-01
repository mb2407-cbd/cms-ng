import React, { useMemo, useState } from 'react';
import {
  Eye,
  Monitor,
  Smartphone,
  Tv,
  Sparkles,
  Pin,
  CalendarClock,
  ListTree,
  Wand2,
  Layers,
} from 'lucide-react';

type PopulationMode = 'MANUAL' | 'API' | 'HYBRID';
type HomepageStatus = 'DRAFT' | 'PUBLISHED';
type PreviewState = 'draft' | 'published';
type DeviceType = 'Web' | 'Mobile' | 'TV';
type PlatformType = 'OTT' | 'DTH';

interface Lane {
  id: string;
  title: string;
  populationMode: PopulationMode;
  placement: string;
  source: string;
  itemsPlanned: number;
  pinned: number;
  status: HomepageStatus;
}

interface Homepage {
  id: string;
  name: string;
  territory: string;
  platform: PlatformType;
  status: HomepageStatus;
  updatedAt: string;
  updatedBy: string;
  lanes: Lane[];
}

const HOMEPAGE_DATA: Homepage[] = [
  {
    id: 'hp-ott-us-en',
    name: 'Argentina OTT Main',
    territory: 'AR / ES',
    platform: 'OTT',
    status: 'DRAFT',
    updatedAt: '2026-02-24 09:30',
    updatedBy: 'operator.alpha',
    lanes: [
      {
        id: 'lane-hero',
        title: 'Hero Promotions',
        populationMode: 'MANUAL',
        placement: 'Top Hero',
        source: 'Operator Curated',
        itemsPlanned: 6,
        pinned: 3,
        status: 'DRAFT',
      },
      {
        id: 'lane-trending',
        title: 'Trending Now',
        populationMode: 'API',
        placement: 'Lane 2',
        source: '/v1/reco/trending?market=ar',
        itemsPlanned: 18,
        pinned: 0,
        status: 'PUBLISHED',
      },
      {
        id: 'lane-mix',
        title: 'Tonight Picks',
        populationMode: 'HYBRID',
        placement: 'Lane 3',
        source: '4 pinned + API backfill',
        itemsPlanned: 12,
        pinned: 4,
        status: 'DRAFT',
      },
    ],
  },
  {
    id: 'hp-dth-us-en',
    name: 'Argentina DTH Main',
    territory: 'AR / ES',
    platform: 'DTH',
    status: 'PUBLISHED',
    updatedAt: '2026-02-23 17:10',
    updatedBy: 'operator.beta',
    lanes: [
      {
        id: 'lane-live',
        title: 'Live Highlights',
        populationMode: 'API',
        placement: 'Top Lane',
        source: '/v1/reco/live?market=ar',
        itemsPlanned: 14,
        pinned: 0,
        status: 'PUBLISHED',
      },
      {
        id: 'lane-sports',
        title: 'Sports Spotlight',
        populationMode: 'MANUAL',
        placement: 'Lane 2',
        source: 'Sports Editors',
        itemsPlanned: 10,
        pinned: 5,
        status: 'PUBLISHED',
      },
    ],
  },
];

const statusBadgeClass = (status: HomepageStatus): string =>
  status === 'PUBLISHED'
    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';

const modeBadgeClass = (mode: PopulationMode): string => {
  if (mode === 'MANUAL') return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
  if (mode === 'API') return 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300';
  return 'bg-[var(--color-primary-100)] text-[var(--color-primary-700)] dark:bg-[var(--color-primary-900)]/30 dark:text-[var(--color-primary-300)]';
};

const HomepagesPage: React.FC = () => {
  const [selectedHomepageId, setSelectedHomepageId] = useState(HOMEPAGE_DATA[0].id);
  const [selectedDevice, setSelectedDevice] = useState<DeviceType>('Web');
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformType>('OTT');
  const [previewState, setPreviewState] = useState<PreviewState>('draft');

  const selectedHomepage = useMemo(
    () => HOMEPAGE_DATA.find((item) => item.id === selectedHomepageId) ?? HOMEPAGE_DATA[0],
    [selectedHomepageId]
  );

  const visibleLanes = useMemo(
    () => selectedHomepage.lanes.filter((lane) => selectedPlatform === selectedHomepage.platform || lane.populationMode !== 'API'),
    [selectedHomepage, selectedPlatform]
  );

  const previewDeviceIcon = selectedDevice === 'TV' ? <Tv size={14} /> : selectedDevice === 'Mobile' ? <Smartphone size={14} /> : <Monitor size={14} />;

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade-in space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-neutral-800)] dark:text-white">Homepages</h1>
          <p className="text-sm text-[var(--color-neutral-500)] mt-1">
            Mocked merchandising console for homepage lanes, placements, and preview.
          </p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-md bg-[var(--color-primary-600)] px-3 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-700)]">
          <Sparkles size={16} />
          Create Homepage
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <section className="lg:col-span-1 bg-white dark:bg-[var(--color-neutral-800)] rounded-xl border border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)] overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)]">
            <h2 className="text-sm font-semibold text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-100)]">Homepage Targets</h2>
          </div>
          <div className="divide-y divide-[var(--color-neutral-200)] dark:divide-[var(--color-neutral-700)]">
            {HOMEPAGE_DATA.map((homepage) => {
              const isActive = homepage.id === selectedHomepage.id;
              return (
                <button
                  key={homepage.id}
                  onClick={() => {
                    setSelectedHomepageId(homepage.id);
                    setSelectedPlatform(homepage.platform);
                  }}
                  className={`w-full p-4 text-left transition-colors ${
                    isActive
                      ? 'bg-[var(--color-primary-50)] dark:bg-[var(--color-primary-900)]/30'
                      : 'hover:bg-[var(--color-neutral-50)] dark:hover:bg-[var(--color-neutral-700)]/40'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-[var(--color-neutral-800)] dark:text-white">{homepage.name}</p>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${statusBadgeClass(homepage.status)}`}>{homepage.status}</span>
                  </div>
                  <p className="text-xs text-[var(--color-neutral-500)] mt-1">{homepage.territory} • {homepage.platform}</p>
                  <p className="text-xs text-[var(--color-neutral-500)] mt-1">Updated {homepage.updatedAt} by {homepage.updatedBy}</p>
                </button>
              );
            })}
          </div>
        </section>

        <section className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-[var(--color-neutral-800)] rounded-xl border border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)]">
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)]">
              <div>
                <h2 className="text-sm font-semibold text-[var(--color-neutral-800)] dark:text-white">{selectedHomepage.name}</h2>
                <p className="text-xs text-[var(--color-neutral-500)]">Configure lanes and rendering behavior</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[var(--color-neutral-100)] dark:bg-[var(--color-neutral-700)] text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-100)]">
                  <ListTree size={13} />
                  {selectedHomepage.lanes.length} lanes
                </span>
                <span className={`px-2 py-1 rounded-md ${statusBadgeClass(selectedHomepage.status)}`}>
                  {selectedHomepage.status}
                </span>
              </div>
            </div>

            <div className="p-4 overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[var(--color-neutral-500)] border-b border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)]">
                    <th className="py-2 font-medium">Lane</th>
                    <th className="py-2 font-medium">Mode</th>
                    <th className="py-2 font-medium">Placement</th>
                    <th className="py-2 font-medium">Source</th>
                    <th className="py-2 font-medium text-right">Items</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedHomepage.lanes.map((lane) => (
                    <tr key={lane.id} className="border-b border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)] last:border-0">
                      <td className="py-3 text-[var(--color-neutral-800)] dark:text-[var(--color-neutral-100)] font-medium">{lane.title}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${modeBadgeClass(lane.populationMode)}`}>{lane.populationMode}</span>
                      </td>
                      <td className="py-3 text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-300)]">{lane.placement}</td>
                      <td className="py-3 text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-300)]">{lane.source}</td>
                      <td className="py-3 text-right text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-200)]">
                        {lane.itemsPlanned}
                        {lane.pinned > 0 ? <span className="ml-2 text-xs text-[var(--color-neutral-500)]">({lane.pinned} pinned)</span> : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
            <section className="xl:col-span-2 bg-white dark:bg-[var(--color-neutral-800)] rounded-xl border border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)] p-4 space-y-4">
              <h3 className="text-sm font-semibold text-[var(--color-neutral-800)] dark:text-white">Configuration Snapshot</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-200)]"><Layers size={15} /> Placements: Home Main, Hero, Lane Stack</div>
                <div className="flex items-center gap-2 text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-200)]"><Wand2 size={15} /> Rules: API fill threshold, diversity cap, freshness window</div>
                <div className="flex items-center gap-2 text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-200)]"><CalendarClock size={15} /> Schedules: Prime-time boost 18:00-23:00 local</div>
                <div className="flex items-center gap-2 text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-200)]"><Pin size={15} /> Overrides: Pin, hide, boost with expiration</div>
              </div>
            </section>

            <section className="xl:col-span-3 bg-white dark:bg-[var(--color-neutral-800)] rounded-xl border border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)] p-4 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-[var(--color-neutral-800)] dark:text-white inline-flex items-center gap-2">
                  <Eye size={15} />
                  Preview
                </h3>
                <div className="inline-flex items-center gap-2 text-xs text-[var(--color-neutral-500)]">
                  {previewDeviceIcon}
                  {selectedDevice} • {selectedPlatform.toUpperCase()} • {previewState}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                {(['Web', 'Mobile', 'TV'] as DeviceType[]).map((device) => (
                  <button
                    key={device}
                    onClick={() => setSelectedDevice(device)}
                    className={`rounded-md px-2 py-1.5 border ${
                      selectedDevice === device
                        ? 'border-[var(--color-primary-500)] bg-[var(--color-primary-50)] text-[var(--color-primary-700)] dark:bg-[var(--color-primary-900)]/40 dark:text-[var(--color-primary-300)]'
                        : 'border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)] text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-300)]'
                    }`}
                  >
                    {device}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {(['OTT', 'DTH'] as PlatformType[]).map((platform) => (
                  <button
                    key={platform}
                    onClick={() => setSelectedPlatform(platform)}
                    className={`rounded-md px-2 py-1.5 border ${
                      selectedPlatform === platform
                        ? 'border-[var(--color-primary-500)] bg-[var(--color-primary-50)] text-[var(--color-primary-700)] dark:bg-[var(--color-primary-900)]/40 dark:text-[var(--color-primary-300)]'
                        : 'border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)] text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-300)]'
                    }`}
                  >
                    {platform}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {(['draft', 'published'] as PreviewState[]).map((state) => (
                  <button
                    key={state}
                    onClick={() => setPreviewState(state)}
                    className={`rounded-md px-2 py-1.5 border ${
                      previewState === state
                        ? 'border-[var(--color-primary-500)] bg-[var(--color-primary-50)] text-[var(--color-primary-700)] dark:bg-[var(--color-primary-900)]/40 dark:text-[var(--color-primary-300)]'
                        : 'border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)] text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-300)]'
                    }`}
                  >
                    {state}
                  </button>
                ))}
              </div>

              <div className="rounded-lg border border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)] bg-[var(--color-neutral-50)] dark:bg-[var(--color-neutral-900)] p-3 space-y-2">
                {visibleLanes.map((lane) => (
                  <div key={lane.id} className="rounded-md bg-white dark:bg-[var(--color-neutral-800)] border border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-700)] px-3 py-2 flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold text-[var(--color-neutral-800)] dark:text-white">{lane.title}</p>
                      <p className="text-xs text-[var(--color-neutral-500)]">{lane.placement} • {lane.populationMode}</p>
                    </div>
                    <p className="text-xs text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-300)]">{lane.itemsPlanned} cards</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </section>
      </div>
    </div>
  );
};

export default HomepagesPage;
