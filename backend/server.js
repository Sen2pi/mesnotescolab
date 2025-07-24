const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true
  }
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));
app.use(express.json());

// Configuration Swagger
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Mes Notes Colab',
      version: '1.0.0',
      description: 'API pour la gestion collaborative de notes en temps réel'
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Serveur de développement'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: ['./routes/*.js', './models/*.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Connexion MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connexion MongoDB réussie'))
  .catch(err => console.error('❌ Erreur connexion MongoDB:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/notes', require('./routes/notes'));
app.use('/api/users', require('./routes/users'));

// Socket.io pour collaboration temps réel
require('./sockets/noteSocket')(io);

// Route de santé pour Docker healthcheck
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Service en fonctionnement',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// Route racine
app.get('/', (req, res) => {
  res.json({ 
    message: 'API Mes Notes Colab',
    documentation: `http://localhost:${PORT}/api-docs`,
    health: `http://localhost:${PORT}/api/health`
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`📚 Documentation Swagger: http://localhost:${PORT}/api-docs`);
});

module.exports = { app, io };