import React, { useEffect, useRef, useState } from 'react';
import {
  AdvancedMarker,
  InfoWindow,
  Polygon,
  Polyline,
} from '@vis.gl/react-google-maps';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  CLOUD_GATEWAY_POS,
  GCET_BUILDINGS,
  getBinStatus,
} from '../data/gcetOsmData';
import { SmartBin } from '../types/waste';
import { CampusSatelliteMap } from './CampusMapContext';

gsap.registerPlugin(ScrollTrigger);

interface SmartBinDeploymentSectionProps {
  bins: SmartBin[];
}

interface DeploymentChapter {
  stage: 1 | 2 | 3 | 4;
  label: string;
  title: string;
  summary: string;
  metrics: string;
}

const DEPLOYMENT_CHAPTERS: DeploymentChapter[] = [
  {
    stage: 1,
    label: 'Phase 01 · Academic Core',
    title: 'Main Spine & Library Nodes Activate',
    summary:
      'Ultrasonic units go online along Academic Block A and the Central Library turnaround, monitoring paper and dry recyclable volumes during peak class hours.',
    metrics: 'Nodes online: GCET-BIN-101, GCET-BIN-103',
  },
  {
    stage: 2,
    label: 'Phase 02 · Dining & Block B',
    title: 'High-Traffic Food Plaza Coverage',
    summary:
      'Central Canteen Courtyard and CSE/IT Block B sensors activate with thermal odor thresholds to catch rapid lunchtime wet-waste accumulation.',
    metrics: 'Nodes online: GCET-BIN-102, GCET-BIN-105',
  },
  {
    stage: 3,
    label: 'Phase 03 · Hostel & Labs',
    title: 'Full Campus Perimeter Mesh',
    summary:
      'Residential Hostel Wing and Mechanical Workshop stations join the campus map, covering 100% of internal sanitation service roads.',
    metrics: '6 Active Sensor Zones · 100% Campus Mesh',
  },
  {
    stage: 4,
    label: 'Phase 04 · Cloud Telemetry Uplink',
    title: 'Live Links to Block A Cloud Hub',
    summary:
      'Every activated bin establishes an encrypted LoRaWAN uplink to the Academic Block A Cloud Server, streaming fill percentages and battery health.',
    metrics: 'Gateway: 28.4568° N, 77.4982° E · 60s Polling',
  },
];

