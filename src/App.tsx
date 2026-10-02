import {
  CommandCenterProvider,
  useCommandCenter,
} from '@/state/CommandCenterProvider';
import { TopBar } from '@/components/layout/TopBar';
import { PhaseStepper } from '@/components/layout/PhaseStepper';
import { MetricCards } from '@/components/metrics/MetricCards';
import { ZoneCard } from '@/components/zones/ZoneCard';
import { EventMap } from '@/components/map/EventMap';
import { TrendChart } from '@/components/charts/TrendChart';
import { AlertsPanel } from '@/components/alerts/AlertsPanel';
import { RecommendationsPanel } from '@/components/recommendations/RecommendationsPanel';
import { ImpactPanel } from '@/components/impact/ImpactPanel';
import { CriticalOverlay } from '@/components/critical/CriticalOverlay';
import { ChaosController } from '@/components/telemetry/ChaosController';
import { SOSDispatchModal } from '@/components/sos/SOSDispatchModal';
import { PoliceDispatchModal } from '@/components/government/PoliceDispatchModal';
import { PublicBroadcastModal } from '@/components/broadcast/PublicBroadcastModal';
import AttendeeAppModal from '@/components/attendee/AttendeeAppModal';
import { AttendeePushPanel } from '@/components/attendee/AttendeePushPanel';
import { CCTVModal } from '@/components/cctv/CCTVModal';

function Dashboard() {
  const {
    zoneList,
    predictions,
    mode,
    hasData,
    feedStatus,
    isSOSModalOpen,
    setIsSOSModalOpen,
    isPoliceModalOpen,
    setIsPoliceModalOpen,
    isBroadcastModalOpen,
    setIsBroadcastModalOpen,
    isAttendeeModalOpen,
    setIsAttendeeModalOpen,
    isCCTVModalOpen,
    setIsCCTVModalOpen,
    cctvActiveZoneId,
  } = useCommandCenter();

  return (
    <div className="min-h-screen bg-surface-base font-body text-slate-100">
      <CriticalOverlay />
      <TopBar />
      <PhaseStepper />
      <main className="mx-auto max-w-7xl space-y-6 p-6 pb-28">
        {mode === 'live' && !hasData && (
          <div className="rounded-xl border border-risk-warning/40 bg-risk-warning/10 p-4 text-sm text-risk-warning flex items-center justify-between">
            <span>
              Waiting for live sensor feed ({feedStatus}). Start the gateway with{' '}
              <code className="rounded bg-black/40 px-1.5 py-0.5 font-mono text-xs text-amber-300">
                npm run feed
              </code>{' '}
              or switch to Simulation mode in the Demo Deck below.
            </span>
          </div>
        )}
        {mode === 'live' && feedStatus === 'stale' && (
          <div className="rounded-xl border border-risk-high/40 bg-risk-high/10 p-4 text-sm text-risk-high">
            No data received recently from sensor gateway. Risk levels below reflect the last
            reading and may be out of date.
          </div>
        )}
        <MetricCards />

        <AttendeePushPanel />

        <section className="grid gap-4 lg:grid-cols-2">
          <AlertsPanel />
          <RecommendationsPanel />
        </section>

        <ImpactPanel />

        <section className="grid gap-4 lg:grid-cols-2">
          <EventMap />
          <TrendChart />
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
            Zones Telemetry
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {zoneList.map((zone) => (
              <ZoneCard
                key={zone.id}
                zone={zone}
                prediction={predictions[zone.id]}
              />
            ))}
          </div>
        </section>
      </main>

      {/* Floating Chaos Controller & Live Telemetry Inspector */}
      <ChaosController />

      {/* Standalone SOS Emergency Operations Hub Modal */}
      <SOSDispatchModal
        isOpen={isSOSModalOpen}
        onClose={() => setIsSOSModalOpen(false)}
      />

      {/* 1-Click Mumbai Police & BMC Disaster Cell Integration Modal */}
      <PoliceDispatchModal
        isOpen={isPoliceModalOpen}
        onClose={() => setIsPoliceModalOpen(false)}
      />

      {/* Stadium PA & Digital Screens Broadcast Modal */}
      <PublicBroadcastModal
        isOpen={isBroadcastModalOpen}
        onClose={() => setIsBroadcastModalOpen(false)}
      />

      {/* Mobile Attendee App Preview Modal */}
      <AttendeeAppModal
        isOpen={isAttendeeModalOpen}
        onClose={() => setIsAttendeeModalOpen(false)}
      />

      {/* Automated CCTV Intelligence & Vision AI Modal */}
      <CCTVModal
        isOpen={isCCTVModalOpen}
        onClose={() => setIsCCTVModalOpen(false)}
        initialZoneId={cctvActiveZoneId}
      />
    </div>
  );
}

export function App() {
  return (
    <CommandCenterProvider>
      <Dashboard />
    </CommandCenterProvider>
  );
}

export default App;
