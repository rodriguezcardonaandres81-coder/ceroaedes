/* Recorrido de interfaz con navegador real.  node tests/ui.test.js
   Flujo de 7 pasos: definición de caso → paciente y signos vitales → torniquete →
   signos de alarma → manifestaciones graves → condiciones → resultado. */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const URL = 'file://' + path.join(__dirname, '..', 'index.html');
const OUT = path.join(__dirname, '..', 'shots');
const TMP = path.join(__dirname, '..', '.tmp');
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(TMP, { recursive: true });

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const ctx = await browser.newContext({ viewport: { width: 470, height: 900 }, deviceScaleFactor: 2, acceptDownloads: true });
  const page = await ctx.newPage();
  const errores = [], dialogos = [];
  page.on('console', m => { if (m.type() === 'error') errores.push(m.text()); });
  page.on('pageerror', e => errores.push('pageerror: ' + e.message));
  page.on('dialog', d => { dialogos.push(d.message()); d.dismiss(); });

  const shot = n => page.screenshot({ path: path.join(OUT, n + '.png'), fullPage: true });
  const marcar = (lista, i) => page.locator(`#list-${lista} .chk`).nth(i).click();
  const ninguno = zona => page.locator(`#ninguno-${zona} .chk`).click();
  const avanzar = n => page.click(`#s${n} button:has-text("Siguiente")`);

  /* Paso 1 — definición de caso */
  async function definicionCaso({ endemica = true, fiebre = true, manifs = [0, 2] } = {}) {
    await page.goto(URL);
    await page.click('#s0 button:has-text("Comenzar")');
    await page.waitForSelector('#s1.active');
    if (endemica) await page.locator('#f-endemica').click();
    if (fiebre) await page.locator('#f-fiebre').click();
    for (const i of manifs) await marcar('manif', i);
  }

  /* Paso 2 — paciente, fechas y signos vitales */
  async function llenarPaciente({ edad = '34', unidad = 'a', peso = '70', inicio = '2026-08-10',
                                  consulta = '2026-08-13', hora = '08:00', nombre = '', vitales = null } = {}) {
    await avanzar(1);
    if (nombre) await page.fill('#f-nombre', nombre);
    await page.fill('#f-edad', edad);
    if (unidad !== 'a') await page.selectOption('#f-edad-u', unidad);
    await page.fill('#f-peso', peso);
    await page.fill('#f-inicio', inicio);
    await page.fill('#f-fecha', consulta);
    await page.fill('#f-hora', hora);
    if (vitales) for (const [campo, valor] of Object.entries(vitales)) {
      if (campo === 'llenado' || campo === 'conciencia') await page.selectOption('#f-' + campo, valor);
      else await page.fill('#f-' + campo, valor);
    }
  }

  // ================= Caso 0: bienvenida =================
  await page.goto(URL);
  if (!(await page.locator('#s0.active').count())) throw new Error('La app no abre en la bienvenida');
  if (!(await page.locator('#progress').isHidden())) throw new Error('La barra de pasos no debe verse en la bienvenida');
  const bienv = await page.locator('#s0').innerText();
  for (const e of ['CeroAedes', 'Apoyo a la decisión clínica en dengue', 'No reemplaza el juicio clínico',
                   'Clasifica', 'Calcula líquidos', 'Exporta a Word'])
    if (!bienv.includes(e)) throw new Error('Falta en la bienvenida: ' + e);
  if (!(await page.locator('#s0 .w-svg .mosco').count())) throw new Error('Falta el mosquito animado');
  if (!(await page.locator('#s0 .w-svg .ban').count())) throw new Error('Falta la señal de prohibido');
  await page.waitForTimeout(1500);
  await shot('00-bienvenida');
  await page.click('#s0 button:has-text("Comenzar")');
  await page.waitForSelector('#s1.active');
  if (await page.locator('#progress').isHidden()) throw new Error('La barra de pasos debe reaparecer al entrar');
  await page.click('#s1 button:has-text("Atrás")');
  await page.waitForSelector('#s0.active');
  console.log('  OK   │ Caso 0: bienvenida animada, sin barra de pasos, con ida y vuelta a la definición de caso');

  // ================= Caso 1: recorrido completo → B2 =================
  await definicionCaso();
  if (!/Definición de caso de dengue/.test(await page.locator('#s1 .step-title').innerText()))
    throw new Error('La app no abre en la definición de caso');
  const cnt = await page.locator('#manif-count').innerText();
  if (!/Cumple la definición/.test(cnt)) throw new Error('No reconoció el caso probable: ' + cnt);
  if (!(await page.locator('#manif-count.ok').count())) throw new Error('El contador no quedó en verde');
  await shot('01-definicion-caso');

  await llenarPaciente({
    nombre: 'Paciente de prueba',
    vitales: { pas: '95', pad: '78', fc: '110', fr: '22', temp: '38.5', sato2: '96',
               llenado: '> 2 segundos', conciencia: 'Alerta' }
  });
  const diaTxt = await page.locator('#dia-calc').innerText();
  if (!/Día 4 de enfermedad/.test(diaTxt)) throw new Error('Día mal calculado: ' + diaTxt);
  if (!(await page.locator('#fase-critica-alert .note.danger').count()))
    throw new Error('No se mostró la alerta de fase crítica en día 4 (adulto)');
  const pptxt = await page.locator('#pp-out').innerText();
  if (!/17 mmHg/.test(pptxt)) throw new Error('Presión de pulso mal calculada');
  if (!/PAM 84 mmHg/.test(pptxt)) throw new Error('PAM mal calculada: ' + pptxt);
  if (!(await page.locator('#pp-out.danger').count())) throw new Error('PP ≤20 no marcó alerta');
  await shot('02-paciente-vitales');
  await avanzar(2);

  if (!/Realice la prueba del torniquete/.test(await page.locator('#s3 .step-title').innerText()))
    throw new Error('La pantalla 3 no es el torniquete');
  if (!/Insufle el manguito/.test(await page.locator('#s3').innerText()))
    throw new Error('Sigue diciendo "infle" en vez de "insufle"');
  await page.selectOption('#f-torniquete', 'pos');
  await shot('03-torniquete');
  await avanzar(3);

  if (!/Verifique signos de alarma/.test(await page.locator('#s4 .step-title').innerText()))
    throw new Error('La pantalla 4 no es la de signos de alarma');
  const nAlarma = await page.locator('#list-alarma .chk').count();
  if (nAlarma !== 12) throw new Error('Se esperaban 12 signos de alarma, hay ' + nAlarma);
  await marcar('alarma', 2);                      // diarrea
  await shot('04-alarma');
  await avanzar(4);

  if (!/Verifique manifestaciones graves de dengue/.test(await page.locator('#s5 .step-title').innerText()))
    throw new Error('La pantalla 5 no es la de manifestaciones graves');
  const nGrave = await page.locator('#list-grave .chk').count();
  if (nGrave !== 4) throw new Error('Se esperaban 4 criterios de gravedad, hay ' + nGrave);
  const hemo = await page.locator('#resumen-hemo').innerText();
  for (const e of ['TA 95/78', 'PAM 84', 'presión de pulso 17', 'criterios compatibles con choque'])
    if (!hemo.includes(e)) throw new Error('El resumen hemodinámico no trae: ' + e);
  if (!(await page.locator('#resumen-hemo .note.danger').count()))
    throw new Error('El resumen hemodinámico no marcó la alerta de choque');
  await shot('05-graves');
  await ninguno('grave');
  await avanzar(5);
  await shot('06-condiciones');

  await page.click('button:has-text("Clasificar")');
  await page.waitForSelector('#s7.active');
  const salida = await page.locator('#out').innerText();
  if (!/categoría de intervención B2/i.test(salida)) throw new Error('Clasificación errónea');
  if (!/Dengue con signos de alarma/.test(await page.locator('.sivi .val').innerText()))
    throw new Error('Bloque SIVIGILA incorrecto');
  for (const e of ['700 ml en 1 hora', '350 – 490 ml/h', '210 – 350 ml/h', '140 – 280 ml/h',
                   '233 gotas/min', '500 mg cada 6 horas', 'Diarrea', 'torniquete: positiva']) {
    if (!salida.includes(e)) throw new Error('Falta en el resultado: ' + e);
  }
  await shot('07-resultado-B2');
  console.log('  OK   │ Caso 1: recorrido de 7 pasos → B2, día calculado por fechas, torniquete positivo');

  // ---- Word y conducta copiada ----
  const [descarga] = await Promise.all([
    page.waitForEvent('download'),
    page.click('button:has-text("Exportar a Word")')
  ]);
  const docxPath = path.join(TMP, 'reporte.docx');
  await descarga.saveAs(docxPath);
  if (!/^CeroAedes_.*\.docx$/.test(descarga.suggestedFilename()))
    throw new Error('Nombre de archivo inesperado: ' + descarga.suggestedFilename());
  if (fs.statSync(docxPath).size < 2000) throw new Error('El .docx generado es sospechosamente pequeño');

  await ctx.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.click('button:has-text("Copiar conducta")');
  await page.waitForTimeout(300);
  const portapapeles = await page.evaluate(() => navigator.clipboard.readText());
  for (const e of ['CONDUCTA — DENGUE', 'Dengue con signos de alarma', '700 ml en 1 hora',
                   'DOSIS ÚNICA', 'No administrar aspirina'])
    if (!portapapeles.includes(e)) throw new Error('Falta en la conducta copiada: ' + e);
  console.log('  OK   │ Word descargado y conducta copiada con el plan completo');

  // ================= Caso 2: el caso del pediatra — 33 kg ambulatorio =================
  await definicionCaso({ manifs: [1, 3] });
  await llenarPaciente({ edad: '10', peso: '33', inicio: '2026-08-12', consulta: '2026-08-13' });
  if (!/Día 2 de enfermedad/.test(await page.locator('#dia-calc').innerText()))
    throw new Error('Inicio el 12 y consulta el 13 debe dar día 2');
  await avanzar(2); await avanzar(3);
  await ninguno('alarma'); await avanzar(4);
  await ninguno('grave'); await avanzar(5);
  await page.click('button:has-text("Clasificar")');
  await page.waitForSelector('#s7.active');
  const out2 = await page.locator('#out').innerText();
  if (!/categoría de intervención A/i.test(out2)) throw new Error('Escolar sin hallazgos debería ser A');
  if (!out2.includes('1760 ml en 24 h'))
    throw new Error('Holliday-Segar puro para 33 kg debe dar 1760 ml, no otro valor');
  if (out2.includes('1850 ml')) throw new Error('No debe aplicar el 5 % de déficit en categoría A');
  if (!/100 ml\/kg los primeros 10 kg/.test(out2)) throw new Error('No explica la fórmula de Holliday-Segar');
  for (const e of ['330 – 495 mg por dosis', '11 – 16.5 ml por dosis'])
    if (!out2.includes(e)) throw new Error('Falta dosis pediátrica: ' + e);
  await shot('08-resultado-A-33kg');
  console.log('  OK   │ Caso 2: escolar 33 kg ambulatorio → 1.760 ml/24 h (Holliday-Segar sin déficit)');

  // ---- El mismo niño, ahora en grupo de riesgo: sí lleva el 5 % ----
  await definicionCaso({ manifs: [1, 3] });
  await llenarPaciente({ edad: '10', peso: '33' });
  await avanzar(2); await avanzar(3);
  await ninguno('alarma'); await avanzar(4);
  await ninguno('grave'); await avanzar(5);
  await marcar('cond', 2);                          // diabetes mellitus
  await page.click('button:has-text("Clasificar")');
  await page.waitForSelector('#s7.active');
  const out2b = await page.locator('#out').innerText();
  if (!/categoría de intervención B1/i.test(out2b)) throw new Error('Con condición asociada debería ser B1');
  if (!out2b.includes('1850 ml en 24 h')) throw new Error('En B1 debe aplicar Holliday-Segar + 5 % = 1850 ml');
  if (!/grupo de riesgo/.test(out2b)) throw new Error('No explica por qué agrega el 5 %');
  console.log('  OK   │ El mismo niño en grupo de riesgo → 1.850 ml/24 h (Holliday-Segar + 5 %)');

  // ================= Caso 3: no cumple definición pero requiere manejo =================
  await definicionCaso({ endemica: false, manifs: [0] });
  await llenarPaciente({ peso: '70' });
  await avanzar(2); await avanzar(3);
  await marcar('alarma', 1);                        // vómito persistente
  await avanzar(4);
  await ninguno('grave'); await avanzar(5);
  await page.click('button:has-text("Clasificar")');
  await page.waitForSelector('#s7.active');
  const sivi = await page.locator('.sivi').innerText();
  if (!/No cumple la definición de caso probable/.test(sivi)) throw new Error('Debería no cumplir la definición');
  if (!/área endémica/.test(sivi)) throw new Error('No reportó el criterio faltante');
  if (!/categoría de intervención B2/i.test(await page.locator('#out').innerText()))
    throw new Error('Aun sin cumplir definición debe manejarse como B2');
  await shot('09-no-cumple-definicion');
  console.log('  OK   │ Caso 3: no notificable por falta de área endémica, pero conducta B2 igual');

  // ================= Caso 4: gestante en choque → C =================
  await definicionCaso({ manifs: [0, 4] });
  await llenarPaciente({ edad: '28', peso: '60', inicio: '2026-08-09', consulta: '2026-08-13' });
  await page.click('#seg-sexo button[data-v="F"]');
  await page.locator('#f-embarazo').click();
  await avanzar(2); await avanzar(3);
  await ninguno('alarma'); await avanzar(4);
  await marcar('grave', 2);                          // shock por dengue
  await avanzar(5);
  await page.click('button:has-text("Clasificar")');
  await page.waitForSelector('#s7.active');
  const out4 = await page.locator('#out').innerText();
  if (!/categoría de intervención C/i.test(out4)) throw new Error('Choque debería ser C');
  for (const e of ['Dengue grave', '600 ml en 15 – 30 min', 'Dosis reducida a 10 ml/kg', '300 – 600 ml (glóbulos rojos'])
    if (!out4.includes(e)) throw new Error('Falta en resultado C: ' + e);
  await shot('10-resultado-C-gestante');
  console.log('  OK   │ Caso 4: gestante en choque → C, bolo 10 ml/kg y SIVIGILA "dengue grave"');

  // ================= Caso 5: validaciones y bloqueos =================
  await definicionCaso();
  await avanzar(1);
  dialogos.length = 0;
  await page.fill('#f-edad', '40');
  await avanzar(2);
  await page.waitForTimeout(200);
  if (!dialogos.some(d => /peso/i.test(d))) throw new Error('No bloqueó el avance sin peso');
  if (!(await page.locator('#s2.active').count())) throw new Error('Avanzó sin peso');

  await page.fill('#f-peso', '130');
  await page.click('#seg-sexo button[data-v="M"]');
  await page.fill('#f-talla', '175');
  await page.waitForTimeout(100);
  if (await page.locator('#peso-ideal-box').isHidden()) throw new Error('No ofreció el ajuste por peso ideal');
  if ((await page.locator('#pi-val').innerText()) !== '70.5') throw new Error('Peso ideal incorrecto');
  await avanzar(2); await avanzar(3);

  dialogos.length = 0;
  await avanzar(4);
  await page.waitForTimeout(200);
  if (!dialogos.some(d => /signos de alarma/i.test(d))) throw new Error('No exigió confirmar los signos de alarma');
  if (!(await page.locator('#s4.active').count())) throw new Error('Avanzó sin confirmar signos de alarma');
  await ninguno('alarma'); await avanzar(4);
  dialogos.length = 0;
  await avanzar(5);
  await page.waitForTimeout(200);
  if (!dialogos.some(d => /manifestaciones graves/i.test(d))) throw new Error('No exigió confirmar las manifestaciones graves');
  console.log('  OK   │ Caso 5: exige peso, ofrece peso ideal y no deja avanzar sin confirmar ausencias');

  // "Ninguno" y marcar un signo son excluyentes
  await page.click('#s5 button:has-text("Atrás")');
  await page.waitForSelector('#s4.active');
  await marcar('alarma', 0);
  if (await page.locator('#ninguno-alarma .chk input').isChecked())
    throw new Error('Marcar un signo debería desactivar "Ninguno"');
  await ninguno('alarma');
  if (await page.locator('#list-alarma .chk.on').count()) throw new Error('Marcar "Ninguno" debería limpiar la lista');
  console.log('  OK   │ "Ninguno" y los signos marcados son mutuamente excluyentes');

  // ================= Caso 6: fechas inconsistentes y modo manual =================
  await definicionCaso();
  await llenarPaciente({ inicio: '2026-08-14', consulta: '2026-08-13' });
  const err = await page.locator('#dia-calc').innerText();
  if (!/posterior a la fecha de consulta/.test(err)) throw new Error('No detectó la fecha de inicio invertida');
  if (!(await page.locator('#dia-calc .note.danger').count())) throw new Error('No marcó el error en rojo');

  await page.locator('#chk-sinfecha').click();
  await page.waitForTimeout(120);
  if (await page.locator('#wrap-dia-manual').isHidden()) throw new Error('No habilitó el día manual');
  await page.selectOption('#f-dia', '5');
  await avanzar(2); await avanzar(3);
  await ninguno('alarma'); await avanzar(4);
  await ninguno('grave'); await avanzar(5);
  await page.click('button:has-text("Clasificar")');
  await page.waitForSelector('#s7.active');
  if (!/Día 5/.test(await page.locator('#out').innerText())) throw new Error('No usó el día seleccionado a mano');
  await shot('11-fechas');
  console.log('  OK   │ Caso 6: detecta fechas invertidas y permite el día manual cuando no se precisa el inicio');

  // ================= Caso 7: auditoría, dipirona y versión =================
  await definicionCaso();
  await llenarPaciente({ nombre: 'Auditoria', peso: '70', vitales: { pas: '100', pad: '70', fc: '105' } });
  const pieVersion = await page.locator('#app-version').innerText();
  if (!/^v\d+\.\d+\.\d+$/.test(pieVersion)) throw new Error('El pie no muestra la versión completa: ' + pieVersion);
  await avanzar(2);
  await page.selectOption('#f-torniquete', 'pos');
  await avanzar(3);
  await marcar('alarma', 10);                        // acumulación de líquidos
  await avanzar(4);
  await ninguno('grave'); await avanzar(5);
  await page.click('button:has-text("Clasificar")');
  await page.waitForSelector('#s7.active');
  const out7 = await page.locator('#out').textContent();
  for (const e of ['torniquete: positiva', 'Registro para historia clínica', 'PAM',
                   'Ninguna — buscadas dirigidamente y ausentes', 'Ecografía abdominal y radiografía de tórax',
                   'NEGATIVA no descarta el dengue', 'técnica distinta, molecular',
                   'solo si es necesario y en DOSIS ÚNICA', 'Restricciones y contraindicaciones']) {
    if (!out7.includes(e)) throw new Error('Falta en el resultado: ' + e);
  }
  const [dl2] = await Promise.all([
    page.waitForEvent('download'),
    page.click('button:has-text("Exportar a Word")')
  ]);
  await dl2.saveAs(path.join(TMP, 'auditoria.docx'));
  await shot('12-auditoria');
  console.log('  OK   │ Caso 7: auditoría, NS1 negativo, dipirona en dosis única y versión única');

  // ================= Comprobaciones de marca y consola =================
  const htmlCrudo = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  if (/meister/i.test(htmlCrudo)) throw new Error('Quedó una referencia al nombre anterior en index.html');

  const erroresReales = errores.filter(e => !/favicon|manifest|sw\.js/i.test(e));
  if (erroresReales.length) {
    console.log('\n  Errores de consola:'); erroresReales.forEach(e => console.log('   · ' + e));
    throw new Error('Hubo errores de consola');
  }
  console.log('  OK   │ Sin referencias al nombre anterior y sin errores de consola');

  await browser.close();
  console.log('\n  Todos los recorridos de interfaz pasaron. Capturas en shots/\n');
})().catch(e => { console.error('\n FALLA │ ' + e.message + '\n'); process.exit(1); });
