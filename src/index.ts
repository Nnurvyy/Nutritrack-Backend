import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { aiRoutes } from './routes/ai.routes';
import { paymentRoutes } from './routes/payment.routes';
import { AppEnv } from './types';

const app = new Hono<AppEnv>();

// Enable CORS for all origins and methods
app.use('*', cors());

// Mount the protected AI / Cloudinary endpoints
app.route('/api/ai', aiRoutes);
app.route('/api/payment', paymentRoutes);

// Base route for status checks
app.get('/', (c) => {
  return c.text('NutriTrack Backend is Running!');
});

export default app;
