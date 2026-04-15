# 📮 GUÍA COMPLETA POSTMAN - VISOR Backend

> Todos los comandos, requests y pruebas para testing del API VISOR

---

## 🔧 CONFIGURACIÓN INICIAL

### Variables de Entorno Postman

Crear un nuevo Environment llamado `VISOR Local`:

```json
{
  "name": "VISOR Local",
  "values": [
    {
      "key": "base_url",
      "value": "http://localhost:5000/api",
      "enabled": true
    },
    {
      "key": "token",
      "value": "",
      "enabled": true
    },
    {
      "key": "user_id",
      "value": "",
      "enabled": true
    }
  ]
}
```

---

## 📌 COLLECTION COMPLETA DE REQUESTS

---

## 1️⃣ AUTENTICACIÓN

### 📝 Registrar Usuario

**Método:** `POST`  
**URL:** `{{base_url}}/auth/register`

**Headers:**
```
Content-Type: application/json
```

**Body (raw - JSON):**
```json
{
  "name": "María García",
  "email": "maria@test.com",
  "password": "securepass123",
  "role": "field",
  "location": "Volcán Nevado de Ruiz",
  "position": [5.0129, -75.4299]
}
```

**Tests:**
```javascript
pm.test("Status code es 201", function () {
    pm.response.to.have.status(201);
});

pm.test("Usuario creado correctamente", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property("token");
    pm.expect(jsonData.user).to.have.property("id");
    
    // Guardar token para usar en otros requests
    pm.environment.set("token", jsonData.token);
    pm.environment.set("user_id", jsonData.user.id);
});

pm.test("Respuesta contiene datos del usuario", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.user).to.have.all.keys("id", "name", "email", "role", "status", "location", "volcanoAlert", "position");
});
```

**Respuesta esperada:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "María García",
    "email": "maria@test.com",
    "role": "field",
    "status": "Active",
    "location": "Volcán Nevado de Ruiz",
    "volcanoAlert": "Watch",
    "position": [5.0129, -75.4299]
  }
}
```

---

### 🔐 Login

**Método:** `POST`  
**URL:** `{{base_url}}/auth/login`

**Headers:**
```
Content-Type: application/json
```

**Body (raw - JSON):**
```json
{
  "email": "maria@test.com",
  "password": "securepass123"
}
```

**Tests:**
```javascript
pm.test("Login exitoso - Status 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Token generado correctamente", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.token).to.be.a("string");
    pm.expect(jsonData.token.length).to.be.greaterThan(0);
    pm.environment.set("token", jsonData.token);
});

pm.test("Usuario retorna todos los datos", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.user).to.have.property("id");
    pm.expect(jsonData.user).to.have.property("name");
    pm.expect(jsonData.user).to.have.property("email");
    pm.expect(jsonData.user).to.have.property("role");
});

pm.test("Token es almacenado en variable", function () {
    pm.expect(pm.environment.get("token")).to.be.a("string");
});
```

**Respuesta esperada:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "María García",
    "email": "maria@test.com",
    "role": "field",
    "status": "Active",
    "location": "Volcán Nevado de Ruiz",
    "volcanoAlert": "Watch",
    "position": [5.0129, -75.4299]
  }
}
```

---

### ➡️ Logout

**Método:** `POST`  
**URL:** `{{base_url}}/auth/logout`

**Headers:**
```
Authorization: Bearer {{token}}
Content-Type: application/json
```

**Body:** (vacío)

**Tests:**
```javascript
pm.test("Logout exitoso - Status 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Mensaje de éxito", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.success).to.equal(true);
    pm.expect(jsonData.message).to.contain("Logged out");
});
```

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Logged out successfully."
}
```

---

## 2️⃣ PERFIL DE USUARIO

### 👤 Obtener Perfil

**Método:** `GET`  
**URL:** `{{base_url}}/user/profile`

**Headers:**
```
Authorization: Bearer {{token}}
```

**Body:** (vacío)

**Tests:**
```javascript
pm.test("Perfil obtenido - Status 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Datos del usuario completos", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.all.keys("_id", "name", "email", "role", "status", "location", "position", "volcanoAlert", "createdAt", "updatedAt");
});

pm.test("Email y nombre coinciden", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.email).to.contain("@");
    pm.expect(jsonData.name).to.be.a("string");
    pm.expect(jsonData.name.length).to.be.greaterThan(0);
});

