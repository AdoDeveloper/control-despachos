// pages/page.jsx
'use client';

import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react';
import { useEffect, useState, useRef } from 'react';
import Swal from 'sweetalert2';
import { supabase } from '../../lib/supabaseClient';
import {
  FiPlus,
  FiX,
  FiEye,
  FiCheck,
  FiPlay,
  FiCheckCircle,
  FiTruck,
  FiInbox,
  FiClock,
} from 'react-icons/fi';
import Header from '../components/Header';

// Cargar react-select dinámicamente para evitar problemas SSR
const Select = dynamic(() => import('react-select'), { ssr: false });

// Opciones de puntos de despacho
const puntoDespachoOptions = [
  {
    label: "Bodegas",
    options: [
      { value: "BODEGA 1 PUERTA 1", label: "BODEGA 1 PUERTA 1" },
      { value: "BODEGA 1 PUERTA 2", label: "BODEGA 1 PUERTA 2" },
      { value: "BODEGA 1 PUERTA 3", label: "BODEGA 1 PUERTA 3" },
      { value: "BODEGA 2 PUERTA 1", label: "BODEGA 2 PUERTA 1" },
      { value: "BODEGA 2 PUERTA 2", label: "BODEGA 2 PUERTA 2" },
      { value: "BODEGA 3 PUERTA 1", label: "BODEGA 3 PUERTA 1" },
      { value: "BODEGA 3 PUERTA 2", label: "BODEGA 3 PUERTA 2" },
      { value: "BODEGA 3 SISTEMA", label: "BODEGA 3 SISTEMA" },
      { value: "BODEGA 4 PUERTA 1", label: "BODEGA 4 PUERTA 1" },
      { value: "BODEGA 4 PUERTA 3", label: "BODEGA 4 PUERTA 3" },
      { value: "BODEGA 5 PUERTA 1", label: "BODEGA 5 PUERTA 1" },
      { value: "BODEGA 6 PUERTA 3", label: "BODEGA 6 PUERTA 3" },
    ],
  },
  {
    label: "Silos",
    options: [
      { value: "SILO 1 GRAVEDAD", label: "SILO 1 GRAVEDAD" },
      { value: "SILO 1 SISTEMA", label: "SILO 1 SISTEMA" },
      { value: "SILO 1 CADENA MOVIL", label: "SILO 1 CADENA MOVIL" },
      { value: "SILO 2 GRAVEDAD", label: "SILO 2 GRAVEDAD" },
      { value: "SILO 2 SISTEMA", label: "SILO 2 SISTEMA" },
      { value: "SILO 2 CADENA MOVIL", label: "SILO 2 CADENA MOVIL" },
      { value: "SILO 3 GRAVEDAD", label: "SILO 3 GRAVEDAD" },
      { value: "SILO 3 SISTEMA", label: "SILO 3 SISTEMA" },
      { value: "SILO 3 CADENA MOVIL", label: "SILO 3 CADENA MOVIL" },
      { value: "SILO 4 GRAVEDAD", label: "SILO 4 GRAVEDAD" },
      { value: "SILO 4 SISTEMA", label: "SILO 4 SISTEMA" },
      { value: "SILO 4 CADENA MOVIL", label: "SILO 4 CADENA MOVIL" },
      { value: "SILO 5 SISTEMA", label: "SILO 5 SISTEMA" },
      { value: "SILO 6 SISTEMA", label: "SILO 6 SISTEMA" },
      { value: "SILO 7 SISTEMA INDIVIDUAL", label: "SILO 7 SISTEMA INDIVIDUAL" },
      { value: "SILO 7 SISTEMA", label: "SILO 7 SISTEMA" },
      { value: "SILO 8 SISTEMA INDIVIDUAL", label: "SILO 8 SISTEMA INDIVIDUAL" },
      { value: "SILO 8 SISTEMA", label: "SILO 8 SISTEMA" },
      { value: "SILO 9 GRAVEDAD", label: "SILO 9 GRAVEDAD" },
      { value: "SILO 9 SISTEMA", label: "SILO 9 SISTEMA" },
      { value: "SILO 10 SISTEMA", label: "SILO 10 SISTEMA" },
      { value: "SILO 11 SISTEMA", label: "SILO 11 SISTEMA" },
      { value: "SILO 12 SISTEMA", label: "SILO 12 SISTEMA" },
      { value: "SILO 13 SISTEMA", label: "SILO 13 SISTEMA" },
      { value: "SILO 14 SISTEMA", label: "SILO 14 SISTEMA" },
      { value: "SILO 15 SISTEMA", label: "SILO 15 SISTEMA" },
      { value: "SILO 16 SISTEMA", label: "SILO 16 SISTEMA" },
      { value: "SILO 17 SISTEMA", label: "SILO 17 SISTEMA" },
    ],
  },
  {
    label: "Modulos",
    options: [
      { value: "MODULO 1", label: "MODULO 1" },
      { value: "MODULO 2", label: "MODULO 2" },
      { value: "MODULO 3", label: "MODULO 3" },
    ],
  },
];

