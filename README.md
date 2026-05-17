# Warehouse Management System (WMS) - Gestión de Almacén

## 📝 Descripción General
Este proyecto es un **Sistema de Gestión de Almacén (WMS)** diseñado para centralizar y optimizar el control de inventario y la comunicación entre trabajadores y gerencia. La aplicación permite llevar un registro detallado de existencias, ubicaciones y estados de productos, además de gestionar solicitudes de reabastecimiento de manera eficiente.

El sistema implementa un **Control de Acceso Basado en Roles (RBAC)**, permitiendo que diferentes tipos de usuarios (Gerentes y Trabajadores) tengan experiencias y herramientas personalizadas según sus responsabilidades.

## 🚀 Tecnologías Utilizadas

### Frontend
- **React (Vite):** Biblioteca principal para la interfaz de usuario.
- **JavaScript (ES6+):** Lógica del lado del cliente.
- **CSS3:** Diseño responsivo y profesional.

### Backend
- **Node.js & Express:** Servidor de aplicaciones y API RESTful.
- **MySQL:** Base de datos relacional para la persistencia de datos.
- **mysql2/promise:** Cliente de MySQL para Node.js con soporte de Promesas.

### Infraestructura
- **Docker & Docker Compose:** Contenerización de toda la aplicación (Frontend, Backend y DB) para asegurar que funcione en cualquier entorno.

---

## 👤 Autor
**[Tu Nombre Aquí]** - *Proyecto Final de Programación III*

---

## 🛠️ Instalación y Ejecución

Para poner en marcha el proyecto, asegúrate de tener instalado **Docker** y **Docker Desktop**.

1.  Clona el repositorio o accede a la carpeta del proyecto.
2.  Abre una terminal en la raíz del proyecto.
3.  Ejecuta el siguiente comando:
    ```bash
    docker-compose up --build
    ```
4.  Una vez finalizado, accede a:
    - **Aplicación (Frontend):** `http://localhost:5173`
    - **API (Backend):** `http://localhost:3000`

---

## 📖 Guía de Uso y Roles

### Cuentas de Prueba
- **Gerente:** Usuario: `admin` | Contraseña: `admin123`
- **Trabajador:** Usuario: `pepe` | Contraseña: `pepe123`

### Funcionalidades por Rol
1.  **Panel de Trabajador:**
    - Visualización del inventario actual.
    - Formulario de **Nueva Solicitud**: Permite pedir materiales específicos indicando la cantidad necesaria.
2.  **Panel de Gerente:**
    - Control total del inventario.
    - Gestión de Stock: Botones para aumentar o disminuir existencias.
    - Supervisión de Pedidos: Revisión de solicitudes de trabajadores con opción de **Aprobar** o **Rechazar**.

---

## 💻 Detalles Técnicos y Ejemplos de Desarrollo

### 1. Inicialización de la Base de Datos (Backend)
El sistema está diseñado para "auto-configurarse" al arrancar. El siguiente fragmento de `backend/index.js` muestra cómo se crean las tablas y se insertan datos semilla automáticamente:

```javascript
async function initDb() {
  const connection = await pool.getConnection();
  
  // Tabla de Usuarios con Roles
  await connection.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role ENUM('gerente', 'trabajador') NOT NULL,
      full_name VARCHAR(100)
    )
  `);

  // Insertar usuario administrador por defecto
  const [userCount] = await connection.query('SELECT COUNT(*) as count FROM users');
  if (userCount[0].count === 0) {
    await connection.query('INSERT INTO users (username, password, role, full_name) VALUES (?, ?, ?, ?)', 
      ['admin', 'admin123', 'gerente', 'Juan Gerente']);
  }
}
```

### 2. Control de Acceso en el Frontend (React)
La interfaz cambia dinámicamente según el rol del usuario autenticado. Utilizamos renderizado condicional en `App.jsx`:

```jsx
{user.role === 'gerente' ? (
  <section className="manager-view">
    <h2>Solicitudes de Trabajadores</h2>
    {/* Lista de solicitudes con botones de aprobar/rechazar */}
  </section>
) : (
  <section className="worker-view">
    <h2>Nueva Solicitud de Material</h2>
    {/* Formulario para enviar pedidos */}
  </section>
)}
```

### 3. Comunicación Frontend-Backend
Se implementó un middleware manual de **CORS** en el backend para permitir que el navegador realice peticiones desde el puerto 5173 al 3000 de forma segura:

```javascript
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});
```

---

*Este documento sirve como base técnica para la presentación del proyecto final.*