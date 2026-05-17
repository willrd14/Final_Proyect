import { useState, useEffect } from 'react'

function App() {
  const [user, setUser] = useState(null)
  const [inventory, setInventory] = useState([])
  const [requests, setRequests] = useState([])
  const [loginData, setLoginData] = useState({ username: '', password: '' })
  const [newRequest, setNewRequest] = useState({ product_name: '', quantity: 1 })
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (user) {
      fetchInventory()
      fetchRequests()
    }
  }, [user])

  const fetchInventory = () => {
    fetch('http://127.0.0.1:3000/api/inventory')
      .then(res => res.json())
      .then(data => setInventory(data))
  }

  const fetchRequests = () => {
    fetch('http://127.0.0.1:3000/api/requests')
      .then(res => res.json())
      .then(data => setRequests(data))
  }

  const handleLogin = (e) => {
    e.preventDefault()
    const backendUrl = `http://${window.location.hostname}:3000/api/login`
    console.log('Intentando login en:', backendUrl)
    
    fetch(backendUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginData)
    })
    .then(res => {
      console.log('Respuesta del servidor:', res.status)
      if (res.status === 401) {
        throw new Error('Usuario o contraseña incorrectos')
      }
      if (!res.ok) {
        throw new Error('Error en el servidor (' + res.status + ')')
      }
      return res.json()
    })
    .then(data => {
      console.log('Login exitoso:', data)
      setUser(data)
    })
    .catch(err => {
      console.error('Error durante el login:', err.message)
      alert(err.message === 'Failed to fetch' 
        ? 'No se pudo conectar con el servidor. Revisa que el backend esté corriendo en el puerto 3000.' 
        : err.message)
    })
  }

  const handleCreateRequest = (e) => {
    e.preventDefault()
    fetch('http://127.0.0.1:3000/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newRequest, worker_id: user.id })
    })
    .then(res => res.json())
    .then(data => {
      setMessage(data.message)
      setNewRequest({ product_name: '', quantity: 1 })
      fetchRequests()
      setTimeout(() => setMessage(''), 3000)
    })
  }

  const handleUpdateStatus = (id, status) => {
    fetch(`http://127.0.0.1:3000/api/requests/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    })
    .then(() => fetchRequests())
  }

  const handleUpdateStock = (id, currentStock, change) => {
    const newStock = Math.max(0, currentStock + change)
    const status = newStock === 0 ? 'escasez' : newStock < 10 ? 'por_llegar' : 'disponible'
    
    fetch(`http://127.0.0.1:3000/api/inventory/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stock: newStock, status })
    })
    .then(() => fetchInventory())
  }

  if (!user) {
    return (
      <div style={{ maxWidth: '350px', margin: '100px auto', padding: '30px', border: '1px solid #ddd', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <h2 style={{ textAlign: 'center', color: '#333' }}>WMS Control de Acceso</h2>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input 
            type="text" 
            placeholder="Nombre de usuario" 
            style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
            value={loginData.username} 
            onChange={e => setLoginData({...loginData, username: e.target.value})}
            required 
          />
          <input 
            type="password" 
            placeholder="Contraseña" 
            style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
            value={loginData.password} 
            onChange={e => setLoginData({...loginData, password: e.target.value})}
            required 
          />
          <button type="submit" style={{ padding: '12px', backgroundColor: '#2c3e50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
            Iniciar Sesión
          </button>
        </form>
        <div style={{ marginTop: '20px', fontSize: '13px', color: '#7f8c8d', backgroundColor: '#f9f9f9', padding: '10px', borderRadius: '4px' }}>
          <strong>Cuentas de demo:</strong><br/>
          Gerente: admin / admin123<br/>
          Trabajador: pepe / pepe123
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '30px', fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif', backgroundColor: '#f4f7f6', minHeight: '100vh' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: '15px 25px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '30px' }}>
        <h1 style={{ margin: 0, color: '#2c3e50', fontSize: '24px' }}>WMS - Panel de {user.role.toUpperCase()}</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <span style={{ color: '#34495e' }}>Usuario: <strong>{user.full_name}</strong></span>
          <button onClick={() => setUser(null)} style={{ padding: '8px 15px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cerrar Sesión</button>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: user.role === 'gerente' ? '1.2fr 0.8fr' : '1fr', gap: '30px' }}>
        
        {/* SECCIÓN INVENTARIO */}
        <section style={{ backgroundColor: 'white', padding: '25px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <h2 style={{ marginTop: 0, color: '#2c3e50', borderBottom: '2px solid #f4f7f6', paddingBottom: '10px' }}>Control de Inventario</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '15px' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: '#7f8c8d', fontSize: '14px' }}>
                <th style={{ padding: '12px', borderBottom: '2px solid #eee' }}>PRODUCTO</th>
                <th style={{ padding: '12px', borderBottom: '2px solid #eee' }}>STOCK</th>
                <th style={{ padding: '12px', borderBottom: '2px solid #eee' }}>UBICACIÓN</th>
                <th style={{ padding: '12px', borderBottom: '2px solid #eee' }}>ESTADO</th>
                {user.role === 'gerente' && <th style={{ padding: '12px', borderBottom: '2px solid #eee' }}>ACCIONES</th>}
              </tr>
            </thead>
            <tbody>
              {inventory.map(item => (
                <tr key={item.id}>
                  <td style={{ padding: '12px', borderBottom: '1px solid #eee', fontWeight: '500' }}>{item.name}</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{item.stock} unidades</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #eee', color: '#7f8c8d' }}>{item.location}</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                    <span style={{ 
                      padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase',
                      backgroundColor: item.status === 'escasez' ? '#fdecea' : item.status === 'por_llegar' ? '#fef9e7' : '#eafaf1',
                      color: item.status === 'escasez' ? '#e74c3c' : item.status === 'por_llegar' ? '#f1c40f' : '#27ae60'
                    }}>
                      {item.status.replace('_', ' ')}
                    </span>
                  </td>
                  {user.role === 'gerente' && (
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                      <button onClick={() => handleUpdateStock(item.id, item.stock, 10)} style={{ marginRight: '5px', padding: '4px 8px', cursor: 'pointer' }}>+10</button>
                      <button onClick={() => handleUpdateStock(item.id, item.stock, -10)} style={{ padding: '4px 8px', cursor: 'pointer' }}>-10</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* SECCIÓN SOLICITUDES */}
        <section style={{ backgroundColor: 'white', padding: '25px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <h2 style={{ marginTop: 0, color: '#2c3e50', borderBottom: '2px solid #f4f7f6', paddingBottom: '10px' }}>
            {user.role === 'gerente' ? 'Solicitudes Recibidas' : 'Nueva Solicitud de Material'}
          </h2>

          {user.role === 'trabajador' && (
            <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
              <form onSubmit={handleCreateRequest} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ display: 'flex', gap: '15px' }}>
                  <div style={{ flex: 2 }}>
                    <label style={{ display: 'block', fontSize: '13px', color: '#7f8c8d', marginBottom: '5px' }}>Producto / Material</label>
                    <input 
                      type="text" 
                      style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
                      placeholder="Ej: Paletas de madera"
                      value={newRequest.product_name} 
                      onChange={e => setNewRequest({...newRequest, product_name: e.target.value})}
                      required 
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '13px', color: '#7f8c8d', marginBottom: '5px' }}>Cantidad Necesaria</label>
                    <input 
                      type="number" 
                      style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
                      value={newRequest.quantity} 
                      onChange={e => setNewRequest({...newRequest, quantity: parseInt(e.target.value)})}
                      min="1"
                      required 
                    />
                  </div>
                </div>
                <button type="submit" style={{ padding: '12px', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                  ENVIAR PEDIDO AL GERENTE
                </button>
              </form>
              {message && <p style={{ color: '#27ae60', textAlign: 'center', marginTop: '15px', fontWeight: 'bold' }}>{message}</p>}
            </div>
          )}

          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '16px', color: '#7f8c8d' }}>Historial de Solicitudes</h3>
            {requests.map(req => (
              <div key={req.id} style={{ padding: '15px', border: '1px solid #eee', borderRadius: '6px', marginBottom: '10px', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '15px' }}>{req.product_name}</span>
                  <span style={{ color: '#2c3e50', fontWeight: 'bold' }}>Cant: {req.quantity}</span>
                </div>
                <div style={{ fontSize: '12px', color: '#95a5a6', marginTop: '5px' }}>
                  Por: {req.worker_name} | {new Date(req.created_at).toLocaleDateString()}
                </div>
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ 
                    fontSize: '11px', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold',
                    backgroundColor: req.status === 'pendiente' ? '#eee' : req.status === 'aprobado' ? '#d4edda' : '#f8d7da',
                    color: req.status === 'pendiente' ? '#666' : req.status === 'aprobado' ? '#155724' : '#721c24'
                  }}>
                    {req.status.toUpperCase()}
                  </span>
                  {user.role === 'gerente' && req.status === 'pendiente' && (
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button onClick={() => handleUpdateStatus(req.id, 'aprobado')} style={{ padding: '5px 10px', fontSize: '11px', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>Aprobar</button>
                      <button onClick={() => handleUpdateStatus(req.id, 'rechazado')} style={{ padding: '5px 10px', fontSize: '11px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>Rechazar</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

export default App




