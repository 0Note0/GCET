import React, { useEffect, useState } from 'react';
import {
  AdvancedMarker,
  InfoWindow,
  Polygon,
  Polyline,
  useAdvancedMarkerRef,
  useMap,
} from '@vis.gl/react-google-maps';
import { Compass, LocateFixed, MapPin, RotateCcw } from 'lucide-react';
import {
  GCET_BUILDINGS,
  GCET_CAMPUS_ROADS,
  GCET_CENTER,
  haversineDistanceKm,
} from '../data/gcetOsmData';
import { CampusBuildingFeature } from '../types/waste';
import { CampusSatelliteMap } from './CampusMapContext';

const CAMPUS_OVERVIEW_MAP_ID = 'campus-overview-map';

interface CameraSyncProps {
  selectedBuilding: CampusBuildingFeature;
  recenterSignal: number;
  userPosition: { lat: number; lng: number } | null;
}

const CampusCameraSync: React.FC<CameraSyncProps> = ({
  selectedBuilding,
  recenterSignal,
  userPosition,
}) => {
  const map = useMap(CAMPUS_OVERVIEW_MAP_ID);

  useEffect(() => {
    if (!map) return;
    map.panTo({
      lat: selectedBuilding.center[0],
      lng: selectedBuilding.center[1],
    });
  }, [map, selectedBuilding]);

  useEffect(() => {
    if (!map || recenterSignal === 0) return;
    map.panTo({ lat: GCET_CENTER[0], lng: GCET_CENTER[1] });
    map.setZoom(17.6);
  }, [map, recenterSignal]);

  useEffect(() => {
    if (!map || !userPosition) return;
    map.panTo(userPosition);
    map.setZoom(18);
  }, [map, userPosition]);

  return null;
};

