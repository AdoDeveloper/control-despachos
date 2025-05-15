// app/page.jsx

'use client'

import { useEffect, useState } from 'react'
import Swal from 'sweetalert2'
import { supabase } from '../lib/supabaseClient'

export default function HomePage() {
  const [notifs, setNotifs] = useState([])
  const [newMsg, setNewMsg] = useState('')
  const [pushAllowed, setPushAllowed] = useState(false)

  // Sincroniza permiso real con localStorage y estado
  const syncPermission = () => {
    const real = Notification.permission // "granted", "denied" o "default"
    localStorage.setItem('push-permission', real)
    setPushAllowed(real === 'granted')
    return real
  }

  // 1️⃣ Solicita permiso si no definido, y siempre sincroniza
  useEffect(() => {
    const saved = localStorage.getItem('push-permission')
    const real = Notification.permission
    if (real === 'default' && saved !== 'denied') {
      Notification.requestPermission().then(syncPermission)
    } else {
      syncPermission()
    }
  }, [])

  // Helper: muestra alerta si permiso no concedido
  const ensurePush = () => {
    const real = syncPermission()
    if (real !== 'granted') {
      Swal.fire({
        icon: 'warning',
        title: 'Notificaciones desactivadas',
        text: 'Para recibir alertas en tiempo real debes habilitar notificaciones en la configuración de tu navegador.',
        confirmButtonText: 'Entendido'
      })
      return false
    }
    return true
  }

  // 2️⃣ Registra Service Worker para notificaciones en background
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(console.error)
    }
  }, [])

  // 3️⃣ Fetch inicial de notifs
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

  // 4️⃣ Suscripción realtime con validación y push
  useEffect(() => {
    const channel = supabase
      .channel('notif_channel')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        ({ new: row }) => {
          setNotifs(prev => [row, ...prev])
          if (!ensurePush()) return
          const msg = {
            type: 'SHOW_NOTIFICATION',
            title: 'Nueva notificación',
            options: { body: row.message, tag: row.id }
          }
          if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage(msg)
          } else {
            new Notification(msg.title, msg.options)
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
  }, [])

  // 5️⃣ Enviar nueva notificación
  const sendNotification = async () => {
    if (!newMsg.trim()) return
    if (!ensurePush()) return
    const { error } = await supabase.from('notifications').insert([{ message: newMsg }])
    if (error) console.error('Insert error:', error)
    else setNewMsg('')
  }

  // 6️⃣ Marcar leído/no leído
  const toggleRead = async (id, read) => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: !read })
      .eq('id', id)
    if (error) console.error('Update error:', error)
  }

  // 7️⃣ Archivado manual
  const archiveAll = async () => {
    const res = await fetch('/api/archive', { method: 'POST' })
    const body = await res.json()
    if (body.success) {
      setNotifs([])
      Swal.fire('Éxito', body.message, 'success')
    } else {
      Swal.fire('Error', body.message, 'error')
    }
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-3xl font-bold mb-4">Notificaciones Realtime</h1>

      <div className="mb-4">
        Permiso Push: <strong>{pushAllowed ? 'Concedido' : 'No concedido'}</strong>
      </div>

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
        >
          Enviar
        </button>
      </div>

      <div className="mb-6">
        <button
          className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          onClick={archiveAll}
        >
          Archivar y limpiar todas
        </button>
      </div>

      <ul className="space-y-3">
        {notifs.map(n => (
          <li
            key={n.id}
            className={`p-4 rounded shadow flex justify-between items-center ${
              n.read ? 'bg-gray-100' : 'bg-white'
            }`}
          >
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