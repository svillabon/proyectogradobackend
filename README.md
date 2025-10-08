# Backend - Sistema de Reservas de Espacios

API REST para el sistema de gestión de reservas de espacios académicos.

## Tecnologías
- Node.js
- Express.js
- PostgreSQL
- JWT para autenticación
- bcryptjs para hash de contraseñas
- Joi para validaciones

## Instalación

### Requisitos Previos
- Node.js (versión 16 o superior)
- PostgreSQL (versión 12 o superior)

### Pasos de Instalación

1. **Instalar dependencias:**
```bash
npm install
```

2. **Configurar variables de entorno en `.env`:**
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=reservas_db
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_jwt_secret_key_here
PORT=5000
NODE_ENV=development
```

3. **Crear e inicializar la base de datos:**

   **En Linux/Mac:**
   ```bash
   # Crear base de datos
   createdb -U postgres reservas_db

   # Ejecutar script de inicialización
   psql -U postgres -d reservas_db -f init.sql
   ```

   **En Windows:**
   ```cmd
   REM Crear base de datos (desde línea de comandos de PostgreSQL)
   createdb -U postgres reservas_db

   REM Ejecutar script de inicialización
   psql -U postgres -d reservas_db -f init.sql
   ```

   **Alternativa usando pgAdmin o interfaz gráfica:**
   - Crear una base de datos llamada `reservas_db`
   - Ejecutar el contenido del archivo `init.sql` en el query tool

4. **Ejecutar el servidor:**
```bash
# Modo desarrollo (con nodemon)
npm run dev

# Modo producción
npm start
```

### Verificación de Instalación

Una vez ejecutado el servidor, puedes verificar que funciona visitando:
- `http://localhost:5000` - Mensaje de bienvenida de la API
- `http://localhost:5000/api/auth/login` - Endpoint de login (POST)

## Estructura del Proyecto

```
backend/
├── src/
│   ├── config/
│   │   └── database.js          # Configuración PostgreSQL
│   ├── controllers/
│   │   ├── authController.js    # Autenticación
│   │   ├── userController.js    # CRUD usuarios
│   │   ├── spaceController.js   # CRUD espacios
│   │   ├── reservationController.js  # Gestión reservas
│   │   └── dashboardController.js    # Estadísticas
│   ├── middlewares/
│   │   ├── auth.js             # Verificación JWT
│   │   └── roleCheck.js        # Validación roles
│   ├── models/
│   │   ├── User.js             # Modelo Usuario
│   │   ├── Space.js            # Modelo Espacio
│   │   └── Reservation.js      # Modelo Reserva
│   ├── routes/
│   │   ├── auth.js             # Rutas autenticación
│   │   ├── users.js            # Rutas usuarios
│   │   ├── spaces.js           # Rutas espacios
│   │   ├── reservations.js     # Rutas reservas
│   │   └── dashboard.js        # Rutas dashboard
│   ├── utils/
│   │   └── validations.js      # Validaciones comunes
│   └── app.js                  # Configuración Express
├── init.sql                    # Script inicialización BD
├── package.json
├── .env                        # Variables entorno
└── README.md
```

## API Endpoints

### Autenticación
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Registro (solo admin)
- `GET /api/auth/profile` - Perfil usuario

### Usuarios (Admin)
- `GET /api/users` - Listar usuarios
- `POST /api/users` - Crear usuario
- `PUT /api/users/:id` - Actualizar usuario
- `DELETE /api/users/:id` - Eliminar usuario

### Espacios
- `GET /api/spaces` - Listar espacios (público)
- `GET /api/spaces/:id` - Obtener espacio (público)
- `POST /api/spaces` - Crear espacio (admin)
- `PUT /api/spaces/:id` - Actualizar espacio (admin)
- `DELETE /api/spaces/:id` - Eliminar espacio (admin)

### Reservas
- `GET /api/reservations` - Listar reservas (con filtros)
- `POST /api/reservations` - Crear reserva
- `PUT /api/reservations/:id/status` - Aprobar/rechazar (admin)

### Dashboard
- `GET /api/dashboard/stats` - Estadísticas
- `GET /api/dashboard/reservations/today` - Reservas del día

## Roles de Usuario
- **admin**: Acceso completo a todas las funcionalidades
- **profesor**: Puede crear reservas, ver sus reservas
- **estudiante**: Puede crear reservas, ver sus reservas

## Usuarios de Prueba
- **admin**: admin / admin123
- **profesor1**: profesor1 / admin123
- **estudiante1**: estudiante1 / admin123
- **estudiante2**: estudiante2 / admin123

## Validaciones
- Emails deben ser institucionales (@uni.edu.co)
- Contraseñas mínimo 6 caracteres
- Horarios de reservas no pueden solaparse
- Solo admin puede crear usuarios y espacios
- Reservas de admin se aprueban automáticamente