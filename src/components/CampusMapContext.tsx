import React, { createContext, useContext } from 'react';
import {
  APILoadingStatus,
  Map as GoogleMap,
  type MapProps,
  useApiLoadingStatus,
} from '@vis.gl/react-google-maps';
import {
  GCET_BUILDINGS,
  GCET_CAMPUS_BOUNDS,
  GCET_CAMPUS_ROADS,
  GCET_CENTER,
} from '../data/gcetOsmData';

interface MapsAvailabilityContextValue {
  hasApiKey: boolean;
  isResolvingKey: boolean;
}

export const MapsAvailabilityContext = createContext<MapsAvailabilityContextValue>({
  hasApiKey: false,
  isResolvingKey: false,
});

export function useMapsAvailability() {
  return useContext(MapsAvailabilityContext);
}

interface CampusSatelliteMapProps extends Omit<MapProps, 'internalUsageAttributionIds'> {
  children?: React.ReactNode;
  ariaLabel?: string;
}

function projectToSvg(lat: number, lng: number): [number, number] {
  const width = 800;
  const height = 460;
  const x =
    ((lng - GCET_CAMPUS_BOUNDS.west) / (GCET_CAMPUS_BOUNDS.east - GCET_CAMPUS_BOUNDS.west)) *
    width;
  const y =
    ((GCET_CAMPUS_BOUNDS.north - lat) /
      (GCET_CAMPUS_BOUNDS.north - GCET_CAMPUS_BOUNDS.south)) *
    height;
  return [Number(x.toFixed(1)), Number(y.toFixed(1))];
}

export const CampusSatelliteMap: React.FC<CampusSatelliteMapProps> = ({
  children,
  ariaLabel,
  defaultCenter,
  defaultZoom = 17.6,
  ...rest
}) => {
  const { hasApiKey, isResolvingKey } = useMapsAvailability();
  const status = useApiLoadingStatus();

  if (isResolvingKey) {
    return (
      <div
        role="status"
        aria-label={ariaLabel}
        className="w-full h-full flex items-center justify-center bg-[#0F2319] text-[#D7E8DF] text-xs font-medium px-6 text-center"
      >
        Loading Google Maps Satellite Imagery for GCET Campus...
      </div>
    );
  }

  if (!hasApiKey) {
    return (
      <div
        role="region"
        aria-label={ariaLabel}
        className="w-full h-full relative bg-[#0B1F16] overflow-hidden"
      >
        <svg
          viewBox="0 0 800 460"
          preserveAspectRatio="xMidYMid slice"
          className="w-full h-full"
          aria-hidden="true"
        >
          <defs>
            <radialGradient id="gcet-sat-bg" cx="50%" cy="50%" r="70%">
              <stop offset="0%" stopColor="#173828" />
              <stop offset="100%" stopColor="#091811" />
            </radialGradient>
          </defs>
          <rect width="800" height="460" fill="url(#gcet-sat-bg)" />
          {GCET_CAMPUS_ROADS.map((road, idx) => (
            <polyline
              key={`fallback-road-${idx}`}
              fill="none"
              stroke="#38BDF8"
              strokeOpacity="0.65"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={road.map(([lat, lng]) => projectToSvg(lat, lng).join(',')).join(' ')}
            />
          ))}
          {GCET_BUILDINGS.map((bldg) => {
            const [cx, cy] = projectToSvg(bldg.center[0], bldg.center[1]);
            return (
              <g key={`fallback-bldg-${bldg.id}`}>
                <polygon
                  fill="#10B981"
                  fillOpacity="0.24"
                  stroke="#86EFAC"
                  strokeWidth="2"
                  points={bldg.polygon
                    .map(([lat, lng]) => projectToSvg(lat, lng).join(','))
                    .join(' ')}
                />
                <circle cx={cx} cy={cy} r="4" fill="#D8ECE2" />
                <text
                  x={cx}
                  y={cy - 9}
                  textAnchor="middle"
                  fill="#E6F4EC"
                  fontSize="10"
                  fontWeight="600"
                >
                  {bldg.name}
                </text>
              </g>
            );
          })}
        </svg>

        <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-md bg-[#091610]/90 backdrop-blur-sm border border-[#2C5642] rounded-lg px-3.5 py-2.5 text-xs space-y-0.5">
          <div className="font-semibold text-white">
            Google Maps Satellite View (GCET Campus)
          </div>
          <p className="text-[11px] text-[#95C5AC]">
            Showing verified GCET campus topology. Add{' '}
            <code className="font-mono text-[#D8ECE2]">VITE_GOOGLE_MAPS_API_KEY</code> in GitHub
            Repository Secrets to enable live Google Maps satellite tiles.
          </p>
        </div>
      </div>
    );
  }

  if (status === APILoadingStatus.FAILED || status === APILoadingStatus.AUTH_FAILURE) {
    return (
      <div
        role="alert"
        aria-label={ariaLabel}
        className="w-full h-full flex flex-col items-center justify-center bg-[#0F2319] text-[#FCA5A5] text-xs px-6 text-center space-y-1"
      >
        <div className="font-semibold">Unable to load Google Maps satellite view.</div>
        <p className="text-[#D7E8DF]">
          Please check your network connection or Google Maps API quota.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative" aria-label={ariaLabel}>
      <GoogleMap
        mapId="DEMO_MAP_ID"
        mapTypeId="satellite"
        defaultCenter={defaultCenter ?? { lat: GCET_CENTER[0], lng: GCET_CENTER[1] }}
        defaultZoom={defaultZoom}
        minZoom={17}
        maxZoom={21}
        restriction={{
          latLngBounds: GCET_CAMPUS_BOUNDS,
          strictBounds: true,
        }}
        gestureHandling="cooperative"
        mapTypeControl={false}
        streetViewControl={false}
        fullscreenControl={true}
        zoomControl={true}
        internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
        style={{ width: '100%', height: '100%' }}
        {...rest}
      >
        {children}
      </GoogleMap>
    </div>
  );
};
