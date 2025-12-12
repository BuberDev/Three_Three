import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
    nodeEnv: process.env.NODE_ENV || 'development',
    environment: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT, 10) || 3000,
    apiPrefix: process.env.API_PREFIX || 'api',
    jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

    // AWS S3 Configuration
    aws: {
        region: process.env.AWS_REGION || 'us-east-1',
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        s3BucketName: process.env.AWS_S3_BUCKET_NAME || 'three-three-voice-notes',
    },

    // OpenAI Configuration
    openai: {
        apiKey: process.env.OPENAI_API_KEY,
        model: process.env.OPENAI_MODEL || 'gpt-4',
        whisperModel: process.env.WHISPER_MODEL || 'whisper-1',
    },

    // Kafka Configuration
    kafka: {
        clientId: process.env.KAFKA_CLIENT_ID || 'three-three-api',
        brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
        groupId: process.env.KAFKA_GROUP_ID || 'three-three-group',
    },

    // Google OAuth Configuration
    google: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackUrl: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/google/callback',
    },
}));