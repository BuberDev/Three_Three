import { DatabaseService } from '../database/database';
import { AppEvent, EventType } from '../types';

type EventListener = (event: AppEvent) => void;

export class EventService {
    private static instance: EventService;
    private listeners: Map<EventType, EventListener[]> = new Map();
    private dbService: DatabaseService;

    private constructor() {
        this.dbService = DatabaseService.getInstance();
    }

    public static getInstance(): EventService {
        if (!EventService.instance) {
            EventService.instance = new EventService();
        }
        return EventService.instance;
    }

    public addEventListener(eventType: EventType, listener: EventListener): void {
        if (!this.listeners.has(eventType)) {
            this.listeners.set(eventType, []);
        }
        this.listeners.get(eventType)!.push(listener);
    }

    public removeEventListener(eventType: EventType, listener: EventListener): void {
        const listeners = this.listeners.get(eventType);
        if (listeners) {
            const index = listeners.indexOf(listener);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }

    public async dispatchEvent(eventType: EventType, userId: string, payload: any = {}): Promise<void> {
        const event: AppEvent = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            userId,
            eventType,
            payload,
            timestamp: new Date().toISOString()
        };

        try {
            // Log to database
            await this.dbService.logEvent(event);

            // Notify listeners
            const listeners = this.listeners.get(eventType) || [];
            listeners.forEach(listener => {
                try {
                    listener(event);
                } catch (error) {
                    console.error(`Error in event listener for ${eventType}:`, error);
                }
            });
        } catch (error) {
            console.error('Failed to dispatch event:', error);
        }
    }

    public async getEvents(userId: string, eventType?: EventType, limit: number = 100): Promise<AppEvent[]> {
        try {
            // This would be implemented in DatabaseService
            return [];
        } catch (error) {
            console.error('Failed to get events:', error);
            return [];
        }
    }
}