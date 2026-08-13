# MEISTER Dengue

Aplicación web de apoyo a la decisión clínica para la **clasificación y el manejo del dengue**, con cálculo de **reposición hídrica según el peso del paciente**.

Basada en el *Algoritmo de diagnóstico y tratamiento de dengue* de la **OPS/OMS**, adoptado por el **Ministerio de Salud y Protección Social de Colombia (2019)**.

> ⚠️ Herramienta de apoyo. Los cálculos son orientativos y no reemplazan el juicio clínico ni la reestratificación continua del paciente. Verifique siempre los volúmenes antes de administrarlos.

---

## Qué hace

1. **Clasifica** el caso en las cuatro categorías de intervención del algoritmo:

   | Categoría | Definición | Dónde se maneja |
   |---|---|---|
   | **A** | Dengue sin signos de alarma, sin condiciones asociadas ni riesgo social | Casa, control cada 24–48 h |
   | **B1** | Dengue sin signos de alarma **con** condiciones asociadas o riesgo social | Supervisado por personal de salud |
   | **B2** | Dengue **con** signos de alarma | Unidad de dengue, evaluación horaria |
   | **C** | Dengue grave | Estabilizar y remitir; evaluación minuto a minuto |

2. **Calcula la reposición hídrica** a partir del peso, con cronograma horario:

   - **A / B1** — hidratación oral. En adultos, mínimo 2 000 ml/24 h; en pediátricos, mantenimiento por Holliday-Segar + 5 % de déficit. Si hay intolerancia oral en B1, cristaloides a 2–4 ml/kg/h.
   - **B2** — carga de 10 ml/kg en 1 h (repetible hasta 2 veces si persisten signos de alarma y la diuresis es < 1 ml/kg/h), luego 5–7 → 3–5 → 2–4 ml/kg/h.
   - **C** — bolo de 20 ml/kg en 15–30 min (10 ml/kg en gestantes y ≥ 65 años), luego 10 ml/kg/h → 5–7 → 3–5 → 2–4 ml/kg/h, con las rutas de rescate: segundo y tercer bolo, coloide y transfusión (glóbulos rojos 5–10 ml/kg o sangre fresca 10–20 ml/kg).

   Cada fase muestra **ml/h, volumen total, hora proyectada y goteo sin bomba** (macrogotero de 20 gotas/ml y microgotero de 60 µgotas/ml).

3. **Entrega el checklist clínico** de la categoría: laboratorios según el día de enfermedad (RT-PCR/NS1 en días 1–4, IgM desde el día 5), frecuencia de monitoreo de signos vitales, diuresis y hematocrito, criterios de referencia al hospital, criterios de alta, contraindicaciones y notificación a SIVIGILA.

### Detalles que resuelve el motor

- **Adultos y pediátricos** en el mismo flujo: el umbral de 18 años cambia la dosis de acetaminofén (500 mg c/6 h frente a 10–15 mg/kg/dosis, con equivalencia en jarabe de 150 mg/5 ml) y el inicio de la fase crítica (día 4–6 en adultos, día 3–6 en niños).
- **Condiciones asociadas automáticas** por edad y gestación: menor de 1 año, menor de 5 años, ≥ 65 años y embarazo elevan el caso a B1 sin que haya que marcarlas.
- **Peso ideal en obesidad**: si la talla está registrada y el peso supera en más del 20 % el peso ideal (fórmula de Devine), la app ofrece calcular los volúmenes con peso ideal para no sobrehidratar.
- **Presión de pulso**: calculadora integrada que marca el umbral de choque (≤ 20 mmHg).
- **Prueba del torniquete**: criterio y técnica embebidos en la pantalla de caso probable.

---

## Uso

Abra `index.html` en cualquier navegador. No requiere servidor, instalación ni conexión a internet.

### Publicar en GitHub Pages

```bash
git init
git add .
git commit -m "MEISTER Dengue v1.0"
git branch -M main
git remote add origin https://github.com/USUARIO/meister-dengue.git
git push -u origin main
```

Luego, en el repositorio: **Settings → Pages → Source: `main` / root**. La app queda publicada en `https://USUARIO.github.io/meister-dengue/`.

### Instalar en el celular

Con la app abierta desde una URL `https://` (por ejemplo GitHub Pages):

- **Android / Chrome** — menú ⋮ → *Añadir a pantalla de inicio*.
- **iOS / Safari** — botón compartir → *Añadir a pantalla de inicio*.

Queda como ícono independiente y **funciona sin señal**, que es la condición habitual en zona rural endémica. El *service worker* (`sw.js`) cachea toda la aplicación en la primera visita.

---

## Estructura

```
meister-dengue/
├── index.html              # Aplicación completa: interfaz + motor clínico
├── manifest.json           # Metadatos PWA
├── sw.js                   # Service worker (uso sin conexión)
├── assets/
│   ├── icon-192.png
│   ├── icon-512.png
│   └── icon-maskable-512.png
├── tests/
│   └── engine.test.js      # 62 pruebas del motor clínico
├── LICENSE
└── README.md
```

El motor clínico está delimitado en `index.html` entre los comentarios `/* === ENGINE START === */` y `/* === ENGINE END === */`. Es código puro, sin dependencias del DOM: se extrae y se prueba en Node sin navegador.

## Pruebas

```bash
node tests/engine.test.js
```

Verifica la clasificación en los cuatro grupos, la definición de caso probable, los volúmenes de cada fase para adulto y pediátrico, las dosis reducidas en gestación y adulto mayor, el ajuste por peso ideal, las conversiones a goteo, la selección de laboratorios por día de enfermedad y el manejo de horas que cruzan la medianoche.

## Actualizar la aplicación en los dispositivos

Después de editar `index.html`, suba el número de versión en `sw.js`:

```js
const VERSION = 'meister-dengue-v1.0.1';
```

Sin ese cambio, los celulares que ya la tengan instalada seguirán mostrando la versión cacheada.

---

## Fuentes

- Organización Panamericana de la Salud. *Dengue: guías para la atención de enfermos en la Región de las Américas*. 2.ª edición. Washington, D.C.: OPS; 2016.
- Ministerio de Salud y Protección Social de Colombia. *Algoritmo de diagnóstico y tratamiento de dengue*, 2019.
- Ministerio de Salud y Protección Social — Federación Médica Colombiana. *Dengue: memorias*. Bogotá; 2012–2013.

## Autor

**Andrés Rodríguez Cardona** — Epidemiólogo

## Licencia

MIT. Ver [LICENSE](LICENSE).
