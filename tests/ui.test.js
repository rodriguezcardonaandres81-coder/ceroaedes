/* Recorrido de interfaz con navegador real.  node tests/ui.test.js  */
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
  const avanzar = async n => page.click(`#s${n} button:has-text("Siguiente")`);

  async function llenarPaciente({ edad = '34', unidad = 'a', peso = '70', dia = '4', hora = '08:00', nombre = '' } = {}) {
    await page.goto(URL);
    if (nombre) await page.fill('#f-nombre', nombre);
    await page.fill('#f-edad', edad);
    if (unidad !== 'a') await page.selectOption('#f-edad-u', unidad);
    await page.fill('#f-peso', peso);
    await page.fill('#f-hora', hora);
    await page.selectOption('#f-dia', dia);
  }

  // ---- Caso 1: adulto 70 kg, caso probable con signo de alarma → B2 ----
  await llenarPaciente({ nombre: 'Paciente de prueba' });
  await shot('01-paciente');
  if (!(await page.locator('#fase-critica-alert .note.danger').count()))
    throw new Error('No se mostró la alerta de fase crítica en día 4 (adulto)');
  await avanzar(1);

  await page.locator('#f-endemica').click();
  await page.locator('#f-fiebre').click();
  await marcar('manif', 0);   // cefalea
  await marcar('manif', 2);   // mialgias
  const cnt = await page.locator('#manif-count').innerText();
  if (!/Cumple la definición/.test(cnt)) throw new Error('No reconoció el caso probable: ' + cnt);
  if (!(await page.locator('#manif-count.ok').count())) throw new Error('El contador no quedó en verde');
  await shot('02-definicion-caso');
  await avanzar(2);

  const nAlarma = await page.locator('#list-alarma .chk').count();
  if (nAlarma !== 12) throw new Error('Se esperaban 12 signos de alarma, hay ' + nAlarma);
  await marcar('alarma', 2);  // diarrea — criterio nuevo, no estaba en la versión anterior
  await shot('03-alarma');
  await avanzar(3);

  const nGrave = await page.locator('#list-grave .chk').count();
  if (nGrave !== 4) throw new Error('Se esperaban 4 criterios de gravedad, hay ' + nGrave);
  await page.fill('#f-pas', '95');
  await page.fill('#f-pad', '78');
  if (!/17 mmHg/.test(await page.locator('#pp-out').innerText())) throw new Error('Presión de pulso mal calculada');
  if (!(await page.locator('#pp-out.danger').count())) throw new Error('PP ≤20 no marcó alerta');
  await shot('04-grave');
  await avanzar(4);
  await shot('05-condiciones');

  await page.click('button:has-text("Clasificar")');
  await page.waitForSelector('#s6.active');
  const salida = await page.locator('#out').innerText();
  if (!/categoría de intervención B2/i.test(salida)) throw new Error('Clasificación errónea');
  if (!/Dengue con signos de alarma/.test(await page.locator('.sivi .val').innerText()))
    throw new Error('Bloque SIVIGILA incorrecto');
  for (const e of ['700 ml en 1 hora', '350 – 490 ml/h', '210 – 350 ml/h', '140 – 280 ml/h',
                   '233 gotas/min', '500 mg cada 6 horas', 'Diarrea']) {
    if (!salida.includes(e)) throw new Error('Falta en el resultado: ' + e);
  }
  await shot('06-resultado-B2');
  console.log('  OK   │ Caso 1: adulto con diarrea como signo de alarma → B2 + SIVIGILA "con signos de alarma"');

  // ---- Exportación a Word desde este mismo caso ----
  const [descarga] = await Promise.all([
    page.waitForEvent('download'),
    page.click('button:has-text("Exportar a Word")')
  ]);
  const docxPath = path.join(TMP, 'reporte.docx');
  await descarga.saveAs(docxPath);
  const nombreSugerido = descarga.suggestedFilename();
  if (!/^CeroAedes_.*\.docx$/.test(nombreSugerido)) throw new Error('Nombre de archivo inesperado: ' + nombreSugerido);
  if (fs.statSync(docxPath).size < 2000) throw new Error('El .docx generado es sospechosamente pequeño');
  console.log('  OK   │ Word generado y descargado: ' + nombreSugerido);

  // ---- Copiar conducta ----
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.click('button:has-text("Copiar conducta")');
  await page.waitForTimeout(300);
  const portapapeles = await page.evaluate(() => navigator.clipboard.readText());
  for (const e of ['CONDUCTA — DENGUE', 'Dengue con signos de alarma', '700 ml en 1 hora', 'No administrar'])
    if (!portapapeles.includes(e)) throw new Error('Falta en la conducta copiada: ' + e);
  console.log('  OK   │ Conducta copiada al portapapeles con el plan completo');

  // ---- Caso 2: no cumple definición de caso pero requiere manejo ----
  await llenarPaciente({ peso: '70', dia: '3' });
  await avanzar(1);
  await page.locator('#f-fiebre').click();          // sin área endémica
  await marcar('manif', 0);
  await avanzar(2);
  await marcar('alarma', 1);                        // vómito persistente
  await avanzar(3);
  await avanzar(4);
  await page.click('button:has-text("Clasificar")');
  await page.waitForSelector('#s6.active');
  const sivi = await page.locator('.sivi').innerText();
  if (!/No cumple la definición de caso probable/.test(sivi)) throw new Error('Debería no cumplir la definición');
  if (!/área endémica/.test(sivi)) throw new Error('No reportó el criterio faltante');
  if (!/categoría de intervención B2/i.test(await page.locator('#out').innerText()))
    throw new Error('Aun sin cumplir definición debe manejarse como B2');
  await shot('07-no-cumple-definicion');
  console.log('  OK   │ Caso 2: no notificable por falta de área endémica, pero conducta B2 igual');

  // ---- Caso 3: escolar 30 kg sin hallazgos → A con dosis pediátricas ----
  await llenarPaciente({ edad: '10', peso: '30', dia: '2' });
  await avanzar(1);
  await page.locator('#f-endemica').click();
  await page.locator('#f-fiebre').click();
  await marcar('manif', 1); await marcar('manif', 3);
  await avanzar(2); await avanzar(3); await avanzar(4);
  await page.click('button:has-text("Clasificar")');
  await page.waitForSelector('#s6.active');
  const out3 = await page.locator('#out').innerText();
  if (!/categoría de intervención A/i.test(out3)) throw new Error('Escolar sin hallazgos debería ser A');
  for (const e of ['1790 ml en 24 h', '300 – 450 mg por dosis', '10 – 15 ml por dosis', 'Dengue sin signos de alarma'])
    if (!out3.includes(e)) throw new Error('Falta en resultado pediátrico: ' + e);
  await shot('08-resultado-A-pediatrico');
  console.log('  OK   │ Caso 3: escolar 30 kg → A, dosis pediátricas y SIVIGILA "sin signos de alarma"');

  // ---- Caso 4: gestante en choque → C, bolo reducido, SIVIGILA grave ----
  await llenarPaciente({ edad: '28', peso: '60', dia: '5' });
  await page.click('#seg-sexo button[data-v="F"]');
  await page.locator('#f-embarazo').click();
  await avanzar(1);
  await page.locator('#f-endemica').click();
  await page.locator('#f-fiebre').click();
  await marcar('manif', 0); await marcar('manif', 4);
  await avanzar(2); await avanzar(3);
  await marcar('grave', 2);                          // shock por dengue
  await avanzar(4);
  await page.click('button:has-text("Clasificar")');
  await page.waitForSelector('#s6.active');
  const out4 = await page.locator('#out').innerText();
  if (!/categoría de intervención C/i.test(out4)) throw new Error('Choque debería ser C');
  for (const e of ['Dengue grave', '600 ml en 15 – 30 min', 'Dosis reducida a 10 ml/kg', '300 – 600 ml (glóbulos rojos'])
    if (!out4.includes(e)) throw new Error('Falta en resultado C: ' + e);
  await shot('09-resultado-C-gestante');
  console.log('  OK   │ Caso 4: gestante en choque → C, bolo 10 ml/kg y SIVIGILA "dengue grave"');

  // ---- Caso 5: validaciones ----
  await page.goto(URL);
  dialogos.length = 0;
  await page.fill('#f-edad', '40');
  await page.click('#s1 button:has-text("Siguiente")');
  await page.waitForTimeout(200);
  if (!dialogos.some(d => /peso/i.test(d))) throw new Error('No bloqueó el avance sin peso');
  if (!(await page.locator('#s1.active').count())) throw new Error('Avanzó sin peso');

  await page.click('#seg-sexo button[data-v="M"]');
  await page.fill('#f-peso', '130');
  await page.fill('#f-talla', '175');
  await page.waitForTimeout(100);
  if (await page.locator('#peso-ideal-box').isHidden()) throw new Error('No ofreció el ajuste por peso ideal');
  if ((await page.locator('#pi-val').innerText()) !== '70.5') throw new Error('Peso ideal incorrecto');
  console.log('  OK   │ Caso 5: exige peso y ofrece peso ideal en obesidad (70.5 kg)');

  // ---- Marca: no debe quedar rastro del nombre anterior ----
  const htmlCrudo = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  if (/meister/i.test(htmlCrudo)) throw new Error('Quedó una referencia a MEISTER en index.html');
  console.log('  OK   │ Sin referencias al nombre anterior');

  const erroresReales = errores.filter(e => !/favicon|manifest|sw\.js/i.test(e));
  if (erroresReales.length) {
    console.log('\n  Errores de consola:'); erroresReales.forEach(e => console.log('   · ' + e));
    throw new Error('Hubo errores de consola');
  }
  console.log('  OK   │ Sin errores de consola en ningún recorrido');

  await browser.close();
  console.log('\n  Todos los recorridos de interfaz pasaron. Capturas en shots/\n');
})().catch(e => { console.error('\n FALLA │ ' + e.message + '\n'); process.exit(1); });
