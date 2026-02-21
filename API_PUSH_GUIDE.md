# Guía de Sincronización PUSH (Backend Cloud)

Esta guía explica cómo enviar datos de usuarios y marcaciones al backend cuando este se encuentra en un servidor en la nube.

## 1. Configuración de Seguridad

Para que el servidor acepte los datos, cada petición debe incluir un token de seguridad en los encabezados (Headers).

- **Encabezado:** `x-sync-token`
- **Valor:** `HikvisionSecretToken2026` (Configurable en el archivo `.env`)

## 2. Endpoint

- **URL:** `http://TU_IP_O_DOMINIO:3000/api/sync/push`
- **Método:** `POST`
- **Content-Type:** `application/json`

## 3. Estructura del Body (JSON)

El servidor espera un objeto con las listas de `users` y `events`. 

> [!TIP]
> **Separación Automática:** Si en el campo `name` envías el formato `Documento - Nombre`, el backend guardará el documento por un lado y el nombre limpio por otro automáticamente.

### Ejemplo de JSON:
```json
{
  "users": [
    {
      "employeeNo": "00000001",
      "name": "1130264365 - Jean Correa",
      "userType": "normal",
      "Valid": {
        "cardNo": "12345678"
      }
    }
  ],
  "events": [
    {
      "employeeNoString": "00000001",
      "time": "2026-02-20T14:44:32+08:00",
      "major": 5,
      "minor": 38,
      "serialNo": 316,
      "attendanceStatus": "undefined"
    }
  ]
}
```

## 4. Ejemplo de Consumo (cURL)

Puedes probar el envío desde una terminal con este comando:

```bash
curl -X POST http://localhost:3000/api/sync/push \
     -H "Content-Type: application/json" \
     -H "x-sync-token: HikvisionSecretToken2026" \
     -d '{
           "users": [{"employeeNo": "1", "name": "12345 - Test User"}],
           "events": [{"employeeNoString": "1", "time": "2026-02-20T18:00:00Z", "major": 5, "minor": 38, "serialNo": 999}]
         }'
```

## 5. Respuestas del Servidor

- **200 OK:** La data se procesó y guardó correctamente.
- **401 Unauthorized:** El token es incorrecto o no se envió.
- **500 Internal Server Error:** Error al procesar los datos o problemas con la base de datos.
