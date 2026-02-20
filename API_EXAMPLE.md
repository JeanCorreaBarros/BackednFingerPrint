# Documentación de la API (CRUD)

Esta API permite gestionar los usuarios y ver las marcaciones de asistencia sincronizadas desde el huellero HikVision.

## Base URL
`http://localhost:3000`

---

## 1. Usuarios

### Obtener todos los usuarios
**Endpoint:** `GET /api/users`  
**Respuesta (200 OK):**
```json
[
  {
    "user_id": "1",
    "name": "Juan Perez",
    "card_no": "12345678",
    "created_at": "2024-02-20T10:00:00.000Z"
  }
]
```

### Actualizar un usuario
**Endpoint:** `PUT /api/users/:id`  
**Body (JSON):**
```json
{
  "name": "Juan P. Actualizado",
  "card_no": "99999999"
}
```

### Eliminar un usuario
**Endpoint:** `DELETE /api/users/:id`  

---

## 2. Asistencia

### Consultar marcaciones (con filtros)
**Endpoint:** `GET /api/attendance`  
**Query Parameters (Opcionales):**
- `start`: Fecha inicio (ISO 8601, ej: `2024-02-01`)
- `end`: Fecha fin (ej: `2024-02-28`)
- `user_id`: ID del usuario

**Respuesta (200 OK):**
```json
[
  {
    "id": 1,
    "user_id": "1",
    "name": "Juan Perez",
    "event_time": "2024-02-20T08:00:00.000Z",
    "event_type": "check-in",
    "raw_data": { ... }
  }
]
```

---

## 3. Sincronización Manual

### Disparar sincronización
**Endpoint:** `POST /api/sync`  
**Descripción:** Fuerza al servidor a conectarse al huellero y traer nuevos datos de inmediato.
