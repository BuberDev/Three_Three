import { ClassSerializerInterceptor, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as compression from 'compression';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
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
    app.enableCors({
        origin: process.env.NODE_ENV === 'production'
            ? ['https://your-domain.com']
            : ['http://localhost:8081', 'exp://192.168.1.102:8081'],
        credentials: true,
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

    const port = configService.get('PORT', 3000);
    await app.listen(port);

    console.log(`🚀 Three Three API running on port ${port}`);
    console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
}

bootstrap();