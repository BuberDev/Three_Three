import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    name: process.env.DB_NAME || 'three_three',

    // Connection pool settings
    poolSize: parseInt(process.env.DB_POOL_SIZE, 10) || 10,
    maxQueryExecutionTime: parseInt(process.env.DB_MAX_QUERY_TIME, 10) || 60000,

    // SSL settings for production
    ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false,
    } : false,
}));