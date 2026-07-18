require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { connectDB } = require('./config/db');
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');
const uploadRoutes = require('./routes/upload');
const webhookRoutes = require('./routes/webhooks');

const app = express();
const PORT = process.env.PORT || 5001;

// CLIENT_URL can hold one or more comma-separated origins (prod + local)
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);
if (!allowedOrigins.includes('http://localhost:5173')) {
  allowedOrigins.push('http://localhost:5173');
}

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser tools (curl, health checks) that send no origin
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);
// Razorpay webhooks need the raw body for signature verification
app.use('/api/webhooks', express.raw({ type: 'application/json' }), webhookRoutes);

app.use(express.json({ limit: '1mb' }));

app.get('/', (_req, res) => {
  res.json({
    app: 'Crosia by Hand API',
    tagline: 'Every loop made with love',
    message: 'Backend is running. Open the React app at http://localhost:5173',
    health: '/api/health',
    auth: {
      register: 'POST /api/auth/register',
      login: 'POST /api/auth/login',
      me: 'GET /api/auth/me',
    },
  });
});

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    app: 'Crosia by Hand',
    tagline: 'Every loop made with love',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/upload', uploadRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: 'Server error' });
});

async function start() {
  await connectDB(process.env.MONGODB_URI);
  app.listen(PORT, () => {
    console.log(`Crosia by Hand API on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