pm.test("No contiene password hasheada", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.not.have.property("password");
});
```

**Respuesta esperada:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "María García",
  "email": "maria@test.com",
  "role": "field",
  "status": "Active",
  "location": "Volcán Nevado de Ruiz",
  "position": [5.0129, -75.4299],
  "volcanoAlert": "Watch",
  "createdAt": "2025-04-15T10:30:00.000Z",
  "updatedAt": "2025-04-15T10:30:00.000Z"
}
```

---

### ✏️ Actualizar Perfil

**Método:** `PUT`  
**URL:** `{{base_url}}/user/profile`

**Headers:**
```
Authorization: Bearer {{token}}
Content-Type: application/json
```

**Body (raw - JSON):**
```json
{
  "name": "María García López",
  "location": "Volcán Cotopaxi",
  "position": [-0.9045, -78.4414],
  "status": "Active",
  "volcanoAlert": "Advisory"
}
```

**Variante - Actualizar solo nombre:**
```json
{
  "name": "María García López"
}
```

**Variante - Cambiar alerta de volcán:**
```json
{
  "volcanoAlert": "Warning"
}
```

**Variante - Actualizar ubicación:**
```json
{
  "location": "Volcán Popocatépetl",
  "position": [19.0225, -98.6919]
}
```

**Tests:**
```javascript
pm.test("Perfil actualizado - Status 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Cambios aplicados correctamente", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.name).to.equal("María García López");
    pm.expect(jsonData.volcanoAlert).to.equal("Advisory");
    pm.expect(jsonData.location).to.equal("Volcán Cotopaxi");
});

pm.test("Posición actualizada correctamente", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.position).to.deep.equal([-0.9045, -78.4414]);
});

pm.test("UpdatedAt es reciente", function () {
    var jsonData = pm.response.json();
    var updatedTime = new Date(jsonData.updatedAt);
    var now = new Date();
    var diff = now - updatedTime;
    pm.expect(diff).to.be.lessThan(5000); // menos de 5 segundos
});
```

**Respuesta esperada:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "María García López",
  "email": "maria@test.com",
  "role": "field",
  "status": "Active",
  "location": "Volcán Cotopaxi",
  "position": [-0.9045, -78.4414],
  "volcanoAlert": "Advisory",
  "createdAt": "2025-04-15T10:30:00.000Z",
  "updatedAt": "2025-04-15T10:35:15.000Z"
}
```

---

## 3️⃣ MAPAS (Público - Sin autenticación)

### 🗺️ Obtener Puntos de Datos

**Método:** `GET`  
**URL:** `{{base_url}}/map/data-points`

**Headers:** (ninguno requerido)

**Body:** (vacío)

**Tests:**
```javascript
pm.test("Puntos de datos obtenidos - Status 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Retorna un array", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.be.an("array");
});

pm.test("Cada punto contiene propiedades requeridas", function () {
    var jsonData = pm.response.json();
    if (jsonData.length > 0) {
        jsonData.forEach(function(point) {
            pm.expect(point).to.have.property("_id");
            pm.expect(point).to.have.property("location");
        });
    }
});
```

**Respuesta esperada:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439001",
    "location": "Estación Norte",
    "position": [5.0129, -75.4299],
    "reading": 3.2,
    "createdAt": "2025-04-15T10:00:00.000Z"
  },
  {
    "_id": "507f1f77bcf86cd799439002",
    "location": "Estación Sur",
    "position": [5.0100, -75.4350],
    "reading": 2.8,
    "createdAt": "2025-04-15T10:05:00.000Z"
  }
]
```

---

### 👥 Obtener Participantes

**Método:** `GET`  
**URL:** `{{base_url}}/map/participants`

**Headers:** (ninguno requerido)

**Body:** (vacío)

**Tests:**
```javascript
pm.test("Participantes obtenidos - Status 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Retorna un array de participantes", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.be.an("array");
});
```

