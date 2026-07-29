async function test() {
  try {
    require('dotenv').config({path: './.env'});
    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ id: 1, username: 'admin', role: 'ADMIN' }, process.env.JWT_SECRET || 'yucoffe_secret_key_123!@#', { expiresIn: '1d' });

    const res = await fetch('http://localhost:5000/api/menu/1', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: "Test Update",
        price: 15000,
        category: "MINUMAN"
      })
    });
    const data = await res.json();
    console.log("UPDATE Response:", res.status, data);
  } catch (err) {
    console.error("ERROR:", err);
  }
}

test();
