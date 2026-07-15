import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Health')
@Public()
@Controller('')
export class HealthController {
    @Get('health')
    @ApiOperation({ summary: 'Health check endpoint' })
    @ApiResponse({
        status: 200,
        description: 'Service is healthy',
        schema: {
            type: 'object',
            properties: {
                status: { type: 'string', example: 'ok' },
                timestamp: { type: 'string', format: 'date-time' },
                uptime: { type: 'number', description: 'Process uptime in seconds' },
                version: { type: 'string', example: '1.0.0' },
            },
        },
    })
    getHealth() {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            version: '1.0.0',
        };
    }
}
