/* pages/devices/page.jsx */
'use client';

import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import Header from '../../components/Header';
import { TbRefresh, TbEye, TbEyeOff } from 'react-icons/tb';
import Loader from '../../components/Loader';

// Cargamos el cliente de mapa sin SSR
const DevicesMap = dynamic(() => import('../../components/DevicesMap'), { 
  ssr: false 
});

export default function DevicesPage() {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [mapKey, setMapKey] = useState(Date.now());
  const [showMarkers, setShowMarkers] = useState(true);
  
  useEffect(() => {
    if (status !== 'loading') setIsLoading(false);
  }, [status]);
  
  const refreshMap = () => {
    setLoading(true);
    setMapKey(Date.now());
    setLastUpdate(new Date());
    setTimeout(() => setLoading(false), 500);
  };

  const toggleMarkers = () => setShowMarkers(prev => !prev);
  
  if (isLoading) return (
      <div className="flex items-center justify-center h-screen">
        <Loader />
      </div>
  );

  if (!session || (session.user.roleId !== 1 && session.user.roleId !== 2)) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 max-w-md bg-white rounded-lg shadow-md">
          <div className="text-red-600 text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-red-600 mb-2">Acceso Denegado</h1>
          <p className="text-gray-600">No tiene los permisos necesarios para acceder a esta sección.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col">
      <Header title="Dispositivos" />
      <div className="pt-20"></div>
      <div className="flex-1 p-4">
        <div className="bg-white rounded-lg shadow-md p-4 h-full relative">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-lg font-medium text-gray-700">Ubicaciones en tiempo real</h2>
              {lastUpdate && (
                <p className="text-xs text-gray-500">Última actualización: {lastUpdate.toLocaleTimeString()}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* Refresh button */}
              <button 
                onClick={refreshMap}
                disabled={loading}
                className={`bg-blue-50 hover:bg-blue-100 text-blue-600 p-2 rounded-full transition-colors flex items-center justify-center ${loading ? 'opacity-50' : ''}`}
                title="Actualizar ubicaciones"
              >
                <TbRefresh size={20} className={loading ? 'animate-spin' : ''} />
              </button>
              {/* Toggle markers button */}
              <button
                onClick={toggleMarkers}
                className="bg-blue-50 hover:bg-blue-100 text-blue-600 p-2 rounded-full flex items-center justify-center"
                title={showMarkers ? "Ocultar marcadores" : "Mostrar marcadores"}
              >
                {showMarkers ? <TbEyeOff size={20} /> : <TbEye size={20} />}
              </button>
            </div>
          </div>

          <div className="h-[calc(100%-4rem)] w-full rounded-lg overflow-hidden border border-gray-200 relative z-0">
            <DevicesMap 
              key={mapKey} 
              forceRefresh={mapKey}
              showMarkers={showMarkers}
            />
          </div>
        </div>
      </div>
    </div>
  );
}