export const CampusOverviewMap: React.FC = () => {
  const [selectedBuilding, setSelectedBuilding] = useState<CampusBuildingFeature>(
    GCET_BUILDINGS[0]
  );
  const [infoOpen, setInfoOpen] = useState(true);
  const [recenterSignal, setRecenterSignal] = useState(0);
  const [userPosition, setUserPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [markerRef, selectedMarker] = useAdvancedMarkerRef();

  const [geoStatus, setGeoStatus] = useState<{
    state: 'idle' | 'locating' | 'located' | 'denied';
    message: string;
  }>({
    state: 'idle',
    message: 'Locked strictly to GCET Greater Noida campus satellite view.',
  });

  const handleSelectBuilding = (bldg: CampusBuildingFeature) => {
    setSelectedBuilding(bldg);
    setInfoOpen(true);
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setGeoStatus({
        state: 'denied',
        message: 'Browser geolocation unavailable. Showing GCET campus satellite map.',
      });
      return;
    }

    setGeoStatus({ state: 'locating', message: 'Detecting device GPS coordinates...' });

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userLat = pos.coords.latitude;
        const userLon = pos.coords.longitude;
        const distKm = haversineDistanceKm(userLat, userLon, GCET_CENTER[0], GCET_CENTER[1]);

        if (distKm <= 0.6) {
          setUserPosition({ lat: userLat, lng: userLon });
        } else {
          setUserPosition(null);
          setRecenterSignal((n) => n + 1);
        }

        setGeoStatus({
          state: 'located',
          message:
            distKm <= 0.6
              ? `Inside GCET Campus (${userLat.toFixed(4)}° N, ${userLon.toFixed(4)}° E)`
              : `Outside campus perimeter · Map locked strictly to GCET grounds.`,
        });
      },
      () => {
        setGeoStatus({
          state: 'denied',
          message: 'Location permission declined. Showing verified GCET campus grounds.',
        });
      },
      { timeout: 6000 }
    );
  };

  return (
    <section
      id="campus-overview"
      className="w-full bg-[#F7FBF9] py-16 md:py-24 border-b border-[#DCE8E1]"
    >
      <div className="max-w-[1280px] mx-auto px-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
          <div className="space-y-2 max-w-2xl">
            <p className="font-mono text-xs font-medium text-[#2D6A4F] tabular-nums">
              SECTION 02 · GOOGLE MAPS SATELLITE TOPOLOGY
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-[#0F1F18] tracking-tight">
              GCET Greater Noida Campus Overview
            </h2>
            <p className="text-sm md:text-base text-[#3D574A] leading-relaxed">
              High-resolution Google Maps satellite imagery strictly scoped to GCET campus
              grounds—academic blocks, student hostels, central canteen, sports courts, and internal
              service lanes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleDetectLocation}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#163A2B] rounded-md hover:bg-[#0F2A1F] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#163A2B]"
            >
              <LocateFixed className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Detect Campus Location</span>
            </button>

            <button
              type="button"
              onClick={() => setRecenterSignal((n) => n + 1)}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium text-[#163A2B] bg-white border border-[#C9DBD1] rounded-md hover:bg-[#EDF4F0] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#163A2B]"
            >
              <RotateCcw className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>Recenter Campus</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-8 flex flex-col bg-white border border-[#D2E2D9] rounded-xl overflow-hidden shadow-xs">
            <div className="px-4 py-3 border-b border-[#E5EFEA] flex flex-wrap items-center justify-between gap-2 text-xs text-[#3D574A]">
              <div className="flex items-center gap-2 font-medium text-[#152D22]">
                <Compass className="w-4 h-4 text-[#163A2B] shrink-0" aria-hidden="true" />
                <span>{geoStatus.message}</span>
              </div>
              <span className="font-mono text-[11px] text-[#546E61] tabular-nums">
                Satellite View · Campus Perimeter Only
              </span>
            </div>

            <div className="w-full h-[380px] sm:h-[440px] md:h-[490px]">
              <CampusSatelliteMap
                id={CAMPUS_OVERVIEW_MAP_ID}
                ariaLabel="Google Maps satellite view strictly scoped to Galgotias College of Engineering and Technology campus"
              >
                <CampusCameraSync
                  selectedBuilding={selectedBuilding}
                  recenterSignal={recenterSignal}
                  userPosition={userPosition}
                />

                {GCET_CAMPUS_ROADS.map((roadCoords, index) => (
                  <Polyline
                    key={`campus-road-${index}`}
                    path={roadCoords.map(([lat, lng]) => ({ lat, lng }))}
                    strokeColor="#38BDF8"
                    strokeOpacity={0.85}
                    strokeWeight={3}
                  />
                ))}

                {GCET_BUILDINGS.map((bldg) => {
                  const isSelected = selectedBuilding.id === bldg.id;
                  return (
                    <Polygon
                      key={bldg.id}
                      paths={bldg.polygon.map(([lat, lng]) => ({ lat, lng }))}
                      strokeColor={isSelected ? '#FDE047' : '#86EFAC'}
                      strokeOpacity={isSelected ? 1 : 0.75}
                      strokeWeight={isSelected ? 3 : 1.5}
                      fillColor={isSelected ? '#22C55E' : '#10B981'}
                      fillOpacity={isSelected ? 0.34 : 0.14}
                      clickable={true}
                      onClick={() => handleSelectBuilding(bldg)}
                    />
                  );
                })}

                <AdvancedMarker
                  ref={markerRef}
                  position={{
                    lat: selectedBuilding.center[0],
                    lng: selectedBuilding.center[1],
                  }}
                  title={selectedBuilding.name}
                  clickable={true}
                  onClick={() => setInfoOpen(true)}
                >
                  <div className="px-2 py-1 rounded bg-[#0F2319]/95 border border-[#86EFAC] text-white text-[11px] font-semibold shadow-md whitespace-nowrap">
                    {selectedBuilding.name}
                  </div>
                </AdvancedMarker>

                {infoOpen && selectedMarker && (
                  <InfoWindow
                    anchor={selectedMarker}
                    maxWidth={220}
                    onCloseClick={() => setInfoOpen(false)}
                  >
                    <div className="text-xs text-[#0F1F18] space-y-0.5 pr-2">
                      <div className="font-bold">{selectedBuilding.name}</div>
                      <div className="text-[#425A4F]">{selectedBuilding.category}</div>
                      <div className="font-mono text-[11px] text-[#2D6A4F] tabular-nums">
                        {selectedBuilding.center[0].toFixed(5)}°N,{' '}
                        {selectedBuilding.center[1].toFixed(5)}°E
                      </div>
                    </div>
                  </InfoWindow>
                )}

                {userPosition && (
                  <AdvancedMarker position={userPosition} title="Your Campus Location">
                    <div className="w-4 h-4 rounded-full bg-[#2563EB] border-2 border-white shadow-md" />
                  </AdvancedMarker>
                )}
              </CampusSatelliteMap>
            </div>
          </div>

          <div className="lg:col-span-4 bg-white border border-[#D2E2D9] rounded-xl p-5 flex flex-col justify-between">
            <div>
              <h3 className="font-display text-base font-bold text-[#0F1F18]">
                GCET Campus Buildings &amp; Zones
              </h3>
              <p className="text-xs text-[#546E61] mt-1 mb-4">
                Select any building footprint to focus the Google Maps satellite view.
              </p>

              <div className="divide-y divide-[#EDF4F0]">
                {GCET_BUILDINGS.map((bldg) => {
                  const isActive = selectedBuilding.id === bldg.id;
                  return (
                    <button
                      key={bldg.id}
                      type="button"
                      onClick={() => handleSelectBuilding(bldg)}
                      className={`w-full py-2.5 px-3 text-left flex items-start justify-between gap-3 rounded-md transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#163A2B] ${
                        isActive ? 'bg-[#E9F4EE]' : 'hover:bg-[#F7FBF9]'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-[#152D22] truncate">
                          {bldg.name}
                        </div>
                        <div className="text-[11px] text-[#546E61] mt-0.5">{bldg.category}</div>
                      </div>
                      <span className="font-mono text-[11px] text-[#2D6A4F] tabular-nums shrink-0">
                        {bldg.center[0].toFixed(4)}°N
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#E5EFEA] flex items-center justify-between text-xs text-[#425A4F]">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#163A2B]" aria-hidden="true" />
                <span>GCET Plot No. 1 Campus Perimeter</span>
              </span>
              <span className="font-mono text-[11px] tabular-nums">77.4975° E</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
