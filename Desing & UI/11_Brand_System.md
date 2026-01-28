# BlackGem - Brand Manifesto & Design System

## Document Information
| Field | Value |
|-------|-------|
| Version | 2.2 |
| Last Updated | January 26, 2026 |
| Document Type | Brand Guidelines |

---

> **Concepto Central:** *Institutional Excellence.* (Excelencia Institucional).

---

## 1. Logo Specifications

### A. Primary Wordmark

El logo de BlackGem es un wordmark tipográfico puro, sin símbolo. Esta decisión es intencional: las firmas financieras más respetadas (BlackRock, Blackstone, Carlyle, KKR) utilizan wordmarks porque comunican estabilidad, permanencia y seriedad institucional.

```
TIPOGRAFÍA OFICIAL
─────────────────────────────────────────────────────────
Familia:        Canela (Commercial Type)
"Black":        Canela Regular
"Gem":          Canela Semibold
Fallback:       Libre Baskerville (open-source, solo desarrollo)

El contraste de peso entre "Black" (Regular) y "Gem" (Semibold)
crea jerarquía visual sin romper la sobriedad del wordmark.
```

### B. Construcción del Wordmark

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                                                                 │
│                    BlackGem                                     │
│                    ├────┤├──┤                                   │
│                    Regular Semibold                             │
│                                                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

PROPORCIONES
─────────────────────────────────────────────────────────
Cap Height (X):     Base de medición
Tracking "Black":   0 (normal)
Tracking "Gem":     +10 (ligeramente expandido para balance visual)
Kerning B-l:        Ajuste óptico -20
Kerning k-G:        Ajuste óptico -15 (crítico para unión visual)
Kerning G-e:        Ajuste óptico -10
```

### C. Área de Protección (Clear Space)

El área de protección garantiza que el logo mantenga su impacto visual sin interferencia de otros elementos.

```
                    ┌───┐
                    │ X │ = Cap height del wordmark
                    └───┘
        
        ┌─────────────────────────────────────────┐
        │                                         │
        │    ┌─────────────────────────────┐     │
        │    │                             │     │
        │ X  │        BlackGem             │  X  │
        │    │                             │     │
        │    └─────────────────────────────┘     │
        │                                         │
        └─────────────────────────────────────────┘
                           │
                           X
                           │

Mínimo: 1X en todos los lados (donde X = cap height)
Recomendado: 1.5X para materiales impresos premium
```

### D. Tamaños Mínimos

```
DIGITAL
─────────────────────────────────────────────────────────
Wordmark completo:      Mínimo 80px de ancho
Favicon/App Icon:       Mínimo 16px (usar variante "BG")

IMPRESO
─────────────────────────────────────────────────────────
Wordmark completo:      Mínimo 25mm de ancho
Materiales premium:     Recomendado 40mm+ de ancho
```

### E. Variantes del Logo

**Variante 1 — Wordmark Principal (Horizontal)**

Uso principal en headers, documentos, y materiales de marketing.

```
BlackGem
```

**Variante 2 — Favicon / App Icon ("BG")**

Para espacios reducidos donde el wordmark completo no es legible.

```
Construcción:
┌─────────────┐
│             │
│     BG      │  Canela Semibold
│             │  Centrado en contenedor cuadrado
└─────────────┘

