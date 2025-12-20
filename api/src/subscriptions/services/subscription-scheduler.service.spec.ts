import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionsService } from '../subscriptions.service';
import { SubscriptionSchedulerService } from './subscription-scheduler.service';

describe('SubscriptionSchedulerService', () => {
    let service: SubscriptionSchedulerService;
    let subscriptionsService: jest.Mocked<SubscriptionsService>;
    let configService: jest.Mocked<ConfigService>;
    let schedulerRegistry: jest.Mocked<SchedulerRegistry>;

    beforeEach(async () => {
        const mockSubscriptionsService = {
            processTrialExpiration: jest.fn(),
            processTrialEndingNotifications: jest.fn(),
        };

        const mockConfigService = {
            get: jest.fn(),
        };

        const mockSchedulerRegistry = {
            getCronJob: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SubscriptionSchedulerService,
                {
                    provide: SubscriptionsService,
                    useValue: mockSubscriptionsService,
                },
                {
                    provide: ConfigService,
                    useValue: mockConfigService,
                },
                {
                    provide: SchedulerRegistry,
                    useValue: mockSchedulerRegistry,
                },
            ],
        }).compile();

        service = module.get<SubscriptionSchedulerService>(SubscriptionSchedulerService);
        subscriptionsService = module.get(SubscriptionsService);
        configService = module.get(ConfigService);
        schedulerRegistry = module.get(SchedulerRegistry);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('processExpiredTrials', () => {
        it('should process expired trials successfully', async () => {
            // Arrange
            configService.get.mockReturnValue(true); // scheduling enabled
            const mockResult = { processedCount: 3, errors: [] };
            subscriptionsService.processTrialExpiration.mockResolvedValue(mockResult);

            // Act
            await service.processExpiredTrials();

            // Assert
            expect(subscriptionsService.processTrialExpiration).toHaveBeenCalledTimes(1);
        });

        it('should skip processing when scheduling is disabled', async () => {
            // Arrange
            configService.get.mockReturnValue(false); // scheduling disabled

            // Act
            await service.processExpiredTrials();

            // Assert
            expect(subscriptionsService.processTrialExpiration).not.toHaveBeenCalled();
        });

        it('should handle errors gracefully', async () => {
            // Arrange
            configService.get.mockReturnValue(true);
            subscriptionsService.processTrialExpiration.mockRejectedValue(new Error('Database error'));

            // Act & Assert
            await expect(service.processExpiredTrials()).resolves.not.toThrow();
        });
    });

    describe('manualProcessExpiredTrials', () => {
        it('should manually trigger trial expiration processing', async () => {
            // Arrange
            const mockResult = { processedCount: 2, errors: [] };
            subscriptionsService.processTrialExpiration.mockResolvedValue(mockResult);

            // Act
            const result = await service.manualProcessExpiredTrials();

            // Assert
            expect(subscriptionsService.processTrialExpiration).toHaveBeenCalledTimes(1);
            expect(result).toEqual(mockResult);
        });
    });

    describe('getSchedulerStatus', () => {
        it('should return scheduler status', () => {
            // Arrange
            configService.get.mockReturnValue(true);

            // Act
            const status = service.getSchedulerStatus();

            // Assert
            expect(status).toHaveProperty('enabled');
            expect(status).toHaveProperty('jobs');
            expect(status).toHaveProperty('totalJobs');
            expect(status).toHaveProperty('timestamp');
        });
    });
});