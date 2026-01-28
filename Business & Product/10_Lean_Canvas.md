# BlackGem - Lean Canvas

## Document Information
| Field | Value |
|-------|-------|
| Version | 1.1 |
| Last Updated | January 26, 2026 |
| Author | NIRO Group LLC |
| Document Type | Business Model |

---

## Document Purpose

> **Relationship to Other Documents:**
> 
> This document focuses on **business viability** — how BlackGem will make money and reach customers. For user needs and product features, see `00_Product_Strategy.md`. For visual identity and UX, see `11_Brand_System.md`.
>
> | Question | This Document | Product Strategy |
> |----------|---------------|------------------|
> | Who are our users? | Market size, segments | Personas, journeys, pain points |
> | What do we build? | High-level solution | Detailed MVP, features |
> | How do we make money? | **Pricing, revenue model** | — |
> | How do we reach customers? | **Channels, go-to-market** | — |
> | What makes us different? | **Unfair advantages** | Value proposition |

---

## Lean Canvas Overview

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                        LEAN CANVAS: BLACKGEM                                        │
├──────────────────────┬──────────────────────┬──────────────────────┬──────────────────────┬──────────────────────┤
│                      │                      │                      │                      │                      │
│      PROBLEM         │     SOLUTION         │   UNIQUE VALUE       │  UNFAIR ADVANTAGE    │  CUSTOMER SEGMENTS   │
│                      │                      │   PROPOSITION        │                      │                      │
│ 1. Fund managers     │ 1. Integrated deal   │                      │ 1. Deep domain       │ Primary:             │
│    spend 8-10 hrs/   │    pipeline with     │  "El sistema         │    expertise en      │ • Search Fund        │
│    week on admin     │    stage management  │   operativo para     │    search funds      │   Principals         │
│    instead of        │    and DD tracking   │   search funds que   │    (NIRO Group LLC)  │   (MBA grads,        │
│    sourcing deals    │                      │   te hace ver como   │                      │   ex-bankers)        │
│                      │ 2. Automated LP      │   un fondo           │ 2. Primeros en el    │                      │
│ 2. Capital account   │    portal with       │   institucional      │    nicho específico  │ Secondary:           │
│    calculations are  │    real-time         │   desde el día uno"  │    de micro-PE       │ • Limited Partners   │
│    manual and        │    capital accounts  │                      │                      │   (HNW individuals,  │
│    error-prone       │                      │  ─────────────────   │ 3. Network effects   │   family offices)    │
│                      │ 3. One-click         │                      │    potenciales con   │                      │
│ 3. LPs have zero     │    professional      │  High-Level Concept: │    comunidad de      │ Tertiary:            │
│    visibility sin    │    quarterly         │  "Carta meets        │    searchers         │ • Micro-PE Funds     │
│    molestar al       │    reports + K-1     │   HubSpot para       │                      │ • Holding Companies  │
│    fund manager      │    distribution      │   Search Funds"      │                      │ • Fund Analysts      │
│                      │                      │                      │                      │                      │
├──────────────────────┴──────────────────────┤                      ├──────────────────────┴──────────────────────┤
│                                             │                      │                                             │
│              KEY METRICS                    │                      │               CHANNELS                      │
│                                             │                      │                                             │
│ Acquisition:                                │                      │ Discovery:                                  │
│ • Search funds onboarded / month            │                      │ • Stanford GSB Search Fund community        │
│ • Conversion rate website → trial           │                      │ • Search Fund Accelerator programs          │
│                                             │                      │ • LinkedIn (search fund principals)         │
│ Activation:                                 │                      │ • Referrals de LPs satisfechos              │
│ • % users que agregan deal en día 1         │                      │                                             │
│ • Time to first LP portal invite            │                      │ Delivery:                                   │
│                                             │                      │ • Web app (responsive)                      │
│ Retention:                                  │                      │ • LP Portal (white-label ready)             │
│ • Monthly active users / total users        │                      │                                             │
│ • Churn rate por tier                       │                      │ Education:                                  │
│                                             │                      │ • Blog con best practices                   │
│ Revenue:                                    │                      │ • Webinars con searchers exitosos           │
│ • MRR y MRR growth                          │                      │ • Templates y recursos gratuitos            │
│ • ARPU por tier                             │                      │                                             │
│ • Upgrade rate Searcher → Operator          │                      │                                             │
│                                             │                      │                                             │
├─────────────────────────────────────────────┴──────────────────────┴─────────────────────────────────────────────┤
│                                                                                                                  │
│                                              COST STRUCTURE                                                      │
│                                                                                                                  │
│ Fixed Costs:                                          Variable Costs:                                            │
│ • Infrastructure (Vercel, Supabase): ~$200-500/mo     • Payment processing (Stripe): 2.9% + $0.30              │
│ • Domain, email services: ~$50/mo                     • Email transactional (Resend): ~$0.001/email             │
│ • Development tools: ~$100/mo                         • File storage (S3/R2): ~$0.02/GB                         │
│                                                       • Support time per customer                                │
│ One-time / Periodic:                                                                                             │
│ • Legal (terms, privacy): ~$2-5K initial              Break-even estimate:                                       │
│ • Security audit: ~$5-10K annually                    • ~$1,000/month fixed costs                               │
│ • Accounting/tax: ~$2-4K annually                     • Need ~25 Searcher customers OR ~7 Operator customers    │
│                                                                                                                  │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                                  │
│                                              REVENUE STREAMS                                                     │
│                                                                                                                  │
│ ┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐ │
│ │                                                                                                             │ │
│ │   TIER SEARCHER              TIER OPERATOR               TIER FUND MANAGER           ADD-ONS               │ │
│ │   $49/mes | $399/año         $199/mes | $1,899/año       $399/mes | $3,599/año       Variable              │ │
│ │                                                                                                             │ │
│ │   Para: Fase de búsqueda     Para: Post-adquisición      Para: Multi-fund/PE         • K-1 Gen: +$50/mo   │ │
│ │                                                                                       • API Access: +$99/mo│ │
│ │   ✓ Deal pipeline completo   ✓ Todo en Searcher          ✓ Todo en Operator          • Priority: +$100/mo │ │
│ │   ✓ Contactos y actividades  ✓ LP Portal completo        ✓ Multi-fund support                              │ │
│ │   ✓ DD Checklist             ✓ Capital calls             ✓ White-label portal                              │ │
│ │   ✓ Document storage (5GB)   ✓ Distributions             ✓ Advanced analytics                              │ │
│ │   ✓ Basic reporting          ✓ Portfolio tracking        ✓ API access incluido                             │ │
│ │   ✓ 2 usuarios               ✓ Quarterly reports         ✓ Usuarios ilimitados                             │ │
│ │                              ✓ 5 usuarios                ✓ Storage ilimitado                               │ │
│ │                              ✓ Storage 25GB              ✓ Soporte prioritario                             │ │
│ │                                                                                                             │ │
│ │   Target: 60% of customers   Target: 30% of customers    Target: 10% of customers                          │ │
│ │                                                                                                             │ │
│ └─────────────────────────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                                  │
│ Revenue Model Characteristics:                                                                                   │
│ • Subscription-based (MRR predictable)                                                                          │
│ • Tiered by fund lifecycle phase (natural upgrade path)                                                         │
│ • Annual discount: 2 months free (improves cash flow, reduces churn)                                            │
│ • No per-seat pricing (encourages adoption across team)                                                         │
│ • No AUM-based pricing (predictable for customers)                                                              │
│                                                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Problem (Problema)

