/* Integridad del documento Word que exporta la aplicación.   node tests/docx.test.js

   El escritor DOCX es puro JavaScript escrito a mano — ZIP, CRC32 y OOXML — y
   hasta la versión 3.1 no tenía ninguna prueba: la única comprobación era que el
   archivo pesara más de 2 KB. Aquí se descarga el .docx real desde el navegador y
   se verifica que el ZIP abra, que cada parte sea XML bien formado, que
   document.xml valide contra el esquema ISO/IEC 29500-4, que el cuerpo salga
   justificado y en negrita, y que no quede rastro del nombre del autor. */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');

const URL = 'file://' + path.join(__dirname, '..', 'index.html');
const TMP = path.join(__dirname, '..', '.tmp', 'docx');
const XSD = '/mnt/skills/public/docx/scripts/office/schemas/ISO-IEC29500-4_2016/wml.xsd';

let pass = 0, fail = 0;
function t(nombre, real, esperado) {
  const ok = String(real) === String(esperado);
  ok ? pass++ : fail++;
  console.log(`${ok ? '  OK  ' : ' FALLA'} │ ${nombre}`);
  if (!ok) console.log(`       │   esperado: ${esperado}\n       │   obtenido: ${real}`);
}

(async () => {
  fs.rmSync(TMP, { recursive: true, force: true });
  fs.mkdirSync(TMP, { recursive: true });

  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const ctx = await browser.newContext({ viewport: { width: 470, height: 900 }, acceptDownloads: true });
  const page = await ctx.newPage();
  const errores = [];
  page.on('pageerror', e => errores.push(e.message));
  page.on('dialog', d => d.dismiss());

  console.log('\n── Documento Word: generación ────────────────────');

  /* Caso denso a propósito: categoría C, con acentos, símbolos y un nombre que
     lleva caracteres que hay que escapar en XML. */
  await page.goto(URL);
  await page.click('#s0 button:has-text("Comenzar")');
  await page.locator('#f-endemica').click();
  await page.locator('#f-fiebre').click();
  await page.locator('#list-manif .chk').nth(0).click();
  await page.locator('#list-manif .chk').nth(2).click();
  await page.locator('#f-nexo').click();
  await page.click('#s1 button:has-text("Siguiente")');
  await page.fill('#f-nombre', 'Ana <b>Muñoz</b> & Peña');
  await page.fill('#f-edad', '34');
  await page.fill('#f-peso', '70,5');            // coma decimal colombiana
  await page.fill('#f-inicio', '2026-08-10');
  await page.fill('#f-fecha', '2026-08-13');
  await page.fill('#f-pas', '80'); await page.fill('#f-pad', '60');
  await page.fill('#f-fc', '128'); await page.fill('#f-temp', '38,5');
  await page.fill('#f-hct', '52'); await page.fill('#f-hb', '17,2');
  await page.fill('#f-plaquetas', '82.000'); await page.fill('#f-leucocitos', '3.200');
  await page.click('#s2 button:has-text("Siguiente")');
  await page.click('#s3 button:has-text("Siguiente")');
  await page.locator('#list-alarma .chk').nth(0).click();
  await page.click('#s4 button:has-text("Siguiente")');
  await page.locator('#list-grave .chk').nth(0).click();   // shock
  await page.click('#s5 button:has-text("Siguiente")');
  await page.selectOption('#f-ingesta', 'agua');
  await page.locator('#list-automed .chk').first().click();   // AINE
  await page.selectOption('#f-vo', 'si');
  await page.selectOption('#f-di', 'si');
  await page.click('#s6 button:has-text("Clasificar y calcular manejo")');
  await page.waitForSelector('#s7.active');

  t('La coma decimal llegó como 70,5 kg y no como 705',
    /70[.,]5 kg/.test(await page.locator('#s7').innerText()), 'true');

  const dl = await Promise.all([
    page.waitForEvent('download'),
    page.click('button:has-text("Exportar a Word")')
  ]);
  const archivo = path.join(TMP, 'reporte.docx');
  await dl[0].saveAs(archivo);
  t('El .docx se descarga', fs.existsSync(archivo), 'true');
  /* Abierta desde file://, Chromium descarta el atributo download completo si el
     valor trae un acento o una eñe, y guarda un archivo llamado "download" sin
     extensión. Por eso el nombre se pliega a ASCII. */
  t('El nombre del archivo conserva el del paciente, plegado a ASCII',
    dl[0].suggestedFilename(), 'Cero_Aedes_Ana_b_Munoz_b_Pena_2026-08-13.docx');
  t('La página no lanzó errores de JavaScript', errores.join(' | ') || 'ninguno', 'ninguno');

  console.log('\n── Documento Word: integridad del ZIP ────────────');

  const zipOk = (() => { try { execFileSync('unzip', ['-t', archivo]); return true; } catch (e) { return false; } })();
  t('El ZIP pasa la prueba de integridad (CRC de cada miembro)', zipOk, 'true');
  execFileSync('unzip', ['-o', '-q', archivo, '-d', TMP]);

  const partes = ['[Content_Types].xml', '_rels/.rels', 'word/document.xml',
                  'word/styles.xml', 'word/numbering.xml', 'word/footer1.xml',
                  'word/_rels/document.xml.rels'];
  partes.forEach(p => t('Existe la parte ' + p, fs.existsSync(path.join(TMP, p)), 'true'));
  partes.forEach(p => {
    let ok = true;
    try { execFileSync('xmllint', ['--noout', path.join(TMP, p)], { stdio: 'pipe' }); }
    catch (e) { ok = false; }
    t('XML bien formado: ' + p, ok, 'true');
  });

  console.log('\n── Documento Word: conformidad OOXML ─────────────');

  if (fs.existsSync(XSD)) {
    ['word/document.xml', 'word/styles.xml', 'word/numbering.xml', 'word/footer1.xml'].forEach(p => {
      let salida = 'válido';
      try { execFileSync('xmllint', ['--noout', '--schema', XSD, path.join(TMP, p)], { stdio: 'pipe' }); }
      catch (e) { salida = String(e.stderr || e.message).split('\n').filter(Boolean).slice(0, 2).join(' / '); }
      t('Valida contra ISO/IEC 29500-4: ' + p, salida, 'válido');
    });
  } else {
    console.log('  ····  │ Esquema ISO/IEC 29500-4 no disponible: se omite la validación');
  }

  console.log('\n── Documento Word: forma y contenido ─────────────');

  const doc = fs.readFileSync(path.join(TMP, 'word/document.xml'), 'utf8');
  const pie = fs.readFileSync(path.join(TMP, 'word/footer1.xml'), 'utf8');

  t('El nombre del paciente va escapado una sola vez',
    doc.includes('Ana &lt;b&gt;Muñoz&lt;/b&gt; &amp; Peña'), 'true');
  t('No queda ninguna etiqueta <b> cruda del nombre',
    /<w:t[^>]*>[^<]*<b>/.test(doc), 'false');
  t('No hay doble escape (&amp;lt; visible en el documento)',
    doc.includes('&amp;lt;'), 'false');

  const parrafos = (doc.match(/<w:p>/g) || []).length;
  const justificados = (doc.match(/<w:jc w:val="both"\/>/g) || []).length;
  const negritas = (doc.match(/<w:b\/>/g) || []).length;
  t('Hay párrafos en el documento', parrafos > 100, 'true');
  t('La mayoría del cuerpo va justificado', justificados > parrafos * 0.5, 'true');
  t('El contenido va en negrita', negritas > parrafos * 0.5, 'true');

  /* Los grises tenues que el usuario reportó como ilegibles */
  ['4A4A55', '6B6B78', '8A8A97', '3A3A45'].forEach(gris =>
    t('Ya no aparece el gris tenue ' + gris, doc.includes(gris) || pie.includes(gris), 'false'));

  t('No aparece el nombre del autor en el documento', /Rodríguez Cardona/.test(doc), 'false');
  t('No aparece el nombre del autor en el pie de página', /Rodríguez Cardona/.test(pie), 'false');
  t('El pie sí identifica la aplicación', /Cero_Aedes by AR/.test(pie), 'true');
  t('El pie advierte que no reemplaza el criterio médico',
    /no reemplaza el criterio médico/.test(pie), 'true');
  t('El cierre repite la advertencia', /NO reemplaza el criterio médico/.test(doc), 'true');

  t('El laboratorio incluye el aislamiento viral', /aislamiento viral/.test(doc), 'true');
  t('La conducta lleva la velocidad de bomba', /Con bomba: /.test(doc), 'true');
  t('El Word conserva la lectura del hematocrito', /Lectura del hematocrito/.test(doc), 'true');
  t('El pie numera las páginas', /w:instr=" PAGE "/.test(pie), 'true');
  t('El Word lleva la fecha de revisión clínica',
    /Contenido clínico revisado el \d+ de \w+ de \d{4}/.test(doc), 'true');

  /* Ítems 3, 4.2, 7, 8, 17 y 23 del instrumento de MinSalud */
  t('El Word rotula el destino del paciente', /Destino del paciente/.test(doc), 'true');
  t('El Word registra el nexo epidemiológico', /Nexo epidemiológico para arbovirosis PRESENTE/.test(doc), 'true');
  t('El Word ya no menciona la vacuna contra el dengue', /vacuna/i.test(doc), 'false');
  t('El Word corrige la ingesta de solo agua', /NO reponen los electrolitos/.test(doc), 'true');
  t('El Word ordena suspender el AINE', /SUSPENDER de inmediato/.test(doc), 'true');

  console.log('\n── Documento Word: apertura real ─────────────────');

  let paginas = 0;
  try {
    execFileSync('libreoffice', ['--headless', '--convert-to', 'pdf', '--outdir', TMP, archivo],
      { stdio: 'pipe', timeout: 180000 });
    const pdf = path.join(TMP, 'reporte.pdf');
    if (fs.existsSync(pdf)) paginas = (String(execFileSync('pdfinfo', [pdf])).match(/Pages:\s+(\d+)/) || [])[1] | 0;
  } catch (e) { /* pdfinfo o libreoffice ausentes */ }
  t('LibreOffice abre y convierte el documento sin reparación', paginas > 0, 'true');

  await browser.close();
  console.log('\n───────────────────────────────────────────────────');
  console.log(`  ${pass} pruebas correctas, ${fail} fallidas`);
  console.log('───────────────────────────────────────────────────\n');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('\n  ERROR │ ' + e.message + '\n'); process.exit(1); });
