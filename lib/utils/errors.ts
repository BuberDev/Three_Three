export enum ErrorCode {
    VALIDATION_ERROR = 'VALIDATION_ERROR',
    AUTH_ERROR = 'AUTH_ERROR',
    PERMISSION_ERROR = 'PERMISSION_ERROR',
    RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
    SERVER_ERROR = 'SERVER_ERROR',
    NETWORK_ERROR = 'NETWORK_ERROR',
    DATABASE_ERROR = 'DATABASE_ERROR',
    VOICE_PROCESSING_ERROR = 'VOICE_PROCESSING_ERROR'
}

export class AppError extends Error {
    public readonly code: ErrorCode;
    public readonly details: any;
    public readonly timestamp: string;

    constructor(code: ErrorCode, message: string, details: any = {}) {
        super(message);
        this.name = 'AppError';
        this.code = code;
        this.details = details;
        this.timestamp = new Date().toISOString();
    }

    public toJSON() {
        return {
            error: {
                code: this.code,
                message: this.message,
                details: this.details,
                timestamp: this.timestamp
            }
        };
    }
}

export class ValidationError extends AppError {
    constructor(message: string, field?: string) {
        super(ErrorCode.VALIDATION_ERROR, message, { field });
    }
}

export class AuthError extends AppError {
    constructor(message: string = 'Authentication failed') {
        super(ErrorCode.AUTH_ERROR, message);
    }
}

export class PermissionError extends AppError {
    constructor(message: string = 'Permission denied') {
        super(ErrorCode.PERMISSION_ERROR, message);
    }
}

export class RateLimitError extends AppError {
    constructor(message: string = 'Rate limit exceeded', retryAfter?: number) {
        super(ErrorCode.RATE_LIMIT_ERROR, message, { retryAfter });
    }
}

export class ServerError extends AppError {
    constructor(message: string = 'Internal server error') {
        super(ErrorCode.SERVER_ERROR, message);
    }
}

export class NetworkError extends AppError {
    constructor(message: string = 'Network connection failed') {
        super(ErrorCode.NETWORK_ERROR, message);
    }
}

export class DatabaseError extends AppError {
    constructor(message: string, operation?: string) {
        super(ErrorCode.DATABASE_ERROR, message, { operation });
    }
}

export class VoiceProcessingError extends AppError {
    constructor(message: string, stage?: string) {
        super(ErrorCode.VOICE_PROCESSING_ERROR, message, { stage });
    }
}

export class ErrorHandler {
    private static instance: ErrorHandler;
    private readonly errorListeners: ((error: AppError) => void)[] = [];

    private constructor() { }

    public static getInstance(): ErrorHandler {
        if (!ErrorHandler.instance) {
            ErrorHandler.instance = new ErrorHandler();
        }
        return ErrorHandler.instance;
    }

    public handleError(error: Error | AppError): AppError {
        let appError: AppError;

        if (error instanceof AppError) {
            appError = error;
        } else {
            // Convert standard errors to AppError
            appError = new ServerError(error.message);
        }

        // Log error
        console.error('Application Error:', appError.toJSON());

        // Notify listeners
        for (const listener of this.errorListeners) {
            try {
                listener(error);
            } catch (listenerError) {
                console.error('Error in error listener:', listenerError);
            }
        }

        return appError;
    }

    public addErrorListener(listener: (error: AppError) => void): void {
        this.errorListeners.push(listener);
    }

    public removeErrorListener(listener: (error: AppError) => void): void {
        const index = this.errorListeners.indexOf(listener);
        if (index > -1) {
            this.errorListeners.splice(index, 1);
        }
    }

    public static createFromApiResponse(response: any): AppError {
        const { error } = response;

        switch (error?.code) {
            case ErrorCode.VALIDATION_ERROR:
                return new ValidationError(error.message, error.details?.field);
            case ErrorCode.AUTH_ERROR:
                return new AuthError(error.message);
            case ErrorCode.PERMISSION_ERROR:
                return new PermissionError(error.message);
            case ErrorCode.RATE_LIMIT_ERROR:
                return new RateLimitError(error.message, error.details?.retryAfter);
            default:
                return new ServerError(error?.message || 'Unknown error occurred');
        }
    }
}