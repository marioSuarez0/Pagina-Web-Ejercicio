# Página Web Ejercicio

Aplicacion web en Node.js/Express para registrar ejercicios fisicos, calcular calorias y consultar listados y ranking. Usa autenticacion por sesion, plantillas EJS y una base de datos SQLite local.

## Tecnologias

- Node.js + Express
- EJS (motor de vistas)
- Sequelize (ORM)
- SQLite (almacen local)
- express-session (sesiones)
- crypto-js (hash de contrasenas)

## Requisitos

- Node.js instalado
- npm instalado

## Instalacion y ejecucion

1. Instalar dependencias:

```bash
npm install
```

2. Arrancar la aplicacion:

```bash
node app.js
```

3. Abrir en el navegador:

```
http://localhost:3000
```

## Base de datos

- Motor: SQLite.
- Archivo: `database/dev.sqlite`.
- Las tablas se crean automaticamente al arrancar el servidor (`sequelize.sync`).
- Para reiniciar los datos, elimina `database/dev.sqlite` y vuelve a iniciar la app.

## Estructura del proyecto 

- `app.js`: servidor Express, sesiones, rutas principales y autenticacion.
- `routers/exercises.js`: logica y rutas de ejercicios.
- `models/User.js`: modelo de usuario.
- `models/Exercise.js`: modelo de ejercicio.
- `database/database.js`: configuracion de Sequelize y SQLite.
- `views/`: vistas EJS.
- `public/style.css`: estilos.

## Modelo de datos

### User

- `username` (string, obligatorio)
- `password` (string, obligatorio, SHA-256)
- `age` (integer, obligatorio)
- `weight` (integer, obligatorio)
- `height` (integer, obligatorio)

### Exercise

- `name` (string, obligatorio) -> Running, Caminata, Natacion, Ciclismo
- `date` (string, obligatorio, formato YYYY-MM-DD)
- `calories` (float, obligatorio)
- `user` (string, obligatorio, username del creador)

Nota: no hay FK formal entre Exercise y User, la relacion se guarda por nombre de usuario.

## Calculo de calorias

Para un ejercicio de tipo `name` y un tiempo `tiempo`, se usa un factor por actividad y la ecuacion de Harris-Benedict (version con -161).

```text
factorAjuste = (10 * weight) + (6.25 * height) - (5 * age) - 161
calorias = (factorActividad[name] * tiempo) * factorAjuste / 1440
```

Factores usados:

- Running: 11.4
- Caminata: 5.0
- Natacion: 10.0
- Ciclismo: 8.0

En la actualizacion de un ejercicio, se calcula el tiempo aproximado a partir de las calorias guardadas.

## Rutas y pantallas

### Publicas

- `GET /` -> login
- `GET /login` -> login
- `POST /login` -> inicia sesion
- `GET /register` -> registro
- `POST /register` -> crea usuario
- `GET /logout` -> cierra sesion

### Protegidas (requieren sesion)

- `GET /exercises` -> listado global de ejercicios
- `GET /exercises/ranking` -> ranking por calorias (desc)
- `GET /exercises/user` -> resumen del usuario y sus ejercicios
- `GET /exercises/new` -> formulario de alta
- `POST /exercises/new` -> crea ejercicio
- `GET /exercises/:id` -> detalle del ejercicio
- `GET /exercises/update/:id` -> formulario de actualizacion (solo propietario)
- `POST /exercises/user` -> actualiza ejercicio
- `GET /exercises/delete/:id` -> confirmacion de borrado (solo propietario)
- `POST /exercises/delete` -> elimina ejercicio
- `GET /profile` -> perfil del usuario
- `GET /updateProfile` -> formulario de perfil
- `POST /updateProfile` -> actualiza perfil

### Errores

- `403` cuando se intenta acceder a una ruta protegida sin sesion.
- `404` para rutas o ejercicios inexistentes.

## Escenarios de uso

1. Registro y acceso:
   - El usuario se registra en `/register` y luego inicia sesion en `/login`.

2. Alta de ejercicio:
   - En `/exercises/new` selecciona actividad, fecha y tiempo.
   - La app calcula calorias y guarda el ejercicio.

3. Consulta general:
   - `/exercises` muestra todos los ejercicios del sistema.

4. Ranking:
   - `/exercises/ranking` ordena por calorias de mayor a menor.

5. Mis ejercicios y resumen:
   - `/exercises/user` muestra:
     - ejercicio con mas calorias de toda la historia
     - ejercicio con mas calorias de la ultima semana
     - listado completo del usuario

6. Detalle y control de propietario:
   - En `/exercises/:id` se ve el detalle.
   - Si el ejercicio es del usuario logueado, aparecen botones para actualizar o eliminar.

7. Actualizacion de ejercicio:
   - `/exercises/update/:id` permite cambiar actividad, fecha y tiempo.
   - Se recalculan las calorias.

8. Eliminacion de ejercicio:
   - `/exercises/delete/:id` solicita confirmacion y luego borra.

9. Perfil:
   - `/profile` permite editar edad, peso y altura.
   - Estos datos afectan el calculo de calorias en ejercicios nuevos/actualizados.

10. Accesos no autorizados:
    - Si no hay sesion o no eres propietario, se devuelve 403.
    - Si el id no existe, se devuelve 404.

## Notas y limitaciones

- La sesion se guarda en memoria; se pierde al reiniciar el servidor.
- El puerto esta fijado en `app.js` (3000).