export const SmartBinDeploymentSection: React.FC<SmartBinDeploymentSectionProps> = ({
  bins,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const [activeStage, setActiveStage] = useState<1 | 2 | 3 | 4>(1);
  const [selectedBinId, setSelectedBinId] = useState<string | null>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      stepRefs.current.forEach((el, idx) => {
        if (!el) return;
        const stage = (idx + 1) as 1 | 2 | 3 | 4;
        ScrollTrigger.create({
          trigger: el,
          start: 'top 55%',
          end: 'bottom 45%',
          onEnter: () => setActiveStage(stage),
          onEnterBack: () => setActiveStage(stage),
        });
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const selectedBin = bins.find((b) => b.id === selectedBinId) ?? null;

  return (
    <section
      id="smart-deployment"
      ref={containerRef}
      className="w-full bg-white py-16 md:py-24 border-b border-[#DCE8E1]"
    >
      <div className="max-w-[1280px] mx-auto px-6">
        <div className="max-w-2xl mb-12 space-y-2">
          <p className="font-mono text-xs font-medium text-[#2D6A4F]">
            SECTION 03 · SCROLL-DRIVEN SENSOR ROLLOUT
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-[#0F1F18] tracking-tight">
            Smart Bin Deployment Across Campus
          </h2>
          <p className="text-sm md:text-base text-[#3D574A]">
            Scroll through each deployment wave to activate campus markers on satellite imagery and
            animate telemetry uplinks to the Block A cloud hub.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-5 space-y-5">
            {DEPLOYMENT_CHAPTERS.map((chapter, index) => {
              const isCurrent = activeStage === chapter.stage;
              return (
                <button
                  type="button"
                  key={chapter.stage}
                  ref={(el) => {
                    stepRefs.current[index] = el;
                  }}
                  onClick={() => setActiveStage(chapter.stage)}
                  aria-pressed={isCurrent}
                  className={`w-full text-left p-6 rounded-xl border transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#163A2B] ${
                    isCurrent
                      ? 'bg-[#EDF7F1] border-[#163A2B] shadow-xs'
                      : 'bg-white border-[#DCE8E1] hover:border-[#8AB8A0]'
                  }`}
                >
                  <div className="font-mono text-xs font-semibold text-[#2D6A4F]">
                    {chapter.label}
                  </div>
                  <h3 className="font-display text-lg font-bold text-[#0F1F18] mt-1.5">
                    {chapter.title}
                  </h3>
                  <p className="text-sm text-[#3D574A] leading-relaxed mt-2">
                    {chapter.summary}
                  </p>
                  <div className="mt-3 pt-3 border-t border-[#D2E4DA] font-mono text-xs text-[#163A2B] tabular-nums">
                    {chapter.metrics}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="lg:col-span-7 lg:sticky lg:top-20">
            <div className="bg-white border border-[#D2E2D9] rounded-xl overflow-hidden shadow-xs">
              <div className="px-4 py-3 bg-[#152D22] text-white flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-semibold">
                  Active Stage 0{activeStage} · {DEPLOYMENT_CHAPTERS[activeStage - 1].title}
                </span>
                <span className="font-mono text-[#B8DEC9] tabular-nums">
                  {activeStage === 4
                    ? 'Cloud Links Streaming'
                    : `${Math.min(6, activeStage * 2)} / 6 Bins Active`}
                </span>
              </div>

              <div className="w-full h-[380px] sm:h-[440px] md:h-[520px]">
                <CampusSatelliteMap
                  id="smart-deployment-map"
                  ariaLabel="Scroll-triggered smart bin deployment satellite map across GCET campus"
                >
                  {GCET_BUILDINGS.map((bldg) => (
                    <Polygon
                      key={bldg.id}
                      paths={bldg.polygon.map(([lat, lng]) => ({ lat, lng }))}
                      strokeColor="#86EFAC"
                      strokeOpacity={0.55}
                      strokeWeight={1}
                      fillColor="#22C55E"
                      fillOpacity={0.12}
                    />
                  ))}

                  {activeStage >= 4 &&
                    bins.map((bin) => (
                      <Polyline
                        key={`uplink-${bin.id}`}
                        path={[
                          { lat: bin.lat, lng: bin.lon },
                          { lat: CLOUD_GATEWAY_POS[0], lng: CLOUD_GATEWAY_POS[1] },
                        ]}
                        strokeColor="#38BDF8"
                        strokeOpacity={0}
                        icons={[
                          {
                            icon: {
                              path: 'M 0,-1 0,1',
                              strokeOpacity: 0.95,
                              strokeColor: '#38BDF8',
                              scale: 2.5,
                            },
                            offset: '0',
                            repeat: '12px',
                          },
                        ]}
                      />
                    ))}

                  <AdvancedMarker
                    position={{ lat: CLOUD_GATEWAY_POS[0], lng: CLOUD_GATEWAY_POS[1] }}
                    title="GCET Cloud Server & LoRaWAN Gateway (Block A)"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#0F172A] border-2 border-[#D8ECE2] text-white font-mono text-[10px] font-bold shadow-lg">
                      HUB
                    </div>
                  </AdvancedMarker>

                  {bins.map((bin) => {
                    const isActivated = activeStage >= 3 || bin.deploymentStage <= activeStage;
                    if (!isActivated) {
                      return (
                        <AdvancedMarker
                          key={bin.id}
                          position={{ lat: bin.lat, lng: bin.lon }}
                          title={`${bin.code} · Pending activation`}
                        >
                          <div className="w-3 h-3 rounded-full bg-[#CBD5E1] border border-[#64748B] opacity-80" />
                        </AdvancedMarker>
                      );
                    }

                    const status = getBinStatus(bin);
                    const pinColor =
                      status === 'Overflowing'
                        ? '#DC2626'
                        : status === 'Near Full'
                          ? '#D97706'
                          : '#16A34A';

                    return (
                      <AdvancedMarker
                        key={bin.id}
                        position={{ lat: bin.lat, lng: bin.lon }}
                        title={`${bin.code} · ${bin.name} (${bin.fillLevel}%)`}
                        clickable={true}
                        onClick={() => setSelectedBinId(bin.id)}
                      >
                        <div className="relative w-7 h-7 flex items-center justify-center cursor-pointer">
                          <span
                            className="bin-radar-ring absolute inset-0 rounded-full opacity-45"
                            style={{ backgroundColor: pinColor }}
                          />
                          <span
                            className="relative w-4 h-4 rounded-full border-2 border-white shadow-md"
                            style={{ backgroundColor: pinColor }}
                          />
                        </div>
                      </AdvancedMarker>
                    );
                  })}

                  {selectedBin && (
                    <InfoWindow
                      position={{ lat: selectedBin.lat, lng: selectedBin.lon }}
                      maxWidth={220}
                      onCloseClick={() => setSelectedBinId(null)}
                    >
                      <div className="text-xs text-[#0F1F18] space-y-0.5 pr-2">
                        <div className="font-mono font-bold text-[#163A2B]">
                          {selectedBin.code}
                        </div>
                        <div className="font-semibold">{selectedBin.name}</div>
                        <div className="text-[#425A4F]">
                          Fill: <strong>{selectedBin.fillLevel}%</strong> · {selectedBin.stream}
                        </div>
                      </div>
                    </InfoWindow>
                  )}
                </CampusSatelliteMap>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
