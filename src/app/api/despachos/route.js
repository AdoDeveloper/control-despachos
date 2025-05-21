import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * POST /api/despachos
 * Sincroniza todos los despachos de la vista v_despachos en Supabase a Aiven y luego los borra en Supabase.
 * Se espera un header `x-cron-secret: <CRON_SECRET>`.
 */
export async function POST(request) {
  // Verificamos que venga el header Authorization con el Bearer token
  const auth = request.headers.get('Authorization') || '';
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1) leer todos los despachos desde la vista v_despachos
    const { data: supaRows, error: supaError } = await supabase
      .from("v_despachos")
      .select("*");

    if (supaError) {
      console.error("Error leyendo Supabase:", supaError);
      return NextResponse.json({ error: "Error leyendo Supabase" }, { status: 500 });
    }

    // 2) por cada registro, upsert en Aiven y luego borrarlo en table despachos
    let count = 0;
    for (const row of supaRows) {
      const {
        id,
        punto_despacho,
        placa_cabezal,
        estado,
        fecha_registro,
        fecha_aceptacion,
        fecha_en_proceso,
        fecha_completado,
        operador_external_user_id,
        supervisor_external_user_id,
        enlonador_external_user_id
      } = row;

      // Upsert en Aiven
      await prisma.despacho.upsert({
        where: { registerId: id.toString() },
        create: {
          registerId:           id.toString(),
          puntoDespacho:        punto_despacho,
          placaCabezal:         placa_cabezal,
          estado,
          fechaRegistro:        fecha_registro,
          fechaAceptacion:      fecha_aceptacion,
          fechaEnProceso:       fecha_en_proceso,
          fechaCompletado:      fecha_completado,
          operadorBasculaId:    operador_external_user_id,
          supervisorDespachoId: supervisor_external_user_id,
          enlonadorId:          enlonador_external_user_id,
        },
        update: {
          puntoDespacho:        punto_despacho,
          placaCabezal:         placa_cabezal,
          estado,
          fechaAceptacion:      fecha_aceptacion,
          fechaEnProceso:       fecha_en_proceso,
          fechaCompletado:      fecha_completado,
          operadorBasculaId:    operador_external_user_id,
          supervisorDespachoId: supervisor_external_user_id,
          enlonadorId:          enlonador_external_user_id,
        },
      });

      // Borrar del origen (Supabase)
      const { error: delError } = await supabase
        .from("despachos")
        .delete()
        .eq("id", id);

      if (delError) {
        console.error(`Error borrando Supabase id=${id}:`, delError);
      } else {
        count++;
      }
    }

    return NextResponse.json(
      { message: `Sincronizados y eliminados ${count} despachos en Supabase.` },
      { status: 200 }
    );
  } catch (e) {
    console.error("Error en sync de despachos:", e);
    return NextResponse.json({ error: "Error durante la sincronización" }, { status: 500 });
  }
}

/**
 * GET /api/despachos
 * Devuelve todos los despachos ya sincronizados en Aiven,
 * ordenados por fechaRegistro descendente.
 */
export async function GET(request) {
  try {
    const despachos = await prisma.despacho.findMany({
      orderBy: { fechaRegistro: "desc" },
      include: {
        operadorBascula:    { select: { nombreCompleto: true } },
        supervisorDespacho: { select: { nombreCompleto: true } },
        enlonador:          { select: { nombreCompleto: true } },
      },
    });
    return NextResponse.json(despachos, { status: 200 });
  } catch (e) {
    console.error("Error leyendo despachos:", e);
    return NextResponse.json(
      { error: "Error al obtener despachos" },
      { status: 500 }
    );
  }
}