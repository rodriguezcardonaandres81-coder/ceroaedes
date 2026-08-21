# Cero_Aedes by AR

Aplicación web de apoyo a la decisión clínica para la **clasificación y el manejo del dengue**, con cálculo de **reposición hídrica según el peso del paciente** y exportación de la conducta a **Word**.

Construida sobre tres documentos oficiales colombianos:

- **Ficha de notificación individual SIVIGILA, evento 210 / 220 / 580 — Dengue (2024)**, sección 6 *Datos para clasificación del dengue*.
- **Protocolo de Vigilancia de Dengue del INS**, Tabla 2 *Definiciones operativas de caso*.
- **Algoritmo de diagnóstico y tratamiento de dengue**, OPS/OMS — Ministerio de Salud y Protección Social, 2019.

> ⚠️ Herramienta de apoyo. Los cálculos son orientativos y no reemplazan el juicio clínico ni la reestratificación continua del paciente. Verifique siempre los volúmenes antes de administrarlos.

---

## Qué hace

### 1. Dos clasificaciones en paralelo

La app entrega las dos salidas que un caso de dengue necesita, porque no siempre coinciden:

| Salida | Para qué sirve |
|---|---|
| **Clasificación para notificación (SIVIGILA)** | Dengue sin signos de alarma / con signos de alarma / grave, o "no cumple la definición de caso probable" con el criterio faltante explícito. Es lo que se digita en la ficha. |
| **Categoría de intervención (OPS)** | A, B1, B2 o C. Es lo que gobierna dónde se maneja el paciente y cuánto líquido recibe. |

Un paciente puede requerir conducta B2 sin cumplir la definición de caso probable — por ejemplo, sin procedencia de área endémica. La app lo dice sin ambigüedad en lugar de forzar una sola respuesta.

### 2. Criterios completos de la ficha

Todos los ítems de la sección 6, con el origen marcado en cada casilla:

- **Manifestaciones** (5 de la ficha): cefalea, dolor retroocular, mialgias, artralgias, erupción o rash. Más **leucopenia**, que está en la Tabla 2 del protocolo pero no como casilla en la ficha.
- **Signos de alarma** (11 de la ficha): dolor abdominal intenso y continuo, vómito persistente, diarrea, somnolencia o irritabilidad, hipotensión postural, hepatomegalia dolorosa > 2 cm, hemorragia en mucosas, hipotermia, aumento del hematocrito, caída de plaquetas < 100.000 y acumulación de líquidos. Más **disminución de la diuresis**, que aparece en la definición narrativa del protocolo.
- **Manifestaciones graves** (4 de la ficha): extravasación severa de plasma, hemorragia con compromiso hemodinámico, shock por dengue y daño grave de órganos.

Las etiquetas `ficha §6` y `protocolo` sobre cada casilla indican de dónde sale el criterio, para no perder ninguno al clasificar ni confundirse al digitar en SIVIGILA.

### 3. Reposición hídrica calculada por peso

- **A** — hidratación oral. Adultos: 2 000 a 3 000 ml/24 h. Pediátricos: **Holliday-Segar puro** (100 ml/kg los primeros 10 kg, 50 ml/kg los siguientes 10 kg, 20 ml/kg por cada kilo adicional), conforme al ítem 22 del instrumento de auditoría.
- **B1** — lo mismo, pero **más 5 % de déficit** en pediátricos por pertenecer a grupo de riesgo, conforme al ítem 27. Si hay intolerancia oral, cristaloides a 2–4 ml/kg/h.
- **B2** — carga de 10 ml/kg en 1 h (repetible hasta 2 veces si persisten signos de alarma y la diuresis es < 1 ml/kg/h), luego 5–7 → 3–5 → 2–4 ml/kg/h.
- **B2 con comorbilidad, gestación o ≥ 65 años** — esquema reducido de OPS/CDE 2020: carga de **5 ml/kg** en 1 h, luego 4 → 3 → 2 ml/kg/h. La app lo selecciona sola y explica el motivo, porque duplicar la carga en estos pacientes es la vía directa a la sobrecarga.
- **C** — bolo de 20 ml/kg en 15–30 min (10 ml/kg en gestantes y ≥ 65 años), luego 10 ml/kg/h → 5–7 → 3–5 → 2–4 ml/kg/h, con las rutas de rescate: segundo y tercer bolo, coloide y transfusión (glóbulos rojos 5–10 ml/kg o sangre fresca 10–20 ml/kg).

