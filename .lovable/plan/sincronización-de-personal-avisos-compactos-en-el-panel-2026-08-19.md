# Sincronización de personal + avisos compactos en el Panel

## Qué encontré (verificado en la base)

- La sincronización sí se ejecuta: la tarea automática corre cada 4 horas y el último sincronizado fue hoy 12:56 UTC.
- Todas las personas cuyo código apareció por primera vez desde el 12/08 (fecha en que se activó el aviso) sí tienen su notificación de "Nuevo personal activo". No hay casos nuevos sin aviso.
- Entonces el problema no es que falte generar avisos, sino cómo se detectan y cómo se ven:
  1. **Solo se avisa por códigos nuevos.** Si una persona ya existía en la base como DESVINCULADO y en la hoja de RRHH vuelve a ACTIVO (reingreso, o alguien que estaba mal marcado), no se genera ningún aviso.
  2. **Los avisos repetidos se ignoran.** Al reutilizarse el mismo código, el sistema descarta el aviso en lugar de reactivarlo, así que queda como "leído" y no vuelve a aparecer.
  3. **El Panel muestra los últimos 5 avisos aunque estén leídos**, así que si marcaste todo como leído, los nuevos se pierden entre los antiguos y no hay ningún indicador de "sin leer".

## Cambios propuestos

### 1. Detección por cambio de estado (no solo por código nuevo)

En la sincronización, comparar el estado anterior guardado en la base contra el estado de la hoja:

- Código que no existía y llega como ACTIVO → aviso de nuevo personal (como hoy).
- Código que existía como DESVINCULADO y ahora llega como ACTIVO → aviso de reingreso/reactivación, con nombre y puesto.
- Al generar el aviso, reactivarlo (marcarlo como no leído y actualizar título/mensaje) en vez de descartarlo si ya existía uno del mismo tipo para esa persona.

El resumen de la sincronización ("X registros, Y desvinculados, Z nuevos") también informará las reactivaciones.

### 2. Aviso visible de pendientes

- Añadir un contador de avisos sin leer junto a "Notificaciones" en el menú lateral, para que un aviso nuevo se note sin entrar al Panel.

### 3. Avisos recientes más compactos en el Panel

- Priorizar los avisos **sin leer**; si no hay ninguno, mostrar los últimos leídos en gris.
- Cada aviso en una sola fila compacta: título en una línea recortada, fecha corta al lado y el mensaje detallado disponible al pasar el cursor / en `/notificaciones`.
- Máximo 5 filas con altura fija y scroll interno, de modo que la tarjeta ya no crezca según la cantidad de avisos.
- Encabezado con el conteo de pendientes y el enlace "Ver todos".

## Detalles técnicos

- `src/lib/personal-sync.server.ts`: leer `codigo, estado` de `personal` antes del upsert, calcular altas y reactivaciones, y usar upsert con `onConflict: "tipo,personal_codigo"` **sin** `ignoreDuplicates`, reseteando `leida = false` y `updated_at`.
- Textos de la respuesta de sincronización y toasts en `dashboard.tsx` y `personal.tsx` para incluir reactivaciones.
- `src/routes/_authenticated/route.tsx`: consulta del conteo de no leídos para el badge del menú.
- `src/routes/_authenticated/dashboard.tsx`: consulta ordenada por `leida` y `created_at`, y tarjeta con `max-h` + `overflow-y-auto` usando tokens semánticos existentes.
- Sin cambios de base de datos ni de la tarea programada.