**Respuesta esperada:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "name": "María García",
    "email": "maria@test.com",
    "role": "field",
    "location": "Volcán Nevado de Ruiz",
    "position": [5.0129, -75.4299]
  },
  {
    "_id": "507f1f77bcf86cd799439012",
    "name": "Carlos López",
    "email": "carlos@test.com",
    "role": "office",
    "location": "Centro de Control",
    "position": [5.0155, -75.4300]
  }
]
```

---

### 🌋 Obtener Datos del Volcán

**Método:** `GET`  
**URL:** `{{base_url}}/map/volcano`

**Headers:** (ninguno requerido)

**Body:** (vacío)

**Tests:**
```javascript
pm.test("Datos del volcán obtenidos - Status 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Respuesta contiene propiedades del volcán", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property("name");
    pm.expect(jsonData).to.have.property("location");
});
```

**Respuesta esperada:**
```json
{
  "_id": "507f1f77bcf86cd799439099",
  "name": "Nevado de Ruiz",
  "location": "Colombia",
  "status": "Active",
  "position": [5.0129, -75.4299],
  "elevation": 5321,
  "lastEruption": "1985-11-13",
  "currentAlert": "Yellow"
}
```

---

### 📊 Obtener Campañas

**Método:** `GET`  
**URL:** `{{base_url}}/map/campaigns`

**Headers:** (ninguno requerido)

**Body:** (vacío)

**Tests:**
```javascript
pm.test("Campañas obtenidas - Status 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Retorna un array de campañas", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.be.an("array");
});
```

**Respuesta esperada:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439051",
    "name": "Monitoreo Sísmica 2025",
    "volcano": "Nevado de Ruiz",
    "startDate": "2025-01-01T00:00:00.000Z",
    "status": "Active",
    "participants": 15,
    "description": "Campaña de monitoreo intensivo"
  }
]
```

---

## 4️⃣ ESTADO

### ➕ Crear Actualización de Estado

**Método:** `POST`  
**URL:** `{{base_url}}/status`

**Headers:**
```
Authorization: Bearer {{token}}
Content-Type: application/json
```

**Body (raw - JSON):**
```json
{
  "text": "Se detectó actividad sísmica en la estación norte. Magnitud 3.2"
}
```

**Variante - Alerta de cambios:**
```json
{
  "text": "ALERTA: Incremento en lecturas de dióxido de azufre detectado"
}
```

**Variante - Reporte normal:**
```json
{
  "text": "Reporte de monitoreo diario completado. Todos los sensores operacionales."
}
```

**Tests:**
```javascript
pm.test("Estado creado - Status 201", function () {
    pm.response.to.have.status(201);
});

pm.test("ID de estado generado", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property("_id");
});

pm.test("Estado contiene todas las propiedades", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property("text");
    pm.expect(jsonData).to.have.property("user");
    pm.expect(jsonData).to.have.property("createdAt");
});

pm.test("Texto es el enviado", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.text).to.include("actividad sísmica");
});
```

**Respuesta esperada:**
```json
{
  "_id": "507f1f77bcf86cd799439061",
  "text": "Se detectó actividad sísmica en la estación norte. Magnitud 3.2",
  "user": "507f1f77bcf86cd799439011",
  "createdAt": "2025-04-15T10:45:00.000Z",
  "updatedAt": "2025-04-15T10:45:00.000Z"
}
```

---

### 📖 Obtener Estados

**Método:** `GET`  
**URL:** `{{base_url}}/status`

**Headers:**
```
Authorization: Bearer {{token}}
```

**Body:** (vacío)

**Tests:**
```javascript
pm.test("Estados obtenidos - Status 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Retorna un array de estados", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.be.an("array");
});

pm.test("Cada estado contiene datos requeridos", function () {
    var jsonData = pm.response.json();
    if (jsonData.length > 0) {
        jsonData.forEach(function(status) {
            pm.expect(status).to.have.property("_id");
            pm.expect(status).to.have.property("text");
            pm.expect(status).to.have.property("user");
        });
    }
});
```

**Respuesta esperada:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439061",
    "text": "Se detectó actividad sísmica en la estación norte. Magnitud 3.2",
    "user": "507f1f77bcf86cd799439011",
    "createdAt": "2025-04-15T10:45:00.000Z",
    "updatedAt": "2025-04-15T10:45:00.000Z"
  },
  {
    "_id": "507f1f77bcf86cd799439062",
    "text": "ALERTA: Incremento en lecturas de dióxido de azufre detectado",
    "user": "507f1f77bcf86cd799439012",
    "createdAt": "2025-04-15T11:00:00.000Z",
    "updatedAt": "2025-04-15T11:00:00.000Z"
  }
]
```

---

## 5️⃣ SOS (EMERGENCIA)

### 🚨 Enviar Alerta SOS

**Método:** `POST`  
**URL:** `{{base_url}}/sos`

**Headers:**
```
Authorization: Bearer {{token}}
Content-Type: application/json
```

**Body (raw - JSON):**
```json
{
  "message": "¡EMERGENCIA! Equipo atrapado en la zona de erupción"
}
```

**Variante - Equipamiento dañado:**
```json
{
  "message": "Equipo de monitoreo dañado. Requiero soporte immediate."
}
```

**Variante - Evacuación requerida:**
```json
{
  "message": "EVACUACIÓN REQUERIDA. Erupción inminente detectada. Equipo en peligro."
}
```

**Variante - Falla de comunicación:**
```json
{
  "message": "Pérdida de comunicación con equipo norte. Requiero asistencia."
}
```

**Tests:**
```javascript
pm.test("SOS enviado - Status 201", function () {
    pm.response.to.have.status(201);
});