Cada fase muestra **ml/h, volumen total, hora proyectada y goteo sin bomba** (macrogotero de 20 gotas/ml y microgotero de 60 µgotas/ml).

### 4. Flujo en siete pasos

Se abre con una **pantalla de bienvenida** breve —gota de hidratación y mosquito *Aedes* tachado, animados en SVG puro— que recuerda en una línea que la aplicación acompaña la consulta y no reemplaza el juicio clínico. Un botón entra a la evaluación; la barra de pasos aparece solo a partir de ahí. Respeta `prefers-reduced-motion`.

El orden sigue el razonamiento clínico, no la estructura de los datos:

1. **Definición de caso** — es lo primero que ve el médico al abrir, para recordar qué es un caso probable de dengue antes de mirar al paciente.
2. **Paciente y signos vitales** — identificación, fechas, antropometría, tensión arterial, FC, FR, temperatura, SatO₂, llenado capilar y estado de conciencia en un solo módulo de primer contacto.
3. **Prueba del torniquete**.
4. **Verifique signos de alarma**.
5. **Verifique manifestaciones graves de dengue** — con un resumen de lo medido en el primer contacto, que marca en rojo si la presión de pulso o el llenado capilar ya son compatibles con choque.
6. **Condiciones asociadas y riesgo social**.
7. **Resultado**.

### 5. Día de enfermedad calculado por fechas

Se registran la **fecha de inicio de síntomas** y la **fecha de consulta**, y el día se calcula solo. El día 1 es el día en que inicia la fiebre, como cuenta el INS: inicio el 12 y consulta el 13 son dos días de evolución. La app avisa si el inicio quedó después de la consulta. Como la fecha de consulta es editable, también sirve para registrar pacientes vistos días atrás.

### 6. Ausencia confirmada, no asumida

En signos de alarma y en manifestaciones graves hay una casilla **"Ninguno — los busqué y no hay"**. La app no deja avanzar sin que se elija una de las dos cosas: o se marca al menos un signo, o se confirma explícitamente que se buscaron y no hay. No marcar nada ya no equivale a decir que no hay: el negativo queda registrado como tal en el reporte, en la conducta copiada y en el Word, que es lo que exige una historia clínica auditable.

### 7. Torniquete, signos vitales e imágenes

- **Prueba del torniquete** con la técnica completa en la pantalla de definición de caso. Es apoyo diagnóstico y parte de la búsqueda activa de manifestaciones hemorrágicas que exige el instrumento de auditoría (ítem 11); no suma para la definición de caso porque no es casilla de la sección 6.
- **Signos vitales**: TA, FC, FR, temperatura, SatO₂, llenado capilar y estado de conciencia, con **PAM y presión de pulso calculadas**.
- **Ecografía abdominal y radiografía de tórax** sugeridas ante hallazgos de fuga vascular, que son las que documentan ascitis y derrame pleural.

### 8. Curva del curso clínico

La pantalla de paciente dibuja la **figura de referencia de la OMS** —fases febril, crítica y de recuperación, con las curvas esquemáticas de temperatura, hematocrito y plaquetas— y marca con una línea y un punto **el día en que está el paciente**, calculado desde la fecha de inicio de síntomas. La banda de fase crítica se desplaza según la edad: día 3 en niños, día 4 en adultos.

