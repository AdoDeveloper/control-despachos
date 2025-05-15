'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function HomePage() {
  const [notifs, setNotifs] = useState([])
  const [newMsg, setNewMsg] = useState('')
  const [pushAllowed, setPushAllowed] = useState(false)

  // --- 1. Solicitar permiso de notificaciones ---
  useEffect(() => {
    const saved = localStorage.getItem('push-permission')
    if (saved === 'granted') {
      setPushAllowed(true)
    } else if (saved !== 'denied') {
      Notification.requestPermission().then(permission => {
        localStorage.setItem('push-permission', permission)
        setPushAllowed(permission === 'granted')
      })
    }
  }, [])

  // --- 2. Registrar Service Worker para segundo plano ---
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(console.error)
    }
  }, [])

  // --- 3. Fetch inicial de notificaciones ---
  const fetchNotifs = () => {
    supabase
      .from('notifications')
      .select('*')
      .order('inserted_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) console.error('Fetch error:', error)
        else setNotifs(data)
      })
  }
  useEffect(fetchNotifs, [])

  // --- 4. Suscripción realtime con notificaciones push ---
  useEffect(() => {
    const channel = supabase
      .channel('notif_channel')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        ({ new: row }) => {
          setNotifs(prev => [row, ...prev])
          if (pushAllowed) {
            // muestra notificación
            if (navigator.serviceWorker.controller) {
              navigator.serviceWorker.controller.postMessage({
                type: 'SHOW_NOTIFICATION',
                title: 'Nueva notificación',
                options: {
                  body: row.message,
                  tag: row.id
                }
              })
            } else {
              // caida de respaldo
              new Notification('Nueva notificación', { body: row.message, tag: row.id })
            }
          }
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notifications' },
        ({ new: row }) =>
          setNotifs(prev => prev.map(n => n.id === row.id ? { ...n, read: row.read } : n))
      )
      .on('postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'notifications' },
        ({ old: row }) =>
          setNotifs(prev => prev.filter(n => n.id !== row.id))
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [pushAllowed])

  // --- 5. Enviar nueva notificación ---
  const sendNotification = async () => {
    if (!newMsg.trim()) return
    const { error } = await supabase.from('notifications').insert([{ message: newMsg }])
    if (error) console.error('Insert error:', error)
    else setNewMsg('')
  }

  // --- 6. Toggle leído/no leído ---
  const toggleRead = async (id, read) => {
    const { error } = await supabase.from('notifications').update({ read: !read }).eq('id', id)
    if (error) console.error('Update error:', error)
  }

  // --- 7. Archivado manual ---
  const archiveAll = async () => {
    const res = await fetch('/api/archive', { method: 'POST' })
    const body = await res.json()
    if (body.success) setNotifs([])
    else console.error(body.message)
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-3xl font-bold mb-4">Notificaciones Realtime</h1>

      {/* Permiso push */}
      <div className="mb-4">
        Permiso Push:{' '}
        <strong>{pushAllowed ? 'Concedido' : 'No concedido'}</strong>
      </div>

      {/* Formulario de envío */}
      <div className="flex mb-4">
        <input
          className="flex-1 p-2 border rounded-l"
          value={newMsg}
          onChange={e => setNewMsg(e.target.value)}
          placeholder="Escribe tu notificación..."
        />
        <button
          className="px-4 bg-blue-600 text-white rounded-r"
          onClick={sendNotification}
        >Enviar</button>
      </div>

      {/* Botón de archivado */}
      <div className="mb-6">
        <button
          className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          onClick={archiveAll}
        >Archivar y limpiar todas</button>
      </div>

      {/* Lista de notificaciones */}
      <ul className="space-y-3">
        {notifs.map(n => (
          <li key={n.id}
              className={`p-4 rounded shadow flex justify-between items-center ${n.read ? 'bg-gray-100' : 'bg-white'}`}>
            <div>
              <p className="font-medium">{n.message}</p>
              <time className="text-xs text-gray-500">
                {new Date(n.inserted_at).toLocaleTimeString()}
              </time>
            </div>
            <button
              className="ml-4 px-3 py-1 border rounded"
              onClick={() => toggleRead(n.id, n.read)}
            >
              {n.read ? 'Marcar no leído' : 'Marcar leído'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}