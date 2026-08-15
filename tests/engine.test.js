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
  nombre: '', fecha: '2026-08-12', fechaInicio: '', sinFecha: false, hora: '08:00', sexo: 'M', edad: '', edadU: 'a',
  peso: 0, talla: 0, usarPesoIdeal: false, embarazo: false, dia: '4',
  endemica: true, fiebre: true, manif: ['cefalea', 'mialgias'],
  alarma: [], grave: [], cond: [], social: [], toleraVO: true, diuresisOk: true,
  hctBasal: '', hctActual: '', hb: '', plaquetas: ''
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

console.log('\n── Día de enfermedad calculado por fechas ─────────');

t('Inicio 12 y consulta 13 de agosto = día 2 (el INS cuenta el inicio como día 1)',
  ctx.diaDeEnfermedad('2026-08-12', '2026-08-13'), 2);
t('Inicio y consulta el mismo día = día 1',
  ctx.diaDeEnfermedad('2026-08-13', '2026-08-13'), 1);
t('Inicio 8 y consulta 12 de agosto = día 5',
  ctx.diaDeEnfermedad('2026-08-08', '2026-08-12'), 5);
t('Cruza el cambio de mes: 30 de julio a 2 de agosto = día 4',
  ctx.diaDeEnfermedad('2026-07-30', '2026-08-02'), 4);
t('Cruza el cambio de año: 30 de diciembre a 2 de enero = día 4',
  ctx.diaDeEnfermedad('2025-12-30', '2026-01-02'), 4);
t('Año bisiesto: 27 de febrero a 1 de marzo de 2028 = día 4',
  ctx.diaDeEnfermedad('2028-02-27', '2028-03-01'), 4);
t('Inicio posterior a la consulta no devuelve día',
  ctx.diaDeEnfermedad('2026-08-14', '2026-08-13'), null);
t('Sin fecha de inicio no devuelve día', ctx.diaDeEnfermedad('', '2026-08-13'), null);
t('Fecha malformada no devuelve día', ctx.diaDeEnfermedad('13/08/2026', '2026-08-13'), null);

console.log('\n── Grupo A / B1: hidratación oral ─────────────────');

const A70 = ctx.planLiquidos(P({ edad: '34', peso: 70 }));
t('Adulto A: vía oral', A70.via, 'oral');
t('Adulto A: 2.000 a 3.000 ml en 24 h', A70.oral.principal, '2.000 a 3.000 ml en 24 h');
t('Adulto A: sin línea IV', A70.fases.length, 0);
t('Holliday-Segar 8 kg = 800 ml/día', ctx.holliday(8), 800);
t('Holliday-Segar 12 kg = 1.100 ml/día', ctx.holliday(12), 1100);
t('Holliday-Segar 25 kg = 1.600 ml/día', ctx.holliday(25), 1600);
t('Escolar 33 kg ambulatorio (A): Holliday-Segar puro = 1.760 ml/24 h',
  ctx.planLiquidos(P({ edad: '10', peso: 33 })).oral.principal, '1760 ml en 24 h');
t('Escolar 33 kg en grupo de riesgo (B1): Holliday-Segar + 5 % = 1.850 ml/24 h',
  ctx.planLiquidos(P({ edad: '10', peso: 33, cond: ['dm'] })).oral.principal, '1850 ml en 24 h');
t('Niño 12 kg ambulatorio (A): 1.100 ml/24 h',
  ctx.planLiquidos(P({ edad: '3', peso: 12 })).oral.principal, '1100 ml en 24 h');
t('Niño 12 kg en grupo de riesgo (B1): 1.160 ml/24 h',
  ctx.planLiquidos(P({ edad: '3', peso: 12, cond: ['menor5'] })).oral.principal, '1160 ml en 24 h');
t('El grupo A cita Holliday-Segar sin déficit',
  /100 ml\/kg los primeros 10 kg/.test(ctx.planLiquidos(P({ edad: '10', peso: 33 })).oral.detalle), 'true');
t('El grupo B1 explica por qué agrega el 5 %',
  /grupo de riesgo/.test(ctx.planLiquidos(P({ edad: '10', peso: 33, cond: ['dm'] })).oral.detalle), 'true');
