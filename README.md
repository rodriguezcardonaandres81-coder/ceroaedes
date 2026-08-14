# CeroAedes by AR

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

Se registran la **fecha de inicio de síntomas** y la **fecha de consulta**, y el día se calcula solo. El día 1 es el día en que inicia la fiebre, como cuenta el INS: inicio el 12 y consulta el 13 son dos días de evolución. La app avisa si el inicio quedó después de la consulta, y permite seleccionar el día a mano cuando el paciente no precisa la fecha. Eso también deja registrar consultas de pacientes vistos días atrás.

### 6. Ausencia confirmada, no asumida

En signos de alarma y en manifestaciones graves hay una casilla **"Ninguno — los busqué y no hay"**. La app no deja avanzar sin que se elija una de las dos cosas: o se marca al menos un signo, o se confirma explícitamente que se buscaron y no hay. No marcar nada ya no equivale a decir que no hay: el negativo queda registrado como tal en el reporte, en la conducta copiada y en el Word, que es lo que exige una historia clínica auditable.

### 7. Torniquete, signos vitales e imágenes

- **Prueba del torniquete** con la técnica completa en la pantalla de definición de caso. Es apoyo diagnóstico y parte de la búsqueda activa de manifestaciones hemorrágicas que exige el instrumento de auditoría (ítem 11); no suma para la definición de caso porque no es casilla de la sección 6.
- **Signos vitales**: TA, FC, FR, temperatura, SatO₂, llenado capilar y estado de conciencia, con **PAM y presión de pulso calculadas**.
- **Ecografía abdominal y radiografía de tórax** sugeridas ante hallazgos de fuga vascular, que son las que documentan ascitis y derrame pleural.

### 8. Salida en Word y copiado de conducta

- **Exportar a Word** genera un `.docx` real con tablas: clasificación, ficha del paciente, hallazgos, plan de líquidos fase por fase, manejo sintomático, laboratorio, monitoreo y criterios de alta o de referencia. El médico lo abre, copia y pega en la historia clínica.
- **Copiar conducta** deja en el portapapeles la misma información como texto plano, para pegar directamente sin abrir Word.

El documento Word cierra con una sección **«Registro para historia clínica»** que reproduce los ítems 1 a 17 del *Instrumento de seguimiento y evaluación de casos de dengue*: anamnesis, examen físico, laboratorio e imágenes diagnósticas. Lo que la app ya capturó aparece marcado y en negrilla; lo demás queda como campo con línea para completar. El objetivo es que la historia clínica quede lista para la auditoría.

El escritor de `.docx` está implementado en JavaScript puro dentro del mismo archivo — sin librerías, sin servidor y funcionando sin conexión.

### Detalles que resuelve el motor

- **Adultos y pediátricos** en el mismo flujo: el umbral de 18 años cambia la dosis de acetaminofén (500 mg c/6 h frente a 10–15 mg/kg/dosis, con equivalencia en jarabe de 150 mg/5 ml) y el inicio de la fase crítica (día 4–6 en adultos, día 3–6 en niños).
- **Condiciones asociadas automáticas** por edad y gestación: menor de 1 año, ≥ 65 años y embarazo elevan el caso a B1 sin que haya que marcarlas. El *menor de 5 años* se ofrece marcado y es desmarcable, porque la guía nacional lo incluye en el grupo B y el algoritmo OPS 2019 no.
- **Peso ideal en obesidad**: si la talla está registrada y el peso supera en más del 20 % el peso ideal, la app ofrece calcular los volúmenes con peso ideal. La indicación es de la OMS — *«Use the ideal body weight for calculation of fluid infusion for obese and overweight patients»*, Handbook for Clinical Management of Dengue, secciones 2.2.2 y 2.2.3.1. La OMS publica una tabla de peso ideal por talla (Textbox J); la app lo calcula con la **fórmula de Devine**, que puede diferir en uno o dos kilos.
- **Presión de pulso**: calculadora integrada que marca el umbral de choque (≤ 20 mmHg).
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
│   ├── engine.test.js      # 154 pruebas del motor clínico
│   └── ui.test.js          # Recorridos en navegador real + validación del .docx
├── LICENSE
└── README.md
```

El motor clínico está delimitado en `index.html` entre los comentarios `/* === ENGINE START === */` y `/* === ENGINE END === */`. Es código puro, sin dependencias del DOM: se extrae y se prueba en Node sin navegador.

La función `construirReporte()` produce un único modelo de datos del que se derivan **tanto la pantalla como el documento Word**, de modo que no puedan divergir.

## Pruebas

```bash
node tests/engine.test.js    # motor clínico
npm i -D playwright && node tests/ui.test.js   # interfaz y exportación
```

El motor verifica la definición operativa de caso, la clasificación en los cuatro grupos, los volúmenes de cada fase para adulto y pediátrico, las dosis reducidas en gestación y adulto mayor, el ajuste por peso ideal, las conversiones a goteo y la selección de laboratorios por día de enfermedad. El recorrido de interfaz además descarga el `.docx` generado y comprueba que abra correctamente.

## Actualizar la aplicación en los dispositivos

Después de editar `index.html`, suba el número de versión en `sw.js`:

```js
const VERSION = 'ceroaedes-v2.4.1';
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
- Organización Mundial de la Salud. *Laboratory testing for dengue virus: interim guidance*. Abril de 2025.

## Autor

**Andrés Rodríguez Cardona** — Epidemiólogo

## Licencia

MIT. Ver [LICENSE](LICENSE).
