import React, { createContext, useContext } from 'react';
import {
  APILoadingStatus,
  Map as GoogleMap,
  type MapProps,
  useApiLoadingStatus,
} from '@vis.gl/react-google-maps';
import { GCET_CAMPUS_BOUNDS, GCET_CENTER } from '../data/gcetOsmData';

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
        className="w-full h-full flex flex-col items-center justify-center bg-[#0F2319] text-[#D7E8DF] text-xs px-6 text-center space-y-1.5"
      >
        <div className="font-semibold text-white">
          Google Maps Satellite View (GCET Campus)
        </div>
        <p className="text-[#95C5AC] max-w-sm">
          Waiting for Google Maps API key configuration (`VITE_GOOGLE_MAPS_API_KEY`).
        </p>
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