Proporciones del contenedor:
- Ratio: 1:1 (cuadrado)
- Padding interno: 15% de cada lado
- Border radius: 20% del lado (para app icons)
- Border radius: 0% (para favicon)
```

**Variante 3 — Monograma "G"**

Para usos muy reducidos (favicon legacy, watermarks sutiles).

```
┌───────┐
│       │
│   G   │  Canela Semibold, centrado
│       │
└───────┘
```

### F. Versiones de Color

```
VERSIÓN PRIMARIA (Sobre fondos claros)
─────────────────────────────────────────────────────────
Color:          Midnight Ink (#11141D)
Uso:            Materiales light mode, reportes, documentos impresos

VERSIÓN INVERTIDA (Sobre fondos oscuros)
─────────────────────────────────────────────────────────
Color:          Soft Parchment (#F9FAFB)
Uso:            Headers dark mode, CTAs sobre Midnight Ink

VERSIÓN MONOCROMÁTICA
─────────────────────────────────────────────────────────
Negro puro:     #000000 (solo para impresión en una tinta)
Blanco puro:    #FFFFFF (solo para fondos negros puros)
```

### G. Aplicación por Contexto

| Contexto | Variante | Color | Tamaño Mínimo |
|----------|----------|-------|---------------|
| Website header | Wordmark | Midnight Ink | 100px ancho |
| App header | Wordmark | Según modo | 80px ancho |
| Favicon | "BG" | Midnight Ink | 16x16px |
| iOS App Icon | "BG" | Midnight Ink sobre blanco | 1024x1024px master |
| PDF Reports | Wordmark | Midnight Ink | 30mm ancho |
| Email signature | Wordmark | Midnight Ink | 120px ancho |
| Quarterly letter | Wordmark | Midnight Ink | 40mm ancho |
| LP Portal header | Wordmark | Midnight Ink | 100px ancho |
| Cockpit header | Wordmark | Soft Parchment | 100px ancho |

### H. Usos Prohibidos

El logo de BlackGem nunca debe modificarse. Las siguientes alteraciones están estrictamente prohibidas:

```
PROHIBIDO
─────────────────────────────────────────────────────────
✗ Cambiar la tipografía
✗ Cambiar las proporciones o estirar el logo
✗ Agregar efectos (sombras, brillos, gradientes, 3D)
✗ Cambiar los colores a tonos no aprobados
✗ Rotar el logo
✗ Agregar elementos decorativos (líneas, símbolos, iconos)
✗ Colocar sobre fondos que reduzcan el contraste
✗ Usar el wordmark completo en tamaños menores a 80px/25mm
✗ Separar "Black" y "Gem" en líneas diferentes
✗ Agregar taglines pegados al logo (usar espacio separado)
✗ Animar el logo con efectos llamativos
✗ Usar outline en lugar de fill
```

### I. Fondos Permitidos

```
FONDOS APROBADOS
─────────────────────────────────────────────────────────
✓ Soft Parchment (#F9FAFB) — Logo en Midnight Ink
✓ Blanco (#FFFFFF) — Logo en Midnight Ink  
✓ Slate 100 (#F1F5F9) — Logo en Midnight Ink
✓ Midnight Ink (#11141D) — Logo en Soft Parchment
✓ Heritage Sapphire (#3E5CFF) — Logo en blanco (solo CTAs)

FONDOS PROHIBIDOS
─────────────────────────────────────────────────────────
✗ Fotografías o imágenes (salvo con overlay sólido al 85%+)
✗ Gradientes multicolor
✗ Colores brillantes o saturados
✗ Patrones o texturas
✗ Cualquier fondo donde el contraste sea menor a 4.5:1
```

---

## 2. Estrategia de Marca (The Core)

Blackgem es la infraestructura invisible que permite a los **Search Funds** y **Micro-PE** operar con el rigor de una firma de *Large-Cap*. Nuestra identidad proyecta autoridad, solidez y un profesionalismo impecable desde el día uno.

**Misión:** Proyectar madurez institucional inmediata para gestores y confianza absoluta para inversores (LPs).

**La Metáfora:** Un reloj de alta gama o una oficina de banca privada; tecnología de punta bajo una apariencia sobria, atemporal y funcional.

**Personalidad:** Estable, analítica, discreta y experta.

---

## 3. La Dualidad de Interfaz (The Dual Approach)

Blackgem se adapta a la psicología de sus dos perfiles de usuario clave:

### A. The Cockpit (Modo Manager)

| Aspecto | Descripción |
|---------|-------------|
| **Perfil** | El Principal del Search Fund (Ex-Banking/Consulting) |
| **Objetivo** | Eficiencia operativa y revisión diaria de métricas |
| **Estética** | **Soft Dark Mode** — Fondo Midnight Ink (#11141D) |
| **Sensación** | Control, modernidad técnica, profesionalismo |

### B. The Library (Modo LP/Portal)

| Aspecto | Descripción |
|---------|-------------|
| **Perfil** | Inversores y LPs (45-65 años, alto patrimonio) |
| **Objetivo** | Transparencia y acceso a información de inversión |
| **Estética** | **Pristine Light Mode** — Fondo Soft Parchment (#F9FAFB) |
| **Sensación** | Seguridad, tradición, legibilidad de reporte impreso |

---

## 4. Protocolo de Visualización de Datos (The Boardroom Standard)

En Blackgem, los gráficos son herramientas de decisión, no elementos decorativos. Se sigue una política estricta de alto "Ratio Datos-Tinta" (Edward Tufte).

### A. Gráficos Recomendados

**Gráficos de Área** — Exclusivos para mostrar la evolución del valor del portfolio o activos bajo gestión (AUM) a lo largo del tiempo. Usar con gradientes sutiles del color de acento hacia transparente.

**Gráficos de Barras Horizontales** — Formato estándar para comparar métricas (EBITDA, múltiplos, ingresos) entre diferentes deals o compañías del portfolio. Las barras horizontales permiten etiquetas más legibles que las verticales.

**Gráficos de Línea (Fina)** — Reservados para métricas de rendimiento dinámico como IRR (TIR) o Cash Flow a lo largo del tiempo. Línea de 2px máximo, sin markers excepto en hover.

**Tablas de Datos** — El corazón de la plataforma. Representan el 80% de la interacción del usuario.

```
Especificaciones de Tablas:
├── Tipografía: Monoespaciada para números (JetBrains Mono o similar)
├── Alineación: Decimal perfecta en columnas numéricas
├── Bordes: Líneas horizontales de 1px, sin bordes verticales
├── Hover: Fila completa con fondo sutil (#F1F5F9 en light, #1E293B en dark)
└── Spacing: Padding vertical generoso (12-16px por celda)
```

### B. Elementos Prohibidos (Anti-Patterns)

| Elemento | Razón de Prohibición |
|----------|---------------------|
| **Pie Charts** | Imprecisión al comparar magnitudes similares. El ojo humano no puede comparar ángulos con precisión. |
| **Gráficos 3D** | Distorsionan la percepción de los datos y restan profesionalismo. Sin excepciones. |
| **Animaciones Excesivas** | Blackgem no es un pitch deck. Las transiciones deben ser instantáneas o fade-in funcional (<200ms). |
| **Sombras Pesadas** | Los gráficos deben ser planos (flat). Máximo permitido: sombra sutil en cards (0 2px 4px rgba(0,0,0,0.05)). |
| **Gradientes Multicolor** | Usar máximo 2 puntos de color. Preferir sólidos o gradiente hacia transparente. |
| **Iconografía Decorativa** | Los iconos deben ser funcionales. No usar ilustraciones ni emojis en la interfaz principal. |

---

## 5. Universo Visual

### A. Paleta de Colores (Stealth Wealth)

```
COLORES PRIMARIOS
─────────────────────────────────────────────────────────
Midnight Ink        #11141D     Fondo principal (dark mode)
Soft Parchment      #F9FAFB     Fondo principal (light mode)

COLORES DE ACENTO
─────────────────────────────────────────────────────────
Heritage Sapphire   #3E5CFF     Acento principal, CTAs, links
Emerald Forest      #059669     Éxito, crecimiento, IRR positivo

COLORES NEUTRALES
─────────────────────────────────────────────────────────
Slate 700           #334155     Texto principal (dark mode)
Slate 600           #475569     Texto secundario, bordes
Slate 400           #94A3B8     Texto deshabilitado, placeholders
Slate 200           #E2E8F0     Bordes sutiles (light mode)
Slate 100           #F1F5F9     Fondos secundarios (light mode)

COLORES SEMÁNTICOS
─────────────────────────────────────────────────────────
Error/Decline       #DC2626     Errores, IRR negativo, deals pasados
Warning             #D97706     Alertas, items pendientes
Info                #2563EB     Información neutral
```

### B. Aplicación de Color por Contexto

| Contexto | Light Mode | Dark Mode |
|----------|------------|-----------|
| Fondo página | #F9FAFB | #11141D |
| Fondo card | #FFFFFF | #1E293B |
| Texto principal | #1E293B | #F1F5F9 |
| Texto secundario | #475569 | #94A3B8 |
| Bordes | #E2E8F0 | #334155 |
| Hover state | #F1F5F9 | #334155 |

### C. Tipografía (Editorial Mix)

**Sans-Serif para UI y Datos**

```
Familia: Inter (primaria) o Public Sans (alternativa)
Pesos utilizados: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)

Aplicaciones:
├── Body text: 14px / 400 / line-height 1.5
├── Labels: 12px / 500 / letter-spacing 0.02em
├── Buttons: 14px / 600
├── Table headers: 12px / 600 / uppercase / letter-spacing 0.05em
└── Large numbers (KPIs): 32-48px / 700
```

**Serif para Reportes y Títulos**

```
Familia: Source Serif Pro (primaria) o Lora (alternativa)
Pesos utilizados: 400 (regular), 600 (semibold), 700 (bold)

Aplicaciones:
├── Report titles: 24-32px / 700
├── Section headers: 18-20px / 600
├── PDF documents: 11pt / 400 / line-height 1.6
└── Quarterly letter salutation: 14px / 400 / italic
```

**Monoespaciada para Números**

```
Familia: JetBrains Mono o Roboto Mono
Peso: 400 (regular), 500 (medium)

Aplicaciones:
├── Tablas financieras: 13px / 400
├── Capital accounts: 14px / 500
├── Large monetary values: 24-32px / 500
└── Timestamps: 11px / 400
```

---

## 6. Principios de UI/UX Institucional

### Principio 1: Espaciado de Lujo

El desorden comunica caos. Usamos márgenes amplios para transmitir control.

```
Spacing Scale (basado en 4px):
├── xs: 4px   — Entre elementos inline
├── sm: 8px   — Padding interno compacto
├── md: 16px  — Padding estándar de cards
├── lg: 24px  — Separación entre secciones
├── xl: 32px  — Margen de página (móvil)
└── 2xl: 48px — Margen de página (desktop)
```

### Principio 2: Líneas de Precisión

Divisiones mediante líneas de 1px en tonos grises suaves, nunca sombras pesadas.

```css
/* Bordes estándar */
border: 1px solid var(--slate-200);  /* Light mode */
border: 1px solid var(--slate-700);  /* Dark mode */

/* Sombras permitidas (solo para elevación de cards) */
box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);  /* Light mode */
box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);   /* Dark mode */
```

### Principio 3: Arquitectura de Información

Priorización de KPIs críticos en la parte superior de cada vista.

```
Jerarquía Visual por Vista:

Dashboard:
├── Row 1: Fund summary (AUM, IRR, MOIC) — Números grandes
├── Row 2: Alerts / Action items — Cards destacadas
└── Row 3: Recent activity / Charts — Información secundaria

Deal Detail:
├── Header: Company name + Stage badge + Key metrics
├── Tabs: Overview | Financials | DD | Documents | Activity
└── Sidebar: Quick actions + Contacts

LP Portal:
├── Header: Welcome + Last login
├── Row 1: My investment summary (Committed, Contributed, Value)
├── Row 2: Recent documents / Reports
└── Row 3: Fund updates
```

### Principio 4: Feedback Inmediato

Cada acción del usuario debe tener confirmación visual instantánea.

```
Estados de Interacción:
├── Hover: Cambio de fondo en <50ms
├── Click: Feedback visual en <100ms
├── Loading: Skeleton screens, no spinners giratorios
├── Success: Toast notification + color verde sutil
└── Error: Inline message + borde rojo en campo
```

---

## 7. Voz y Tono

### Autoridad Serena

Hablamos como un socio de confianza, no como una startup de software.

| En lugar de... | Decimos... |
|----------------|------------|
| "¡Genial! Tu deal fue creado." | "Deal registrado." |
| "Oops, algo salió mal." | "No se pudo completar la acción. Intenta nuevamente." |
| "¡Felicidades por tu primer capital call!" | "Capital call creado. Los LPs serán notificados." |

### Precisión Financiera

Uso riguroso de terminología técnica sin explicaciones innecesarias.

```
Términos que usamos sin definir:
├── EBITDA, EBITDA Bridge
├── IRR (TIR), MOIC, Cash-on-Cash
├── Dry Powder, Committed Capital, Paid-In
├── Waterfall, Hurdle Rate, Carried Interest
├── LOI, DD (Due Diligence), CIM
└── Cap Table, Pro-Rata, Dilution
```

### Economía de Lenguaje

Si el dato es sólido, no necesita adornos.

```
Labels y Microcopy:
├── Buttons: "Guardar" no "Guardar cambios ahora"
├── Empty states: "Sin deals activos" no "Aún no has agregado ningún deal"
├── Confirmations: "Eliminado" no "El elemento ha sido eliminado exitosamente"
└── Tooltips: Solo cuando agregan información, no para decorar
```

---

## 8. Componentes Clave

### Cards

```
Especificación:
├── Border radius: 8px
├── Border: 1px solid var(--border-color)
├── Padding: 20px (desktop), 16px (móvil)
├── Shadow: Sutil o ninguna
└── Hover: No cambia (las cards no son clickeables completas)
```

### Buttons

```
Variantes:
├── Primary: Heritage Sapphire (#3E5CFF), texto blanco
├── Secondary: Transparente, borde Slate, texto Slate
├── Ghost: Sin borde ni fondo, texto Sapphire
└── Destructive: Error red (#DC2626), texto blanco

Tamaños:
├── sm: 32px height, 12px padding-x, 13px font
├── md: 40px height, 16px padding-x, 14px font
└── lg: 48px height, 24px padding-x, 16px font

Border radius: 6px (no full rounded)
```

### Badges / Status Indicators

```
Deal Stages:
├── Initial Review: Slate background
├── Analysis/Meeting: Blue background
├── LOI/DD: Sapphire background
├── Closing: Emerald background
├── Closed (Won): Emerald solid
└── Passed: Slate muted

Investor Status:
├── Prospect → Committed: Gradient de intensidad
├── Funded: Emerald solid
└── Inactive: Slate muted
```

---

## 9. Documentos y Reportes (Output Design)

Los PDFs y reportes generados por Blackgem deben ser indistinguibles de los producidos por una firma institucional.

### Quarterly Report Template

```
Especificaciones:
├── Tamaño: Letter (8.5" x 11") o A4
├── Márgenes: 1" todos los lados
├── Tipografía título: Source Serif Pro 24pt
├── Tipografía body: Source Serif Pro 11pt
├── Tipografía tablas: Inter 10pt
├── Colores: Solo negro, Slate grey, y Sapphire para acentos
├── Gráficos: Escala de grises + un color de acento
└── Logo: Esquina superior derecha, discreto
```

### Capital Call Notice

```
Especificaciones:
├── Formato: Carta formal
├── Header: Logo + dirección del fondo
├── Tipografía: Source Serif Pro throughout
├── Tabla de amounts: Inter monospace para números
├── Firma: Espacio para firma digital o manuscrita
└── Footer: Información legal requerida
```

---

## 10. Diferenciación Visual (Quick Reference)

### Blackgem ES:

Un dashboard que podría estar en una pantalla de Morgan Stanley. Reportes que se confunden con los de BlackRock. Una experiencia que hace que un fondo de $5M se sienta como uno de $500M.

### Blackgem NO ES:

Una app con ilustraciones de personas sonriendo. Un SaaS con confetti cuando completas una acción. Una plataforma con modo oscuro "gamer" y acentos neón. Un producto que necesita explicar qué es un EBITDA.

---

> *"En Blackgem, la tecnología no es el espectáculo; es el cimiento de la confianza financiera."*

---

## Related Documents

| Document | Description |
|----------|-------------|
| `00_Product_Strategy.md` | Product vision and positioning |
| `09_Claude_Instructions.md` | Implementation patterns |
