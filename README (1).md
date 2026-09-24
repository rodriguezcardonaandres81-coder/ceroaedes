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
│   ├── engine.test.js      # 496 pruebas del motor clínico
│   ├── ui.test.js          # 34 recorridos en navegador real
│   └── docx.test.js        # 53 comprobaciones del documento Word generado
├── LICENSE
└── README.md
```

El motor clínico está delimitado en `index.html` entre los comentarios `/* === ENGINE START === */` y `/* === ENGINE END === */`. Es código puro, sin dependencias del DOM: se extrae y se prueba en Node sin navegador.

La función `construirReporte()` produce un único modelo de datos del que se derivan **tanto la pantalla como el documento Word**, de modo que no puedan divergir.

## Pruebas

```bash
npm test                                  # 620 pruebas del motor clínico (sin navegador)
npm i -D playwright
npm run test:ui                           # 39 recorridos de interfaz en Chromium real
npm run test:docx                         # 63 comprobaciones del .docx exportado
npm run test:all                          # las tres suites
```

**Motor clínico** — definición operativa de caso, clasificación en los cuatro grupos, volúmenes de cada fase para adulto y pediátrico, dosis reducidas en gestación y adulto mayor, ajuste por peso ideal, conversiones a goteo, selección de laboratorios por día de enfermedad, lectura del hematocrito y válvulas de seguridad de la infusión.

**Interfaz** — los recorridos completos, incluidos los casos que antes fallaban: notación decimal colombiana, rangos de plausibilidad, operación con teclado y persistencia de las decisiones del médico. Dos de esos recorridos son casos reales de campo, fijados como regresión permanente: la gestante que **no** debe pasar a B2 por plaquetas bajas, y la que **sí** debe pasar a B2 por hemorragia en mucosas, con la carga completa.

**Documento Word** — descarga el `.docx` real desde el navegador, comprueba la integridad del ZIP y del CRC de cada miembro, valida cada parte XML contra el esquema **ISO/IEC 29500-4**, verifica el escapado del texto de origen humano, la justificación y la negrita del cuerpo, la ausencia de grises ilegibles, la notación decimal de **toda** cifra impresa, y lo abre con LibreOffice para confirmar que no pide reparación.

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

## Las seis manifestaciones de la definición de caso

Aquí conviven dos definiciones que **no dicen lo mismo**, y la aplicación tiene que obedecer a una sola: la que rige la notificación al SIVIGILA en Colombia.

**INS, _Protocolo de Vigilancia de Dengue_ v07, 15 de julio de 2024** — es la que manda:

> «Enfermedad febril aguda de 2 a 7 días de evolución en la que se observan **dos o más** de las siguientes manifestaciones: cefalea, dolor retroocular, mialgias, artralgias, erupción cutánea, rash o **leucopenia**.»

Seis, enumeradas por separado, **sin prueba de torniquete**. Es exactamente la sección 6 de la ficha 210/220/580 más la leucopenia — que es de donde salió el rótulo `'prot'` de esa entrada.

**OPS, _Definiciones de caso…_ 2023 y _Algoritmos…_ 2024** — definición regional. Agrupa distinto y **sí** incluye el torniquete: «1. Náusea o vómito · 2. Exantema · 3. Cefalea o dolor retro ocular · 4. Mialgia o artralgia · **5. Petequias o prueba de torniquete positiva (+)** · 6. Leucopenia».

La app **cuenta por el INS**. El torniquete se realiza, se registra y se imprime —el instrumento de auditoría lo exige en el ítem 13— pero no completa la definición colombiana: contarlo notificaría casos que el SIVIGILA no reconoce como tales. Cuando el torniquete sale positivo y el caso queda **a una manifestación de cumplir**, la app lo advierte en vez de dejarlo descartar en silencio: *«con el torniquete positivo, la OPS ya lo consideraría caso probable — busque dirigidamente las otras manifestaciones y las petequias antes de descartarlo»*.

La **leucopenia sí cuenta**, y como el leucograma ya está digitado, la app la reconoce sola —umbral < 4.000 /mm³— en vez de pedir que se marque una casilla más. Va rotulada con su origen: *«Leucopenia — tomada de leucocitos 3.200 /mm³»*, para que quien lea la historia clínica vea de dónde salió. Una manifestación marcada a mano no se cuenta dos veces.

**Nada de esto toca el grupo de manejo.** Las manifestaciones alimentan la clasificación para el SIVIGILA; el grupo A/B1/B2/C lo deciden los signos de alarma, las manifestaciones graves y las condiciones asociadas. Dos pruebas lo verifican comparando `clasificar()` y `planLiquidos()` con y sin las manifestaciones deducidas.

## Sin tensión arterial no se dice «sin choque»

Un informe real salió con **«Sin hallazgos de choque en los parámetros registrados»** y la tensión arterial en blanco — la conclusión se sostenía sobre la frecuencia cardiaca y el llenado capilar, en una paciente B2 en fase crítica.

Sin tensión arterial no hay **presión de pulso**, y la presión de pulso estrecha (≤ 20 mmHg) es el signo más temprano de choque en dengue: el que aparece mientras la sistólica todavía se sostiene y el paciente parece estable. Lo registrado no permitía decir que no había choque; permitía decir que **no se había buscado**.

Desde la v3.6.2 esa situación tiene su propio veredicto —*«Evaluación hemodinámica INCOMPLETA: falta la tensión arterial»*—, el bloque se despliega solo en vez de quedar plegado, y el paciente **no se declara estable** sin ella: eso importa porque `interpretarHematocrito()` usa esa bandera para decidir si un hematocrito en descenso significa «reabsorción, reduzca los líquidos». En **B2 y C** la tensión se reclama en rojo, como el hemograma, y sin frenar la hidratación. Un hallazgo real —hipotensión, presión de pulso estrecha— pesa más que el dato faltante y no se ablanda a «incompleta».

## El informe no puede desdecirse a sí mismo

Un hematocrito de 50 % en una adolescente salía rotulado **«Normal»** en la tabla, mientras el encabezado de la misma sección decía **HEMOCONCENTRACIÓN SUGESTIVA** y el párrafo de abajo decía **«supera el límite superior de referencia»**. Tres lecturas del mismo número en media página, porque la ficha tenía su propio umbral (el 50 % de la OMS) y el veredicto usaba otro (la referencia por edad y sexo).

Ahora la ficha **se deriva** del veredicto en vez de recalcularse, de modo que no existe ningún valor en que puedan contradecirse — hay una prueba que recorre de 20 a 70 % en pasos de medio punto verificando exactamente eso. En el mismo informe se corrigieron otras dos frases escritas para un caso e impresas en otro: *«si lo marca, el paciente pasa a categoría B2»* en un paciente que **ya** estaba en B2, y *«no indica hemoconcentración»* —dicho del índice Hto/Hb— impreso justo debajo del encabezado que anunciaba hemoconcentración.

## Respuestas que se contradicen

Dos pantallas distintas preguntan por lo mismo con otras palabras. Un informe real salió con **«Disminución de la diuresis»** entre los signos de alarma y, dos páginas después, **«Diuresis últimas 6 h: normal»** — las dos impresas, sin que nada lo advirtiera. No es indiferente cuál de las dos es cierta: el signo de alarma mueve la categoría a B1, y la respuesta del interrogatorio es la que queda firmada en la historia clínica.

Desde la v3.5.3 la aplicación coteja dos pares —diuresis disminuida frente a diuresis normal, y vómito persistente frente a tolerancia oral conservada— y **avisa en la pantalla donde todavía se puede corregir**, no solo en el informe. El aviso no reclasifica ni bloquea: dice cuál es la consecuencia de cada respuesta y cómo resolver la duda (*«cuantifique la orina de la próxima hora antes de decidir»*). La decisión sigue siendo del médico.

## Cada signo de alarma con su propia conducta

Los cuatro signos que notifica el SIVIGILA pero no clasifican en B2 —diarrea, hipotermia, plaquetas y diuresis— compartían un solo texto explicativo. El aviso nombraba bien el signo marcado y a continuación citaba **siempre** la trombocitopenia y ordenaba **siempre** hemograma seriado: a un paciente con la diuresis en descenso se le respondía con una cita sobre plaquetas y una orden de laboratorio, en lugar de mandar a cuantificar la orina.

Es el mismo defecto que originó toda esta revisión —texto escrito para un caso, impreso en otro—, así que ahora la justificación y la conducta viajan con el signo. La diuresis además corrige una afirmación falsa: no define B2, pero **sí lleva a B1**, y el aviso lo dice.

## Lo que el documento dice de sí mismo

Un informe clínico se lee de arriba abajo y sus partes tienen que sostenerse entre sí. Tres correcciones de la v3.5.2 salieron de casos reales en los que el documento se contradecía a sí mismo a dos renglones de distancia:

- La nota del patrón hematológico afirmaba *«hemoconcentración o hematocrito alto, trombocitopenia y leucopenia»* dentro de un informe cuyo veredicto impreso decía **NO HAY HEMOCONCENTRACIÓN** y cuyo hematocrito salía rotulado como normal. Ahora la nota describe lo que la muestra muestra, y remite a la tendencia.
- En fase crítica el informe advertía *«la caída de la fiebre no es mejoría»* a un médico que acababa de registrar 38,5 °C. La fase se sigue definiendo por el día —así lo hacen las guías— pero con la temperatura a la vista la frase se vuelve una instrucción de **cuándo** mirar: si sigue febril, la defervescencia todavía no ocurrió; si ya está afebril, este es el momento de mayor riesgo.
- El antipirético ofrecía **25 ml de jarabe pediátrico** a un adolescente de 50 kg: correcto en aritmética, absurdo en la práctica. Desde que la tableta de 500 mg cabe dentro del rango calculado, es lo que se dispensa, con el jarabe nombrado para quien no traga tabletas. **La cifra en miligramos no cambió.**

## Notación numérica

En Colombia la coma es el separador decimal y el punto el de miles. Eso ya se respetaba en la **entrada** —los campos clínicos son de texto y pasan por `numDec`/`numCount`, porque un `<input type="number">` descartaba la coma en silencio y `70,5` kg se convertía en una carga de 7.050 ml—. Desde la v3.5.1 se respeta también en la **salida**: toda cifra que la aplicación calcula pasa por `dec()` antes de imprimirse.

No es un detalle de estilo. El documento escribía «furosemida 5.8 mg» y «peso 70.5 kg» a dos renglones de «solución salina 0,9 %»; en una orden médica, un punto leído como separador de miles cambia la dosis de escala. `dec()` solo cambia cómo se escribe el número — nunca su valor — y una prueba de barrido recorre el reporte completo de más de mil casos sintéticos verificando que no quede ninguna cifra con punto decimal.

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

## Dos listas de signos de alarma, y por qué están separadas

La ficha SIVIGILA §6 es un instrumento de **notificación** y lista **doce** hallazgos. El algoritmo de **tratamiento** define el grupo B2 con **ocho**. No son la misma lista, y hasta la v3.3 la aplicación usaba los doce para las dos cosas: cualquiera de ellos disparaba una carga intravenosa de B2.

Desde la v3.4 cada lista gobierna lo suyo. El quinto campo del arreglo `ALARMA` marca con `'ops'` los ocho que cambian la categoría de intervención:

| Signo | Notifica (ficha) | Define B2 (algoritmo) |
|---|:---:|:---:|
| Dolor abdominal intenso · Vómito persistente · Acumulación de líquidos · Sangrado de mucosas · Somnolencia o irritabilidad · Hipotensión postural · Hepatomegalia > 2 cm · Aumento progresivo del hematocrito | Sí | **Sí** |
| Diarrea · Hipotermia · Caída de plaquetas < 100.000 | Sí | **No** |
| Disminución de la diuresis | Sí | **No** — pero baja a B1, porque «micción normal en las últimas 6 horas» es requisito del grupo A |

Los cuatro que no definen B2 se siguen registrando, se siguen notificando y levantan un aviso que pide control seriado y explica por qué no movieron la categoría — para que el médico no lea una contradicción entre las dos clasificaciones.

Sobre el recuento plaquetario, la guía OPS 2016 es explícita: *«Si bien la trombocitopenia no determina el choque, el descenso progresivo del número de plaquetas es un excelente marcador de la evolución negativa»*. Marcador de seguimiento, no criterio de grupo. Coinciden cinco fuentes: OPS 2016 (guías e instrumento de arbovirosis), MinSalud 2019, OPS/CDE 2020 y OPS 2022.

## Gestación

El embarazo **no complicado** es condición asociada: lleva como mínimo a **B1**. El embarazo **complicado** es, por sí mismo, criterio de hospitalización, con independencia de la categoría de dengue.

**La dosis de líquidos no se reduce por la gestación** en los grupos A, B1 ni B2 — *«el tratamiento […] de la mujer embarazada es semejante al de las no embarazadas […] se usará siempre la solución lactato de Ringer […] en las dosis establecidas»* (OPS 2016). La única excepción es el bolo del **grupo C**, que sí baja de 20 a 10 ml/kg. Hasta la v3.3 la aplicación recortaba también la carga de B2, lo que dejaba a la gestante con la mitad del volumen indicado.

La app pide además la **edad gestacional**: una gestante de 8 semanas y una de 34 no son comparables hemodinámicamente.

Al leer el hematocrito de una gestante, el informe advierte la **hemodilución fisiológica del embarazo**: el volumen plasmático crece más que la masa eritrocitaria, de modo que un hematocrito «dentro del rango» puede ya representar hemoconcentración y uno «bajo» puede ser fisiológico. La referencia numérica **no se corrige** —moverla cambiaría el veredicto y con él la conducta—: se entrega la advertencia y se recuerda que un hemograma previo del propio embarazo pesa más que cualquier referencia poblacional.

## Recomendaciones para la casa

El informe cierra con una hoja de recomendaciones que se arma sola a partir de **tres cosas: el grupo de manejo, la fase del curso clínico y el peso**. Está pensada para copiarla en la epicrisis o entregarla impresa — el instrumento del MinSalud pide expresamente que las órdenes se entreguen por escrito.

Qué cambia según el caso: las cantidades de líquido salen del peso (Holliday-Segar en pediatría, 5 vasos de 250 ml y 2–3 litros en adultos); el mosquitero y el aviso de que **la caída de la fiebre no es mejoría** solo aparecen en fase febril; en recuperación se vigila el exceso de líquidos y el brote; la cita de control es cada 48 h en A y cada 24–48 h en B1; y si el paciente está en fase crítica siendo B2 o C, la hoja encabeza con **«todavía no es momento del alta»** en vez de dar el alta.

Los signos para volver de urgencia van en lenguaje de paciente —«dolor de barriga fuerte y que no cede»— no en lenguaje de ficha.

## Cuándo se pide el hemograma

El hemograma **no hace falta para clasificar** y por eso viene plegado en la pantalla del paciente. En los grupos A y B1 es de control —cada 48 horas, o dentro de los primeros tres días—. En **B2 y C** sí es prerrequisito del tratamiento: la OMS pide el hematocrito de referencia antes de hidratar. Si el caso resulta B2 o C y no se registró, el informe lo reclama en rojo, aclarando que **no se debe esperar el resultado para hidratar**.

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

El `<head>` trae el gancho de **Cloudflare Web Analytics** activo para el sitio `rodriguezcardonaandres81-coder.github.io`. Para cambiar de cuenta o de sitio, entre a `dash.cloudflare.com → Analytics & Logs → Web Analytics → Manage site` y reemplace el token en la constante `TOKEN` del `<head>`. Si lo deja vacío o con el texto `PEGUE_AQUI_SU_TOKEN`, no se carga nada.

Tampoco se carga si la app se abre desde el disco (`file://`): ahí no hay a quién avisar. Hay pruebas que verifican las dos cosas — que desde `file://` no salga ninguna petición y que publicada por HTTP sí salga, con un token del formato correcto.

**Cloudflare mide por hostname**, y en GitHub Pages todos los proyectos de un usuario comparten `usuario.github.io`. Si hay otros repos publicados, sus visitas también se cuentan; en el panel se filtra por la ruta `/ceroaedes/`.

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