### Problemas Principales que Resolvemos

El primer problema crítico es el **tiempo perdido en administración**. Los fund managers pasan entre 8 y 10 horas semanales en tareas administrativas como actualizar spreadsheets, enviar emails de seguimiento a LPs, compilar reportes trimestrales, y buscar documentos dispersos. Cada hora en admin es una hora menos buscando deals o creando valor en la empresa adquirida.

El segundo problema es la **gestión de capital propensa a errores**. Los cálculos de capital accounts, pro-rata de capital calls, y especialmente waterfall distributions son complejos y se hacen manualmente en Excel. Un error de cálculo puede dañar permanentemente la relación con un LP y la reputación del fund manager.

El tercer problema es la **opacidad para los inversores**. Los LPs no tienen visibilidad en tiempo real de su inversión. Para cualquier pregunta básica como cuál es mi balance actual, dónde está mi K-1, o cómo va el fund, tienen que molestar al fund manager y esperar una respuesta que puede tardar días.

### Alternativas Existentes y Sus Limitaciones

Actualmente, los search fund principals usan una combinación fragmentada de herramientas. Excel o Google Sheets sirve para tracking de deals y capital accounts, pero es propenso a errores, no colaborativo, y se ve poco profesional. Notion o Airtable funcionan para organización general, pero no tienen lógica financiera ni LP portal. CRMs genéricos como HubSpot o Salesforce no están diseñados para PE, son caros, y requieren customización extensiva. Finalmente, el software de PE enterprise como Juniper Square o Carta cuesta entre $10K y $50K al año, es excesivo para un search fund, y está diseñado para fondos institucionales.