t('Adulto: 2.000 a 3.000 ml en 24 h',
  ctx.planLiquidos(P({ edad: '34', peso: 70 })).oral.principal, '2.000 a 3.000 ml en 24 h');
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

t('Día 2 → NS1 o prueba rápida y RT-PCR',
  /NS1 por ELISA o prueba rápida, y RT-PCR/.test(ctx.pruebaConfirmatoria('2')), 'true');
t('Día 5 sigue dentro de la ventana molecular',
  /≤ 5 días/.test(ctx.pruebaConfirmatoria('5')), 'true');
t('Día 6 → IgM por ELISA', /IgM dengue por ELISA/.test(ctx.pruebaConfirmatoria('6')), 'true');
t('Sin día registrado → enuncia los dos cortes',
  /hasta el día 5.*desde el día 6/.test(ctx.pruebaConfirmatoria('')), 'true');

t('El NS1 negativo NO descarta el evento',
  /NEGATIVA no descarta el dengue/.test(ctx.NS1_NEGATIVO), 'true');
t('El NS1 positivo sí confirma el caso',
  /positiva, el caso queda confirmado/.test(ctx.NS1_NEGATIVO), 'true');
t('Ante NS1 negativo indica RT-PCR como técnica distinta',
  /RT-PCR — es una técnica distinta, molecular/.test(ctx.NS1_NEGATIVO), 'true');
t('Menciona el diagnóstico diferencial con chikungunya y Zika',
  /chikungunya y Zika/.test(ctx.NS1_NEGATIVO), 'true');
t('Dentro de los 5 días, el siguiente paso tras un negativo es RT-PCR',
  /solicitar RT-PCR/.test(ctx.siguientePaso('3')), 'true');
t('Pasado el día 5, el siguiente paso es repetir IgM en convaleciente',
  /suero convaleciente/.test(ctx.siguientePaso('7')), 'true');
t('La regla del negativo aparece en el listado de laboratorio',
  ctx.laboratorio(P({ edad: '34', peso: 70, dia: '3' })).some(x => /no descarta el dengue/.test(x)), 'true');
t('Ecografía y radiografía aparecen en todo el listado de laboratorio',
  ctx.laboratorio(P({ edad: '34', peso: 70 })).some(x => /Ecografía abdominal y radiografía de tórax/.test(x)), 'true');
t('B2 exige hemograma antes de hidratar',
  ctx.laboratorio(P({ edad: '34', peso: 70, alarma: ['abdominal'] })).some(x => /ANTES de hidratar/.test(x)), 'true');
t('B2: diuresis meta 0,5 ml/kg/h en 70 kg = 35 ml/h',
  ctx.monitoreo(P({ edad: '34', peso: 70, alarma: ['abdominal'] })).some(x => x.includes('35 ml/h')), 'true');

console.log('\n── Ausencia confirmada de signos ──────────────────');

const sinNada = P({ edad: '34', peso: 70, sinAlarma: true, sinGrave: true });
const repSin = ctx.construirReporte(sinNada);
t('Confirmar "ninguno" deja constancia del negativo en signos de alarma',
  repSin.hallazgos.some(h => h.titulo === 'Signos de alarma' && /Ninguno — buscados/.test(h.items[0])), 'true');
t('Confirmar "ninguna" deja constancia en manifestaciones graves',
  repSin.hallazgos.some(h => h.titulo === 'Manifestaciones graves' && /Ninguna — buscadas/.test(h.items[0])), 'true');
t('El negativo confirmado va en verde, no en naranja',
  repSin.hallazgos.find(h => h.titulo === 'Signos de alarma').color, '2E7D32');
t('El texto de conducta consigna el negativo de alarma',
  /ninguno, buscados dirigidamente y ausentes/.test(repSin.conductaTexto), 'true');
t('El texto de conducta consigna el negativo de gravedad',
  /ninguna, buscadas dirigidamente y ausentes/.test(repSin.conductaTexto), 'true');

