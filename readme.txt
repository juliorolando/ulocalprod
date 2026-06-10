Tengo un proyecto Node.js + Express + SQLite existente llamado "ushuaialocal".
Ya tengo una base de datos SQLite con negocios scrapeados de Ushuaia.

Quiero que construyas un directorio web minimalista con las siguientes características:

## STACK
- Node.js + Express
- SQLite (better-sqlite3)
- Vanilla JS + HTML/CSS (sin frameworks frontend)
- Sin sistema de reseñas, sin comentarios, sin puntuaciones

## LO QUE NECESITO

### 1. Frontend público (/)
- Listado de negocios con: nombre, categoría, dirección, teléfono, sitio web (si tiene)
- Buscador simple por nombre o categoría (filtro en tiempo real, client-side)
- Filtro por categoría (dropdown o botones)
- Card por negocio, diseño limpio y mobile-first
- Sin login, sin reseñas, sin nada social

### 2. Admin panel (/admin)
- Protegido con usuario y contraseña hardcodeada en .env (sin base de datos de usuarios)
- Tabla con todos los negocios
- Botones para: Agregar nuevo negocio, Editar negocio existente, Eliminar negocio
- Formulario simple: nombre, categoría, dirección, teléfono, sitio web, descripción corta, activo (boolean)
- Sin paginación compleja, máximo 500 registros por ahora

### 3. API REST mínima
- GET /api/businesses — lista todos los activos
- POST /api/admin/businesses — crear
- PUT /api/admin/businesses/:id — editar
- DELETE /api/admin/businesses/:id — eliminar
- Todas las rutas /api/admin/* verifican la sesión del admin

## COMPORTAMIENTO ESPERADO
- Al arrancar, si la tabla no existe, la crea
- Si ya existe la tabla con datos, NO la toca (preservar mis datos)
- El servidor corre en el puerto definido en .env

## LO QUE NO QUIERO
- Sin reseñas ni sistema de rating
- Sin registro de usuarios públicos
- Sin mapa embebido por ahora
- Sin dependencias innecesarias: solo express, better-sqlite3,
  express-session, dotenv

## PRIMERO: antes de escribir código
Mostrá el esquema de la tabla que vas a crear/usar y preguntame
si coincide con mi estructura actual. Si mi DB ya tiene datos,
adaptá el schema a lo que encuentres en el archivo .db existente.