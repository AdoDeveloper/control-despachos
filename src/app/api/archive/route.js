// app/api/archive/route.js

import { NextResponse } from 'next/server'
import { createClient }   from '@supabase/supabase-js'
import prisma             from '../../../../lib/prisma'

//  — Inicializa Supabase con la Service Role Key (omitiendo RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  try {
    // 1️⃣ Lee todas las notificaciones
    const { data: allNotifs, error: fetchError } = await supabase
      .from('notifications')
      .select('*')
    if (fetchError) throw fetchError

    // 2️⃣ Copia a la base externa (Prisma), omitiendo duplicados
    if (allNotifs.length) {
      const result = await prisma.notification.createMany({
        data: allNotifs.map(n => ({
          id:          BigInt(n.id),
          message:     n.message,
          read:        n.read,
          inserted_at: n.inserted_at,
        })),
        skipDuplicates: true,
      })
      console.log(`Copiadas ${result.count} notificación(es) externas.`)
    }

    // 3️⃣ Borra todas las notificaciones en Supabase vía RPC a la función SQL
    //    DELETE FROM public.notifications WHERE id IS NOT NULL;
    //    ALTER SEQUENCE public.notifications_id_seq RESTART WITH 1;
    const { error: deleteError } = await supabase.rpc('delete_notifications')
    if (deleteError) throw deleteError

    // 4️⃣ Responde con éxito
      return NextResponse.json(
      {
        success: true,
        message: `Archivadas ${allNotifs.length} notificación(es) y eliminadas de Supabase.`
      },
      { status: 200 }
    )

  } catch (err) {
    console.error('Archive endpoint error:', err)
    return NextResponse.json(
      { success: false, message: 'Error interno: ' + err.message },
      { status: 500 }
    )
  } finally {
    // Cierra la conexión de Prisma
    await prisma.$disconnect()
  }
}