const sinConfirmar = ctx.construirReporte(P({ edad: '34', peso: 70 }));
t('Sin confirmar, el reporte NO afirma que no haya signos de alarma',
  sinConfirmar.hallazgos.some(h => h.titulo === 'Signos de alarma'), 'false');
t('Sin confirmar, la conducta dice "no consignados"',
  /SIGNOS DE ALARMA: no consignados/.test(sinConfirmar.conductaTexto), 'true');
t('Confirmar ausencia no cambia la categoría de intervención',
  ctx.clasificar(sinNada), 'A');

console.log('\n── Torniquete y signos vitales ────────────────────');

t('Torniquete positivo entra en las manifestaciones del reporte',
  ctx.construirReporte(P({ edad: '34', peso: 70, torniquete: 'pos' })).hallazgos[0].items
    .some(x => /torniquete: positiva/.test(x)), 'true');
t('Torniquete no realizado no ensucia el reporte',
  ctx.construirReporte(P({ edad: '34', peso: 70, torniquete: 'nr' })).hallazgos[0].items
    .some(x => /torniquete/.test(x)), 'false');
t('El torniquete no altera la definición de caso',
  ctx.definicionCaso(P({ edad: '34', peso: 70, manif: ['cefalea'], torniquete: 'pos' })).cumple, 'false');

t('PAM de 90/60 = 70 mmHg', ctx.pam(P({ pas: '90', pad: '60' })), 70);
t('Presión de pulso de 95/78 = 17 mmHg', ctx.presionPulso(P({ pas: '95', pad: '78' })), 17);
t('Presión de pulso ≤ 20 se anota como choque compensado',
  /choque compensado/.test(ctx.vitalesTabla(P({ pas: '95', pad: '78' }))[2][1]), 'true');
t('Sin tensión arterial no inventa PAM', ctx.pam(P({ pas: '', pad: '' })), null);
t('Los parámetros no registrados se marcan como tales',
  ctx.vitalesTabla(P({}))[3][1], 'Sin registrar');

console.log('\n── Umbral de choque (evaluación compuesta) ────────');

/* El caso que reportó el usuario: TA 80/40 con presión de pulso amplia.
   La app antes decía "por encima del umbral de choque" — falsa tranquilidad. */
const choqueReal = P({ edad: '34', peso: 70, pas: '80', pad: '40', fc: '100', fr: '25',
                       temp: '38', sato2: '89', llenado: '> 2 segundos', conciencia: 'Somnoliento o irritable' });
const hReal = ctx.evaluacionHemodinamica(choqueReal);
t('TA 80/40 en adulto se reconoce como choque hipotenso', hReal.nivel, 'hipotenso');
t('Detecta la hipotensión pese a que la presión de pulso es de 40 mmHg',
  hReal.hallazgos.some(x => /Hipotensión: PAS 80/.test(x)), 'true');
t('Advierte que la hipotensión es signo TARDÍO', /signo TARDÍO/.test(hReal.mensaje), 'true');
t('Dice explícitamente que una presión de pulso amplia no descarta el choque',
  /NO descarta el choque/.test(hReal.mensaje), 'true');
t('Recoge el llenado capilar prolongado',
  hReal.hallazgos.some(x => /Llenado capilar > 2 segundos/.test(x)), 'true');
t('Recoge la PAM baja', hReal.hallazgos.some(x => /PAM 53 mmHg/.test(x)), 'true');
t('Recoge la alteración de conciencia',
  hReal.hallazgos.some(x => /somnoliento o irritable/.test(x)), 'true');
t('Recoge la desaturación', hReal.hallazgos.some(x => /Saturación de oxígeno 89/.test(x)), 'true');
t('Nunca dice "por encima del umbral de choque"',
  /por encima del umbral de choque/i.test(hReal.mensaje + hReal.titulo), 'false');

t('Presión de pulso ≤ 20 con PAS conservada = choque compensado',
  ctx.evaluacionHemodinamica(P({ edad: '34', pas: '110', pad: '95' })).nivel, 'compensado');
t('Llenado capilar > 2 s por sí solo levanta la bandera de choque compensado',
  ctx.evaluacionHemodinamica(P({ edad: '34', llenado: '> 2 segundos' })).nivel, 'compensado');