pm.test("Alerta registrada correctamente", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property("_id");
    pm.expect(jsonData.user).to.equal(pm.environment.get("user_id"));
});

pm.test("Mensaje es el enviado", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.message).to.include("EMERGENCIA");
});

pm.test("Timestamp es reciente", function () {
    var jsonData = pm.response.json();
    var sosTime = new Date(jsonData.createdAt);
    var now = new Date();
    var diff = now - sosTime;
    pm.expect(diff).to.be.lessThan(5000);
});
```

**Respuesta esperada:**
```json
{
  "_id": "507f1f77bcf86cd799439071",
  "user": "507f1f77bcf86cd799439011",
  "message": "¡EMERGENCIA! Equipo atrapado en la zona de erupción",
  "status": "Active",
  "createdAt": "2025-04-15T11:15:00.000Z",
  "updatedAt": "2025-04-15T11:15:00.000Z"
}
```

---

### 🚨 Obtener Alertas SOS

**Método:** `GET`  
**URL:** `{{base_url}}/sos`

**Headers:**
```
Authorization: Bearer {{token}}
```

**Body:** (vacío)

**Tests:**
```javascript
pm.test("Alertas SOS obtenidas - Status 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Retorna un array de alertas", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.be.an("array");
});

pm.test("Cada alerta contiene propiedades requeridas", function () {
    var jsonData = pm.response.json();
    if (jsonData.length > 0) {
        jsonData.forEach(function(alert) {
            pm.expect(alert).to.have.property("_id");
            pm.expect(alert).to.have.property("user");
            pm.expect(alert).to.have.property("message");
            pm.expect(alert).to.have.property("status");
        });
    }
});
```

**Respuesta esperada:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439071",
    "user": "507f1f77bcf86cd799439011",
    "message": "¡EMERGENCIA! Equipo atrapado en la zona de erupción",
    "status": "Active",
    "createdAt": "2025-04-15T11:15:00.000Z",
    "updatedAt": "2025-04-15T11:15:00.000Z"
  }
]
```

---

## 🧪 FLUJO COMPLETO DE PRUEBAS

### Orden Recomendado:

```
1. Register → Obtiene token y user_id
   ↓
2. Login → Obtiene nuevo token (opcional, para verificar)
   ↓
3. Get Profile → Valida que estás autenticado
   ↓
4. Update Profile → Modifica tus datos
   ↓
5. Get Map Data → Prueba endpoints públicos (sin token)
   ↓
6. Get Participants → Más datos públicos
   ↓
7. Create Status → Crea una actualización
   ↓
8. Get Status → Obtiene tus actualizaciones
   ↓
9. Send SOS → Envía una alerta de emergencia
   ↓
10. Get SOS → Obtiene tus alertas
   ↓
11. Logout → Cierra la sesión
```

---

## 📋 HEADERS COMUNES

### Sin autenticación:
```
Content-Type: application/json
```

### Con autenticación (Token):
```
Authorization: Bearer {{token}}
Content-Type: application/json
```

### Health Check (Verificar que servidor está activo):
**Método:** `GET`  
**URL:** `{{base_url}}/health`

```javascript
pm.test("Servidor activo", function () {
    pm.response.to.have.status(200);
    var jsonData = pm.response.json();
    pm.expect(jsonData.status).to.equal("ok");
});
```

---

## ⚠️ CÓDIGOS DE RESPUESTA ESPERADOS