---

## 2. Customer Segments (Segmentos de Clientes)

### Segmento Primario: Search Fund Principals

**Perfil demográfico:** MBA graduates de 28-35 años, típicamente de programas top como Stanford, Harvard, o Wharton, con 3-7 años de experiencia previa en investment banking, consulting, o private equity.

**Tamaño del mercado:** Aproximadamente 100-150 nuevos search funds se lanzan globalmente cada año, con alrededor de 400-500 search funds activos en cualquier momento dado. El mercado está concentrado en Estados Unidos pero crece en España, Latinoamérica, y otras regiones.

**Características clave:** Son técnicamente sofisticados y esperan software moderno. Tienen presupuesto limitado durante la búsqueda, típicamente entre $200 y $500 al mes para todas las herramientas. Son altamente sensibles a la imagen profesional porque están vendiendo confianza a sus LPs. Además, valoran enormemente su tiempo porque cada hora cuenta en una búsqueda de 18-24 meses.

**Jobs-to-be-done:** Encontrar y cerrar la adquisición correcta, mantener a los LPs informados y satisfechos, verse profesional y organizado, y minimizar tiempo administrativo.

### Segmento Secundario: Limited Partners (LPs)

**Perfil:** High-net-worth individuals de 45-65 años, family offices, y algunos institucionales pequeños. Típicamente invierten entre $25K y $200K por search fund, y suelen ser LPs en múltiples fondos simultáneamente.

**Necesidades:** Acceso fácil a información de su inversión, documentos fiscales como K-1 disponibles cuando los necesitan, comunicación consistente y profesional, y confianza en que el fondo está bien gestionado.

**Nota importante:** Los LPs no pagan por el software, pero son usuarios críticos del LP Portal. Su satisfacción influye directamente en la capacidad del fund manager de levantar capital futuro y obtener referencias.

### Segmento Terciario: Micro-PE y Holding Companies

**Perfil:** Fondos de PE pequeños con AUM de $10M-$50M, holding companies permanentes estilo Berkshire en miniatura, y family offices que hacen inversiones directas.

**Oportunidad:** Este segmento es significativamente más grande que search funds tradicionales y tiene mayor capacidad de pago. Representan el path de crecimiento natural una vez validado el producto con search funds.

---

## 3. Unique Value Proposition (Propuesta de Valor Única)

### Statement Principal

**"El sistema operativo para search funds que te hace ver como un fondo institucional desde el día uno."**

### High-Level Concept

La forma más simple de explicar el producto es como **"Carta meets HubSpot para Search Funds"**. Combina la gestión de cap table y relaciones con inversores de Carta con el CRM y pipeline management de HubSpot, pero diseñado específicamente para el flujo de trabajo de un search fund.

### Propuesta de Valor por Segmento

