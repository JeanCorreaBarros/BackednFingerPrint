# Guía de Configuración: Huellero HikVision + Node.js + Postgres

Sigue estos pasos para poner a funcionar tu sistema de extracción de huellas.

## 1. Prerrequisitos
- Tener **Node.js** instalado.
- Tener **Docker Desktop** instalado y abierto.
- El huellero HikVision debe estar conectado a la misma red que tu computadora.
- **ISAPI debe estar ACTIVO** en la configuración del dispositivo (Vía iVMS-4200 o interfaz Web).

---

## 1.1 Activar ISAPI (MUY IMPORTANTE)
Sin esto, el backend recibirà errores de conexión o "Parse Error":
1. Abre **iVMS-4200**.
2. Ve a **Device Management** y entra a la configuración del dispositivo.
3. Busca **Network** -> **Advanced Settings** -> **Network Service**.
4. Asegúrate de que la casilla **Enable ISAPI** esté marcada.
5. Guarda los cambios.

## 2. Preparar el Entorno (Docker)
Levanta la base de datos y la interfaz gráfica de pgAdmin ejecutando este comando en la terminal:

```bash
docker-compose up -d
```

---

## 3. Configurar Credenciales
Abre el archivo `.env` en tu editor y asegúrate de que los datos sean correctos:
- `HIKVISION_IP=192.168.21.100` (IP de tu huellero)
- `HIKVISION_PORT=8000` (Puerto ISAPI)
- `HIKVISION_PASSWORD=a1234567` (Clave de tu dispositivo)

---

## 4. Iniciar el Servidor de Node.js
**IMPORTANTE:** Como el huellero usa un protocolo antiguo (HTTP/0.9), debemos usar una bandera especial. Ejecuta esto en tu terminal:

```bash
# Primero limpia cualquier variable "atrapada" (solo si te da error)
$env:NODE_OPTIONS = ""

# Luego inicia el servidor
node --insecure-http-parser index.js
```

---

## 5. Ver Datos en pgAdmin
1. Entra a `http://localhost:8080` en tu navegador.
2. Inicia sesión con: `admin@admin.com` / `admin`.
3. **Paso Crucial:** Debes conectar pgAdmin a la base de datos:
   - Clic derecho en **Servers** -> **Register** -> **Server**.
   - **General:** Nombre -> `Huellero`.
   - **Connection:**
     - **Host name:** `db`
     - **Port:** `5432`
     - **Database:** `fingerprint_db`
     - **Username:** `postgres`
     - **Password:** `mysecretpassword`
   - Clic en **Save**.

4. Ve a `Schemas` -> `public` -> `Tables` para ver tus usuarios (`users`) y marcas de asistencia (`attendance_logs`).

---

## 6. Sincronización Manual
El sistema sincroniza solo cada 5 minutos, pero puedes forzarlo abriendo otra terminal y ejecutando:
```bash
curl.exe -X POST http://localhost:3000/api/sync
```
