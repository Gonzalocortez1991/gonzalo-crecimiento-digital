# Deploy

## Vercel

El proyecto se publica como sitio estático.

| Ajuste | Valor |
| --- | --- |
| Framework preset | Other |
| Build command | *(vacío)* |
| Output directory | `site` |
| Install command | *(vacío)* |

La configuración está versionada en `vercel.json`, incluyendo:

- `outputDirectory: "site"`.
- Rewrites de URLs históricas.
- Headers de seguridad y Content Security Policy.

## Desde la CLI

```bash
npm install -g vercel
vercel link
vercel --prod
```

## Checklist antes de publicar

```bash
npm run check:links
npm run screenshots
```

1. Verificar que los enlaces locales no estén rotos.
2. Revisar la home y las landings principales en desktop y mobile.
3. Confirmar que los eventos de Meta Pixel y GA4 siguen disparando.
4. Probar un checkout de Hotmart y la página de gracias correspondiente.

## Variables y secretos

Este repositorio no contiene credenciales. Los tokens de Meta, Google y Hotmart se configuran en:

- Variables de entorno locales (`.env`, ignorado por Git).
- Panel de Vercel, si alguna función los necesita.
- Panel de Google Apps Script, para la captación y el envío de emails.
