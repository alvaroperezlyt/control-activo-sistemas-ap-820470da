# Activos TI

1. Necesito un sistema para registro y control de activos informáticos que contenga las siguientes funciones: 

	- Registro datos de nuevos ingresos de computadoras (relevamiento en Google Sheets)

	- Registro datos de nuevos ingresos de Teléfonos (relevamiento en Google Sheets)

	- Registro datos de nuevos ingresos de Impresoras (datos a definir)

	- Registro datos de nuevos ingresos de Líneas de telefonía (relevamiento en Google Sheets)

	- Registro datos de nuevos ingresos de Dispositivos de red (datos a definir)

	- Registro datos de nuevos ingresos de Otros dispositivos (datos a definir)

2. El siguiente es el ID del documento Google Sheets que contiene el relavamiento de equipos (Computadoras, Telefonos, Lineas) y también la lista del personal (Personal) ACTIVO y DESVINCULADO (Columna D) enlazado directamente a la lista de RRHH, por lo que esta es la lista oficial que debe usar el sistema. ID: 1Kr3eVp3vtn0UnMAiJiOLGYokOeC_L9bIdPmhbArVtro

Como la lista esta enlazada a RRHH puede existir espacios intermedios en los nombres y apellidos asi como también al final del nombre un espacio adicional, tomar en cuenta, es muy importante.

2. Debe existir un apartado donde se pueda asignar uno o varios equipos a una persona

3. Se debe poder crear almacenes, los almacenes deben tener nombre y lugar

4.Los equipos tendrán varios estados de asignacion (ASIGNADO, LIBRE y BAJA)

5. Debe existir formularios de recepción de los equipos (Computadora y telefono + linea) que devuelve el personal. Es posible que te provea enlaces de Google forms para que puedas extraer la información que se captura en los formularios de recepción?

6. Debe existir un apartado para registrar fallas de los equipos (codigo interno, fecha, nombre quien reporta (usualmente el asignado), descripción de la falla)

7. Desde el apartado de fallas se puede seleccionar y registrar su reparación correspondiente (código interno, fecha, quien reporto, descripción de la falla, descripción de la reparación, proveedor, costo, factura/recibo)

8. Debe existir una apartado donde ver el historial de vida de cada equipo (nombre de las personas a las que fue asignado históricamente, fecha entrega, fecha retorno), historial de fallas con sus reparaciones.

9. Cuando el estado del personal en el cambie de ACTIVO a DESVINCULADO el sistema debe enviar una notificación sugiriendo realizar la recepción de los equipos ya que el estado desde RRHH cambio a DESVINCULADO

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://control-activo-sistemas-ap.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/b44e777b-e56b-4db2-9d58-f739943fa959).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
