const express = require('express');
const mysql = require('mysql2/promise');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Middleware de CORS manual para permitir peticiones desde el frontend
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'test_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function initDb() {
  try {
    const connection = await pool.getConnection();
    console.log('Inicializando Base de Datos WMS...');
    
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('gerente', 'trabajador') NOT NULL,
        full_name VARCHAR(100)
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        stock INT DEFAULT 0,
        min_stock INT DEFAULT 5,
        location VARCHAR(100),
        status ENUM('disponible', 'por_llegar', 'escasez') DEFAULT 'disponible'
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_name VARCHAR(255) NOT NULL,
        quantity INT NOT NULL,
        worker_id INT,
        status ENUM('pendiente', 'aprobado', 'rechazado', 'recibido') DEFAULT 'pendiente',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (worker_id) REFERENCES users(id)
      )
    `);

    const [userCount] = await connection.query('SELECT COUNT(*) as count FROM users');
    if (userCount[0].count === 0) {
      await connection.query('INSERT INTO users (username, password, role, full_name) VALUES (?, ?, ?, ?)', 
        ['admin', 'admin123', 'gerente', 'Juan Gerente']);
      await connection.query('INSERT INTO users (username, password, role, full_name) VALUES (?, ?, ?, ?)', 
        ['pepe', 'pepe123', 'trabajador', 'Pepe Almacén']);
    }

    const [prodCount] = await connection.query('SELECT COUNT(*) as count FROM products');
    if (prodCount[0].count === 0) {
      await connection.query('INSERT INTO products (name, stock, min_stock, location, status) VALUES (?, ?, ?, ?, ?)', 
        ['Cajas de Cartón', 50, 10, 'Pasillo A', 'disponible']);
      await connection.query('INSERT INTO products (name, stock, min_stock, location, status) VALUES (?, ?, ?, ?, ?)', 
        ['Cinta de Embalaje', 3, 10, 'Estantería 2', 'escasez']);
    }

    connection.release();
  } catch (err) {
    console.error('Error inicializando WMS DB:', err.message);
    setTimeout(initDb, 5000);
  }
}

// --- API ROUTES ---

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  console.log(`Intento de login para usuario: ${username}`);
  try {
    const [rows] = await pool.query('SELECT id, username, role, full_name FROM users WHERE username = ? AND password = ?', [username, password]);
    if (rows.length > 0) {
      console.log(`Login exitoso: ${username}`);
      res.json(rows[0]);
    } else {
      console.log(`Login fallido: ${username} (Credenciales incorrectas)`);
      res.status(401).json({ error: 'Credenciales inválidas' });
    }
  } catch (err) { 
    console.error('Error en el login:', err);
    res.status(500).json({ error: 'Error en el servidor' }); 
  }
});

app.get('/api/inventory', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM products');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: 'Error al obtener inventario' }); }
});

// Actualizar stock de un producto (Gerente)
app.put('/api/inventory/:id', async (req, res) => {
  const { stock, status } = req.body;
  try {
    await pool.query('UPDATE products SET stock = ?, status = ? WHERE id = ?', [stock, status, req.params.id]);
    res.json({ message: 'Inventario actualizado' });
  } catch (err) { res.status(500).json({ error: 'Error al actualizar inventario' }); }
});

app.get('/api/requests', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT r.*, u.full_name as worker_name FROM requests r JOIN users u ON r.worker_id = u.id ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: 'Error al obtener solicitudes' }); }
});

app.post('/api/requests', async (req, res) => {
  const { product_name, quantity, worker_id } = req.body;
  try {
    await pool.query('INSERT INTO requests (product_name, quantity, worker_id) VALUES (?, ?, ?)', [product_name, quantity, worker_id]);
    res.json({ message: 'Solicitud enviada correctamente' });
  } catch (err) { res.status(500).json({ error: 'Error al crear solicitud' }); }
});

// Cambiar estado de solicitud (Aprobar/Rechazar)
app.patch('/api/requests/:id', async (req, res) => {
  const { status } = req.body;
  try {
    await pool.query('UPDATE requests SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ message: `Solicitud ${status}` });
  } catch (err) { res.status(500).json({ error: 'Error al actualizar solicitud' }); }
});

app.listen(port, () => {
  console.log(`WMS Backend en puerto ${port}`);
  initDb();
});




