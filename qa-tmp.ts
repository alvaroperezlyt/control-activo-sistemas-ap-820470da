import { generarPlanPDF } from "/dev-server/src/lib/plan-pdf";
import { distribuir } from "/dev-server/src/lib/planes";
const eqs = Array.from({length: 22}, (_,i)=>({equipo_id:String(i),codigo_interno:`SI-EQ-${100+i}`,personal_nombre:`APELLIDO PATERNO MATERNO NOMBRE ${i+1}`,sucursal_nombre:"OFICINA",lugar:["EL ALTO","COCHABAMBA","ORURO","SANTA CRUZ"][i%4]!}));
const items = distribuir(eqs, 2026, 5, ["2026-05-01"]);
const plan = {tipo:"MANTENIMIENTO" as const,anio:2026,mes:5,numero:1,fecha_elaboracion:"2026-04-28",fecha_realizacion:"MAYO 2026",objetivo:"obj ".repeat(30),alcance:"Todos los equipos informaticos dentro de la organización.",recursos:"Herramientas de montaje, soplador de aire, programas de mantenimiento y pasta termica.",nota:"Todos los usuarios deben tomar en cuenta que los equipos deben estar disponibles.",elabora:"Resp. Sistemas",autoriza:"CAO"};
// @ts-ignore
globalThis.__out = "/tmp/planqa/out.pdf";
generarPlanPDF(plan, items);
