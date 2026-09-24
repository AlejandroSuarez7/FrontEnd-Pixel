# PIXEL — Frontend Web

Frontend del **Sistema de Gestión PIXEL**, una aplicación web orientada a la administración de procesos comerciales, operativos y de producción para un negocio de estampados.

El frontend está desarrollado con **React + Vite** y consume el API REST del backend de PIXEL mediante rutas relativas `/api/...`.

---

## Estado del proyecto

Versión estable preparada para despliegue, demostración y sustentación.

Principales validaciones realizadas:

- Suite de pruebas del frontend aprobada.
- ESLint global sin errores ni warnings.
- Build de producción correcto.
- Code splitting y carga diferida por rutas.
- Reportes administrativos integrados.
- Interfaz responsive.
- Permisos dinámicos por rol.
- Flujo completo de cotización, pedido, abonos, diseños, producción y ventas.

---

## Tecnologías principales

- React
- Vite
- JavaScript
- Axios
- React Router
- React Hook Form
- Recharts
- Sonner
- Lucide React
- Ant Design
- Tesseract.js
- CSS por módulos / componentes
- Vitest
- Testing Library
- Nginx para ejecución en contenedor
- Vercel para despliegue web

---

## Módulos del sistema

### Dashboard
- Indicadores administrativos.
- Pedidos.
- Clientes.
- Ingresos.
- Ventas por periodo.
- Tendencias.
- Distribución de pedidos.
- Últimos pedidos y cotizaciones.

### Configuración
- Gestión de roles.
- Asignación dinámica de permisos.

### Usuarios
- Gestión de usuarios internos.
- Gestión de clientes.
- Perfil del usuario.

### Catálogo
- Categorías de productos.
- Productos cotizables.
- Gestión de técnicas.

### Ventas
- Gestión de cotizaciones.
- Gestión de pedidos.
- Gestión de abonos.
- Gestión de ventas.

### Compras
- Proveedores.
- Compras.

### Producción
- Cola de producción.
- Gestión de diseños.
- Requerimientos de diseño.
- Aprobación y corrección de diseños.

### Reportes
Los reportes están integrados dentro de sus módulos correspondientes:

- Reporte de ventas.
- Reporte de pedidos.
- Reporte de cotizaciones.
- Reporte de abonos.

Cada reporte permite utilizar filtros, visualizar KPIs, consultar el detalle paginado y descargar el PDF generado por el backend.

---

## Arquitectura del frontend

El proyecto utiliza una arquitectura modular inspirada en **Clean Architecture**.

Estructura conceptual:

```text
src/
├── core/
│   ├── hooks/
│   ├── services/
│   └── utils/
│
├── shared/
│   └── components/
│
├── modules/
│   ├── auth/
│   ├── dashboard/
│   ├── users/
│   ├── products/
│   ├── services/
│   ├── sales/
│   ├── purchases/
│   ├── production/
│   └── reports/
│
├── routes/
└── store/
```

Dentro de los módulos se utilizan, según corresponda:

```text
domain/
application/
infrastructure/
presentation/
```

La capa de presentación no realiza llamadas HTTP directas cuando existe un repository para el módulo.

---

## Autenticación y permisos

PIXEL utiliza autenticación mediante **JWT**.

Los permisos se obtienen dinámicamente desde el backend y determinan la visibilidad y acceso a las funcionalidades.

Algunos ejemplos:

```text
ventas.ver
pedidos.ver
cotizaciones.ver
abonos.ver
disenos.crear
disenos.produccion
```

No se recomienda implementar validaciones por nombre de rol en componentes cuando existe un permiso específico.

---

## API

El frontend utiliza un cliente Axios centralizado.

Las solicitudes internas usan rutas relativas:

```text
/api/auth/login
/api/pedidos
/api/cotizaciones
/api/disenos
/api/reportes/ventas
```

### Producción

En Vercel, `vercel.json` redirige `/api/:path*` hacia el backend desplegado en Render. Esto permite mantener las llamadas a la API con rutas relativas.

---

