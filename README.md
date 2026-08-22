# Embutidos Ferreyra

Proyecto extraído de Neo Core Sys. Next.js + Supabase.

## Configuración

1.  Instalar dependencias:
    ```bash
    npm install
    ```

2.  Configurar variables de entorno:
    Copiá `.env.example` a `.env.local` y completá los valores con las
    credenciales reales del proyecto de Supabase (Dashboard > Project
    Settings > API, y Project Settings > Database para la connection
    string). **Nunca** commitees `.env` ni `.env.local` — ya están en
    `.gitignore`.
    ```
    NEXT_PUBLIC_SUPABASE_URL=...
    NEXT_PUBLIC_SUPABASE_ANON_KEY=...
    DATABASE_URL=...
    ```

## Desarrollo

Para correr el servidor de desarrollo:

```bash
npm run dev
```

## Producción

Para construir el proyecto para producción:

```bash
npm run build
```

Next.js genera el build en la carpeta `.next` (no `dist`).

## Scripts de mantenimiento (`scripts/`)

Requieren `DATABASE_URL` en `.env.local`. Se ejecutan con `node scripts/<archivo>.js`.

- `secure_permissions.sql` — política de permisos (RLS) recomendada; pegar en el SQL Editor de Supabase.
- `fix_permissions.js` — aplica esas mismas políticas por script.
- El resto son utilidades de inspección de la base (`list-tables.js`, `check-columns.js`, etc.).
