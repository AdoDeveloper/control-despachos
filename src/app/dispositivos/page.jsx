'use client';

import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import Header from '../../components/Header';
import { TbRefresh } from 'react-icons/tb';

// Cargamos el cliente de mapa sin SSR
const DevicesMap = dynamic(() => import('../../components/DevicesMap'), { 
  ssr: false 
});

export default function DevicesPage() {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [mapKey, setMapKey] = useState(Date.now()); // Clave para forzar recarga del mapa
  
  useEffect(() => {
    if (status !== 'loading') {
      setIsLoading(false);
    }
  }, [status]);
  
  // Función para refrescar datos del mapa
  const refreshMap = async () => {
    setLoading(true);
    try {
      // Forzamos la recarga del componente del mapa cambiando su key
      setMapKey(Date.now());
      setLastUpdate(new Date());
    } finally {
      setTimeout(() => setLoading(false), 500); // Simular tiempo de carga
    }
  };
  
  // Pantalla de carga mientras se verifica la sesión
  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando sistema de monitoreo...</p>
        </div>
      </div>
    );
  }
  
  // Manejo de autorización
  if (!session || session.user.roleId !== 1 && session.user.roleId !== 2) {
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
      <Header title="Monitoreo de Dispositivos" />
      
      {/* Espacio para compensar el header fijo */}
      <div className="pt-20"></div>
      
      <div className="flex-1 p-4">
        <div className="bg-white rounded-lg shadow-md p-4 h-full relative">
          {/* Controles del mapa fuera de DevicesMap */}
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-lg font-medium text-gray-700">Ubicaciones en tiempo real</h2>
              {lastUpdate && (
                <p className="text-xs text-gray-500">
                  Última actualización: {lastUpdate.toLocaleTimeString()}
                </p>
              )}
            </div>
            <button 
              onClick={refreshMap}
              disabled={loading}
              className="bg-blue-50 hover:bg-blue-100 text-blue-600 p-2 rounded-full transition-colors flex items-center gap-2"
              title="Actualizar ubicaciones"
            >
              <TbRefresh 
                size={20}
                className={loading ? 'animate-spin' : ''}
              />
              <span className="text-sm">Actualizar</span>
            </button>
          </div>
          
          {/* Contenedor del mapa con z-index controlado */}
          <div className="h-[calc(100%-4rem)] w-full rounded-lg overflow-hidden border border-gray-200 relative z-0">
            <DevicesMap key={mapKey} disableRefreshButton={true} forceRefresh={mapKey} />
          </div>
        </div>
      </div>
    </div>
  );
}