| Código | Significado | Ejemplos |
|--------|---|---|
| **200** | OK - Solicitud exitosa | GET requests, login exitoso |
| **201** | Created - Recurso creado | POST status, SOS, register |
| **400** | Bad Request - Datos inválidos | Email mal formato, campos faltantes |
| **401** | Unauthorized - Token inválido/faltante | Token expirado, sin header de auth |
| **404** | Not Found - Recurso no existe | Endpoint incorrecto |
| **409** | Conflict - Email ya registrado | Email duplicado en registro |
| **500** | Server Error - Error del servidor | Database error, server crash |

---

## 🚨 ERRORES COMUNES

### ❌ Error: 401 Unauthorized
```json
{
  "error": "Invalid email or password."
}
```

**Solución:** Verifica credenciales o hace login nuevamente.

---

### ❌ Error: 409 Conflict
```json
{
  "error": "Email already registered."
}
```

**Solución:** Usa otro email o login con email existente.

---

### ❌ Error: 400 Bad Request
```json
{
  "errors": [
    {
      "param": "password",
      "msg": "Password must be at least 6 characters."
    }
  ]
}
```

**Solución:** Verifica que todos los campos cumplan requisitos.

---

### ❌ Error: Token no almacenado
```
Authorization: Bearer null
```

**Solución:** Ejecuta primero Register o Login para obtener token.

---

## 💡 TIPS Y TRUCOS

### ✅ Pre-request Script (ejecutar antes de cada request):
```javascript
// Validar que el token existe en rutas protegidas
const url = pm.request.url.toString();
if (url.includes("profile") || url.includes("status") || url.includes("sos")) {
    if (!pm.environment.get("token")) {
        console.warn("⚠️ No hay token. Ejecuta Login primero");
    }
}
```

### ✅ Post-response Script (ejecutar después del response):
```javascript
// Guardar información útil automáticamente
if (pm.response.code === 200 || pm.response.code === 201) {
    try {
        var jsonData = pm.response.json();
        if (jsonData.token) {
            pm.environment.set("token", jsonData.token);
            console.log("✅ Token actualizado");
        }
        if (jsonData.user && jsonData.user.id) {
            pm.environment.set("user_id", jsonData.user.id);
            console.log("✅ User ID actualizado");
        }
    } catch (e) {
        // Response no es JSON
    }
}
```

### ✅ Usar Postman Runner para pruebas automatizadas:
1. Click en "Runner" en menu superior
2. Selecciona la colección
3. Configura iteraciones
4. Click "Run"

### ✅ Monitorear continuidamente:
1. Click en "..." en la colección
2. "Set up monitors"
3. Configura intervalo
4. Las pruebas se ejecutarán automáticamente

---

## 📤 EXPORTAR COLECCIÓN

### Método 1: Opción directa
1. Click derecho en la colección
2. "Export"
3. Selecciona formato (JSON)
4. Guarda el archivo

### Método 2: Compartir
1. Click "Share collection"
2. "Get public link"
3. Comparte con tu equipo

---

## 🔗 VARIABLES Y AMBIENTE

### Usar variables en cualquier parte:
```
Body:    {{variable_name}}
URL:     {{base_url}}/endpoint
Header:  Bearer {{token}}
```

### Variables predefinidas disponibles:
```
$uuid         - UUID único
$timestamp    - Timestamp actual
$randomInt    - Número entero aleatorio
```

### Ejemplo con variables:
```json
{
  "name": "Test {{$timestamp}}",
  "email": "user{{$randomInt}}@test.com"
}
```

---

## 📊 TESTING AVANZADO

### Prueba con múltiples usuarios:
```javascript
var users = [
  { email: "user1@test.com", password: "pass123" },
  { email: "user2@test.com", password: "pass456" }
];

pm.environment.set("users", users);
```

### Assertions personalizadas:
```javascript
pm.test("Response time es menor a 500ms", function () {
    pm.expect(pm.response.responseTime).to.be.below(500);
});

pm.test("Response no es mayor a 1MB", function () {
    pm.expect(pm.response.responseSize).to.be.below(1000000);
});
```

---

## ✨ CHECKLIST FINAL

- [ ] Verificar `base_url` está correcto (http://localhost:5000/api)
- [ ] Variables de entorno configuradas (token, user_id)
- [ ] Backend está ejecutándose en puerto 5000
- [ ] MongoDB conectada
- [ ] Tests están habilitados
- [ ] Headers correctos por tipo de request
- [ ] Tokens actualizados después de login/register

---

**Última actualización:** April 15, 2026  
**Versión:** 1.0  
**Autor:** VISOR Team
