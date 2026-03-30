const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');

const healthRouter = require('./routes/health');
const authRouter = require('./routes/auth.routes');
const passwordRouter = require('./routes/password.routes');
const userRouter = require('./routes/user.routes');
const fabricRouter = require('./routes/fabric.routes');
const adminRouter = require('./routes/admin.routes');
const designRouter = require('./routes/design.routes');
const savedDesignRouter = require('./routes/savedDesign.routes');
const sizeChartRouter = require('./routes/sizeChart.routes');
const measurementProfileRouter = require('./routes/measurementProfile.routes');
const cartRouter = require('./routes/cart.routes');
const promoRouter = require('./routes/promo.routes');
const checkoutRouter = require('./routes/checkout.routes');
const paymentRouter = require('./routes/payment.routes');
const webhookRouter = require('./routes/webhook.routes');
const orderRouter = require('./routes/order.routes');
const reviewRouter = require('./routes/review.routes');
const { errorHandler } = require('./middleware/errorHandler');
const { notFoundHandler } = require('./middleware/notFoundHandler');

const app = express();

// ── Security headers ────────────────────────────────────────────────────────
app.use(helmet());

// ── CORS ────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., mobile apps, Postman, curl)
      if (!origin) {
        return callback(null, true);
      }
      const allowedOrigins = process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
        : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'];
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ── Stripe webhook — MUST be registered before express.json() ───────────────
// The webhook handler uses express.raw() per-route so Stripe can verify the
// request signature against the unparsed body buffer.
app.use('/api/v1/webhooks', webhookRouter);

// ── Request parsing ──────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(compression());

// ── Logging ──────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// ── Global rate limiter ──────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use(globalLimiter);

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/v1/health', healthRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/auth', passwordRouter);
app.use('/api/v1/user', userRouter);
app.use('/api/v1/products', fabricRouter);
app.use('/api/v1/admin', adminRouter);
app.use('/api/v1/designs', designRouter);
app.use('/api/v1/saved-designs', savedDesignRouter);
app.use('/api/v1/size-chart', sizeChartRouter);
app.use('/api/v1/measurements', measurementProfileRouter);
app.use('/api/v1/cart', cartRouter);
app.use('/api/v1/promo', promoRouter);
app.use('/api/v1/checkout', checkoutRouter);
app.use('/api/v1/payments', paymentRouter);
app.use('/api/v1/orders', orderRouter);
app.use('/api/v1/reviews', reviewRouter);

// ── 404 + Error handlers ─────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
