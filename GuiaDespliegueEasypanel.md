# Guía de Despliegue en Easypanel (Hostinger)

Esta guía te ayudará a subir tu proyecto **BackendFingerPrint** a un VPS de Hostinger utilizando **Easypanel**.

## Requisitos Previos

1.  **VPS con Easypanel**: Debes tener el panel instalado en tu servidor Hostinger.
2.  **Repositorio Git**: Sube tu proyecto a GitHub, GitLab o Bitbucket (incluyendo el `Dockerfile` y `.dockerignore` que acabamos de crear).
3.  **Base de Datos**: Easypanel permite crear una base de datos PostgreSQL fácilmente como un servicio.

---

## Paso 1: Usar tu Proyecto Existente

Como tienes un límite de proyectos, agregaremos los nuevos servicios dentro del proyecto que ya tienes (ej. `funprocafut_backend`). **Esto es seguro y no dañará tus servicios actuales.**

1.  Entra a tu panel de Easypanel y selecciona el proyecto donde quieres agregarlos.
2.  **No borres nada**. Solo vamos a añadir servicios nuevos al listado que ya tienes (`funprocafut_backend` y `mysql`).

## Paso 2: Crear el Nuevo Servicio de PostgreSQL

1.  Dentro de tu proyecto, haz clic en el botón **"+ Servicio"** (o en el icono de **Postgres**).
2.  Dale un nombre único, por ejemplo: `fingerprint-db`.
    - *IMPORTANTE*: No lo llames igual que otras bases de datos ya existentes para evitar confusiones.
3.  Easypanel generará los credenciales. Anótalos (Usuario, Contraseña, DB).

## Paso 3: Crear el Nuevo Servicio de la Aplicación (API)

1.  Haz clic de nuevo en **"+ Servicio"** -> **"App"** (o botón **Aplicación**).
2.  Dale un nombre único, por ejemplo: `fingerprint-api`.
3.  En **"Source"**, selecciona **"Git"** y conecta tu repositorio.
5.  En **"Build"**, selecciona **"Docker"** ( Easypanel usará el `Dockerfile` que creamos).

## Paso 4: Configurar Variables de Entorno

Ve a la pestaña **"Environment"** de tu aplicación y agrega las siguientes variables (usando los datos del servicio de PostgreSQL que creaste):

| Variable | Valor Sugerido |
| :--- | :--- |
| `DB_USER` | (El usuario de tu servicio Postgres en Easypanel) |
| `DB_HOST` | `db-fingerprint` (O el nombre que le diste al servicio DB) |
| `DB_DATABASE` | (El nombre de la DB en Easypanel) |
| `DB_PASSWORD` | (La contraseña de la DB en Easypanel) |
| `DB_PORT` | `5432` |
| `PORT` | `3000` |
| `SYNC_TOKEN` | `TuTokenSecreto2026` |

> [!IMPORTANT]
> El `DB_HOST` debe ser el **Nombre del Servicio** de la base de datos dentro de Easypanel para que se comuniquen internamente.

## Paso 5: Configurar Red y Puerto

1.  En la configuración de la App, ve a **"Network"**.
2.  Asegúrate de que el **"Container Port"** sea `3000`.
3.  Activa los dominios si quieres acceder vía URL (ej. `api.tudominio.com`).

## Paso 6: Desplegar y Verificar

1.  Haz clic en **"Deploy"**.
2.  Observa los logs en la pestaña **"Logs"**. Deberías ver:
    ```
    Backend Cloud listo en puerto 3000
    Database initialized successfully
    ```

---

## Solución de Problemas Comunes

-   **Error de Conexión a DB**: Verifica que el `DB_HOST` coincida exactamente con el nombre del servicio de base de datos en Easypanel.
-   **Puerto Ocupado**: Easypanel gestiona los puertos automáticamente. Si usas el puerto 3000 internamente, el panel lo mapeará al puerto 80/443 externamente si configuras un dominio.
-   **Actualizar Código**: Cada vez que hagas `git push` a tu repositorio, puedes hacer clic en **"Deploy"** en Easypanel para que descargue los nuevos cambios y reconstruya la imagen.

---

¡Felicidades! Tu servidor de huellas ahora está en la nube. 🚀
