import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import orderRoutes from './routes/orders';
import reviewRoutes from './routes/reviews';
import userRoutes from './routes/users';
import checkoutRoutes from './routes/checkout';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Allowed origins — set ALLOWED_ORIGINS in env as comma-separated URLs
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:3001,http://localhost:3002')
    .split(',')
    .map(o => o.trim());

// Middleware
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, Render health checks)
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error(`CORS blocked: ${origin}`));
        }
    },
    credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/users', userRoutes);
app.use('/api', checkoutRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'Backend is running' });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
