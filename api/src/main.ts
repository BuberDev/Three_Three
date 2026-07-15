import { ClassSerializerInterceptor, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory, Reflector } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as compression from 'compression';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { createServer } from 'http';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

const express = require('express');

async function bootstrap() {
    const startedAt = new Date().toISOString();
    const expressApp = express();
    const port = Number(process.env.PORT || 3000);
    let nestReady = false;

    const getHealthPayload = () => ({
        status: nestReady ? 'ok' : 'starting',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        startedAt,
        version: '1.0.0',
    });

    const sendHealth = (_req: any, res: any) => {
        res.status(nestReady ? 200 : 503).json(getHealthPayload());
    };

    const sendHealthHead = (_req: any, res: any) => {
        res.status(nestReady ? 200 : 503).end();
    };

    expressApp.get('/', sendHealth);
    expressApp.head('/', sendHealthHead);
    expressApp.get('/health', sendHealth);
    expressApp.head('/health', sendHealthHead);
    expressApp.get('/api/health', sendHealth);
    expressApp.head('/api/health', sendHealthHead);

    expressApp.use((req: any, res: any, next: any) => {
        if (
            req.originalUrl === '/api/auth/register' ||
            req.originalUrl === '/api/auth/google/mobile'
        ) {
            console.log(`[HTTP] ${req.method} ${req.originalUrl}${nestReady ? '' : ' (startup gate)'}`);
        }

        if (
            !nestReady &&
            (req.originalUrl === '/api/auth/register' || req.originalUrl === '/api/auth/google/mobile')
        ) {
            return res
                .status(503)
                .set('Retry-After', '2')
                .json({
                    error: {
                        code: 'SERVICE_STARTING',
                        message: 'API is starting. Retry shortly.',
                        timestamp: new Date().toISOString(),
                        path: req.originalUrl,
                        method: req.method,
                    },
                });
        }

        next();
    });

    const server = createServer(expressApp);

    await new Promise<void>((resolve, reject) => {
        server.once('error', reject);
        server.listen(port, () => {
            server.off('error', reject);
            resolve();
        });
    });

    console.log(`🚦 Three Three API HTTP server accepting startup probes on port ${port}`);

    const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp));
    const configService = app.get(ConfigService);

    // Security
    app.use(helmet());
    app.use(compression());

    // Rate limiting
    app.use(
        rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 100, // limit each IP to 100 requests per windowMs
        }),
    );

    // CORS
    // Auth is Bearer-token based (no cookies), so credentials/cookies are not
    // needed here — `origin: true` is safe without `credentials: true`.
    app.enableCors({
        origin: process.env.CORS_ORIGINS
            ? process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim())
            : true,
    });

    app.use((req: any, _res: any, next: any) => {
        if (
            req.originalUrl === '/api/auth/register' ||
            req.originalUrl === '/api/auth/google/mobile'
        ) {
            console.log(`[HTTP] ${req.method} ${req.originalUrl}`);
        }

        next();
    });

    // API versioning
    app.enableVersioning({
        type: VersioningType.URI,
        prefix: 'v',
    });

    // Global prefix
    app.setGlobalPrefix('api');

    // Global pipes
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
            transformOptions: {
                enableImplicitConversion: true,
            },
        }),
    );

    // Global filters
    app.useGlobalFilters(new AllExceptionsFilter());

    // Global interceptors
    app.useGlobalInterceptors(
        new LoggingInterceptor(),
        new TransformInterceptor(),
        new ClassSerializerInterceptor(app.get(Reflector)),
    );

    // Swagger documentation
    if (process.env.NODE_ENV !== 'production') {
        const config = new DocumentBuilder()
            .setTitle('Three Three Voice Journal API')
            .setDescription('Professional NestJS API for voice-first productivity app')
            .setVersion('1.0')
            .addBearerAuth()
            .addTag('auth', 'Authentication endpoints')
            .addTag('voice', 'Voice notes management')
            .addTag('tasks', 'Task management')
            .addTag('daily', 'Daily entries and summaries')
            .addTag('users', 'User management')
            .build();
        const document = SwaggerModule.createDocument(app, config);
        SwaggerModule.setup('api/docs', app, document);
    }

    await app.init();
    nestReady = true;

    console.log(`🚀 Three Three API running on port ${port}`);
    console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
}

bootstrap();
