'use client';

import { useEffect, useRef, useState } from 'react';
import Map, { Marker, Popup, NavigationControl, GeolocateControl } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface MapViewProps {
  selectedCounty: string | null;
  onCountySelect: (countyId: string) => void;
}

interface County {
  id: string;
  name: string;
  state: string;
  latitude: number;
  longitude: number;
  medianHomePrice?: number;
  medianRent?: number;
}

export function MapView({ selectedCounty, onCountySelect }: MapViewProps) {
  const mapRef = useRef(null);
  const [viewState, setViewState] = useState({
    longitude: -98.5795,
    latitude: 39.8283,
    zoom: 4,
  });
  const [popupInfo, setPopupInfo] = useState<County | null>(null);

  const { data: counties, isLoading } = useQuery({
    queryKey: ['counties-map'],
    queryFn: async () => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/housing/counties`);
      if (!response.ok) throw new Error('Failed to fetch counties');
      return response.json();
    },
  });

  useEffect(() => {
    if (selectedCounty && counties) {
      const county = counties.find((c: County) => c.id === selectedCounty);
      if (county && county.latitude && county.longitude) {
        setViewState({
          longitude: county.longitude,
          latitude: county.latitude,
          zoom: 8,
        });
      }
    }
  }, [selectedCounty, counties]);

  if (isLoading) {
    return <Skeleton className="h-[600px] w-full" />;
  }

  // Mock data for demonstration - in production, this would come from the API
  const mockCounties: County[] = counties?.slice(0, 50).map((county: any) => ({
    ...county,
    latitude: county.latitude || 39.8283 + (Math.random() - 0.5) * 20,
    longitude: county.longitude || -98.5795 + (Math.random() - 0.5) * 40,
    medianHomePrice: Math.floor(Math.random() * 500000) + 200000,
    medianRent: Math.floor(Math.random() * 2000) + 1000,
  })) || [];

  const getMarkerColor = (price: number) => {
    if (price < 300000) return '#10b981'; // green
    if (price < 500000) return '#f59e0b'; // amber
    return '#ef4444'; // red
  };

  return (
    <div className="relative h-[600px] w-full rounded-lg overflow-hidden">
      <Map
        ref={mapRef}
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        mapStyle="mapbox://styles/mapbox/light-v11"
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 'demo-token'}
        interactiveLayerIds={['counties']}
      >
        <NavigationControl position="top-right" />
        <GeolocateControl position="top-right" />

        {mockCounties.map((county) => (
          <Marker
            key={county.id}
            longitude={county.longitude}
            latitude={county.latitude}
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              setPopupInfo(county);
              onCountySelect(county.id);
            }}
          >
            <div
              className="cursor-pointer transform hover:scale-110 transition-transform"
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                backgroundColor: getMarkerColor(county.medianHomePrice || 0),
                border: '2px solid white',
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
              }}
            />
          </Marker>
        ))}

        {popupInfo && (
          <Popup
            anchor="top"
            longitude={popupInfo.longitude}
            latitude={popupInfo.latitude}
            onClose={() => setPopupInfo(null)}
            closeButton={true}
            closeOnClick={false}
          >
            <Card className="border-0 shadow-none">
              <CardContent className="p-3">
                <div className="space-y-2">
                  <div>
                    <h3 className="font-semibold text-lg">
                      {popupInfo.name}, {popupInfo.state}
                    </h3>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Median Home Price:</span>
                      <Badge variant="outline">
                        ${(popupInfo.medianHomePrice || 0).toLocaleString()}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Median Rent:</span>
                      <Badge variant="outline">
                        ${(popupInfo.medianRent || 0).toLocaleString()}/mo
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Popup>
        )}
      </Map>

      <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg">
        <div className="text-sm font-medium mb-2">Price Legend</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500"></div>
            <span className="text-xs">Under $300k</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-amber-500"></div>
            <span className="text-xs">$300k - $500k</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-500"></div>
            <span className="text-xs">Over $500k</span>
          </div>
        </div>
      </div>
    </div>
  );
}
