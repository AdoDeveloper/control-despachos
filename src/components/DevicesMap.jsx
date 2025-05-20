
/* components/DevicesMap.jsx */

'use client';
import { useEffect, useState, useRef } from 'react';
import { 
  MapContainer, TileLayer, Marker, Popup, ZoomControl,
  LayersControl, LayerGroup, useMap 
} from 'react-leaflet';
import { renderToStaticMarkup } from 'react-dom/server';
import { TbMapPin, TbLoader, TbX, TbTarget } from 'react-icons/tb';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const createMarkerIcon = (username, color = 'red') =>
  L.divIcon({
    html: renderToStaticMarkup(
      <div className="marker-container">
        <div className="username-label">{username}</div>
        <TbMapPin size={32} color={color} />
      </div>
    ),
    className: 'custom-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });

function LocationMarker() {
  const [position, setPosition] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isWatching, setIsWatching] = useState(false);
  const map = useMap();
  const watchIdRef = useRef(null);

  useEffect(() => () => stopWatching(), []);

  const stopWatching = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsWatching(false);
  };

  const clearLocation = () => {
    stopWatching();
    setPosition(null);
    setAccuracy(null);
  };

  const locate = () => {
    setIsLocating(true);
    if (navigator.geolocation) {
      stopWatching();
      watchIdRef.current = navigator.geolocation.watchPosition(
        ({ coords }) => {
          const newPos = { lat: coords.latitude, lng: coords.longitude };
          setPosition(newPos);
          setAccuracy(coords.accuracy);
          setIsLocating(false);
          setIsWatching(true);
          map.flyTo(newPos, Math.max(16, map.getZoom()));
        },
        (error) => {
          console.error('Error de geolocalización:', error.message);
          setIsLocating(false);
          alert(`No se pudo obtener tu ubicación: ${error.message}`);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setIsLocating(false);
      alert('Tu navegador no soporta geolocalización');
    }
  };

  return (
    <div className="leaflet-control leaflet-bar fixed bottom-20 right-4 z-[1000] flex flex-col gap-2">
      <button 
        className={`bg-white p-2 rounded-full shadow-md hover:bg-gray-100 ${isLocating ? 'animate-pulse' : ''}`}
        onClick={locate}
        title="Mostrar mi ubicación"
      >
        {isLocating ? <TbLoader className="animate-spin" size={24} /> : <TbTarget size={24} />}
      </button>
      {position && (
        <button 
          className="bg-white p-2 rounded-full shadow-md hover:bg-gray-100"
          onClick={clearLocation}
          title="Borrar mi ubicación"
        >
          <TbX size={24} />
        </button>
      )}
      {position && (
        <>
          <Marker 
            position={position}
            icon={createMarkerIcon('Mi ubicación', '#3388ff')}
          >
            <Popup>
              <div className="text-center">
                <strong>Mi ubicación</strong><br />
                <span className="text-gray-600">{position.lat.toFixed(5)}, {position.lng.toFixed(5)}</span><br />
                <span className="text-xs text-gray-500">Precisión: ±{Math.round(accuracy)} metros</span>
              </div>
            </Popup>
          </Marker>
          <LayerGroup>
            <circle center={position} radius={accuracy} fillColor="#3388ff" fillOpacity={0.15} stroke={false} />
          </LayerGroup>
        </>
      )}
    </div>
  );
}

export default function DevicesMap({ forceRefresh, showMarkers = true }) {
  const [locations, setLocations] = useState([]);
  const mapRef = useRef(null);
  const didMountRef = useRef(false);
  const intervalRef = useRef(null);

  const fetchLocations = async () => {
    try {
      const res = await fetch('/api/device-locations', { cache: 'no-store', next: { revalidate: 0 } });
      if (res.ok) {
        const data = await res.json();
        setLocations(data);
      }
    } catch (err) {
      console.error('Error al cargar ubicaciones:', err);
    }
  };

  useEffect(() => {
    if (didMountRef.current) return;
    didMountRef.current = true;
    fetchLocations();
    intervalRef.current = setInterval(fetchLocations, 30000);
    return () => clearInterval(intervalRef.current);
  }, []);

  useEffect(() => {
    if (forceRefresh) fetchLocations();
  }, [forceRefresh]);

  const center = [13.571609, -89.830624];

  return (
    <div className="h-full w-full relative">
      <MapContainer
        center={center}
        zoom={18}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        ref={mapRef}
      >
        <ZoomControl position="bottomright" />
        <LayersControl position="topright">
          <LayersControl.BaseLayer name="Estándar" checked>
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Satélite">
            <TileLayer
              attribution="&copy; Esri"
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
          </LayersControl.BaseLayer>
        </LayersControl>

        {showMarkers && (
          <LayerGroup>
            {locations.map(loc => (
              <Marker
                key={loc.userId}
                position={[loc.latitude, loc.longitude]}
                icon={createMarkerIcon(loc.user.username)}
              >
                <Popup>
                  <div className="text-center">
                    <strong>{loc.user.username}</strong><br />
                    <span className="text-gray-600">{loc.latitude.toFixed(5)}, {loc.longitude.toFixed(5)}</span>
                    {loc.timestamp && (
                      <><br /><span className="text-xs text-gray-500">{new Date(loc.timestamp).toLocaleString()}</span></>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
          </LayerGroup>
        )}

        <LocationMarker />
      </MapContainer>

      <style jsx global>{`/* global styles and mobile tweaks */
        .custom-marker { background: none; border: none; }
        .marker-container { display: flex; flex-direction: column; align-items: center; }
        .username-label { background: rgba(255,255,255,0.9); padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; margin-bottom: 2px; box-shadow: 0 1px 3px rgba(0,0,0,0.2); }
        .leaflet-popup { z-index: 1000 !important; }
        .leaflet-control { z-index: 900 !important; }
        @media (max-width: 640px) {
          .leaflet-control-layers-toggle { width: 36px !important; height: 36px !important; }
          .leaflet-control-zoom-in, .leaflet-control-zoom-out {
            width: 36px !important; height: 36px !important; line-height: 36px !important; font-size: 18px !important;
          }
          .username-label { font-size: 9px; padding: 1px 4px; }
        }
      `}</style>
    </div>
  );
}