Para Search Fund Principals el valor se centra en que pasan de gastar entre 8 y 10 horas semanales en administración a solo 2 o 3 horas. Esto significa que tienen más tiempo para lo que realmente importa: encontrar y cerrar deals. Además, eliminan el riesgo de errores en cálculos financieros que podrían dañar su credibilidad, y se ven profesionales ante LPs desde el primer día con un portal branded y reportes consistentes.

Para Limited Partners el valor está en la transparencia sin fricción. Pueden acceder a su información de inversión 24/7 sin tener que molestar al fund manager. Tienen sus documentos fiscales disponibles cuando los necesitan, y la experiencia consistente y profesional les genera confianza en el fondo.

Para Analysts el valor se traduce en claridad y organización. Tienen un sistema donde pueden ver exactamente qué se ha hecho y qué falta por hacer, con tareas claras vinculadas a deals específicos y sin confusión de versiones de documentos.

---

## 4. Solution (Solución)

### Features Principales

La primera solución es un **Pipeline de Deals Integrado** que permite agregar un deal en menos de 60 segundos. El sistema incluye gestión de stages con validación automática, un tracker de due diligence con checklist pre-poblado, logging de actividades como calls, emails, y reuniones, y almacenamiento de documentos organizado por deal.

La segunda solución es un **Portal de LP Automatizado** que muestra capital accounts en tiempo real. Los LPs tienen acceso self-service a documentos y reportes, el portal tiene un diseño profesional que puede llevar branding del fondo, y las notificaciones automáticas informan sobre capital calls y distribuciones.

La tercera solución es **Reporting con Un Click**. El sistema auto-genera reportes trimestrales con datos pre-poblados, calcula IRR y MOIC automáticamente, genera PDFs profesionales listos para distribuir, y permite distribución directa a LPs a través del portal.

### Diferenciadores vs. Alternativas

Comparado con spreadsheets, la plataforma ofrece cálculos automáticos y verificados, colaboración en tiempo real, y un LP Portal imposible de replicar en Excel. Comparado con herramientas genéricas como Notion o Airtable, tiene lógica financiera built-in, workflows específicos de PE, y no requiere configuración DIY. Comparado con software enterprise como Juniper Square, el precio es 10-20 veces menor, la implementación es inmediata en lugar de semanas, y está diseñado para el tamaño y necesidades específicas de search funds.

---

## 5. Channels (Canales)

### Canales de Descubrimiento

El canal principal será la **Comunidad de Search Funds**, específicamente Stanford GSB que es el epicentro del modelo con una conferencia anual y red de alumni activa, IESE en Barcelona que lidera el mercado europeo, y Harvard Business School con su programa de search funds creciente. La estrategia será ofrecer el producto a sus redes de searchers, posiblemente con pricing especial para alumni.

El segundo canal son los **Search Fund Accelerators** como Relay Investments, Pacific Lake Partners, y Search Fund Accelerator en España. Estos programas invierten en 10-20 searchers simultáneamente y podrían adoptar la plataforma como herramienta estándar para sus portfolios.

El tercer canal es **LinkedIn y Content Marketing**. La comunidad de search funds es activa en LinkedIn, por lo que publicar contenido útil como templates, best practices, y case studies puede generar awareness orgánico. También hay oportunidad en podcasts especializados como "Think Like an Owner" y "Acquiring Minds".

El cuarto canal son **Referrals de LPs**. Un LP satisfecho que invierte en múltiples search funds puede recomendar la plataforma a otros fund managers en su portfolio. Este es potencialmente el canal más poderoso porque viene con trust incorporado.

### Canales de Entrega

El producto se entrega como una **Web App Responsive**, optimizada para desktop donde se hace el trabajo pesado pero funcional en móvil para quick checks. El **LP Portal** es una experiencia separada con posibilidad de custom domain y branding, diseñada para ser simple y enfocada en lo que los LPs necesitan.

### Canales de Educación

Mantendremos un **Blog con Best Practices** que incluirá guías como "How to Structure Your First Capital Call", "DD Checklist for Manufacturing Companies", y "LP Communication Best Practices". También realizaremos **Webinars** mensuales con searchers que han tenido exits exitosos, lo cual sirve doble propósito de educación y marketing.

