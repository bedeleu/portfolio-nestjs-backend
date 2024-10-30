import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

export const createCorsConfig = (frontendUrl: string): CorsOptions => {
  const origins = frontendUrl.split(',').map(url => url.trim());

  return {
    origin: origins.length === 1 ? origins[0] : origins,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization'],
    credentials: false,
    preflightContinue: false,
    optionsSuccessStatus: 204
  };
};