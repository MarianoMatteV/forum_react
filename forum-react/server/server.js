const express = require('express');
const app = express();
const pool = require('./db');
const authRoutes = require('./src/routes/authRoutes');
const postRoutes = require('./src/routes/postRoutes');
const commentRoutes = require('./src/routes/commentRoutes');
const userRoutes = require('./src/routes/userRoutes');
const uploadRoutes = require('./src/routes/uploadRoutes');
const path = require('path');
const cors = require('cors');
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// 👉 Servir arquivos estáticos da pasta uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 👉 Rotas principais
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes); 
app.use('/api/comments', commentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);

// Rota inicial (teste)
app.get('/', (req, res) => {
  res.send('Bem-vindo à API do Fórum!');
});

// Rota para testar conexão com DB
app.get('/test-db', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 + 1 AS solution');
    res.json({ message: 'Conexão com DB bem-sucedida!', solution: rows[0].solution });
  } catch (error) {
    console.error('Erro na rota /test-db:', error);
    res.status(500).json({ message: 'Erro ao conectar ao banco de dados', error: error.message });
  }
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Acesse: http://localhost:${PORT}`);
});
