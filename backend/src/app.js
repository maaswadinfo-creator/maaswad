import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import config from './config/index.js';
import routes from './routes/index.js';
import { notFound, errorHandler } from './middleware/error.js';
import { apiLimiter } from './middleware/rateLimit.js';
import { isDbConnected } from './config/db.js';
import { swaggerSpec } from './docs/swagger.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: config.clientUrl === '*' ? true : [config.clientUrl], credentials: true }));
app.use(compression());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
if (config.env !== 'test') app.use(morgan('dev'));

app.get('/health', (_req, res) => res.json({
  success: true, service: 'maaswad-api', status: 'up', db: isDbConnected() ? 'connected' : 'disconnected',
  founder: 'Dr. Chef Vinoth', time: new Date().toISOString(),
}));

app.use('/api/v1', apiLimiter, routes);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { customSiteTitle: 'Maaswad API Docs' }));
app.get('/api/docs.json', (_req, res) => res.json(swaggerSpec));

app.get('/', (_req, res) => res.json({ name: 'Maaswad API', tagline: "Home Food, Made with Mother's Love", docs: '/api/docs' }));

app.use(notFound);
app.use(errorHandler);

export default app;
