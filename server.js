require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/User');


const app = express();
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || 'https://master.d1heqwiehxskxp.amplifyapp.com/',
  methods: ['GET','POST','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
}));
app.use(express.json());

// Validar MONGO_URI
const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
  console.error('ERROR: MONGO_URI no está definida en las variables de entorno.');
  // Hacemos que el back falle en AWS para que el deploy marque error y se arregle con la variable.
  process.exit(1);
}

// Conectar a MongoDB con manejo de errores
mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Conectado a MongoDB'))
  .catch(err => {
    console.error('Error al conectar a MongoDB:', err);
    process.exit(1);
  });

app.get("/", (req, res) => {
  res.send("Backend de Bears Travel funcionando correctamente");
});

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

  const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '2h' });
  res.json({ message: 'Login exitoso', token, user: { name: user.name, email: user.email } });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log('API escuchando en puerto', PORT));
