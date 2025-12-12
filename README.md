# Mercado del Campo

Proyecto extraído de Neo Core Sys.

## Configuración

1.  Instalar dependencias:
    ```bash
    npm install
    ```

2.  Configurar variables de entorno:
    El archivo `.env` ya contiene las claves de Supabase necesarias.
    ```
    VITE_SUPABASE_URL=...
    VITE_SUPABASE_ANON_KEY=...
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

El resultado estará en la carpeta `dist`.