export default function DashboardPage() {
  const { data: session, status } = useSession({ required: true });

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <p className="text-lg">Cargando...</p>
      </div>
    );
  }
  if (!session?.user) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <p className="text-lg">No autenticado</p>
      </div>
    );
  }

  return <DashboardCore user={session.user} />;
}

function DashboardCore({ user }) {
  const { id: userId, username, roleId, roleName } = user;
  const [sessionId, setSessionId] = useState(null);
  const [despachos, setDespachos] = useState([]);
  const [enlonadores, setEnlonadores] = useState([]);

  const [showAdd, setShowAdd] = useState(false);
  const [selectedPunto, setSelectedPunto] = useState(null);
  const [placa, setPlaca] = useState('');

  const [showAssign, setShowAssign] = useState(false);
  const [assignId, setAssignId] = useState(null);
  const [selEnlon, setSelEnlon] = useState('');

  const [showDetail, setShowDetail] = useState(false);
  const [detail, setDetail] = useState(null);

  const [filterMine, setFilterMine] = useState(false);
  const [filterAssigned, setFilterAssigned] = useState(false);
  const [dateFilter, setDateFilter] = useState('');

  // Ref para suprimir notifs de realtime tras manual
  const suppressRealtime = useRef(false);

  // Cargar filtros desde localStorage
  useEffect(() => {
    const storedDate = localStorage.getItem('dateFilter');
    const storedMine = localStorage.getItem('filterMine');
    const storedAssigned = localStorage.getItem('filterAssigned');
    if (storedDate) setDateFilter(storedDate);
    if (storedMine) setFilterMine(storedMine === 'true');
    if (storedAssigned) setFilterAssigned(storedAssigned === 'true');
  }, []);

  // Persistir filtros en localStorage
  useEffect(() => {
    localStorage.setItem('dateFilter', dateFilter);
  }, [dateFilter]);

  useEffect(() => {
    localStorage.setItem('filterMine', filterMine.toString());
  }, [filterMine]);

  useEffect(() => {
    localStorage.setItem('filterAssigned', filterAssigned.toString());
  }, [filterAssigned]);

  const estadoStyles = {
    PENDIENTE: 'bg-yellow-100 text-yellow-800',
    ACEPTADO: 'bg-blue-100 text-blue-800',
    EN_PROCESO: 'bg-orange-100 text-orange-800',
    COMPLETADO: 'bg-green-100 text-green-800',
  };
  const formatEstado = (e) => {
    const lower = e.toLowerCase().replace(/_/g, ' ');
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  };

  const syncPermission = () => {
    const perm = Notification.permission;
    localStorage.setItem('push-permission', perm);
    return perm;
  };

  // Verificar permisos y registrar SW
  useEffect(() => {
    const perm = Notification.permission;
    if (perm !== 'granted') {
      Swal.fire({
        icon: 'warning',
        title: 'Permisos de notificación',
        text: 'Por favor habilita las notificaciones para recibir alertas de nuevos despachos.',
        confirmButtonText: 'Habilitar',
      }).then((result) => {
        if (result.isConfirmed) {
          Notification.requestPermission().then(syncPermission);
        }
      });
    } else if (perm === 'denied') {
      Swal.fire({
        icon: 'error',
        title: 'Permisos de notificación',
        text: 'Las notificaciones del sitio están deshabilitadas. Por favor habilítalas en la configuración del navegador.',
      });
    }
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(console.error);
    }
  }, []);

  // Upsert sesión en Supabase
  useEffect(() => {
    if (!userId) return;
    supabase
      .from('user_sessions_supabase')
      .upsert(
        {
          external_user_id: userId,
          username,
          role_id: roleId,
          role_name: roleName,
          status: 'online',
          last_active: new Date().toISOString(),
        },
        { onConflict: 'external_user_id' }
      )
      .select('id')
      .single()
      .then(({ data }) => setSessionId(data.id))
      .catch(console.error);
  }, [userId, username, roleId, roleName]);

  // Carga lista de enlonadores
  useEffect(() => {
    supabase
      .from('user_sessions_supabase')
      .select('id,username')
      .eq('role_id', 4)
      .then(({ data }) => setEnlonadores(data))
      .catch(console.error);
  }, []);

  // Fetch despachos con filtros
  const fetchDespachos = () => {
    let q = supabase.from('despachos').select(`
      id,
      punto_despacho,
      placa_cabezal,
      estado,
      fecha_registro,
      fecha_aceptacion,
      fecha_en_proceso,
      fecha_completado,
      operador_bascula_id,
      supervisor_despacho_id,
      enlonador_id,
      operador:user_sessions_supabase!despachos_operador_bascula_id_fkey(username),
      supervisor:user_sessions_supabase!despachos_supervisor_despacho_id_fkey(username),
      enlonador:user_sessions_supabase!despachos_enlonador_id_fkey(username)
    `);

    if (dateFilter) {
      const start = new Date(`${dateFilter}T00:00:00`);
      const next = new Date(start);
      next.setDate(start.getDate() + 1);
      q = q.gte('fecha_registro', start.toISOString()).lt(
        'fecha_registro',
        next.toISOString()
      );
    }
    if (roleId === 3 && filterMine) {
      q = q.eq('operador_bascula_id', sessionId);
    }
    if (roleId === 2 && filterAssigned) {
      q = q.eq('supervisor_despacho_id', sessionId);
    }
    if (roleId === 4) {
      q = q.eq('enlonador_id', sessionId);
    }

    q.order('fecha_registro', { ascending: false })
      .then(({ data }) => setDespachos(data || []))
      .catch(console.error);
  };
  useEffect(() => {
    if (sessionId) fetchDespachos();
  }, [sessionId, roleId, filterMine, filterAssigned, dateFilter]);

  // Realtime subscriptions
  useEffect(() => {
    if (!sessionId) return;
    const channel = supabase
      .channel('despachos_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'despachos' },
        ({ new: row }) => {
          fetchDespachos();
          if (!suppressRealtime.current && Notification.permission === 'granted') {
            navigator.serviceWorker.ready
              .then((reg) =>
                reg.showNotification('Nuevo despacho', {
                  body: row.punto_despacho,
                  icon: '/favicon.ico',
                })
              )
              .catch(() =>
                new Notification('Nuevo despacho', {
                  body: row.punto_despacho,
                })
              );
            Swal.fire({
              icon: 'info',
              title: 'Nuevo despacho',
              text: row.punto_despacho,
              timer: 2000,
              showConfirmButton: false,
            });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'despachos' },
        ({ old, new: row }) => {
          fetchDespachos();
          if (!suppressRealtime.current && old.estado !== row.estado) {
            const estadoTexto = formatEstado(row.estado);
            navigator.serviceWorker.ready
              .then((reg) =>
                reg.showNotification('Estado actualizado', {
                  body: `${row.punto_despacho} → ${estadoTexto}`,
                  icon: '/favicon.ico',
                })
              )
              .catch(() =>
                new Notification('Estado actualizado', {
                  body: `${row.punto_despacho} → ${estadoTexto}`,
                })
              );
            Swal.fire({
              icon: 'info',
              title: 'Estado actualizado',
              text: `${row.punto_despacho} → ${estadoTexto}`,
              timer: 2000,
              showConfirmButton: false,
            });
          }
          if (!suppressRealtime.current && old.enlonador_id !== row.enlonador_id) {
            navigator.serviceWorker.ready
              .then((reg) =>
                reg.showNotification('Asignación modificada', {
                  body: row.punto_despacho,
                  icon: '/favicon.ico',
                })
              )
              .catch(() =>
                new Notification('Asignación modificada', {
                  body: row.punto_despacho,
                })
              );
            Swal.fire({
              icon: 'info',
              title: 'Asignación modificada',
              text: row.punto_despacho,
              timer: 2000,
              showConfirmButton: false,
            });
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [sessionId, roleId, filterMine, filterAssigned, dateFilter]);

  // Handlers CRUD con notificaciones manuales
  const openAdd = () => {
    setSelectedPunto(null);
    setPlaca('');
    setShowAdd(true);
  };
  const closeAdd = () => setShowAdd(false);
  const saveAdd = async (e) => {
    e.preventDefault();
    if (!selectedPunto) {
      Swal.fire('Error', 'Selecciona un punto de despacho', 'error');
      return;
    }
    suppressRealtime.current = true;
    const { data, error } = await supabase
      .from('despachos')
      .insert([
        {
          punto_despacho: selectedPunto.value,
          placa_cabezal: placa,
          operador_bascula_id: sessionId,
          fecha_registro: new Date().toISOString(),
        },
      ])
      .select('punto_despacho')
      .single();
    if (error) {
      Swal.fire('Error', error.message, 'error');
    } else {
      if (Notification.permission === 'granted') {
        navigator.serviceWorker.ready
          .then((reg) =>
            reg.showNotification('Despacho creado', {
              body: data.punto_despacho,
              icon: '/favicon.ico',
            })
          )
          .catch(() =>
            new Notification('Despacho creado', {
              body: data.punto_despacho,
            })
          );
      }
      Swal.fire({
        icon: 'success',
        title: 'Despacho creado',
        text: data.punto_despacho,
        timer: 2000,
        showConfirmButton: false,
      });
      setShowAdd(false);
    }
    setTimeout(() => (suppressRealtime.current = false), 1000);
  };

  const openAssign = (id) => {
    setAssignId(id);
    setSelEnlon('');
    setShowAssign(true);
  };
  const closeAssign = () => setShowAssign(false);
  const saveAssign = async (e) => {
    e.preventDefault();
    suppressRealtime.current = true;
    const { data, error } = await supabase
      .from('despachos')
      .update({ supervisor_despacho_id: sessionId, enlonador_id: selEnlon })
      .eq('id', assignId)
      .select('punto_despacho')
      .single();
    if (error) {
      Swal.fire('Error', error.message, 'error');
    } else {
      if (Notification.permission === 'granted') {
        navigator.serviceWorker.ready
          .then((reg) =>
            reg.showNotification('Despacho asignado', {
              body: data.punto_despacho,
              icon: '/favicon.ico',
            })
          )
          .catch(() =>
            new Notification('Despacho asignado', {
              body: data.punto_despacho,
            })
          );
      }
      Swal.fire({
        icon: 'success',
        title: 'Despacho asignado',
        text: data.punto_despacho,
        timer: 2000,
        showConfirmButton: false,
      });
      setShowAssign(false);
    }
    setTimeout(() => (suppressRealtime.current = false), 1000);
  };

  const changeState = async (id, st, fld) => {
    suppressRealtime.current = true;
    const { data, error } = await supabase
      .from('despachos')
      .update({ estado: st, [fld]: new Date().toISOString() })
      .eq('id', id)
      .select('punto_despacho')
      .single();
    if (error) {
      Swal.fire('Error', error.message, 'error');
    } else {
      const estadoTexto = formatEstado(st);
      if (Notification.permission === 'granted') {
        navigator.serviceWorker.ready
          .then((reg) =>
            reg.showNotification('Estado actualizado', {
              body: `${data.punto_despacho} → ${estadoTexto}`,
              icon: '/favicon.ico',
            })
          )
          .catch(() =>
            new Notification('Estado actualizado', {
              body: `${data.punto_despacho} → ${estadoTexto}`,
            })
          );
      }
      Swal.fire({
        icon: 'success',
        title: 'Estado actualizado',
        text: `${data.punto_despacho} → ${estadoTexto}`,
        timer: 2000,
        showConfirmButton: false,
      });
    }
    setTimeout(() => (suppressRealtime.current = false), 1000);
  };

  const openDetail = (row) => {
    setDetail(row);
    setShowDetail(true);
  };
  const closeDetail = () => setShowDetail(false);

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        <div className="bg-white shadow-lg rounded-xl overflow-hidden">
          {/* Cabecera de la página */}
          <div className="px-6 py-5 border border-gray-200 bg-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h1 className="text-xl sm:text-xl font-bold text-gray-800 flex items-center">
              <span className="bg-blue-600 p-2 rounded-lg mr-3 inline-flex">
                <FiTruck className="text-white text-xl" />
              </span>
              Despachos
            </h1>

            {/* Botón Agregar */}
            {(roleId === 1 || roleId === 3) && (
              <button
                onClick={openAdd}
                className="flex items-center px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm text-sm font-medium"
              >
                <FiPlus className="mr-2" size={18} /> Agregar Despacho
              </button>
            )}
          </div>

          {/* Filtros */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="flex flex-wrap items-center gap-4">
              {/* Fecha */}
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Fecha:</label>
                <div className="relative">
                  <input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="pl-3 pr-8 py-2 border border-gray-300 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {dateFilter && (
                    <button
                      onClick={() => setDateFilter('')}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <FiX size={16} />
                    </button>
                  )}
                </div>
              </div>

              {/* Filtro por rol */}
              {roleId === 3 && (
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">Mostrar:</label>
                  <select
                    value={filterMine ? 'mine' : 'all'}
                    onChange={(e) => setFilterMine(e.target.value === 'mine')}
                    className="pl-3 pr-8 py-2 border border-gray-300 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">Todos los despachos</option>
                    <option value="mine">Mis despachos</option>
                  </select>
                </div>
              )}

              {roleId === 2 && (
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">Mostrar:</label>
                  <select
                    value={filterAssigned ? 'assigned' : 'all'}
                    onChange={(e) => setFilterAssigned(e.target.value === 'assigned')}
                    className="pl-3 pr-8 py-2 border border-gray-300 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">Todos los despachos</option>
                    <option value="assigned">Mis asignaciones</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Contenido principal */}
          <div className="px-2 py-4">
            {/* Tarjetas móvil */}
            <div className="space-y-4 md:hidden">
              {despachos.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FiInbox className="mx-auto mb-3" size={32} />
                  <p>No hay despachos disponibles</p>
                </div>
              ) : (
                despachos.map((d) => (
                  <div
                    key={d.id}
                    className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 space-y-3"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <span className="bg-blue-100 text-blue-800 font-bold rounded-full h-8 w-8 flex items-center justify-center mr-2">
                          #{d.id}
                        </span>
                        <h2 className="font-medium text-gray-900">{d.punto_despacho}</h2>
                      </div>
                      <span
                        className={`${estadoStyles[d.estado]} px-3 py-1 text-xs font-semibold rounded-full`}
                      >
                        {formatEstado(d.estado)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Placa:</span>
                        <p className="font-medium">{d.placa_cabezal}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Registro:</span>
                        <p className="font-medium">{new Date(d.fecha_registro).toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-gray-100 flex flex-wrap gap-2">
                      <ActionButtons
                        despacho={d}
                        roleId={roleId}
                        openDetail={openDetail}
                        openAssign={openAssign}
                        changeState={changeState}
                        sessionId={sessionId}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Tabla escritorio */}
            <div className="hidden md:block overflow-x-auto rounded-lg">
              {despachos.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                  <FiInbox className="mx-auto mb-3 text-gray-400" size={48} />
                  <p className="text-gray-500 text-lg">No hay despachos disponibles</p>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      {['ID', 'Punto de Despacho', 'Placa', 'Estado', 'Fecha Registro', 'Acciones'].map(
                        (h) => (
                          <th
                            key={h}
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            {h}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {despachos.map((d, index) => (
                      <tr key={d.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          <span className="bg-blue-100 text-blue-800 font-bold rounded-full h-7 w-7 inline-flex items-center justify-center">
                            {d.id}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {d.punto_despacho}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {d.placa_cabezal}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`${estadoStyles[d.estado]} px-3 py-1 text-xs font-semibold rounded-full`}
                          >
                            {formatEstado(d.estado)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(d.fecha_registro).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex flex-wrap gap-2">
                            <ActionButtons
                              despacho={d}
                              roleId={roleId}
                              openDetail={openDetail}
                              openAssign={openAssign}
                              changeState={changeState}
                              sessionId={sessionId}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Modales */}
        {showAdd && (
          <Modal onClose={closeAdd} title="Nuevo Despacho">
            <form onSubmit={saveAdd} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Punto de Despacho</label>
                <Select
                  options={puntoDespachoOptions}
                  value={selectedPunto}
                  onChange={setSelectedPunto}
                  placeholder="Selecciona un punto de despacho"
                  className="text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Placa de Cabezal
                </label>
                <input
                  type="text"
                  placeholder="Ingrese la placa"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={placa}
                  maxLength={10}
                  onChange={(e) => {
                    // Solo alfanuméricos, en mayúsculas, sin límites de cursor
                    const raw = e.target.value;
                    const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
                    setPlaca(clean);
                  }}
                  required
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeAdd}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm text-sm font-medium"
                >
                  Guardar
                </button>
              </div>
            </form>
          </Modal>
        )}

        {showAssign && (
          <Modal onClose={closeAssign} title="Asignar Enlonador">
            <form onSubmit={saveAssign} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Enlonador</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={selEnlon}
                  onChange={(e) => setSelEnlon(+e.target.value)}
                  required
                >
                  <option value="">Selecciona un enlonador</option>
                  {enlonadores.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.username}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeAssign}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-sm font-medium"
                >
                  Asignar
                </button>
              </div>
            </form>
          </Modal>
        )}

        {showDetail && detail && (
          <Modal onClose={closeDetail} title={`Detalle de Despacho #${detail.id}`}>
            <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6">
                <div>
                  <p className="text-sm text-gray-500">Punto de Despacho</p>
                  <p className="font-medium">{detail.punto_despacho}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Placa de Cabezal</p>
                  <p className="font-medium">{detail.placa_cabezal}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Estado</p>
                  <span
                    className={`${estadoStyles[detail.estado]} px-2 py-1 text-xs font-semibold rounded-full inline-block mt-1`}
                  >
                    {formatEstado(detail.estado)}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Personal Asignado</h3>
                <div className="bg-white border border-gray-200 rounded-lg p-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <p className="text-xs text-gray-500">Operador</p>
                    <p className="font-medium">{detail.operador?.username || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Supervisor</p>
                    <p className="font-medium">{detail.supervisor?.username || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Enlonador</p>
                    <p className="font-medium">{detail.enlonador?.username || '-'}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Seguimiento de Tiempos</h3>
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="grid grid-cols-1 divide-y divide-gray-200">
                    <div className="p-3 flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="bg-blue-100 p-2 rounded-full mr-3">
                          <FiClock className="text-blue-600" size={16} />
                        </div>
                        <p>Registro</p>
                      </div>
                      <p className="text-sm text-gray-600 font-medium">
                        {new Date(detail.fecha_registro).toLocaleString()}
                      </p>
                    </div>
                    <div className="p-3 flex justify-between items-center">
                      <div className="flex items-center">
                          <div className={`${detail.fecha_aceptacion ? 'bg-green-100' : 'bg-gray-100'} p-2 rounded-full mr-3`}>
                            <FiCheck className={detail.fecha_aceptacion ? 'text-green-600' : 'text-gray-400'} size={16} />
                          </div>
                          <p>Aceptado</p>
                      </div>
                      <p className="text-sm text-gray-600 font-medium">
                        {detail.fecha_aceptacion ? new Date(detail.fecha_aceptacion).toLocaleString() : '-'}
                      </p>
                    </div>
                    <div className="p-3 flex justify-between items-center">
                      <div className="flex items-center">
                        <div className={`${detail.fecha_en_proceso ? 'bg-yellow-100' : 'bg-gray-100'} p-2 rounded-full mr-3`}>
                          <FiPlay className={detail.fecha_en_proceso ? 'text-yellow-600' : 'text-gray-400'} size={16} />
                        </div>
                        <p>En Proceso</p>
                      </div>
                      <p className="text-sm text-gray-600 font-medium">
                        {detail.fecha_en_proceso ? new Date(detail.fecha_en_proceso).toLocaleString() : '-'}
                      </p>
                    </div>
                    <div className="p-3 flex justify-between items-center">
                      <div className="flex items-center">
                      <div className={`${detail.fecha_completado ? 'bg-green-100' : 'bg-gray-100'} p-2 rounded-full mr-3`}>
                        <FiCheckCircle className={detail.fecha_completado ? 'text-green-600' : 'text-gray-400'} size={16} />
                      </div>
                      <p>Completado</p>
                      </div>
                      <p className="text-sm text-gray-600 font-medium">
                        {detail.fecha_completado ? new Date(detail.fecha_completado).toLocaleString() : '-'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 text-right">
              <button
                onClick={closeDetail}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-sm font-medium"
              >
                Cerrar
              </button>
            </div>
          </Modal>
        )}
      </main>
    </div>
  );
}

function Modal({ onClose, title, children }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 px-4 py-6">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-auto overflow-hidden animate-fadeIn">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-medium text-gray-800">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function ActionButtons({
  despacho,
  roleId,
  openDetail,
  openAssign,
  changeState,
  sessionId,
}) {
  const isAssigned = despacho.enlonador_id === sessionId;

  const buttonStyles = {
    base: "px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 font-medium transition-colors shadow-sm",
    view: "bg-gray-100 text-gray-700 hover:bg-gray-200",
    assign: "bg-blue-100 text-blue-700 hover:bg-blue-200",
    accept: "bg-blue-600 text-white hover:bg-blue-700",
    process: "bg-yellow-600 text-white hover:bg-yellow-700",
    complete: "bg-green-600 text-white hover:bg-green-700"
  };

  return (
    <>
      <button
        onClick={() => openDetail(despacho)}
        className={`${buttonStyles.base} ${buttonStyles.view}`}
      >
        <FiEye size={16} /> Ver
      </button>

      {(roleId === 1 || roleId === 2) && despacho.estado === 'PENDIENTE' && (
        <button
          onClick={() => openAssign(despacho.id)}
          className={`${buttonStyles.base} ${buttonStyles.assign}`}
        >
          <FiPlus size={16} /> Asignar
        </button>
      )}

      {((roleId === 1) || (roleId === 4 && isAssigned)) && despacho.estado === 'PENDIENTE' && (
        <button
          onClick={() => changeState(despacho.id, 'ACEPTADO', 'fecha_aceptacion')}
          className={`${buttonStyles.base} ${buttonStyles.accept}`}
        >
          <FiCheck size={16} /> Aceptar
        </button>
      )}

      {((roleId === 1) || (roleId === 4 && isAssigned)) && despacho.estado === 'ACEPTADO' && (
        <button
          onClick={() => changeState(despacho.id, 'EN_PROCESO', 'fecha_en_proceso')}
          className={`${buttonStyles.base} ${buttonStyles.process}`}
        >
          <FiPlay size={16} /> Iniciar
        </button>
      )}

      {((roleId === 1) || (roleId === 4 && isAssigned)) && despacho.estado === 'EN_PROCESO' && (
        <button
          onClick={() => changeState(despacho.id, 'COMPLETADO', 'fecha_completado')}
          className={`${buttonStyles.base} ${buttonStyles.complete}`}
        >
          <FiCheckCircle size={16} /> Completar
        </button>
      )}
    </>
  );
}