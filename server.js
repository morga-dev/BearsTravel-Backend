// AgenciaViajes-API/server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/User');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI);

// Registro
app.post('/api/register', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed });
    res.status(201).json({ message: 'Usuario creado', user: { name: user.name, email: user.email } });
  } catch (err) {
    res.status(400).json({ error: 'El correo ya está registrado o datos inválidos.' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ error: 'Usuario no encontrado' });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(400).json({ error: 'Contraseña incorrecta' });

  // Puedes usar JWT para autenticar
  const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '2h' });
  res.json({ message: 'Login exitoso', token, user: { name: user.name, email: user.email } });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log('API escuchando en puerto', PORT));