t('Signos vitales normales no generan alarma',
  ctx.evaluacionHemodinamica(P({ edad: '34', pas: '120', pad: '80', fc: '88',
    sato2: '98', llenado: '< 2 segundos', conciencia: 'Alerta' })).nivel, 'estable');
t('Aun estable, recuerda que el choque se instala en horas',
  /se instala en horas/.test(ctx.evaluacionHemodinamica(P({ edad: '34', pas: '120', pad: '80' })).mensaje), 'true');
t('Sin datos registrados no afirma que el paciente esté bien',
  ctx.evaluacionHemodinamica(P({ edad: '34' })).hallazgos.length, 0);

console.log('\n── Umbrales por edad (tabla del CDC) ──────────────');

t('Lactante de 6 meses: hipotensión con PAS < 70',
  ctx.umbralHipotension(P({ edad: '6', edadU: 'm' })), 70);
t('12 meses: PAS < 72', ctx.umbralHipotension(P({ edad: '12', edadU: 'm' })), 72);
t('2 años: PAS < 74', ctx.umbralHipotension(P({ edad: '2' })), 74);
t('5 años: PAS < 80', ctx.umbralHipotension(P({ edad: '5' })), 80);
t('8 años: PAS < 86', ctx.umbralHipotension(P({ edad: '8' })), 86);
t('10 años: PAS < 90', ctx.umbralHipotension(P({ edad: '10' })), 90);
t('Adulto: PAS < 90', ctx.umbralHipotension(P({ edad: '34' })), 90);

t('Niño de 6 meses con PAS 68 es hipotenso',
  ctx.evaluacionHemodinamica(P({ edad: '6', edadU: 'm', pas: '68', pad: '40' })).nivel, 'hipotenso');
t('Niño de 6 meses con PAS 80 no es hipotenso por ese criterio',
  ctx.evaluacionHemodinamica(P({ edad: '6', edadU: 'm', pas: '80', pad: '55' })).hipotenso, 'false');
t('Adulto con PAS 85 sí es hipotenso',
  ctx.evaluacionHemodinamica(P({ edad: '34', pas: '85', pad: '45' })).hipotenso, 'true');

t('Taquicardia del lactante: umbral 160', ctx.umbralTaquicardia(P({ edad: '6', edadU: 'm' })), 160);
t('Taquicardia del preescolar de 4 años: umbral 140', ctx.umbralTaquicardia(P({ edad: '4' })), 140);
t('Taquicardia del adulto: umbral 100', ctx.umbralTaquicardia(P({ edad: '34' })), 100);
t('FC 130 en adulto se marca como taquicardia',
  ctx.evaluacionHemodinamica(P({ edad: '34', fc: '130' })).hallazgos.some(x => /Taquicardia/.test(x)), 'true');
t('FC 130 en lactante NO se marca como taquicardia',
  ctx.evaluacionHemodinamica(P({ edad: '6', edadU: 'm', fc: '130' })).hallazgos.some(x => /Taquicardia/.test(x)), 'false');

t('El reporte incorpora la evaluación hemodinámica',
  ctx.construirReporte(choqueReal).hemo.nivel, 'hipotenso');
t('La conducta copiada consigna el choque hipotenso',
  /Choque hipotenso/.test(ctx.construirReporte(choqueReal).conductaTexto), 'true');

console.log('\n── Hemoconcentración ──────────────────────────────');

t('Delta de 38 % a 48 % = +26,3 %', ctx.deltaHematocrito(38, 48), 26.3);
t('Delta de 45 % a 36 % = −20 %', ctx.deltaHematocrito(45, 36), -20);
t('Sin basal no calcula delta', ctx.deltaHematocrito('', 48), null);
t('Basal cero no divide por cero', ctx.deltaHematocrito(0, 48), null);

const fuga = P({ edad: '34', peso: 70, hctBasal: '38', hctActual: '48' });
t('Ascenso ≥ 20 % se lee como extravasación de plasma',
  ctx.interpretarHematocrito(fuga).nivel, 'fuga');
