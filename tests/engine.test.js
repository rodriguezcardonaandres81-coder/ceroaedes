/*
 * Pruebas del motor clínico de CeroAedes by AR.
 * Extrae el bloque ENGINE de index.html y verifica clasificación y cálculos
 * contra la ficha SIVIGILA 210/220/580 y el algoritmo OPS/OMS - MinSalud 2019.
 *
 * Uso: node tests/engine.test.js
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const m = html.match(/\/\* === ENGINE START === \*\/([\s\S]*?)\/\* === ENGINE END === \*\//);
if (!m) { console.error('No se encontró el bloque ENGINE en index.html'); process.exit(1); }

const ctx = {};
vm.createContext(ctx);
vm.runInContext(m[1], ctx);

let pass = 0, fail = 0;
function t(nombre, real, esperado) {
  const ok = String(real) === String(esperado);
  ok ? pass++ : fail++;
  console.log(`${ok ? '  OK  ' : ' FALLA'} │ ${nombre}`);
  if (!ok) console.log(`       │   esperado: ${esperado}\n       │   obtenido: ${real}`);
}

const base = {
  nombre: '', fecha: '2026-08-12', hora: '08:00', sexo: 'M', edad: '', edadU: 'a',
  peso: 0, talla: 0, usarPesoIdeal: false, embarazo: false, dia: '4',
  endemica: true, fiebre: true, manif: ['cefalea', 'mialgias'],
  alarma: [], grave: [], cond: [], social: [], toleraVO: true, diuresisOk: true
};
const P = o => Object.assign({}, base, o);
const fase = (S, n) => ctx.planLiquidos(S).fases[n];

console.log('\n── Criterios cargados desde la ficha ──────────────');

t('6 manifestaciones (5 de la ficha + leucopenia del protocolo)', ctx.MANIF.length, 6);
t('12 signos de alarma (11 de la ficha + diuresis del protocolo)', ctx.ALARMA.length, 12);
t('4 manifestaciones graves', ctx.GRAVE.length, 4);
t('Diarrea está entre los signos de alarma',
  ctx.ALARMA.some(x => x[0] === 'diarrea'), 'true');
t('Hipotermia está entre los signos de alarma',
  ctx.ALARMA.some(x => x[0] === 'hipotermia'), 'true');
t('Caída de plaquetas < 100.000 está entre los signos de alarma',
  ctx.ALARMA.some(x => x[0] === 'plaquetas'), 'true');
t('Shock por dengue es criterio de gravedad independiente',
  ctx.GRAVE.some(x => x[0] === 'shock'), 'true');
t('Leucopenia marcada como criterio del protocolo, no de la ficha',
  ctx.MANIF.find(x => x[0] === 'leucopenia')[3], 'prot');
t('Disminución de la diuresis marcada como criterio del protocolo',
  ctx.ALARMA.find(x => x[0] === 'diuresis')[3], 'prot');
t('Los 11 signos de alarma de la ficha están marcados como ficha',
  ctx.ALARMA.filter(x => x[3] === 'ficha').length, 11);

console.log('\n── Definición operativa de caso (SIVIGILA) ────────');

t('Área endémica + fiebre + 2 manifestaciones → dengue sin signos de alarma',
  ctx.definicionCaso(P({ edad: '34', peso: 70 })).clasificacion, 'Dengue sin signos de alarma');

t('Sin área endémica → no cumple definición',
  ctx.definicionCaso(P({ edad: '34', peso: 70, endemica: false })).cumple, 'false');
t('Sin área endémica: el faltante se reporta',
  ctx.definicionCaso(P({ edad: '34', peso: 70, endemica: false })).faltan[0], 'procedencia de área endémica');

t('Sin fiebre → no cumple definición',
  ctx.definicionCaso(P({ edad: '34', peso: 70, fiebre: false })).cumple, 'false');

t('Una sola manifestación → no cumple definición',
  ctx.definicionCaso(P({ edad: '34', peso: 70, manif: ['cefalea'] })).cumple, 'false');

t('Con un signo de alarma → dengue con signos de alarma',
  ctx.definicionCaso(P({ edad: '34', peso: 70, alarma: ['diarrea'] })).clasificacion,
  'Dengue con signos de alarma');

t('Con manifestación grave → dengue grave',
  ctx.definicionCaso(P({ edad: '34', peso: 70, grave: ['shock'] })).clasificacion, 'Dengue grave');

t('Dengue grave sin fiebre pero con signo de alarma sí cumple',
  ctx.definicionCaso(P({ edad: '34', peso: 70, fiebre: false, grave: ['shock'], alarma: ['hipotermia'] })).clasificacion,
  'Dengue grave');

t('Dengue grave sin fiebre y sin alarma no cumple la definición',
  ctx.definicionCaso(P({ edad: '34', peso: 70, fiebre: false, alarma: [], grave: ['shock'] })).cumple, 'false');

t('Signos de alarma sin cumplir la base → no notificable pero se advierte',
  /intervención clínica inmediata/.test(
    ctx.definicionCaso(P({ edad: '34', peso: 70, manif: [], alarma: ['vomito'] })).detalle), 'true');

t('Código SIVIGILA 1 para dengue sin signos de alarma',
  ctx.definicionCaso(P({ edad: '34', peso: 70 })).codigo, 1);
t('Código SIVIGILA 2 para dengue con signos de alarma',
  ctx.definicionCaso(P({ edad: '34', peso: 70, alarma: ['vomito'] })).codigo, 2);
t('Código SIVIGILA 3 para dengue grave',
  ctx.definicionCaso(P({ edad: '34', peso: 70, grave: ['organos'] })).codigo, 3);

console.log('\n── Categoría de intervención (OPS A/B1/B2/C) ──────');

t('Adulto 70 kg sin hallazgos → A', ctx.clasificar(P({ edad: '34', peso: 70 })), 'A');
t('Adulto con diabetes → B1', ctx.clasificar(P({ edad: '34', peso: 70, cond: ['dm'] })), 'B1');
t('Riesgo social → B1', ctx.clasificar(P({ edad: '34', peso: 70, social: ['solo'] })), 'B1');
t('No tolera vía oral → B1', ctx.clasificar(P({ edad: '34', peso: 70, toleraVO: false })), 'B1');
t('Lactante de 8 meses → B1', ctx.clasificar(P({ edad: '8', edadU: 'm', peso: 8 })), 'B1');
t('Adulto de 70 años → B1', ctx.clasificar(P({ edad: '70', peso: 65 })), 'B1');
t('Gestante sin alarma → B1', ctx.clasificar(P({ edad: '28', sexo: 'F', peso: 62, embarazo: true })), 'B1');
t('Un signo de alarma → B2', ctx.clasificar(P({ edad: '34', peso: 70, alarma: ['abdominal'] })), 'B2');
t('Alarma + condición asociada → B2 (no B1)',
  ctx.clasificar(P({ edad: '34', peso: 70, alarma: ['abdominal'], cond: ['dm'] })), 'B2');
t('Criterio de gravedad → C', ctx.clasificar(P({ edad: '34', peso: 70, grave: ['shock'] })), 'C');
t('Gravedad domina sobre alarma → C',
  ctx.clasificar(P({ edad: '34', peso: 70, alarma: ['abdominal'], grave: ['organos'] })), 'C');
t('Diuresis disminuida como signo de alarma → B2',
  ctx.clasificar(P({ edad: '34', peso: 70, alarma: ['diuresis'] })), 'B2');

t('Niño de 3 años se ofrece "menor de 5 años"', ctx.mostrarMenor5(P({ edad: '3', peso: 12 })), 'true');
t('Niño de 3 años con "menor de 5 años" marcado → B1',
  ctx.clasificar(P({ edad: '3', peso: 12, cond: ['menor5'] })), 'B1');
t('Niño de 3 años si se desmarca (OPS 2019 estricto) → A',
  ctx.clasificar(P({ edad: '3', peso: 12 })), 'A');
t('Niño de 8 años no ofrece "menor de 5 años"', ctx.mostrarMenor5(P({ edad: '8', peso: 25 })), 'false');

console.log('\n── Grupo A / B1: hidratación oral ─────────────────');

const A70 = ctx.planLiquidos(P({ edad: '34', peso: 70 }));
t('Adulto A: vía oral', A70.via, 'oral');
t('Adulto A: 2.000 ml o más en 24 h', A70.oral.principal, '2.000 ml o más en 24 h');
t('Adulto A: sin línea IV', A70.fases.length, 0);
t('Holliday-Segar 8 kg = 800 ml/día', ctx.holliday(8), 800);
t('Holliday-Segar 12 kg = 1.100 ml/día', ctx.holliday(12), 1100);
t('Holliday-Segar 25 kg = 1.600 ml/día', ctx.holliday(25), 1600);
t('Niño 12 kg: mantenimiento + 5 % = 1.160 ml/24 h',
  ctx.planLiquidos(P({ edad: '3', peso: 12 })).oral.principal, '1160 ml en 24 h');
const B1 = ctx.planLiquidos(P({ edad: '34', peso: 70, cond: ['dm'] }));
t('B1 con intolerancia oral: 2–4 ml/kg/h = 140–280 ml/h', B1.fases[0].rate, '140 – 280 ml/h');

console.log('\n── Grupo B2: signos de alarma ─────────────────────');

const S_B2 = P({ edad: '34', peso: 70, alarma: ['abdominal'] });
t('B2 carga: 10 ml/kg = 700 ml en 1 h', fase(S_B2, 0).rate, '700 ml en 1 hora');
t('B2 carga a las 08:00', fase(S_B2, 0).hora, '08:00');
t('B2 fase 2: 5–7 ml/kg/h = 350–490 ml/h', fase(S_B2, 2).rate, '350 – 490 ml/h');
t('B2 fase 2 inicia a las 09:00', fase(S_B2, 2).hora, '09:00');
t('B2 fase 3: 3–5 ml/kg/h = 210–350 ml/h', fase(S_B2, 3).rate, '210 – 350 ml/h');
t('B2 fase 4: 2–4 ml/kg/h = 140–280 ml/h', fase(S_B2, 4).rate, '140 – 280 ml/h');
t('B2 fase 4 inicia a las 13:00', fase(S_B2, 4).hora, '13:00');

const S_B2n = P({ edad: '3', peso: 12, alarma: ['vomito'] });
t('B2 niño 12 kg carga = 120 ml en 1 h', fase(S_B2n, 0).rate, '120 ml en 1 hora');
t('B2 niño 12 kg fase 2 = 60–84 ml/h', fase(S_B2n, 2).rate, '60 – 84 ml/h');

console.log('\n── Grupo C: dengue grave ──────────────────────────');

const S_C = P({ edad: '34', peso: 70, grave: ['shock'] });
t('C bolo adulto: 20 ml/kg = 1.400 ml', fase(S_C, 0).rate, '1400 ml en 15 – 30 min');
t('C bolo: velocidad en bomba 2.800–5.600 ml/h', fase(S_C, 0).bomba, '2800 – 5600 ml/h en bomba');
t('C tras choque resuelto: 10 ml/kg/h = 700 ml/h', fase(S_C, 2).rate, '700 ml/h');
t('C mantenimiento: 2–4 ml/kg/h', fase(S_C, 5).rate, '140 – 280 ml/h');
t('C transfusión GR 5–10 ml/kg',
  ctx.planLiquidos(S_C).hemorragia.gr, '350 – 700 ml (glóbulos rojos 5 – 10 ml/kg)');
t('C gestante: bolo reducido a 10 ml/kg = 600 ml',
  fase(P({ edad: '28', sexo: 'F', peso: 60, embarazo: true, grave: ['shock'] }), 0).rate, '600 ml en 15 – 30 min');
t('C adulto ≥65 años: bolo reducido = 650 ml',
  fase(P({ edad: '72', peso: 65, grave: ['extravasacion'] }), 0).rate, '650 ml en 15 – 30 min');
t('C niño 18 kg: bolo 20 ml/kg = 360 ml',
  fase(P({ edad: '5', peso: 18, grave: ['shock'] }), 0).rate, '360 ml en 15 – 30 min');

console.log('\n── Goteo, antipirético y peso ideal ───────────────');

t('700 ml/h = 233 macrogotas/min', ctx.goteo(700).macro, 233);
t('700 ml/h = 700 microgotas/min', ctx.goteo(700).micro, 700);
t('Adulto: 500 mg cada 6 horas',
  ctx.antipiretico(P({ edad: '34', peso: 70 })).dosis, '500 mg cada 6 horas');
t('Niño 12 kg: 120–180 mg por dosis',
  ctx.antipiretico(P({ edad: '3', peso: 12 })).dosis, '120 – 180 mg por dosis, cada 6 horas');
t('Niño 12 kg: jarabe 150 mg/5 ml → 4–6 ml',
  ctx.antipiretico(P({ edad: '3', peso: 12 })).jarabe, 'Jarabe 150 mg/5 ml → 4 – 6 ml por dosis');
t('Peso ideal varón 175 cm ≈ 70,5 kg', ctx.pesoIdeal(175, 'M'), 70.5);
t('Obesidad con peso ideal: carga 10 ml/kg = 705 ml',
  fase(P({ edad: '40', peso: 130, talla: 175, usarPesoIdeal: true, alarma: ['abdominal'] }), 0).rate,
  '705 ml en 1 hora');
t('08:00 + 120 min = 10:00', ctx.addMin('08:00', 120), '10:00');
t('23:30 + 60 min = 00:30 (cruza medianoche)', ctx.addMin('23:30', 60), '00:30');

console.log('\n── Laboratorio y monitoreo ────────────────────────');

t('Día 2 → NS1/RT-PCR',
  /RT-PCR o NS1/.test(ctx.laboratorio(P({ edad: '34', peso: 70, dia: '2' }))[0]), 'true');
t('Día 6 → IgM', /IgM dengue/.test(ctx.laboratorio(P({ edad: '34', peso: 70, dia: '6' }))[0]), 'true');
t('B2 exige hemograma antes de hidratar',
  ctx.laboratorio(P({ edad: '34', peso: 70, alarma: ['abdominal'] })).some(x => /ANTES de hidratar/.test(x)), 'true');
t('B2: diuresis meta 0,5 ml/kg/h en 70 kg = 35 ml/h',
  ctx.monitoreo(P({ edad: '34', peso: 70, alarma: ['abdominal'] })).some(x => x.includes('35 ml/h')), 'true');

console.log('\n── Modelo del reporte (pantalla y Word) ───────────');

const rep = ctx.construirReporte(P({ nombre: 'Prueba', edad: '34', peso: 70, alarma: ['abdominal'] }));
t('El reporte trae categoría de intervención', rep.cat, 'B2');
t('El reporte trae clasificación SIVIGILA', rep.def.clasificacion, 'Dengue con signos de alarma');
t('El reporte trae la conducta de la categoría', rep.meta.conducta, 'Hospitalización en piso');
t('El reporte incluye la fiebre entre las manifestaciones',
  rep.hallazgos[0].items.includes('Fiebre'), 'true');
t('El reporte lista el signo de alarma marcado',
  rep.hallazgos[1].items[0], 'Dolor abdominal intenso y continuo');
t('El texto de conducta incluye la carga inicial',
  rep.conductaTexto.includes('700 ml en 1 hora'), 'true');
t('El texto de conducta incluye la clasificación SIVIGILA',
  rep.conductaTexto.includes('Dengue con signos de alarma'), 'true');
t('El texto de conducta incluye las contraindicaciones',
  rep.conductaTexto.includes('No administrar'), 'true');
t('El texto de conducta no queda vacío', rep.conductaTexto.length > 800, 'true');

const repA = ctx.construirReporte(P({ edad: '34', peso: 70 }));
t('Categoría A muestra criterios de referencia, no de alta',
  repA.criterios.titulo, 'Criterios de referencia al hospital');
t('Categoría B2 muestra criterios de alta',
  rep.criterios.titulo, 'Criterios de alta (deben cumplirse todos)');

console.log('\n───────────────────────────────────────────────────');
console.log(`  ${pass} pruebas correctas, ${fail} fallidas`);
console.log('───────────────────────────────────────────────────\n');
process.exit(fail ? 1 : 0);