---

## 6. Revenue Streams (Flujos de Ingresos)

### Modelo de Monetización: SaaS Tiered por Fase

La estructura de tiers está diseñada para alinearse con la realidad económica del ciclo de vida de un search fund.

**Tier Searcher a $49/mes o $399/año** está diseñado para fondos en fase de búsqueda que tienen presupuesto limitado pero necesitan verse profesionales. Incluye deal pipeline completo con stages y DD tracking, gestión de contactos y actividades, almacenamiento de documentos de hasta 5GB, reportes básicos, y soporte para 2 usuarios. El precio de $49/mes es accesible para cualquier presupuesto de búsqueda pero no es gratis, lo cual filtra curiosos y genera compromiso.

**Tier Operator a $199/mes o $1,899/año** está diseñado para fondos que han cerrado una adquisición y ahora tienen una empresa real con presupuesto operativo. Incluye todo lo del tier Searcher más LP Portal completo con branding, capital calls y distributions con cálculos automáticos, tracking de portfolio company con financials y KPIs, quarterly reports profesionales, soporte para 5 usuarios, y almacenamiento de 25GB. El trigger de upgrade es natural porque una vez que cierras, genuinamente necesitas estas herramientas.

**Tier Fund Manager a $399/mes o $3,599/año** está diseñado para PE funds o holding companies con múltiples inversiones. Incluye todo lo del tier Operator más soporte multi-fund, LP Portal white-label con custom domain, analytics avanzados, API access para integraciones, usuarios ilimitados, almacenamiento ilimitado, y soporte prioritario.

### Add-Ons Opcionales

Algunos features de alto valor estarán disponibles como add-ons en cualquier tier. La generación automatizada de K-1 costará $50/mes adicionales y requiere integración con datos fiscales, representando alto valor percibido durante tax season. El API Access para integraciones custom costará $99/mes. El soporte prioritario con SLA de respuesta de menos de 4 horas costará $100/mes.

### Características del Modelo

El modelo es subscription-based con MRR predecible, sin sorpresas para clientes ni para nosotros. El tiering está basado en fase del fondo, no en métricas como AUM o número de LPs, lo que hace el pricing simple y predecible. El descuento anual de 2 meses gratis mejora cash flow y reduce churn. No hay pricing per-seat porque queremos incentivar adopción completa del equipo. No hay pricing por AUM para mantener predictibilidad para el cliente.

### Proyección de Revenue Mix

Esperamos que el mix de clientes sea aproximadamente 60% Searcher, 30% Operator, y 10% Fund Manager, resultando en un ARPU blended de aproximadamente $120/mes.

---

## 7. Cost Structure (Estructura de Costos)

### Costos Fijos Mensuales

La infraestructura técnica tendrá un costo de $200-500/mes, incluyendo Vercel Pro a $20/mes, Supabase Pro a $25-100/mes dependiendo de uso, y servicios auxiliares como Resend, Sentry, y analytics. El dominio y email costará aproximadamente $50/mes incluyendo dominio, email transaccional, y certificados. Las herramientas de desarrollo sumarán aproximadamente $100/mes por GitHub, Figma, y herramientas de testing. El total de costos fijos operativos ronda los $350-650/mes.

### Costos Variables

El procesamiento de pagos a través de Stripe costará 2.9% más $0.30 por transacción, aproximadamente $1.75 en un pago de $49. El almacenamiento de archivos en S3 o R2 costará alrededor de $0.02/GB/mes, siendo negligible hasta escala significativa. El email transaccional a través de Resend costará $0.001/email, también negligible. El soporte al cliente representará tiempo, pero inicialmente será manejado por founders.

### Costos Periódicos

Los costos legales iniciales de terms of service, privacy policy, y estructura serán de $2-5K. El audit de seguridad anual recomendado post-product-market-fit será de $5-10K. La contabilidad y taxes anuales serán de $2-4K.

### Análisis de Break-Even