t('Indica marcar el signo de alarma que lleva a B2',
  ctx.interpretarHematocrito(fuga).acciones.some(x => /categoría B2/.test(x)), 'true');

const ascensoLeve = P({ edad: '34', peso: 70, hctBasal: '40', hctActual: '44' });
t('Ascenso menor al 20 % se marca como aviso temprano',
  ctx.interpretarHematocrito(ascensoLeve).nivel, 'ascenso');
t('Explica que el ascenso precede a los cambios de tensión arterial',
  /precede a los cambios de tensión arterial/.test(ctx.interpretarHematocrito(ascensoLeve).mensaje), 'true');

/* El cruce que define el módulo: la misma caída significa lo contrario según la hemodinamia */
const caidaInestable = P({ edad: '34', peso: 70, hctBasal: '48', hctActual: '36',
                           pas: '80', pad: '40', llenado: '> 2 segundos' });
const caidaEstable = P({ edad: '34', peso: 70, hctBasal: '48', hctActual: '36',
                         pas: '120', pad: '80', fc: '80', llenado: '< 2 segundos', conciencia: 'Alerta' });
t('Hematocrito que cae CON inestabilidad = sangrado',
  ctx.interpretarHematocrito(caidaInestable).nivel, 'sangrado');
t('Advierte que no debe leerse como mejoría',
  /No lo interprete como mejoría/.test(ctx.interpretarHematocrito(caidaInestable).mensaje), 'true');
t('Indica prueba cruzada y transfusión',
  ctx.interpretarHematocrito(caidaInestable).acciones.some(x => /prueba cruzada/.test(x)), 'true');
t('La MISMA caída CON estabilidad = reabsorción y mejoría',
  ctx.interpretarHematocrito(caidaEstable).nivel, 'mejoria');
t('Y en ese caso indica suspender los líquidos',
  ctx.interpretarHematocrito(caidaEstable).acciones.some(x => /suspender los líquidos/.test(x)), 'true');

t('Plaquetas < 100.000 generan la nota del signo de alarma',
  ctx.interpretarHematocrito(P({ edad: '34', peso: 70, plaquetas: '85000' })).notas
    .some(x => /signo de alarma/.test(x)), 'true');
t('Hematocrito incoherente con la hemoglobina se marca',
  ctx.interpretarHematocrito(P({ edad: '34', peso: 70, hctActual: '48', hb: '11' })).notas
    .some(x => /Comprobación de coherencia/.test(x)), 'true');
t('Hematocrito coherente con la hemoglobina no genera ruido',
  ctx.interpretarHematocrito(P({ edad: '34', peso: 70, hctActual: '45', hb: '15' })).notas
    .some(x => /Comprobación de coherencia/.test(x)), 'false');

console.log('\n── Seguridad de la infusión ───────────────────────');

t('Furosemida en 70 kg: 7 a 35 mg por dosis',
  ctx.furosemida(P({ edad: '34', peso: 70 })).dosis, '7 – 35 mg por dosis, una o dos veces al día');
t('Infusión continua 0,1 mg/kg/hora',
  /7 mg\/hora/.test(ctx.furosemida(P({ edad: '34', peso: 70 })).infusion), 'true');

t('Día 4: la fase crítica NO ha terminado', ctx.faseCriticaTerminada(P({ dia: '4' })), 'false');
t('Día 6: todavía no se da por terminada', ctx.faseCriticaTerminada(P({ dia: '6' })), 'false');
t('Día 7: se considera terminada', ctx.faseCriticaTerminada(P({ dia: '7' })), 'true');
t('Sin día registrado no se asume terminada', ctx.faseCriticaTerminada(P({ dia: '' })), 'false');

const segCritica = ctx.moduloSeguridad(P({ edad: '34', peso: 70, dia: '4', alarma: ['abdominal'] }));
const modSobre = segCritica.modulos[0];
t('En fase crítica la furosemida queda bloqueada', modSobre.permitido, 'false');
t('Y lo dice con la cita de la OMS',
  /Avoid diuretics during the plasma leakage phase/.test(modSobre.advertencia), 'true');
t('Explica el mecanismo del daño',
  /vacía el espacio intravascular/.test(modSobre.advertencia), 'true');

