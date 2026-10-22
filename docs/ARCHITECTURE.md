# Arquitectura

## Vista general

```text
Visitante
   │
   ▼
Vercel (sitio estático)
   │  site/
   ├── landings de venta ──────────────► Hotmart (checkout)
   ├── herramientas interactivas ──────► resultado + CTA
   ├── formularios de captación ───────► Google Apps Script
   │                                        │
   │                                        ├── Google Sheets (leads)
   │                                        └── emails de nurturing
   └── páginas de gracias ─────────────► Meta Pixel / GA4
```

## Decisiones técnicas

### Sitio estático sin build

Las landings son HTML, CSS y JavaScript autocontenidos. No hay framework ni paso de compilación: Vercel publica directamente `site/`. Esto reduce superficie de fallos, acelera el deploy y mantiene cada página portable.

### Una sola fuente

`site/` es la única fuente de verdad. No hay copias en la raíz ni en `public/`. Los rewrites de `vercel.json` conservan las URLs históricas usadas en emails, anuncios y checkout.

### Rewrites estables

Las URLs públicas (`/LANDING-PACK-STARTER.html`, `/alaya`, `/diagnostico`) se mantienen aunque el archivo viva en un subdirectorio. Así se puede reorganizar la estructura interna sin romper campañas activas.

### Herramientas interactivas

Cada herramienta calcula su resultado en el cliente con JavaScript y dispara eventos de tracking. No dependen de backend propio; el envío de leads se delega a Google Apps Script.

### Captación y pagos

- **Google Apps Script** recibe los formularios, guarda leads en Sheets y envía la secuencia de emails.
- **Hotmart** procesa el pago y redirige a las páginas de gracias, donde se registra la conversión.
- Los endpoints públicos viven en el HTML del formulario. Las credenciales y tokens viven fuera del repositorio.

### Seguridad

`vercel.json` aplica headers de seguridad y una Content Security Policy que permite únicamente los orígenes necesarios: Google Fonts, Calendly, Meta Pixel, GA4, YouTube y Apps Script.

## Tooling

| Comando | Función |
| --- | --- |
| `npm run dev` | Servidor local con rewrites de Vercel |
| `npm run check:links` | Detecta enlaces locales rotos en `site/` |
| `npm run screenshots` | Captura screenshots con Playwright |

## Estructura de `site/`

```text
site/
├── index.html                 # Home
├── LANDING-GCD.html           # Landing de marca
├── landings/                  # Oferta, herramientas y páginas de gracias
├── alaya/                     # Programa Escalamiento Consciente
├── assets/                    # PDFs y recursos
├── activos/                   # Imágenes públicas
└── 404.html
```
