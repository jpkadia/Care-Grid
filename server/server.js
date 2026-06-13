require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');

const logger = require('./utils/logger');
const errorHandler = require('./middlewares/error');
const doctorRoutes = require('./routes/doctorRoutes');
const adminRoutes = require('./routes/adminRoutes');
const authRoutes = require('./routes/authRoutes');
mongoose.set('sanitizeFilter', true);
mongoose.set('strictQuery', true);

const requiredEnvVars = ['PORT', 'MONGO_URI', 'OPENAI_API_KEY', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET', 'JWT_SECRET', 'EMAIL_USER', 'BREVO_API_KEY'];
requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    logger.error(`Fatal Error: Missing required environment variable ${envVar}`);
    process.exit(1);
  }
});
if (process.env.NODE_ENV === 'production' && process.env.JWT_SECRET.length < 32) {
  logger.error('Fatal Error: JWT_SECRET must be at least 32 characters in production');
  process.exit(1);
}

const app = express();
app.disable('x-powered-by');
if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1);

app.use(helmet());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  message: { success: false, message: 'Too many requests from this IP, please try again after 15 minutes' }
});
app.use(limiter);

app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

app.use(express.json({ limit: '1mb' }));
const allowedOrigins = (process.env.CLIENT_URLS || 'http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map(origin => origin.trim().replace(/\/$/, ''))
  .filter(Boolean);
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin.replace(/\/$/, ''))) return callback(null, true);
    const error = new Error('Origin is not allowed by CORS');
    error.statusCode = 403;
    return callback(error);
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    logger.info("MongoDB Connected Successfully");
    const Admin = require('./models/Admin');
    const bcrypt = require('bcryptjs');
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0 && process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
      const hashed = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
      await Admin.create({ email: process.env.ADMIN_EMAIL.toLowerCase().trim(), password: hashed });
      logger.info("Initial Super Admin Created");
    } else if (adminCount === 0) {
      logger.warn('No super admin exists. Set ADMIN_EMAIL and ADMIN_PASSWORD for initial deployment.');
    }
    const { verifyEmailConnection } = require('./services/emailService');
    verifyEmailConnection()
      .then(() => logger.info('Email service connected successfully'))
      .catch(error => logger.error('Email service connection failed after retries', {
        message: error.message,
        code: error.code,
        command: error.command,
        responseCode: error.responseCode
      }));
  })
  .catch(err => {
    logger.error("DB Connection Error:", err);
    process.exit(1);
  });

app.use('/api/doctors', doctorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);
app.get('/api/health', (req, res) => {
  const databaseConnected = mongoose.connection.readyState === 1;
  res.status(databaseConnected ? 200 : 503).json({
    success: databaseConnected,
    status: databaseConnected ? 'healthy' : 'database-unavailable'
  });
});

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to CareGrid API. System is fully operational.',
    timestamp: new Date().toISOString()
  });
});

app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => logger.info(`Server running on port ${PORT}`));

const shutdown = async signal => {
  logger.info(`${signal} received, shutting down`);
  server.close(async () => {
    await mongoose.connection.close();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