const segTardia = ctx.moduloSeguridad(P({ edad: '34', peso: 70, dia: '8', alarma: ['abdominal'] }));
t('Pasada la fase crítica la furosemida se admite', segTardia.modulos[0].permitido, 'true');

t('El módulo de oliguria advierte contra restringir líquidos al hipovolémico',
  /Restringir líquidos a un paciente anúrico/.test(segCritica.modulos[1].advertencia), 'true');
t('Y reconoce que las guías no fijan una regla numérica',
  /no fijan una regla numérica/.test(segCritica.modulos[1].advertencia), 'true');
t('El discriminador de sangrado calcula la transfusión por peso',
  segCritica.modulos[2].conducta.some(x => /350 – 700 ml/.test(x)), 'true');
t('El cierre de líquidos se activa desde el día 6',
  ctx.moduloSeguridad(P({ edad: '34', peso: 70, dia: '6', alarma: ['abdominal'] })).modulos[3].activo, 'true');
t('El cierre aclara que la señal es fisiológica y no del calendario',
  /no del calendario/.test(segCritica.modulos[3].conducta[0]), 'true');

t('El módulo de seguridad aplica en B2',
  ctx.moduloSeguridad(P({ edad: '34', peso: 70, alarma: ['abdominal'] })).aplica, 'true');
t('El módulo de seguridad aplica en C',
  ctx.moduloSeguridad(P({ edad: '34', peso: 70, grave: ['shock'] })).aplica, 'true');
t('No aplica en manejo ambulatorio sin líquidos intravenosos',
  ctx.moduloSeguridad(P({ edad: '34', peso: 70 })).aplica, 'false');

console.log('\n── Grupo B2 reducido (OPS/CDE 2020) ───────────────');

const b2Normal = P({ edad: '34', peso: 70, alarma: ['abdominal'] });
const b2Mayor = P({ edad: '70', peso: 70, alarma: ['abdominal'] });
const b2Comorb = P({ edad: '40', peso: 70, alarma: ['abdominal'], cond: ['dm'] });

t('Adulto sano con alarma conserva la carga de 10 ml/kg', ctx.b2Reducido(b2Normal), 'false');
t('Adulto mayor con alarma usa el esquema reducido', ctx.b2Reducido(b2Mayor), 'true');
t('Comorbilidad con alarma usa el esquema reducido', ctx.b2Reducido(b2Comorb), 'true');
t('Gestante con alarma usa el esquema reducido',
  ctx.b2Reducido(P({ edad: '28', sexo: 'F', peso: 60, embarazo: true, alarma: ['abdominal'] })), 'true');
t('"Menor de 5 años" no cuenta como comorbilidad',
  ctx.tieneComorbilidad(P({ edad: '3', cond: ['menor5'] })), 'false');

t('Reducido: carga de 5 ml/kg = 350 ml en 1 h', fase(b2Mayor, 0).rate, '350 ml en 1 hora');
t('Reducido: fase 2 a 4 ml/kg/h = 280 ml/h', fase(b2Mayor, 2).rate, '280 ml/h');
t('Reducido: fase 3 a 3 ml/kg/h = 210 ml/h', fase(b2Mayor, 3).rate, '210 ml/h');
t('Reducido: mantenimiento a 2 ml/kg/h = 140 ml/h', fase(b2Mayor, 4).rate, '140 ml/h');
t('Reducido: explica el motivo del esquema', /Esquema reducido por/.test(fase(b2Mayor, 0).nota), 'true');
t('No reducido: la carga sigue en 700 ml', fase(b2Normal, 0).rate, '700 ml en 1 hora');
t('El plan marca la bandera de esquema reducido', ctx.planLiquidos(b2Mayor).reducido, 'true');

t('La conducta copiada incluye la seguridad de la infusión',
  /SEGURIDAD DE LA INFUSIÓN/.test(ctx.construirReporte(b2Normal).conductaTexto), 'true');
t('La conducta copiada condiciona la furosemida',
  /SOLO con la fase crítica terminada/.test(ctx.construirReporte(b2Normal).conductaTexto), 'true');