El costo fijo mensual total es aproximadamente $1,000 incluyendo algo de buffer. El revenue necesario para break-even es $1,000/mes MRR. Con ARPU de $120/mes, esto significa aproximadamente 8-9 clientes pagando. Alternativamente, con puro Tier Searcher a $49/mes se necesitarían 21 clientes, o con puro Tier Operator a $199/mes se necesitarían solo 5 clientes.

### Nota sobre Costos de Desarrollo

El desarrollo inicial lo hace el equipo de NIRO Group LLC como inversión estratégica. No se contabiliza como costo operativo para efectos de este canvas, pero es relevante para decisiones de inversión y valoración futura.

---

## 8. Key Metrics (Métricas Clave)

### Métricas de Adquisición

Las métricas clave de adquisición son los search funds onboarded por mes, la tasa de conversión de visitante web a trial, el costo de adquisición de cliente (CAC), y el tiempo desde primer contacto hasta cliente pagando.

**Targets iniciales (Año 1):** 3-5 nuevos fondos por mes, conversión de visitante a trial mayor a 5%, CAC menor a $200, y tiempo a conversión menor a 30 días.

### Métricas de Activación

Las métricas de activación incluyen el porcentaje de usuarios que agregan un deal en su primer día, el tiempo hasta la primera invitación a LP Portal, el porcentaje que completa el onboarding de fund setup, y el porcentaje que sube su primer documento.

**Targets:** Más del 70% agregan deal en día 1, tiempo a primer LP invite menor a 7 días, más del 90% completan fund setup, y más del 80% suben primer documento en semana 1.

### Métricas de Retención

Las métricas de retención son el Monthly Active Users dividido por Total Users, el churn rate por tier por mes, el Net Revenue Retention (NRR), y la tasa de upgrade de Searcher a Operator.

**Targets:** DAU/MAU mayor a 40%, churn menor a 3% mensual, NRR mayor a 110% considerando upgrades, y más del 60% de Searchers upgradeando a Operator dentro de 24 meses.

### Métricas de Revenue

Las métricas de revenue son MRR y MRR growth rate, ARPU por tier, Lifetime Value (LTV), y ratio LTV a CAC.

**Targets:** MRR creciendo más del 15% mes a mes en año 1, ARPU aumentando con mix shift hacia Operator, LTV mayor a $1,500, y ratio LTV/CAC mayor a 3:1.

### Métricas de Producto

Las métricas de producto son NPS Score, tickets de soporte por usuario por mes, bugs críticos reportados por semana, y uptime del sistema.

**Targets:** NPS mayor a 50, menos de 1 ticket de soporte por usuario por mes, cero bugs críticos abiertos, y uptime mayor a 99.9%.

---

## 9. Unfair Advantage (Ventaja Competitiva Sostenible)

### Ventaja 1: Expertise de Dominio

NIRO Group LLC está activamente operando en el espacio de search funds y PE, lo cual proporciona comprensión íntima de los workflows y pain points reales, credibilidad con la comunidad de search funds, y capacidad de iterar el producto basado en uso propio. Esta ventaja es difícil de replicar porque competidores tendrían que vivir el problema o contratar expertos del dominio.

### Ventaja 2: First Mover en Nicho Específico

No existe software purpose-built para search funds específicamente. Los incumbentes como Carta y Juniper Square están enfocados en fondos más grandes, las herramientas genéricas requieren customización extensiva, y ser primero permite capturar el mercado antes de que otros identifiquen la oportunidad.

### Ventaja 3: Network Effects Potenciales

A medida que más search funds usen la plataforma, se pueden generar efectos de red. Los LPs que invierten en múltiples fondos preferirán que todos usen la misma plataforma, se podrá crear una comunidad donde searchers comparten templates, DD checklists, y best practices, y eventualmente podría servir como plataforma donde searchers encuentran LPs y viceversa.

### Ventaja 4: Switching Costs Crecientes

Una vez que un fondo tiene su historial en la plataforma incluyendo deals, comunicaciones con LPs, documentos, y capital transactions, migrar a otra solución es doloroso. Esto crea stickiness natural que protege contra competencia.

### Ventaja 5: Relaciones en la Comunidad

