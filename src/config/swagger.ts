import swaggerJSDoc from 'swagger-jsdoc';
import { env } from './env';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Digital Signature & Document Management API',
    version: '1.0.0',
    description: 'API documentation for the Digital Signature Platform.',
  },
  servers: [
    {
      url: `http://localhost:${env.PORT}`,
      description: 'Development server',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Error message' },
          errors: {
            type: 'array',
            items: { type: 'string' },
            example: ['Validation failed on field X'],
          },
        },
      },
    },
  },
};

const options = {
  swaggerDefinition,
  // Paths to files containing OpenAPI definitions
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJSDoc(options);
