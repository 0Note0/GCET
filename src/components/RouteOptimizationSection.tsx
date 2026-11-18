import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AdvancedMarker,
  InfoWindow,
  Polygon,
  Polyline,
} from '@vis.gl/react-google-maps';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CheckCircle2, Play, RotateCcw, Truck } from 'lucide-react';
import {
  findRouteProgressForBin,
  GCET_BUILDINGS,
  getBinStatus,
  interpolateRoutePoint,
  OPTIMAL_TRUCK_ROUTE,
} from '../data/gcetOsmData';
import { SmartBin } from '../types/waste';
import { CampusSatelliteMap } from './CampusMapContext';

gsap.registerPlugin(ScrollTrigger);

interface RouteOptimizationSectionProps {
  bins: SmartBin[];
  onMarkBinCollected: (binId: string) => void;
  onResetRouteScenario: () => void;
}

export const RouteOptimizationSection: React.FC<RouteOptimizationSectionProps> = ({
  bins,
  onMarkBinCollected,
  onResetRouteScenario,
}) => {
  const sectionRef = useRef<HTMLElement>(null);
  const collectedIdsRef = useRef<Set<string>>(new Set());

  const [routeProgress, setRouteProgress] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [selectedBinId, setSelectedBinId] = useState<string | null>(null);

  const orderedBins = useMemo(
    () =>
      [...bins]
        .sort((a, b) => a.routeOrder - b.routeOrder)
        .map((bin) => ({
          bin,
          routeTriggerProgress: findRouteProgressForBin(
            OPTIMAL_TRUCK_ROUTE,
            bin.lat,
            bin.lon
          ),
        })),
    [bins]
  );

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (!sectionRef.current) return;
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top 65%',
        end: 'bottom 40%',
        onUpdate: (self) => {
          if (!isAutoPlaying) {
            setRouteProgress(self.progress);
          }
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, [isAutoPlaying]);

  useEffect(() => {
    if (!isAutoPlaying) return;
    let rafId = 0;
    const startTime = performance.now();
    const durationMs = 7000;

    const step = (now: number) => {
      const elapsed = now - startTime;
      const pct = Math.min(1, elapsed / durationMs);
      setRouteProgress(pct);
      if (pct < 1) {
        rafId = requestAnimationFrame(step);
      } else {
        setIsAutoPlaying(false);
      }
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [isAutoPlaying]);

  useEffect(() => {
    if (routeProgress <= 0.01) return;

    orderedBins.forEach(({ bin, routeTriggerProgress }) => {
      const status = getBinStatus(bin);
      if (
        routeProgress >= routeTriggerProgress &&
        status !== 'Nominal' &&
        !collectedIdsRef.current.has(bin.id)
      ) {
        collectedIdsRef.current.add(bin.id);
        onMarkBinCollected(bin.id);
      }
    });
  }, [routeProgress, orderedBins, onMarkBinCollected]);

  const truckCoords = useMemo(
    () => interpolateRoutePoint(OPTIMAL_TRUCK_ROUTE, routeProgress),
    [routeProgress]
  );

  const selectedBin = bins.find((b) => b.id === selectedBinId) ?? null;
  const progressPct = Math.round(routeProgress * 100);

  return (
    <section
      id="route-optimization"
      ref={sectionRef}
      className="w-full bg-[#F7FBF9] py-16 md:py-24 border-b border-[#DCE8E1]"
    >
      <div className="max-w-[1280px] mx-auto px-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
          <div className="space-y-2 max-w-2xl">
            <p className="font-mono text-xs font-medium text-[#2D6A4F]">
              SECTION 06 · CAMPUS SATELLITE ROAD ROUTING
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-[#0F1F18] tracking-tight">
              Automated Campus Route Optimization
            </h2>
            <p className="text-sm md:text-base text-[#3D574A]">
              Electric collection cart follows GCET&apos;s internal campus roadways on satellite
              imagery, emptying overflowing stations along the loop and turning collected bins green.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                collectedIdsRef.current.clear();
                setRouteProgress(0);
                setIsAutoPlaying(true);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-[#163A2B] rounded-md hover:bg-[#0F2A1F] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#163A2B]"
            >
              <Play className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>Run Optimal Route</span>
            </button>

            <button
              type="button"
              onClick={() => {
                collectedIdsRef.current.clear();
                setIsAutoPlaying(false);
                setRouteProgress(0);
                onResetRouteScenario();
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-[#163A2B] bg-white border border-[#C9DBD1] rounded-md hover:bg-[#EDF4F0] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#163A2B]"
            >
              <RotateCcw className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>Reset Full Bins</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-4 bg-white border border-[#D2E2D9] rounded-xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#E5EFEA]">
                <div className="flex items-center gap-2 text-sm font-bold text-[#0F1F18]">
                  <Truck className="w-4 h-4 text-[#163A2B]" aria-hidden="true" />
                  <span>EV Cart Route Progress</span>
                </div>
                <span className="font-mono text-xs font-bold text-[#163A2B] tabular-nums">
                  {progressPct}%
                </span>
              </div>

              <div className="mt-4 space-y-2.5">
                {orderedBins.map(({ bin }) => {
                  const status = getBinStatus(bin);
                  const isCleared = status === 'Nominal';
                  return (
                    <div
                      key={bin.id}
                      className="p-3 rounded-lg border border-[#E5EFEA] flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="font-mono text-[11px] text-[#546E61] tabular-nums">
                          Stop #{bin.routeOrder} · {bin.code}
                        </div>
                        <div className="text-xs font-semibold text-[#0F1F18] truncate mt-0.5">
                          {bin.name}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs font-semibold shrink-0">
                        {isCleared ? (
                          <>
                            <CheckCircle2
                              className="w-4 h-4 text-[#16A34A]"
                              aria-hidden="true"
                            />
                            <span className="text-[#15803D]">Cleared</span>
                          </>
                        ) : (
                          <span
                            className={`font-mono tabular-nums ${
                              status === 'Overflowing'
                                ? 'text-[#B91C1C]'
                                : 'text-[#B45309]'
                            }`}
                          >
                            {bin.fillLevel}%
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-[#E5EFEA] text-xs text-[#425A4F]">
              Scroll down or click <strong>Run Optimal Route</strong> to drive the EV cart along
              internal GCET campus satellite roads.
            </div>
          </div>

          <div className="lg:col-span-8 bg-white border border-[#D2E2D9] rounded-xl overflow-hidden shadow-xs">
            <div className="px-4 py-3 border-b border-[#E5EFEA] flex flex-wrap items-center justify-between gap-2 text-xs text-[#3D574A]">
              <span className="font-semibold text-[#0F1F18]">
                Campus Loop Distance: 1.18 km · Estimated EV Run: 8 min
              </span>
              <span className="font-mono text-[11px] text-[#2D6A4F] tabular-nums">
                Green = Collected · Red/Amber = Pending
              </span>
            </div>

            <div className="w-full h-[380px] sm:h-[440px] md:h-[500px]">
              <CampusSatelliteMap
                id="route-optimization-map"
                ariaLabel="Google Maps satellite route optimization map showing EV waste collection cart on GCET campus roads"
              >
                {GCET_BUILDINGS.map((bldg) => (
                  <Polygon
                    key={bldg.id}
                    paths={bldg.polygon.map(([lat, lng]) => ({ lat, lng }))}
                    strokeColor="#86EFAC"
                    strokeOpacity={0.6}
                    strokeWeight={1}
                    fillColor="#22C55E"
                    fillOpacity={0.14}
                  />
                ))}

                <Polyline
                  path={OPTIMAL_TRUCK_ROUTE.map(([lat, lng]) => ({ lat, lng }))}
                  strokeColor="#FDE047"
                  strokeOpacity={0}
                  icons={[
                    {
                      icon: {
                        path: 'M 0,-1 0,1',
                        strokeOpacity: 0.95,
                        strokeColor: '#FDE047',
                        scale: 3,
                      },
                      offset: '0',
                      repeat: '12px',
                    },
                  ]}
                />

                {orderedBins.map(({ bin }) => {
                  const status = getBinStatus(bin);
                  const color =
                    status === 'Overflowing'
                      ? '#DC2626'
                      : status === 'Near Full'
                        ? '#D97706'
                        : '#16A34A';

                  return (
                    <AdvancedMarker
                      key={bin.id}
                      position={{ lat: bin.lat, lng: bin.lon }}
                      title={`${bin.code} · ${bin.name} (${bin.fillLevel}% · ${status})`}
                      clickable={true}
                      onClick={() => setSelectedBinId(bin.id)}
                    >
                      <div
                        className="flex items-center justify-center w-6 h-6 rounded-full border-2 border-white text-white font-mono text-[10px] font-bold shadow-md cursor-pointer"
                        style={{ backgroundColor: color }}
                      >
                        {bin.routeOrder}
                      </div>
                    </AdvancedMarker>
                  );
                })}

                <AdvancedMarker
                  position={{ lat: truckCoords[0], lng: truckCoords[1] }}
                  title="GCET EV Collection Vehicle"
                  zIndex={500}
                >
                  <div className="flex items-center justify-center w-9 h-9 rounded-full bg-[#163A2B] border-2 border-white text-[#D8ECE2] font-mono text-[10px] font-bold shadow-lg">
                    EV
                  </div>
                </AdvancedMarker>

                {selectedBin && (
                  <InfoWindow
                    position={{ lat: selectedBin.lat, lng: selectedBin.lon }}
                    maxWidth={220}
                    onCloseClick={() => setSelectedBinId(null)}
                  >
                    <div className="text-xs text-[#0F1F18] space-y-0.5 pr-2">
                      <div className="font-mono font-bold text-[#163A2B]">
                        Stop #{selectedBin.routeOrder} · {selectedBin.code}
                      </div>
                      <div className="font-semibold">{selectedBin.name}</div>
                      <div className="text-[#425A4F]">
                        Status: <strong>{getBinStatus(selectedBin)}</strong> ({selectedBin.fillLevel}
                        %)
                      </div>
                    </div>
                  </InfoWindow>
                )}
              </CampusSatelliteMap>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
