import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { EntityNotFoundError, QueryFailedError } from 'typeorm';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger = new Logger(AllExceptionsFilter.name);

    catch(exception: unknown, host: ArgumentsHost): void {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        let status: HttpStatus;
        let message: string;
        let code: string;

        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse();

            if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
                message = (exceptionResponse as any).message || exception.message;
                code = (exceptionResponse as any).code || 'HTTP_EXCEPTION';
            } else {
                message = exceptionResponse as string;
                code = 'HTTP_EXCEPTION';
            }
        } else if (exception instanceof QueryFailedError) {
            status = HttpStatus.BAD_REQUEST;
            message = 'Database query failed';
            code = 'DATABASE_ERROR';
        } else if (exception instanceof EntityNotFoundError) {
            status = HttpStatus.NOT_FOUND;
            message = 'Entity not found';
            code = 'ENTITY_NOT_FOUND';
        } else {
            status = HttpStatus.INTERNAL_SERVER_ERROR;
            message = 'Internal server error';
            code = 'INTERNAL_SERVER_ERROR';
        }

        const errorResponse = {
            error: {
                code,
                message,
                timestamp: new Date().toISOString(),
                path: request.url,
                method: request.method,
            },
        };

        // Log error for monitoring
        this.logger.error(
            `HTTP ${status} Error: ${message}`,
            exception instanceof Error ? exception.stack : 'Unknown error',
            `${request.method} ${request.url}`,
        );

        response.status(status).json(errorResponse);
    }
}