El mercado de search funds es pequeño y relationship-driven. La confianza construida con early adopters, programas como Stanford GSB, y LPs influyentes crea una barrera que toma años replicar.

---

## 10. Go-to-Market Strategy

### Fase 1: Validación Interna (Meses 1-3)

El objetivo es usar el producto internamente en NIRO Group LLC para validar workflows y encontrar bugs antes de lanzamiento público. El éxito se mide por uso diario real para operaciones del fondo y feedback documentado de mejoras necesarias.

### Fase 2: Beta Privado (Meses 4-6)

El objetivo es onboardear 5-10 search funds conocidos en beta gratuito o con descuento significativo para obtener feedback diverso. La estrategia será aprovechar la red de NIRO Group LLC y contactos de programas MBA. El éxito se mide por NPS mayor a 40, testimonials obtenidos, y lista de mejoras priorizadas.

### Fase 3: Lanzamiento Público (Meses 7-9)

El objetivo es lanzar pricing oficial y comenzar adquisición paga. Las tácticas incluyen presencia en Stanford Search Fund Conference, outreach a aceleradoras de search funds, content marketing con blog y webinars, y programa de referral donde clientes que refieren obtienen un mes gratis. El éxito se mide por alcanzar 25 clientes pagando y MRR de $3,000.

### Fase 4: Crecimiento (Meses 10-18)

El objetivo es escalar adquisición y expandir producto. Las tácticas incluyen partnerships con programas MBA, expansión a mercados internacionales especialmente España y Latinoamérica, desarrollo de features para segmento micro-PE, y contratación de primer hire dedicado a customer success. El éxito se mide por alcanzar 100 clientes y MRR de $15,000.

---

## 11. Assumptions & Risks

### Assumptions Críticas a Validar

La primera assumption es que los search fund principals están dispuestos a pagar por software cuando tienen presupuesto limitado. La validación será a través de entrevistas con 10+ searchers sobre willingness-to-pay.

La segunda assumption es que el LP Portal genera suficiente valor para justificar el upgrade a Operator. La validación será midiendo el engagement de LPs en beta y preguntando a fund managers si el portal mejora sus relaciones.

La tercera assumption es que el mercado de search funds es suficientemente grande para un negocio viable. La validación será research de mercado y tracking de crecimiento del número de nuevos search funds.

### Riesgos Principales

El riesgo de mercado es que el mercado de search funds podría ser demasiado pequeño para soportar un negocio standalone. La mitigación es diseñar para expansión a micro-PE y holding companies desde el inicio.

El riesgo competitivo es que un player establecido como Carta podría lanzar un producto para search funds. La mitigación es moverse rápido, construir relaciones profundas, y especializarse más de lo que un player grande querría.

El riesgo de ejecución es que el desarrollo tome más tiempo o cueste más de lo esperado. La mitigación es empezar con MVP muy enfocado y expandir solo después de validación.

El riesgo de adopción es que los usuarios prefieran seguir con spreadsheets por familiaridad. La mitigación es ofrecer migración fácil, templates pre-hechos, y demostrar ROI claramente.

---

## 12. Success Milestones

### Milestone 1: Product-Market Fit (Mes 6)

Los indicadores son que 5+ clientes pagan sin descuento, NPS mayor a 40, al menos 2 clientes obtenidos por referral, y churn menor a 5% mensual.

### Milestone 2: Growth Mode (Mes 12)

Los indicadores son MRR de $5,000+, 40+ clientes activos, mecanismo de adquisición repeatable identificado, y equipo de 2-3 personas.

### Milestone 3: Market Leadership (Mes 24)

Los indicadores son MRR de $25,000+, 150+ clientes activos, reconocimiento como "the tool" para search funds, y expansión a mercado adyacente iniciada.

---

## Related Documents

| Document | Purpose |
|----------|---------|
| `00_Product_Strategy.md` | Visión de producto y personas |
| `01_PRD_Overview.md` | Arquitectura técnica |
| `02-09_PRD_*` | Especificaciones técnicas detalladas |
