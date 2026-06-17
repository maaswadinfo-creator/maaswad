import swaggerJSDoc from 'swagger-jsdoc';
import config from '../config/index.js';

export const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Maaswad API',
      version: '1.0.0',
      description: 'Maaswad — Home Food, Made with Mother\'s Love. Founded by Dr. Chef Vinoth.',
    },
    servers: [{ url: `${config.apiBaseUrl}/api/v1` }],
    components: {
      securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Auth' }, { name: 'Catalog' }, { name: 'Orders' }, { name: 'Chef' },
      { name: 'Delivery' }, { name: 'Reviews' }, { name: 'Customer' }, { name: 'Admin' },
    ],
    paths: {
      '/auth/otp/request': { post: { tags: ['Auth'], summary: 'Request OTP (phone/email)', security: [], responses: { 200: { description: 'OTP sent' } } } },
      '/auth/otp/verify': { post: { tags: ['Auth'], summary: 'Verify OTP and issue tokens', security: [], responses: { 201: { description: 'Verified' } } } },
      '/auth/refresh': { post: { tags: ['Auth'], summary: 'Refresh access token', security: [], responses: { 200: { description: 'OK' } } } },
      '/auth/me': { get: { tags: ['Auth'], summary: 'Current user', responses: { 200: { description: 'OK' } } } },
      '/catalog/dishes': { get: { tags: ['Catalog'], summary: 'Browse published dishes', security: [], responses: { 200: { description: 'OK' } } } },
      '/catalog/dishes/{id}': { get: { tags: ['Catalog'], summary: 'Dish detail', security: [], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'OK' } } } },
      '/orders/quote': { post: { tags: ['Orders'], summary: 'Price a cart', responses: { 200: { description: 'OK' } } } },
      '/orders/checkout': { post: { tags: ['Orders'], summary: 'Create order + payment intent', responses: { 201: { description: 'Created' } } } },
      '/orders/{id}/pay': { post: { tags: ['Orders'], summary: 'Confirm dummy payment', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'OK' } } } },
      '/orders/mine': { get: { tags: ['Orders'], summary: 'My orders', responses: { 200: { description: 'OK' } } } },
      '/chefs/apply': { post: { tags: ['Chef'], summary: 'Apply as home chef', responses: { 201: { description: 'Created' } } } },
      '/chefs/dashboard': { get: { tags: ['Chef'], summary: 'Chef dashboard metrics', responses: { 200: { description: 'OK' } } } },
      '/chefs/dishes': { get: { tags: ['Chef'], summary: 'My dishes' }, post: { tags: ['Chef'], summary: 'Create dish' } },
      '/delivery/availability': { patch: { tags: ['Delivery'], summary: 'Toggle online/offline', responses: { 200: { description: 'OK' } } } },
      '/delivery/assigned': { get: { tags: ['Delivery'], summary: 'Assigned orders', responses: { 200: { description: 'OK' } } } },
      '/reviews': { post: { tags: ['Reviews'], summary: 'Submit a review', responses: { 201: { description: 'Created' } } } },
      '/admin/chefs': { get: { tags: ['Admin'], summary: 'List chef applications', responses: { 200: { description: 'OK' } } } },
      '/admin/revenue': { get: { tags: ['Admin'], summary: 'Revenue dashboard', responses: { 200: { description: 'OK' } } } },
      '/admin/settings': { get: { tags: ['Admin'], summary: 'Platform settings' }, patch: { tags: ['Admin'], summary: 'Update settings' } },
    },
  },
  apis: [],
});
