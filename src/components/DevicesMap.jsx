// src/app/dispositivos/DevicesMap.jsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from 'react-leaflet';
import { renderToStaticMarkup } from 'react-dom/server';
import { TbMapPin } from 'react-icons/tb';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Configurar icono personalizado con React-Icons
const createMarkerIcon = (username) =>
  L.divIcon({
    html: renderToStaticMarkup(
      <div className="marker-container">
        <div className="username-label">{username}</div>
        <TbMapPin size={32} color="red" />
      </div>
    ),
    className: 'custom-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });

export default function DevicesMap({ forceRefresh }) {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);

  // referencia para evitar doble fetch en React Strict Mode
  const didMountRef = useRef(false);

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/device-locations');
      if (res.ok) {
        setLocations(await res.json());
      }
    } catch (err) {
      console.error('Error al cargar ubicaciones:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (didMountRef.current) return;       // si ya montamos, no volvemos a fetch
    didMountRef.current = true;

    // carga inicial y polling
    fetchLocations();
    const iv = setInterval(fetchLocations, 30_000);
    return () => clearInterval(iv);
  }, []);

  // forzar actualización externa sin duplicar
  const lastForceRef = useRef(forceRefresh);
  useEffect(() => {
    if (forceRefresh && forceRefresh !== lastForceRef.current) {
      lastForceRef.current = forceRefresh;
      fetchLocations();
    }
  }, [forceRefresh]);

  // Centro fijo en Almacenadora ALMAPAC
  const center = [13.571609, -89.830624];

  return (
    <div className="h-full w-full relative">
      {loading && (
        <div className="absolute top-2 right-2 bg-white p-1 rounded shadow">
          Cargando…
        </div>
      )}
      <MapContainer
        center={center}
        zoom={18}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ZoomControl position="bottomright" />

        {locations.map((loc) => (
          <Marker
            key={loc.userId}
            position={[loc.latitude, loc.longitude]}
            icon={createMarkerIcon(loc.user.username)}
          >
            <Popup>
              <div className="text-center">
                <strong>{loc.user.username}</strong>
                <br />
                <span className="text-gray-600">
                  {loc.latitude.toFixed(5)}, {loc.longitude.toFixed(5)}
                </span>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <style jsx global>{`
        .custom-marker {
          background: none;
          border: none;
        }
        .marker-container {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .username-label {
          background: rgba(255, 255, 255, 0.9);
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: bold;
          margin-bottom: 2px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
        }
        .leaflet-popup {
          z-index: 1000 !important;
        }
        .leaflet-control {
          z-index: 900 !important;
        }
      `}</style>
    </div>
  );
}