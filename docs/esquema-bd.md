# Estructura de la base de datos — Activos TI

Generado automaticamente el 2026-08-11. Fuente de verdad: supabase/migrations/*.sql

## Tablas y columnas


### ajustes

| Columna | Tipo | Nulo | Valor por defecto |
|---|---|---|---|
| clave | text | NO |  |
| valor | text | NO | ''::text |
| created_at | timestamp with time zone | NO | now() |
| updated_at | timestamp with time zone | NO | now() |

### almacenes

| Columna | Tipo | Nulo | Valor por defecto |
|---|---|---|---|
| id | uuid | NO | gen_random_uuid() |
| nombre | text | NO |  |
| lugar | text | NO |  |
| created_at | timestamp with time zone | NO | now() |
| updated_at | timestamp with time zone | NO | now() |

### asignaciones

| Columna | Tipo | Nulo | Valor por defecto |
|---|---|---|---|
| id | uuid | NO | gen_random_uuid() |
| equipo_id | uuid | NO |  |
| personal_codigo | text | YES |  |
| personal_nombre | text | NO |  |
| fecha_entrega | date | NO | CURRENT_DATE |
| fecha_retorno | date | YES |  |
| recepcion_id | uuid | YES |  |
| observaciones | text | YES |  |
| created_at | timestamp with time zone | NO | now() |
| updated_at | timestamp with time zone | NO | now() |

### equipos

| Columna | Tipo | Nulo | Valor por defecto |
|---|---|---|---|
| id | uuid | NO | gen_random_uuid() |
| tipo | text | NO |  |
| codigo_interno | text | NO |  |
| estado_asignacion | text | NO | 'LIBRE'::text |
| personal_codigo | text | YES |  |
| almacen_id | uuid | YES |  |
| lugar | text | YES |  |
| marca | text | YES |  |
| modelo | text | YES |  |
| serie | text | YES |  |
| fecha_compra | date | YES |  |
| costo | numeric | YES |  |
| color | text | YES |  |
| observaciones | text | YES |  |
| datos | jsonb | NO | '{}'::jsonb |
| created_at | timestamp with time zone | NO | now() |
| updated_at | timestamp with time zone | NO | now() |
| fecha_baja | date | YES |  |
| motivo_baja | text | YES |  |
| baja_personal_nombre | text | YES |  |

### fallas

| Columna | Tipo | Nulo | Valor por defecto |
|---|---|---|---|
| id | uuid | NO | gen_random_uuid() |
| equipo_id | uuid | NO |  |
| fecha | date | NO | CURRENT_DATE |
| reportado_por | text | NO |  |
| descripcion | text | NO |  |
| estado | text | NO | 'PENDIENTE'::text |
| created_at | timestamp with time zone | NO | now() |
| updated_at | timestamp with time zone | NO | now() |

### feriados

| Columna | Tipo | Nulo | Valor por defecto |
|---|---|---|---|
| id | uuid | NO | gen_random_uuid() |
| fecha | date | NO |  |
| descripcion | text | NO |  |
| created_at | timestamp with time zone | NO | now() |
| updated_at | timestamp with time zone | NO | now() |

### notificaciones

| Columna | Tipo | Nulo | Valor por defecto |
|---|---|---|---|
| id | uuid | NO | gen_random_uuid() |
| tipo | text | NO | 'DESVINCULACION'::text |
| personal_codigo | text | YES |  |
| personal_nombre | text | YES |  |
| titulo | text | NO |  |
| mensaje | text | NO |  |
| leida | boolean | NO | false |
| created_at | timestamp with time zone | NO | now() |
| updated_at | timestamp with time zone | NO | now() |

### personal

| Columna | Tipo | Nulo | Valor por defecto |
|---|---|---|---|
| codigo | text | NO |  |
| nombre | text | NO |  |
| puesto | text | YES |  |
| estado | text | NO | 'ACTIVO'::text |
| synced_at | timestamp with time zone | NO | now() |
| created_at | timestamp with time zone | NO | now() |
| updated_at | timestamp with time zone | NO | now() |

### plan_items

| Columna | Tipo | Nulo | Valor por defecto |
|---|---|---|---|
| id | uuid | NO | gen_random_uuid() |
| plan_id | uuid | NO |  |
| equipo_id | uuid | YES |  |
| codigo_interno | text | NO |  |
| personal_nombre | text | NO |  |
| sucursal_nombre | text | YES |  |
| lugar | text | YES |  |
| fecha | date | NO |  |
| turno | text | NO | 'MANANA'::text |
| orden | integer | NO | 0 |
| created_at | timestamp with time zone | NO | now() |
| updated_at | timestamp with time zone | NO | now() |

### planes

| Columna | Tipo | Nulo | Valor por defecto |
|---|---|---|---|
| id | uuid | NO | gen_random_uuid() |
| tipo | text | NO |  |
| anio | integer | NO |  |
| mes | integer | NO |  |
| numero | integer | NO | 1 |
| fecha_elaboracion | date | NO | CURRENT_DATE |
| fecha_realizacion | text | NO | ''::text |
| objetivo | text | NO | ''::text |
| alcance | text | NO | ''::text |
| recursos | text | NO | ''::text |
| nota | text | YES |  |
| elabora | text | NO | 'Resp. Sistemas Informaticos'::text |
| autoriza | text | NO | 'CAO'::text |
| created_at | timestamp with time zone | NO | now() |
| updated_at | timestamp with time zone | NO | now() |
| fecha_inicio | date | NO |  |
| fecha_fin | date | NO |  |

### profiles

| Columna | Tipo | Nulo | Valor por defecto |
|---|---|---|---|
| id | uuid | NO |  |
| email | text | YES |  |
| nombre | text | YES |  |
| created_at | timestamp with time zone | NO | now() |
| updated_at | timestamp with time zone | NO | now() |

### recepciones

| Columna | Tipo | Nulo | Valor por defecto |
|---|---|---|---|
| id | uuid | NO | gen_random_uuid() |
| tipo | text | NO |  |
| personal_codigo | text | YES |  |
| personal_nombre | text | YES |  |
| fecha | date | NO | CURRENT_DATE |
| recibido_por | text | YES |  |
| estado_fisico | text | YES |  |
| accesorios | jsonb | NO | '[]'::jsonb |
| observaciones | text | YES |  |
| created_at | timestamp with time zone | NO | now() |
| updated_at | timestamp with time zone | NO | now() |
| formulario | text | YES |  |
| revisor | text | YES |  |
| respuestas | jsonb | NO | '{}'::jsonb |
| fotos | jsonb | NO | '[]'::jsonb |

### recepciones_items

| Columna | Tipo | Nulo | Valor por defecto |
|---|---|---|---|
| id | uuid | NO | gen_random_uuid() |
| recepcion_id | uuid | NO |  |
| equipo_id | uuid | NO |  |
| observaciones | text | YES |  |
| created_at | timestamp with time zone | NO | now() |

### reparaciones

| Columna | Tipo | Nulo | Valor por defecto |
|---|---|---|---|
| id | uuid | NO | gen_random_uuid() |
| falla_id | uuid | NO |  |
| fecha | date | NO | CURRENT_DATE |
| descripcion | text | NO |  |
| proveedor | text | YES |  |
| costo | numeric | YES |  |
| factura | text | YES |  |
| created_at | timestamp with time zone | NO | now() |
| updated_at | timestamp with time zone | NO | now() |

### user_roles

| Columna | Tipo | Nulo | Valor por defecto |
|---|---|---|---|
| id | uuid | NO | gen_random_uuid() |
| user_id | uuid | NO |  |
| role | USER-DEFINED | NO |  |
| created_at | timestamp with time zone | NO | now() |

### usuarios_autorizados

| Columna | Tipo | Nulo | Valor por defecto |
|---|---|---|---|
| id | uuid | NO | gen_random_uuid() |
| email | text | NO |  |
| nombre | text | NO |  |
| rol | USER-DEFINED | NO | 'tecnico'::app_role |
| creado_por | uuid | YES |  |
| created_at | timestamp with time zone | NO | now() |
| updated_at | timestamp with time zone | NO | now() |

## Llaves primarias y foraneas

```
ajustes : PRIMARY KEY (clave)
almacenes : PRIMARY KEY (id)
asignaciones : FOREIGN KEY (equipo_id)
asignaciones : FOREIGN KEY (personal_codigo)
asignaciones : FOREIGN KEY (recepcion_id)
asignaciones : PRIMARY KEY (id)
equipos : FOREIGN KEY (almacen_id)
equipos : FOREIGN KEY (personal_codigo)
equipos : PRIMARY KEY (id)
equipos : UNIQUE (codigo_interno)
fallas : FOREIGN KEY (equipo_id)
fallas : PRIMARY KEY (id)
feriados : PRIMARY KEY (id)
feriados : UNIQUE (fecha)
notificaciones : PRIMARY KEY (id)
personal : PRIMARY KEY (codigo)
plan_items : FOREIGN KEY (equipo_id)
plan_items : FOREIGN KEY (plan_id)
plan_items : PRIMARY KEY (id)
planes : PRIMARY KEY (id)
profiles : FOREIGN KEY (id)
profiles : PRIMARY KEY (id)
recepciones : FOREIGN KEY (personal_codigo)
recepciones : PRIMARY KEY (id)
recepciones_items : FOREIGN KEY (equipo_id)
recepciones_items : FOREIGN KEY (recepcion_id)
recepciones_items : PRIMARY KEY (id)
reparaciones : FOREIGN KEY (falla_id)
reparaciones : PRIMARY KEY (id)
user_roles : FOREIGN KEY (user_id)
user_roles : PRIMARY KEY (id)
user_roles : UNIQUE (user_id, role)
usuarios_autorizados : PRIMARY KEY (id)
usuarios_autorizados : UNIQUE (email)
```

## Politicas de acceso (RLS)

```
ajustes | ajustes_insert_admin | INSERT | roles: authenticated
ajustes | ajustes_select_ti | SELECT | roles: authenticated
ajustes | ajustes_update_admin | UPDATE | roles: authenticated
almacenes | almacenes_delete | DELETE | roles: authenticated
almacenes | almacenes_insert | INSERT | roles: authenticated
almacenes | almacenes_select | SELECT | roles: authenticated
almacenes | almacenes_update | UPDATE | roles: authenticated
asignaciones | asignaciones_delete | DELETE | roles: authenticated
asignaciones | asignaciones_insert | INSERT | roles: authenticated
asignaciones | asignaciones_select | SELECT | roles: authenticated
asignaciones | asignaciones_update | UPDATE | roles: authenticated
equipos | equipos_delete | DELETE | roles: authenticated
equipos | equipos_insert | INSERT | roles: authenticated
equipos | equipos_select | SELECT | roles: authenticated
equipos | equipos_update | UPDATE | roles: authenticated
fallas | fallas_delete | DELETE | roles: authenticated
fallas | fallas_insert | INSERT | roles: authenticated
fallas | fallas_select | SELECT | roles: authenticated
fallas | fallas_update | UPDATE | roles: authenticated
feriados | feriados_delete | DELETE | roles: authenticated
feriados | feriados_insert | INSERT | roles: authenticated
feriados | feriados_select | SELECT | roles: authenticated
feriados | feriados_update | UPDATE | roles: authenticated
notificaciones | notificaciones_delete | DELETE | roles: authenticated
notificaciones | notificaciones_insert | INSERT | roles: authenticated
notificaciones | notificaciones_select | SELECT | roles: authenticated
notificaciones | notificaciones_update | UPDATE | roles: authenticated
personal | personal_delete | DELETE | roles: authenticated
personal | personal_insert | INSERT | roles: authenticated
personal | personal_select | SELECT | roles: authenticated
personal | personal_update | UPDATE | roles: authenticated
plan_items | plan_items_delete | DELETE | roles: authenticated
plan_items | plan_items_insert | INSERT | roles: authenticated
plan_items | plan_items_select | SELECT | roles: authenticated
plan_items | plan_items_update | UPDATE | roles: authenticated
planes | planes_delete | DELETE | roles: authenticated
planes | planes_insert | INSERT | roles: authenticated
planes | planes_select | SELECT | roles: authenticated
planes | planes_update | UPDATE | roles: authenticated
profiles | profiles_select_admin | SELECT | roles: authenticated
profiles | profiles_select_own | SELECT | roles: authenticated
profiles | profiles_update_own | UPDATE | roles: authenticated
recepciones | recepciones_delete | DELETE | roles: authenticated
recepciones | recepciones_insert | INSERT | roles: authenticated
recepciones | recepciones_select | SELECT | roles: authenticated
recepciones | recepciones_update | UPDATE | roles: authenticated
recepciones_items | recepciones_items_delete | DELETE | roles: authenticated
recepciones_items | recepciones_items_insert | INSERT | roles: authenticated
recepciones_items | recepciones_items_select | SELECT | roles: authenticated
recepciones_items | recepciones_items_update | UPDATE | roles: authenticated
reparaciones | reparaciones_delete | DELETE | roles: authenticated
reparaciones | reparaciones_insert | INSERT | roles: authenticated
reparaciones | reparaciones_select | SELECT | roles: authenticated
reparaciones | reparaciones_update | UPDATE | roles: authenticated
user_roles | user_roles_admin_manage | ALL | roles: authenticated
user_roles | user_roles_select_own | SELECT | roles: authenticated
usuarios_autorizados | usuarios_autorizados_admin_all | ALL | roles: authenticated
```

## Indices

```
CREATE UNIQUE INDEX ajustes_pkey ON public.ajustes USING btree (clave)
CREATE UNIQUE INDEX almacenes_pkey ON public.almacenes USING btree (id)
CREATE INDEX asignaciones_equipo_idx ON public.asignaciones USING btree (equipo_id)
CREATE UNIQUE INDEX asignaciones_pkey ON public.asignaciones USING btree (id)
CREATE UNIQUE INDEX equipos_codigo_interno_key ON public.equipos USING btree (codigo_interno)
CREATE INDEX equipos_personal_idx ON public.equipos USING btree (personal_codigo)
CREATE UNIQUE INDEX equipos_pkey ON public.equipos USING btree (id)
CREATE INDEX equipos_tipo_idx ON public.equipos USING btree (tipo)
CREATE INDEX fallas_equipo_idx ON public.fallas USING btree (equipo_id)
CREATE UNIQUE INDEX fallas_pkey ON public.fallas USING btree (id)
CREATE UNIQUE INDEX feriados_fecha_key ON public.feriados USING btree (fecha)
CREATE UNIQUE INDEX feriados_pkey ON public.feriados USING btree (id)
CREATE UNIQUE INDEX notificaciones_pkey ON public.notificaciones USING btree (id)
CREATE UNIQUE INDEX notificaciones_unicas_idx ON public.notificaciones USING btree (tipo, personal_codigo)
CREATE INDEX personal_nombre_idx ON public.personal USING btree (nombre)
CREATE UNIQUE INDEX personal_pkey ON public.personal USING btree (codigo)
CREATE UNIQUE INDEX plan_items_pkey ON public.plan_items USING btree (id)
CREATE INDEX plan_items_plan_idx ON public.plan_items USING btree (plan_id)
CREATE UNIQUE INDEX planes_pkey ON public.planes USING btree (id)
CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id)
CREATE UNIQUE INDEX recepciones_pkey ON public.recepciones USING btree (id)
CREATE UNIQUE INDEX recepciones_items_pkey ON public.recepciones_items USING btree (id)
CREATE INDEX reparaciones_falla_idx ON public.reparaciones USING btree (falla_id)
CREATE UNIQUE INDEX reparaciones_pkey ON public.reparaciones USING btree (id)
CREATE UNIQUE INDEX user_roles_pkey ON public.user_roles USING btree (id)
CREATE UNIQUE INDEX user_roles_user_id_role_key ON public.user_roles USING btree (user_id, role)
CREATE UNIQUE INDEX usuarios_autorizados_email_key ON public.usuarios_autorizados USING btree (email)
CREATE UNIQUE INDEX usuarios_autorizados_pkey ON public.usuarios_autorizados USING btree (id)
```

## Conteo de filas actual

```
ajustes: 1
almacenes: 8
asignaciones: 152
equipos: 231
fallas: 2
feriados: 2
notificaciones: 1
personal: 287
plan_items: 54
planes: 1
profiles: 1
recepciones: 0
recepciones_items: 0
reparaciones: 0
user_roles: 1
usuarios_autorizados: 1
```
