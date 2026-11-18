import React, { useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useInView } from 'motion/react';
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  RefreshCw,
  Truck,
  X,
} from 'lucide-react';
import { getBinStatus } from '../data/gcetOsmData';
import { CampusZone, CollectionAlert, SmartBin } from '../types/waste';

interface LiveDashboardSectionProps {
  bins: SmartBin[];
  alerts: CollectionAlert[];
  isSyncing?: boolean;
  syncError?: string | null;
  onSimulateSensorCycle: () => void;
  onFlagOverflow: (binId: string) => void;
  onDispatchCrew: (binId: string) => void;
  onMarkEmptied: (binId: string) => void;
  onDismissAlert: (alertId: string) => void;
  onOpenReportDrawer: (binId?: string) => void;
}

const ZONE_TABS: Array<'All Zones' | CampusZone> = [
  'All Zones',
  'Academic Core',
  'Dining & Plaza',
  'Library & Labs',
  'Hostel & Sports',
];

export const LiveDashboardSection: React.FC<LiveDashboardSectionProps> = ({
  bins,
  alerts,
  isSyncing = false,
  syncError = null,
  onSimulateSensorCycle,
  onFlagOverflow,
  onDispatchCrew,
  onMarkEmptied,
  onDismissAlert,
  onOpenReportDrawer,
}) => {
  const [selectedZone, setSelectedZone] = useState<'All Zones' | CampusZone>('All Zones');
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartInView = useInView(chartContainerRef, { once: true, amount: 'some' });

  const filteredBins = useMemo(() => {
    if (selectedZone === 'All Zones') return bins;
    return bins.filter((b) => b.zone === selectedZone);
  }, [bins, selectedZone]);

  const activeAlerts = useMemo(
    () => alerts.filter((a) => a.status !== 'Resolved'),
    [alerts]
  );

  const avgFill = useMemo(() => {
    if (bins.length === 0) return 0;
    return Math.round(bins.reduce((sum, b) => sum + b.fillLevel, 0) / bins.length);
  }, [bins]);

  const criticalCount = useMemo(
    () => bins.filter((b) => getBinStatus(b) === 'Overflowing').length,
    [bins]
  );

  return (
    <section id="dashboard" className="w-full bg-white py-16 md:py-24 border-b border-[#DCE8E1]">
      <div className="max-w-[1280px] mx-auto px-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
          <div className="space-y-2 max-w-2xl">
            <p className="font-mono text-xs font-medium text-[#2D6A4F]">
              SECTION 05 · REAL-TIME TELEMETRY &amp; ALERTS
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-[#0F1F18] tracking-tight">
              Live Campus Waste Dashboard
            </h2>
            <p className="text-sm md:text-base text-[#3D574A]">
              Animated capacity analytics, live fill percentages, and instant slide-in crew
              notifications triggered by ultrasonic thresholds or student reports.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              disabled={isSyncing}
              onClick={onSimulateSensorCycle}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#163A2B] rounded-md hover:bg-[#0F2A1F] disabled:opacity-60 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#163A2B]"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 shrink-0 ${isSyncing ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
              <span>Pulse Live Sensor Update</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenReportDrawer()}
              className="px-4 py-2.5 text-xs font-semibold text-[#163A2B] bg-[#E9F4EE] rounded-md hover:bg-[#D5E9DE] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#163A2B]"
            >
              Submit Student Report
            </button>
          </div>
        </div>

        {syncError && (
          <div
            role="status"
            className="mb-6 px-4 py-3 text-xs font-medium text-[#92400E] bg-[#FEF3C7] border border-[#F59E0B]/40 rounded-lg"
          >
            {syncError}
          </div>
        )}

        {/* Summary KPI Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="p-5 bg-[#F7FBF9] border border-[#DCE8E1] rounded-xl">
            <div className="text-xs font-medium text-[#546E61]">Campus Mean Fill</div>
            <div className="font-display text-3xl font-bold text-[#0F1F18] mt-1 tabular-nums">
              {avgFill}%
            </div>
          </div>
          <div className="p-5 bg-[#F7FBF9] border border-[#DCE8E1] rounded-xl">
            <div className="text-xs font-medium text-[#546E61]">Critical Overflow Bins</div>
            <div className="font-display text-3xl font-bold text-[#B91C1C] mt-1 tabular-nums">
              {criticalCount}
            </div>
          </div>
          <div className="p-5 bg-[#F7FBF9] border border-[#DCE8E1] rounded-xl">
            <div className="text-xs font-medium text-[#546E61]">Active Mobile Alerts</div>
            <div className="font-display text-3xl font-bold text-[#0F1F18] mt-1 tabular-nums">
              {activeAlerts.length}
            </div>
          </div>
          <div className="p-5 bg-[#F7FBF9] border border-[#DCE8E1] rounded-xl">
            <div className="text-xs font-medium text-[#546E61]">Crews Dispatched</div>
            <div className="font-display text-3xl font-bold text-[#15803D] mt-1 tabular-nums">
              {bins.filter((b) => b.dispatched).length}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left 8 columns: GPU-Animated Chart + Live Bin Fill Table */}
          <div className="lg:col-span-8 space-y-6">
            <div
              ref={chartContainerRef}
              className="p-6 bg-white border border-[#D2E2D9] rounded-xl"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                <div>
                  <h3 className="font-display text-base font-bold text-[#0F1F18]">
                    Live Ultrasonic Fill Distribution
                  </h3>
                  <p className="text-xs text-[#546E61]">
                    85% threshold line triggers automated collection dispatch
                  </p>
                </div>

                <div
                  role="group"
                  aria-label="Filter dashboard by campus zone"
                  className="flex flex-wrap items-center gap-1 p-1 bg-[#EFF6F2] rounded-lg"
                >
                  {ZONE_TABS.map((zone) => (
                    <button
                      key={zone}
                      type="button"
                      onClick={() => setSelectedZone(zone)}
                      className={`px-2.5 py-1 text-[11px] font-medium rounded transition-colors whitespace-nowrap cursor-pointer ${
                        selectedZone === zone
                          ? 'bg-white text-[#0F1F18] shadow-xs'
                          : 'text-[#425A4F] hover:text-[#0F1F18]'
                      }`}
                    >
                      {zone}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3.5">
                {filteredBins.map((bin, idx) => {
                  const status = getBinStatus(bin);
                  const barFill =
                    status === 'Overflowing'
                      ? '#DC2626'
                      : status === 'Near Full'
                        ? '#D97706'
                        : '#16A34A';

                  return (
                    <div key={bin.id} className="space-y-1.5">
                      <div className="flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono font-semibold text-[#163A2B] tabular-nums shrink-0">
                            {bin.code}
                          </span>
                          <span className="font-medium text-[#0F1F18] truncate">
                            {bin.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span
                            className={`text-[11px] font-semibold ${
                              status === 'Overflowing'
                                ? 'text-[#B91C1C]'
                                : status === 'Near Full'
                                  ? 'text-[#B45309]'
                                  : 'text-[#15803D]'
                            }`}
                          >
                            {status}
                          </span>
                          <span className="font-mono font-bold text-[#0F1F18] tabular-nums w-9 text-right">
                            {bin.fillLevel}%
                          </span>
                        </div>
                      </div>

                      <div
                        className="relative h-3 bg-[#EDF4F0] rounded-full overflow-hidden"
                        role="progressbar"
                        aria-valuenow={bin.fillLevel}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${bin.name} fill percentage`}
                      >
                        <div
                          aria-hidden="true"
                          className="absolute top-0 bottom-0 w-px bg-[#152D22]/40 z-10"
                          style={{ left: '85%' }}
                        />
                        <motion.div
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: chartInView ? bin.fillLevel / 100 : 0 }}
                          transition={{
                            duration: 0.6,
                            delay: idx * 0.04,
                            ease: [0.16, 1, 0.3, 1],
                          }}
                          className="h-full w-full origin-left rounded-full will-change-transform"
                          style={{ backgroundColor: barFill }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="border border-[#D2E2D9] rounded-xl overflow-hidden bg-white">
              <div className="divide-y divide-[#EDF4F0]">
                {filteredBins.map((bin) => {
                  const status = getBinStatus(bin);
                  return (
                    <div
                      key={bin.id}
                      className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F9FCFA]"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-[#0F1F18]">{bin.name}</div>
                        <div className="text-[11px] text-[#546E61] mt-0.5 tabular-nums">
                          {bin.code} · {bin.stream} · {bin.temperatureC}°C · Bat {bin.batteryPct}%
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {status !== 'Overflowing' && (
                          <button
                            type="button"
                            onClick={() => onFlagOverflow(bin.id)}
                            className="px-3 py-1.5 text-xs font-semibold text-[#163A2B] bg-[#E9F4EE] rounded hover:bg-[#D5E9DE] cursor-pointer whitespace-nowrap"
                          >
                            Trigger Overflow
                          </button>
                        )}
                        {status !== 'Nominal' && !bin.dispatched && (
                          <button
                            type="button"
                            onClick={() => onDispatchCrew(bin.id)}
                            className="px-3 py-1.5 text-xs font-semibold text-white bg-[#163A2B] rounded hover:bg-[#0F2A1F] cursor-pointer whitespace-nowrap"
                          >
                            Dispatch Crew
                          </button>
                        )}
                        {(status !== 'Nominal' || bin.dispatched) && (
                          <button
                            type="button"
                            onClick={() => onMarkEmptied(bin.id)}
                            className="px-3 py-1.5 text-xs font-medium text-[#0F1F18] bg-white border border-[#C9DBD1] rounded hover:bg-[#F7FBF9] cursor-pointer whitespace-nowrap"
                          >
                            Mark Emptied
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right 4 columns: Slide-In Collection Alert Notifications */}
          <div className="lg:col-span-4 space-y-4">
            <div className="p-5 bg-[#0F2319] text-white rounded-xl border border-[#244B37]">
              <div className="flex items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[#B8DEC9]" aria-hidden="true" />
                  <h3 className="font-display text-sm font-bold">
                    Mobile Crew Notifications
                  </h3>
                </div>
                <span className="font-mono text-xs text-[#B8DEC9] tabular-nums">
                  {activeAlerts.length} Active
                </span>
              </div>

              <div className="space-y-3 overflow-hidden">
                <AnimatePresence initial={false}>
                  {activeAlerts.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-6 text-center rounded-lg bg-[#163124] border border-[#2A5440] space-y-2"
                    >
                      <CheckCircle2
                        className="w-7 h-7 text-[#52B788] mx-auto"
                        aria-hidden="true"
                      />
                      <p className="text-xs font-semibold text-white">
                        All Campus Alerts Resolved
                      </p>
                      <p className="text-[11px] text-[#B8DEC9]">
                        New threshold or student alerts slide in here automatically.
                      </p>
                    </motion.div>
                  ) : (
                    activeAlerts.map((alert) => (
                      <motion.div
                        key={alert.id}
                        layout
                        initial={{ opacity: 0, x: 42 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 42 }}
                        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                        className="p-4 rounded-lg bg-[#163124] border border-[#2C5642] space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5 text-[11px] font-semibold">
                            <AlertTriangle
                              className={`w-3.5 h-3.5 shrink-0 ${
                                alert.severity === 'Critical'
                                  ? 'text-[#F87171]'
                                  : 'text-[#FBBF24]'
                              }`}
                              aria-hidden="true"
                            />
                            <span
                              className={
                                alert.severity === 'Critical'
                                  ? 'text-[#FCA5A5]'
                                  : 'text-[#FDE68A]'
                              }
                            >
                              {alert.severity} · {alert.trigger}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => onDismissAlert(alert.id)}
                            aria-label={`Dismiss alert for ${alert.location}`}
                            className="text-[#95C5AC] hover:text-white cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                        </div>

                        <div>
                          <div className="font-display text-sm font-bold text-white">
                            {alert.location}
                          </div>
                          <div className="font-mono text-[11px] text-[#95C5AC] tabular-nums">
                            {alert.binCode} · {alert.timestamp}
                          </div>
                        </div>

                        <p className="text-xs text-[#D7E8DF] leading-relaxed">{alert.message}</p>

                        <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2">
                          <span className="text-[11px] text-[#B8DEC9]">
                            {alert.status === 'Dispatched'
                              ? `Assigned: ${alert.assignedCrew}`
                              : 'Waiting dispatch'}
                          </span>
                          {alert.status === 'Active' ? (
                            <button
                              type="button"
                              onClick={() => onDispatchCrew(alert.binId)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-[#0F2319] bg-[#D8ECE2] rounded hover:bg-white cursor-pointer"
                            >
                              <Truck className="w-3 h-3" aria-hidden="true" />
                              <span>Dispatch</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onMarkEmptied(alert.binId)}
                              className="px-2.5 py-1 text-[11px] font-semibold text-white bg-[#24563F] rounded hover:bg-[#2E6E51] cursor-pointer"
                            >
                              Mark Cleared
                            </button>
                          )}
                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