console.log('\n── Instrumento de auditoría (ítems 1–17) ──────────');

const aud = ctx.auditoria(P({
  edad: '34', peso: 70, dia: '4', temp: '38.5', fc: '110', fr: '22', sato2: '96',
  pas: '95', pad: '78', llenado: '> 2 segundos', conciencia: 'Alerta',
  torniquete: 'pos', alarma: ['abdominal', 'liquidos'], cond: ['dm'], social: ['solo']
}));
t('Tres bloques: anamnesis, examen físico y laboratorio', aud.length, 3);
t('Bloque A cubre los ítems 1 a 7', aud[0].items.length, 7);
t('Bloque B cubre los ítems 8 a 13', aud[1].items.length, 6);
t('Bloque C cubre los ítems 14 a 17', aud[2].items.length, 4);
t('Ítem 3 recoge el nexo epidemiológico',
  /área endémica/.test(aud[0].items[2].valor), 'true');
t('Ítem 4 recoge los antecedentes marcados',
  /Diabetes mellitus/.test(aud[0].items[3].valor), 'true');
t('Ítem 5 recoge el riesgo social',
  /Vive solo/.test(aud[0].items[4].valor), 'true');
t('Ítem 8 recoge los signos vitales capturados',
  /FC 110 lpm/.test(aud[1].items[0].valor), 'true');
t('Ítem 10 calcula la PAM y la presión de pulso',
  /PAM 84 mmHg · Presión de pulso 17 mmHg/.test(aud[1].items[2].valor), 'true');
t('Ítem 11 consigna el resultado del torniquete',
  /torniquete: Positiva/.test(aud[1].items[3].valor), 'true');
t('Ítem 13 recoge los hallazgos abdominales marcados',
  /Dolor abdominal intenso y continuo/.test(aud[1].items[5].valor), 'true');
t('Ítem 15 marca ecografía y radiografía como INDICADAS si hay acumulación de líquidos',
  /INDICADAS/.test(aud[2].items[1].valor), 'true');
t('Ítem 16 marca los paraclínicos como indicados en B2',
  /INDICADOS/.test(aud[2].items[2].valor), 'true');
t('Ítem 17 trae la prueba según el día de evolución',
  /Día 4 de evolución/.test(aud[2].items[3].valor), 'true');
t('Ítem 17 advierte que un negativo no descarta el evento',
  /no descarta el evento/.test(aud[2].items[3].valor), 'true');
t('Ítem 9 queda como campo por completar (no lo captura la app)',
  aud[1].items[1].valor, 'null');
t('Ítem 12 queda como campo por completar', aud[1].items[2 + 2].valor === null, 'true');

const audSin = ctx.auditoria(P({ edad: '34', peso: 70, sinAlarma: true }));
t('Ítem 6 registra la ausencia confirmada de signos de alarma',
  /ninguno presente/.test(audSin.items ? '' : audSin[0].items[5].valor), 'true');
t('Ítem 15 sin fuga vascular queda como condicional',
  /Solicitar si aparecen/.test(ctx.auditoria(P({ edad: '34', peso: 70 }))[2].items[1].valor), 'true');

t('El reporte incorpora el bloque de auditoría',
  ctx.construirReporte(P({ edad: '34', peso: 70 })).auditoria.length, 3);
t('El reporte incorpora la tabla de signos vitales',
  ctx.construirReporte(P({ edad: '34', peso: 70 })).vitales.length, 9);

console.log('\n── Dipirona y versión ─────────────────────────────');

t('Dipirona: solo si es necesario y en dosis única',
  ctx.NO_HACER.some(x => /solo si es necesario y en DOSIS ÚNICA/.test(x)), 'true');
t('Dipirona conserva las restricciones de nivel y vía',
  ctx.NO_HACER.some(x => /nunca por vía intramuscular ni en pacientes pediátricos/.test(x)), 'true');
t('La conducta copiada incluye las restricciones completas',
  /DOSIS ÚNICA/.test(ctx.construirReporte(P({ edad: '34', peso: 70 })).conductaTexto), 'true');
t('Existe una única constante de versión', typeof ctx.APP_VERSION, 'string');

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