Es SVG puro, sin librerías. La paleta categórica (#C2410C, #0D9488, #7C3AED) está validada para daltonismo con el validador del sistema de diseño; la leyenda nombra cada serie, de modo que la identidad nunca depende solo del color, y cada banda lleva su propio texto descriptivo accesible.

### 9. Hemoconcentración

Se registran hematocrito, hemoglobina, plaquetas y leucocitos. Basta un hemograma, tomado antes de hidratar como indica la OMS — *«Obtain reference HCT before fluid therapy»*. El resultado se presenta como un **veredicto directo** —hay, no hay o es sugestiva de hemoconcentración— con tres fichas de lectura rápida para hematocrito, plaquetas y leucocitos, y debajo solo las acciones a seguir. La app trabaja en dos modos:

**Con un solo hemograma**, lo compara con la referencia para edad y sexo (editable, porque cada laboratorio tiene la suya) y aplica los umbrales absolutos de la OMS: en choque, hematocrito **< 40 % en niños y mujeres adultas o < 45 % en hombres adultos indica sangrado**; **> 50 % o en ascenso tras el primer bolo indica fuga persistente**. Ese valor queda además como basal para los controles siguientes.

**Con un hemograma previo**, calcula el delta contra el basal del propio paciente —el modo que la OMS prefiere— y lo interpreta **cruzado con el estado hemodinámico**, que es lo que cambia su significado:

| Hematocrito | Hemodinamia | Lectura |
|---|---|---|
| Sube ≥ 20 % | cualquiera | Extravasación de plasma. Signo de alarma → mínimo B2; con choque o dificultad respiratoria, categoría C |
| Sube < 20 % | estable | Aviso temprano: el ascenso precede a los cambios de tensión arterial |
| **Baja** | **inestable** | **Hemorragia**. Prueba cruzada y transfusión — no es mejoría |
| **Baja** | **estable** | **Reabsorción**. Criterio para reducir y suspender los líquidos |

**Sobre el índice hematocrito/hemoglobina.** La app lo calcula y lo muestra, pero con la etiqueta correcta: es la *regla de tres*, equivalente a 100 dividido por la CHCM, y sirve para detectar **hipocromía** o un problema de la muestra. **No detecta hemoconcentración**: en la extravasación de plasma el hematocrito y la hemoglobina suben en la misma proporción, de modo que el índice no se mueve. Hay una prueba automatizada que fija ese hecho — sube ambos valores un 25 % y verifica que el índice permanece idéntico mientras el veredicto sí detecta la hemoconcentración.

### 10. Módulo de seguridad de la infusión

Cuatro válvulas de escape para usar **durante** la administración de líquidos, cada una con su disparador y su conducta:

- **Detención por sobrecarga** — signos precoces y tardíos, causas, y furosemida con la dosis calculada por peso (0,1–0,5 mg/kg/dosis; infusión 0,1 mg/kg/h). **El diurético se bloquea mientras no haya terminado la fase crítica**, citando a la OMS: *«Avoid diuretics during the plasma leakage phase because they may lead to intravascular volume depletion»*. Durante la fuga, el diurético vacía el espacio intravascular y puede precipitar el choque.
- **Oliguria o anuria** — con la advertencia de que en dengue la causa más frecuente es la hipovolemia y no la falla renal: restringir líquidos a un paciente anúrico que en realidad está hipovolémico es un error grave.
- **Discriminador de sangrado** — el cruce hematocrito/hemodinamia, con los volúmenes de transfusión calculados por peso.
- **Cierre de líquidos en la fase de reabsorción** — se activa desde el día 6, pero deja claro que la señal para suspender es fisiológica y no del calendario.

### 11. Salida en Word y copiado de conducta

- **Exportar a Word** genera un `.docx` real con portada de marca, llamados de color para la clasificación y la fase, secciones numeradas con filete, tablas de encabezado verde y filas alternas, viñetas nativas de Word y pie de página con versión y número de página. El médico lo abre, copia y pega en la historia clínica.
- **Copiar conducta** deja en el portapapeles la misma información como texto plano, para pegar directamente sin abrir Word.

El documento Word cierra con una sección **«Registro para historia clínica»** que reproduce los ítems 1 a 17 del *Instrumento de seguimiento y evaluación de casos de dengue*: anamnesis, examen físico, laboratorio e imágenes diagnósticas. Lo que la app ya capturó aparece marcado y en negrilla; lo demás queda como campo con línea para completar. El objetivo es que la historia clínica quede lista para la auditoría.

El escritor de `.docx` está implementado en JavaScript puro dentro del mismo archivo — sin librerías, sin servidor y funcionando sin conexión.

### Detalles que resuelve el motor

- **Adultos y pediátricos** en el mismo flujo: el umbral de 18 años cambia la dosis de acetaminofén (500 mg c/6 h frente a 10–15 mg/kg/dosis, con equivalencia en jarabe de 150 mg/5 ml) y el inicio de la fase crítica (día 4–6 en adultos, día 3–6 en niños).
- **Condiciones asociadas automáticas** por edad y gestación: menor de 1 año, ≥ 65 años y embarazo elevan el caso a B1 sin que haya que marcarlas. El *menor de 5 años* se ofrece marcado y es desmarcable, porque la guía nacional lo incluye en el grupo B y el algoritmo OPS 2019 no.
- **Peso ideal en obesidad**: si la talla está registrada y el peso supera en más del 20 % el peso ideal, la app ofrece calcular los volúmenes con peso ideal. La indicación es de la OMS — *«Use the ideal body weight for calculation of fluid infusion for obese and overweight patients»*, Handbook for Clinical Management of Dengue, secciones 2.2.2 y 2.2.3.1. La OMS publica una tabla de peso ideal por talla (Textbox J); la app lo calcula con la **fórmula de Devine**, que puede diferir en uno o dos kilos.
- **Evaluación hemodinámica compuesta, no un solo umbral**: la app no decide el choque únicamente por la presión de pulso. Evalúa en conjunto hipotensión según la edad (tabla del CDC, equivalente a 70 + 2 × edad entre 1 y 9 años y a 90 mmHg desde los 10), presión de pulso ≤ 20 mmHg, llenado capilar > 2 s, taquicardia según la edad, PAM baja, alteración del estado de conciencia y desaturación. Distingue **choque compensado** —presión de pulso estrecha con presión sistólica conservada, el signo precoz— de **choque hipotenso o descompensado**, que la OMS describe como *«a late finding [that] signals an imminent total cardiorespiratory collapse»*. Una presión de pulso amplia **nunca** se presenta como tranquilizadora si ya hay hipotensión.
- **Un NS1 negativo no cierra el caso**: la app lo dice explícitamente y encadena el siguiente paso según el día de evolución — RT-PCR hasta el día 5 (técnica molecular, distinta de la detección de antígeno) e IgM desde el día 6, más el diferencial con chikungunya y Zika. Coinciden el CDC (*«A negative result from an NAAT or NS1 antigen test does not rule out infection»*), la guía provisional de la OMS de abril de 2025 y el protocolo del INS (*«resultados negativos de las pruebas inmunocromatográficas para la detección de NS1 e IgM no excluyen la infección por dengue»*).

---

## Uso

Abra `index.html` en cualquier navegador. No requiere servidor, instalación ni conexión a internet.

### Publicar en GitHub Pages

Suba el contenido del repositorio y active **Settings → Pages → Source: Deploy from a branch → main → / (root)**. La app queda publicada en `https://USUARIO.github.io/REPOSITORIO/`.

### Instalar en el celular

Con la app abierta desde una URL `https://`:

- **Android / Chrome** — menú ⋮ → *Añadir a pantalla de inicio*.
- **iOS / Safari** — botón compartir → *Añadir a pantalla de inicio*.

Queda como ícono independiente y **funciona sin señal**, que es la condición habitual en zona rural endémica. El *service worker* (`sw.js`) cachea toda la aplicación en la primera visita.

---

## Estructura

```
ceroaedes/
├── index.html              # Aplicación completa: interfaz + motor clínico + escritor .docx
├── manifest.json           # Metadatos PWA
├── sw.js                   # Service worker (uso sin conexión)
├── assets/                 # Iconos
├── tests/
│   ├── engine.test.js      # 431 pruebas del motor clínico
│   ├── ui.test.js          # 30 recorridos en navegador real
│   └── docx.test.js        # 49 comprobaciones del documento Word generado
├── LICENSE
└── README.md
```

El motor clínico está delimitado en `index.html` entre los comentarios `/* === ENGINE START === */` y `/* === ENGINE END === */`. Es código puro, sin dependencias del DOM: se extrae y se prueba en Node sin navegador.

La función `construirReporte()` produce un único modelo de datos del que se derivan **tanto la pantalla como el documento Word**, de modo que no puedan divergir.

## Pruebas

```bash
npm test                                  # 431 pruebas del motor clínico (sin navegador)
npm i -D playwright
npm run test:ui                           # 30 recorridos de interfaz en Chromium real
npm run test:docx                         # 49 comprobaciones del .docx exportado
npm run test:all                          # las tres suites
```

**Motor clínico** — definición operativa de caso, clasificación en los cuatro grupos, volúmenes de cada fase para adulto y pediátrico, dosis reducidas en gestación y adulto mayor, ajuste por peso ideal, conversiones a goteo, selección de laboratorios por día de enfermedad, lectura del hematocrito y válvulas de seguridad de la infusión.

**Interfaz** — los recorridos completos, incluidos los casos que antes fallaban: notación decimal colombiana, rangos de plausibilidad, operación con teclado y persistencia de las decisiones del médico.

**Documento Word** — descarga el `.docx` real desde el navegador, comprueba la integridad del ZIP y del CRC de cada miembro, valida cada parte XML contra el esquema **ISO/IEC 29500-4**, verifica el escapado del texto de origen humano, la justificación y la negrita del cuerpo, la ausencia de grises ilegibles, y lo abre con LibreOffice para confirmar que no pide reparación.

## Cobertura del instrumento de MinSalud

La aplicación **no es un instrumento de auditoría de historia clínica**: está pensada para el médico sin experiencia en dengue que necesita clasificar, calcular líquidos y saber qué pedir. Del *Instrumento de seguimiento y evaluación de casos de dengue* (MinSalud) recoge, por tanto, solo los ítems que **cambian la conducta**, no los que sirven para calificar a una IPS.

| Ítem | Cubierto | Cómo |
|---|---|---|
| 1 Fiebre caracterizada | Sí | Fecha de inicio, día de enfermedad calculado y temperatura |
| 2 Definición de caso | Sí | Las 6 manifestaciones de la ficha SIVIGILA |
| 3 Nexo epidemiológico | Sí | Refuerza la sospecha y orienta el diferencial |
| 4.1 Antecedentes personales | Sí | Como condiciones asociadas, que son las que mueven a B1 |
| 5 Riesgo social | Sí | Vive solo, transporte, pobreza |
| 6 Signos de alarma | Sí | Los 12, con constancia del negativo |
| 7 Ingesta de líquidos | Sí | La ingesta nula equivale a intolerancia oral y lleva a B1 |
| 8 Automedicación | Sí | Cada fármaco genera su conducta correctiva |
| 10–15 Examen físico | Sí | Signos vitales, hemodinamia, torniquete, hemorragias, abdomen |
| 16–19 Laboratorio | Sí | Hemograma, imágenes, función hepática y pruebas confirmatorias por día |
| 20–22 Diagnóstico y manejo | Sí | Diferencial, clasificación por gravedad y por grupo A/B1/B2/C |
| 23–24 Destino del paciente | Sí | Ambulatorio, hospitalización o UCI, rotulado explícitamente |
| 31–56 Manejo | Sí | Plan de líquidos por fase, antipirético, contraindicaciones y monitoreo |

**Deliberadamente fuera de alcance**, por ser datos administrativos o de auditoría institucional: ítem 9 (conciliación medicamentosa), 25–30 (remisión, tiempos, IPS destino), 57–65 (nivel de apropiación de la IPS), y los campos de afiliación, aseguradora, desenlace, autopsia y evaluador.

## Un solo archivo para todas las pantallas

No hay una versión "de celular" y otra "de computador": es el mismo `index.html` respondiendo al espacio disponible. El diseño base es de celular —es donde se usa en consulta— y de ahí crece por escalones.

| Ancho | Contenedor | Qué cambia |
|---|---|---|
| < 360 px | 100 % | Menos relleno; los campos pareados pasan a una columna |
| 360 – 699 px | 100 % (máx. 470 px) | Diseño base de celular |
| 700 – 999 px | 700 px | Más aire; los botones dejan de ocupar el ancho completo |
| 1000 – 1319 px | 1000 px | Las listas de criterios se reparten en **dos columnas** |
| ≥ 1320 px | 1180 px | Deja de crecer: más ancho vuelve incómoda la lectura |

Además hay un ajuste para pantallas bajas en horizontal, y una hoja de impresión que oculta botones y barra de pasos y despliega los acordeones.

Las fases del plan de líquidos quedan **a propósito en una sola columna** en todos los tamaños: son una secuencia de administración y repartirlas en dos invita a leerlas fuera de orden.

## Vigencia del contenido clínico

El código puede seguir funcionando perfectamente mientras el contenido clínico caduca. Para que eso no pase en silencio, `index.html` tiene una constante `REVISION` con la fecha de la última revisión y las fuentes contra las que se hizo:

```js
var REVISION = {
  fecha: '2026-08-20',
  fuentes: 'Ficha SIVIGILA 210/220/580 (2024), Protocolo INS v07, ...',
  mesesVigencia: 12
};
```

Esa fecha se muestra **en la pantalla de bienvenida, en el pie de la aplicación y en el documento de Word**. Pasados los meses de vigencia, la app avisa sola —en pantalla y en el Word— que hay que reverificar el algoritmo y las dosis antes de usarla con un paciente.

**Al revisar el contenido clínico, actualice `REVISION.fecha` y la lista de fuentes.** Es lo único que hay que tocar.

## Conteo anónimo de visitas

El `<head>` trae preparado el gancho de **Cloudflare Web Analytics**, apagado. Para activarlo, cree la cuenta gratuita en `dash.cloudflare.com → Analytics & Logs → Web Analytics → Add a site` y reemplace `PEGUE_AQUI_SU_TOKEN` por el token que le entregan.

Mientras diga `PEGUE_AQUI_SU_TOKEN` no se carga ningún script ni sale ninguna petición — hay una prueba que lo verifica. Tampoco se carga si la app se abre desde el disco (`file://`).

Qué se envía: dirección de la página, país y navegador. **Qué no se envía: absolutamente nada del paciente** — los datos clínicos nunca salen del dispositivo. No usa cookies ni identifica personas. El *service worker* deja pasar esa petición sin cachearla, de modo que sin conexión simplemente no se envía y la aplicación funciona igual.

Tenga presente que **el conteo va a quedar corto por diseño**: cuando el médico instala la PWA, las aperturas sin conexión no envían nada. Lo que vea es un piso, no la cifra real.

## Actualizar la aplicación en los dispositivos

Después de editar `index.html`, suba el número de versión en `sw.js`:

```js
const VERSION = 'ceroaedes-v3.2.1';
```

Sin ese cambio, los celulares que ya la tengan instalada seguirán mostrando la versión cacheada.

---

## Fuentes

- Instituto Nacional de Salud. *Ficha de notificación individual — Dengue, evento 210/220/580*. Colombia; 2024.
- Instituto Nacional de Salud. *Protocolo de Vigilancia de Dengue*, versión 07. Colombia; 2024.
- Ministerio de Salud y Protección Social de Colombia. *Algoritmo de diagnóstico y tratamiento de dengue*; 2019.
- Organización Panamericana de la Salud. *Dengue: guías para la atención de enfermos en la Región de las Américas*. 2.ª edición. Washington, D.C.: OPS; 2016.
- Organización Mundial de la Salud. *Handbook for Clinical Management of Dengue*. Ginebra: OMS; 2012. (Peso ideal en sobrepeso y obesidad: secciones 2.2.2 y 2.2.3.1, Textbox J.)
- Ministerio de Salud y Protección Social — Federación Médica Colombiana. *Dengue: memorias*. Bogotá; 2012–2013.
- *Instrumento de seguimiento y evaluación de casos de dengue*, versión 15/06/23.
- Centers for Disease Control and Prevention. *Clinical Testing Guidance for Dengue*. Atlanta: CDC.
- Centers for Disease Control and Prevention. *Dengue Clinical Case Management — Pocket Guide*. Atlanta: CDC; 2024. (Umbrales de hipotensión por edad.)
- Organización Panamericana de la Salud. *Algoritmos para el manejo clínico del dengue*. CDE; 2020. (Esquema reducido del Grupo B2 y criterios de hospitalización.)
- Organización Mundial de la Salud. *Dengue: guidelines for diagnosis, treatment, prevention and control*. Ginebra: OMS; 2009. (Sobrecarga de líquidos, furosemida, interpretación del hematocrito, umbrales absolutos en choque y figura del curso de la enfermedad, capítulo 2.)
- Organización Mundial de la Salud. *Laboratory testing for dengue virus: interim guidance*. Abril de 2025.

## Autor

**Andrés Rodríguez Cardona** — Epidemiólogo

## Licencia

MIT. Ver [LICENSE](LICENSE).