## Reportes

### Ventas

```text
GET /api/reportes/ventas
GET /api/reportes/ventas/pdf
```

### Pedidos

```text
GET /api/reportes/pedidos
GET /api/reportes/pedidos/pdf
```

### Cotizaciones

```text
GET /api/reportes/cotizaciones
GET /api/reportes/cotizaciones/pdf
```

### Abonos

```text
GET /api/reportes/abonos
GET /api/reportes/abonos/pdf
```

El frontend no recalcula los KPIs ni genera nuevamente los PDF. El backend es la fuente de verdad para los datos de reporte.

---

## Instalación local

### Requisitos

- Node.js compatible con las dependencias actuales.
- npm.

### Instalación

```bash
npm install
```

### Desarrollo

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Vista previa

```bash
npm run preview
```

---

## Pruebas

```bash
npm test
```

Para ejecutar toda la suite una vez:

```bash
npm run test:run
```

---

## ESLint

```bash
npm run lint
```

La versión estable del proyecto fue cerrada con ESLint global sin errores ni warnings.

---

## Docker

Construcción:

```bash
docker build -t pixel-frontend .
```

En Docker, Nginx recibe la dirección del backend mediante la variable:

```text
BACKEND_URL
```

Ejemplo:

```yaml
environment:
  BACKEND_URL: http://backend:3000
```

---

## Docker Compose

Ejemplo:

```yaml
services:
  backend:
    build:
      context: ./BACKEND-PIXELv2
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    env_file:
      - ./BACKEND-PIXELv2/.env
    restart: unless-stopped

  frontend:
    build:
      context: ./FrontEnd-Pixel
      dockerfile: Dockerfile
    ports:
      - "8080:80"
    environment:
      BACKEND_URL: http://backend:3000
    depends_on:
      - backend
    restart: unless-stopped
```

Levantar:

```bash
docker compose up -d --build
```

Frontend:

```text
http://localhost:8080
```

Backend:

```text
http://localhost:3000
```

---

## Rendimiento

El frontend utiliza:

- `React.lazy`.
- `Suspense`.
- Code splitting por rutas.
- Recharts fuera del bundle inicial cuando no se necesita.
- Tesseract.js cargado dinámicamente.
- Debounce en búsquedas.
- Cancelación de solicitudes obsoletas.
- Paginación.
- Carga de catálogos bajo demanda.

---

## Archivos y diseños

Los diseños y comprobantes nuevos se almacenan mediante Cloudinary a través del backend.

Nunca deben colocarse secretos del backend en el frontend, por ejemplo:

```text
CLOUDINARY_API_SECRET
DATABASE_URL
JWT_SECRET
SMTP_PASS
```

---

## Convenciones de interfaz

Los textos visibles utilizan ortografía española correcta:

- Contraseña.
- Diseño.
- Diseñador.
- Gestión de Técnicas.
- Producción.
- Cotización.

Los nombres técnicos pueden conservar identificadores sin `ñ`, por ejemplo:

```text
diseno
idDiseno
disenos.crear
/api/disenos
```

---

## Despliegue

El frontend está preparado para despliegue como proyecto Vite en Vercel.

El archivo `vercel.json` mantiene:

1. Rewrite de `/api/*` hacia Render.
2. Fallback SPA hacia `/index.html`.

No cambiar el orden de estos rewrites.

---

## Seguridad

- JWT gestionado por el backend.
- Permisos dinámicos.
- Manejo centralizado de 401 y 403.
- No se almacenan secretos del backend en el frontend.
- Validación de formularios.
- Controles accesibles para mostrar/ocultar contraseñas.

---

## Proyecto académico

PIXEL fue desarrollado como proyecto de formación de **Análisis y Desarrollo de Software**.

El aplicativo web se complementa con una aplicación móvil independiente.

---

## Estado final

La versión actual se considera funcionalmente estable.

A partir de esta versión se recomienda realizar únicamente:

- corrección de bugs;
- mantenimiento;
- actualización de documentación;
- mejoras futuras planificadas.
