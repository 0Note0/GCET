import { Component, type ErrorInfo, type ReactNode, useCallback, useEffect, useState } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import { MapsAvailabilityContext } from './components/CampusMapContext';
import { CampusOverviewMap } from './components/CampusOverviewMap';
import { DataFlowSection } from './components/DataFlowSection';
import { Footer } from './components/Footer';
import { HeroParallaxSection } from './components/HeroParallaxSection';
import { ImpactSection } from './components/ImpactSection';
import { LiveDashboardSection } from './components/LiveDashboardSection';
import { Navbar } from './components/Navbar';
import { OverflowReportDrawer } from './components/OverflowReportDrawer';
import { RouteOptimizationSection } from './components/RouteOptimizationSection';
import { SmartBinDeploymentSection } from './components/SmartBinDeploymentSection';
import {
  formatCurrentTime,
  INITIAL_ALERTS,
  INITIAL_CAMPUS_BINS,
  INITIAL_REPORTS,
  loadStoredState,
  STORAGE_KEYS,
} from './data/gcetOsmData';
import { campusApi } from './services/campusApi';
import {
  CollectionAlert,
  IssueType,
  OverflowReport,
  ReporterRole,
  SmartBin,
} from './types/waste';

class AppErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('App render boundary caught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#F7FBF9] px-6 text-center">
          <div className="max-w-md space-y-4">
            <h1 className="font-display text-2xl font-bold text-[#0F1F18]">
              Unable to render campus telemetry view
            </h1>
            <p className="text-sm text-[#3D574A]">
              An unexpected error interrupted the display. Reload the interface to restore live monitoring.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-[#163A2B] rounded-md hover:bg-[#0F2A1F] cursor-pointer"
            >
              Reload Dashboard
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const envApiKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined) || '';
  const [mapsApiKey, setMapsApiKey] = useState<string>(envApiKey);
  const [isResolvingKey, setIsResolvingKey] = useState<boolean>(!envApiKey);
  const [quotaExceeded, setQuotaExceeded] = useState<boolean>(false);

  const [bins, setBins] = useState<SmartBin[]>(() =>
    loadStoredState<SmartBin[]>(STORAGE_KEYS.BINS, INITIAL_CAMPUS_BINS)
  );
  const [alerts, setAlerts] = useState<CollectionAlert[]>(() =>
    loadStoredState<CollectionAlert[]>(STORAGE_KEYS.ALERTS, INITIAL_ALERTS)
  );
  const [reports, setReports] = useState<OverflowReport[]>(() =>
    loadStoredState<OverflowReport[]>(STORAGE_KEYS.REPORTS, INITIAL_REPORTS)
  );
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerInitialBinId, setDrawerInitialBinId] = useState<string | undefined>(undefined);

  useEffect(() => {
    const onQuotaExceeded = () => setQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', onQuotaExceeded);
    return () => window.removeEventListener('gmp-quota-exceeded', onQuotaExceeded);
  }, []);

  useEffect(() => {
    if (envApiKey) {
      setMapsApiKey(envApiKey);
      setIsResolvingKey(false);
      return;
    }

    let active = true;
    fetch('/api/maps-config', { credentials: 'same-origin' })
      .then(async (res) => {
        if (!res.ok) return { apiKey: '' };
        const ct = res.headers.get('content-type') || '';
        if (!ct.includes('application/json')) return { apiKey: '' };
        return (await res.json()) as { apiKey?: string };
      })
      .then((data: { apiKey?: string }) => {
        if (!active) return;
        setMapsApiKey(data.apiKey || '');
      })
      .catch(() => {
        if (!active) return;
        setMapsApiKey('');
      })
      .finally(() => {
        if (active) setIsResolvingKey(false);
      });

    return () => {
      active = false;
    };
  }, [envApiKey]);

  // Hydrate live state from Express API on mount
  useEffect(() => {
    let active = true;
    campusApi
      .fetchState()
      .then((state) => {
        if (!active) return;
        setBins(state.bins);
        setAlerts(state.alerts);
        setReports(state.reports);
        setSyncError(null);
      })
      .catch(() => {
        // Resilient local fallback if backend offline
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.BINS, JSON.stringify(bins));
      localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(alerts));
      localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
    } catch {
      // Ignore storage quota issues cleanly
    }
  }, [bins, alerts, reports]);

  const scrollToId = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const applyServerState = useCallback(
    (state: { bins: SmartBin[]; alerts: CollectionAlert[]; reports: OverflowReport[] }) => {
      setBins(state.bins);
      setAlerts(state.alerts);
      setReports(state.reports);
      setSyncError(null);
    },
    []
  );

  const handleSimulateSensorCycle = useCallback(async () => {
    setIsSyncing(true);
    try {
      const nextState = await campusApi.simulateCycle();
      applyServerState(nextState);
    } catch {
      const nowLabel = formatCurrentTime();
      setBins((prevBins) => {
        const triggered: CollectionAlert[] = [];
        const next = prevBins.map((bin, idx) => {
          if (bin.dispatched) return bin;
          const delta = ((idx * 3 + Math.floor(Math.random() * 6)) % 7) + 3;
          const nextFill = Math.min(99, bin.fillLevel + delta);
          if (bin.fillLevel < 85 && nextFill >= 85) {
            triggered.push({
              id: `alrt-${Date.now()}-${bin.id}`,
              binId: bin.id,
              binCode: bin.code,
              location: bin.name,
              zone: bin.zone,
              trigger: 'Automated Threshold',
              severity: 'Critical',
              message: `Ultrasonic sensor crossed 85% threshold (${nextFill}% full).`,
              timestamp: nowLabel,
              assignedCrew: null,
              status: 'Active',
            });
          }
          return { ...bin, fillLevel: nextFill, updatedAt: nowLabel };
        });
        if (triggered.length > 0) setAlerts((prev) => [...triggered, ...prev]);
        return next;
      });
      setSyncError('Backend sync delayed — showing local sensor cycle update.');
    } finally {
      setIsSyncing(false);
    }
  }, [applyServerState]);

  const handleFlagOverflow = useCallback(
    async (binId: string) => {
      try {
        const nextState = await campusApi.flagOverflow(binId);
        applyServerState(nextState);
      } catch {
        const target = bins.find((b) => b.id === binId);
        if (!target) return;
        const nowLabel = formatCurrentTime();
        setBins((prev) =>
          prev.map((b) =>
            b.id === binId
              ? { ...b, fillLevel: Math.max(b.fillLevel, 91), reportedOverflow: true, updatedAt: nowLabel }
              : b
          )
        );
        setAlerts((prev) => [
          {
            id: `alrt-${Date.now()}-${binId}`,
            binId: target.id,
            binCode: target.code,
            location: target.name,
            zone: target.zone,
            trigger: 'Sensor Telemetry',
            severity: 'Critical',
            message: `Overflow triggered at ${target.location}.`,
            timestamp: nowLabel,
            assignedCrew: null,
            status: 'Active',
          },
          ...prev,
        ]);
      }
    },
    [applyServerState, bins]
  );

  const handleDispatchCrew = useCallback(
    async (binId: string) => {
      try {
        const nextState = await campusApi.dispatchCrew(binId);
        applyServerState(nextState);
      } catch {
        const crew = `EV Cart 0${Math.floor(1 + Math.random() * 3)}`;
        setBins((prev) => prev.map((b) => (b.id === binId ? { ...b, dispatched: true } : b)));
        setAlerts((prev) =>
          prev.map((a) =>
            a.binId === binId && a.status === 'Active'
              ? { ...a, status: 'Dispatched', assignedCrew: crew }
              : a
          )
        );
      }
    },
    [applyServerState]
  );

  const handleMarkEmptied = useCallback(
    async (binId: string) => {
      try {
        const nextState = await campusApi.collectBin(binId);
        applyServerState(nextState);
      } catch {
        const nowLabel = formatCurrentTime();
        setBins((prev) =>
          prev.map((b) =>
            b.id === binId
              ? {
                  ...b,
                  fillLevel: 8,
                  reportedOverflow: false,
                  dispatched: false,
                  lastEmptied: nowLabel,
                  updatedAt: nowLabel,
                }
              : b
          )
        );
        setAlerts((prev) =>
          prev.map((a) =>
            a.binId === binId && a.status !== 'Resolved'
              ? { ...a, status: 'Resolved', severity: 'Resolved' }
              : a
          )
        );
      }
    },
    [applyServerState]
  );

  const handleDismissAlert = useCallback(
    async (alertId: string) => {
      try {
        const nextState = await campusApi.dismissAlert(alertId);
        applyServerState(nextState);
      } catch {
        setAlerts((prev) =>
          prev.map((a) =>
            a.id === alertId ? { ...a, status: 'Resolved', severity: 'Resolved' } : a
          )
        );
      }
    },
    [applyServerState]
  );

  const handleResetRouteScenario = useCallback(async () => {
    try {
      const nextState = await campusApi.resetCampus();
      applyServerState(nextState);
    } catch {
      setBins(INITIAL_CAMPUS_BINS);
      setAlerts(INITIAL_ALERTS);
      setReports(INITIAL_REPORTS);
    }
  }, [applyServerState]);

  const handleSubmitOverflowForm = useCallback(
    async (payload: {
      binId: string;
      reporterName: string;
      campusId: string;
      role: ReporterRole;
      issueType: IssueType;
      urgency: 'Standard' | 'Urgent';
      notes: string;
      evidenceDataUrl?: string;
    }): Promise<OverflowReport> => {
      try {
        const result = await campusApi.submitReport(payload);
        applyServerState(result.state);
        return result.report;
      } catch {
        const target = bins.find((b) => b.id === payload.binId) ?? bins[0];
        if (!target) {
          throw new Error('Selected smart bin not found.');
        }
        const nowLabel = formatCurrentTime();
        const ticketNumber = `GCET-RPT-${Math.floor(1000 + Math.random() * 9000)}`;
        const report: OverflowReport = {
          id: `rpt-${Date.now()}`,
          ticketNumber,
          binId: target.id,
          binCode: target.code,
          location: target.name,
          reporterName: payload.reporterName.trim(),
          campusId: payload.campusId.trim(),
          role: payload.role,
          issueType: payload.issueType,
          urgency: payload.urgency,
          notes: payload.notes.trim(),
          createdAt: nowLabel,
          status: 'Pending Dispatch',
        };

        setBins((prev) =>
          prev.map((b) =>
            b.id === target.id
              ? {
                  ...b,
                  fillLevel: Math.max(b.fillLevel, 93),
                  reportedOverflow: true,
                  updatedAt: nowLabel,
                }
              : b
          )
        );
        setAlerts((prev) => [
          {
            id: `alrt-${Date.now()}-${target.id}`,
            binId: target.id,
            binCode: target.code,
            location: target.name,
            zone: target.zone,
            trigger: 'Student/Staff Report',
            severity: 'Critical',
            message: `${payload.issueType} reported by ${payload.reporterName.trim()} (${ticketNumber}).`,
            timestamp: nowLabel,
            assignedCrew: null,
            status: 'Active',
          },
          ...prev,
        ]);
        setReports((prev) => [report, ...prev]);
        return report;
      }
    },
    [applyServerState, bins]
  );

  const openReportDrawer = useCallback((binId?: string) => {
    setDrawerInitialBinId(binId);
    setDrawerOpen(true);
  }, []);

  const appContent = (
    <div className="min-h-screen flex flex-col bg-white text-[#0F1F18]">
      {quotaExceeded && (
        <div
          role="status"
          className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-[950] shadow-sm"
        >
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      <Navbar onOpenReportDrawer={() => openReportDrawer()} />

      <main className="flex-1">
        <HeroParallaxSection
          onExploreMap={() => scrollToId('campus-overview')}
          onOpenReportDrawer={() => openReportDrawer()}
        />

        <CampusOverviewMap />

        <SmartBinDeploymentSection bins={bins} />

        <DataFlowSection />

        <LiveDashboardSection
          bins={bins}
          alerts={alerts}
          isSyncing={isSyncing}
          syncError={syncError}
          onSimulateSensorCycle={handleSimulateSensorCycle}
          onFlagOverflow={handleFlagOverflow}
          onDispatchCrew={handleDispatchCrew}
          onMarkEmptied={handleMarkEmptied}
          onDismissAlert={handleDismissAlert}
          onOpenReportDrawer={openReportDrawer}
        />

        <RouteOptimizationSection
          bins={bins}
          onMarkBinCollected={handleMarkEmptied}
          onResetRouteScenario={handleResetRouteScenario}
        />

        <ImpactSection onOpenReportDrawer={() => openReportDrawer()} />
      </main>

      <Footer />

      <OverflowReportDrawer
        isOpen={drawerOpen}
        bins={bins}
        initialBinId={drawerInitialBinId}
        onClose={() => setDrawerOpen(false)}
        onSubmitReport={handleSubmitOverflowForm}
        onJumpToDashboard={() => scrollToId('dashboard')}
      />
    </div>
  );

  return (
    <AppErrorBoundary>
      <MapsAvailabilityContext.Provider
        value={{ hasApiKey: Boolean(mapsApiKey), isResolvingKey }}
      >
        {mapsApiKey ? (
          <APIProvider apiKey={mapsApiKey} libraries={['marker']}>
            {appContent}
          </APIProvider>
        ) : (
          appContent
        )}
      </MapsAvailabilityContext.Provider>
    </AppErrorBoundary>
  );
}
