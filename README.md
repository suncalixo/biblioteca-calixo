# BIBLIOTECA CALIXO — SABER DE ALEJANDRÍA
## Arquitectura Full-Stack: React (Frontend) + Python REST API (Backend) + Supabase (DB & Auth)

Este proyecto cumple estrictamente con el diagrama y especificación técnica de la pizarra:

```
                  ARQUITECTURA DEL SISTEMA
┌──────────────────────────────┐             ┌──────────────────────────────┐
│          /frontend           │             │           /backend           │
│      React + JavaScript      │ ──(HTTP)──> │        Python (Flask)        │
│   (Vite, Tailwind, Motion)   │ <──(JSON)── │      API REST Exclusiva      │
└──────────────────────────────┘             └──────────────┬───────────────┘
                                                            │
                                                            ▼ (supabase-py SDK)
                                             ┌──────────────────────────────┐
                                             │     BASE DE DATOS & AUTH     │
                                             │           Supabase           │
                                             │     (PostgreSQL + Roles)     │
                                             └──────────────────────────────┘
```

---

## 📁 1. Estructura de Directorios

- **/frontend/**
  - Aplicación cliente SPA construida en **React (JavaScript / JSX)**.
  - No depende de plantillas renderizadas en el servidor.
  - Componentes modulares: `BooksView`, `CartModal`, `TwoFactorModal`, `FacturaModal`, `UserProfileModal`, `BookReviewsModal`, etc.
  - Envío reactivo de peticiones asíncronas (`fetch`) a la API REST.

- **/backend/**
  - Servicio **Python** que opera exclusivamente como API REST (`app.py`).
  - Todos los endpoints retornan respuestas en formato estándar `application/json`.
  - Conexión con Supabase PostgreSQL y Supabase Auth mediante la librería oficial `supabase-py` (`supabase_client.py`).
  - Módulos de lógica de negocio: `manager.py`, `models.py`, `two_factor.py`, `facturacion.py`, `reports.py`.

---

## ⚡ 2. Base de Datos & Autenticación (Supabase)

1. En tu proyecto de Supabase, entra al **SQL Editor** y ejecuta el script:
   `backend/supabase_schema.sql`
2. Configura tus credenciales en el entorno antes de iniciar el backend (o déjalas vacías para operar en modo local transparente con persistencia JSON):
   ```powershell
   $env:SUPABASE_URL="https://tu-proyecto.supabase.co"
   $env:SUPABASE_KEY="tu-clave-aqui"
   ```

---

## 🚀 3. Instrucciones de Ejecución

### Paso 1: Iniciar el Backend (Python API REST)
Abre una terminal y ejecuta:
```powershell
cd backend
python app.py
```
> El servicio API REST se iniciará en `http://localhost:5000/api`.

### Paso 2: Iniciar el Frontend (React)
Abre una segunda terminal y ejecuta:
```powershell
cd frontend
npm run dev
```
> La interfaz cliente de React se abrirá en `http://localhost:5173`.
