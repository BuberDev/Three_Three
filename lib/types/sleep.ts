/**
 * Sleep Recording Analysis Types
 */

export interface SleepRecordingAnalysis {
    id: string;
    uri: string;
    duration: number;
    timestamp: Date;
    audioLevels: number[];
    disturbanceEvents: SleepDisturbanceEvent[];
    qualityScore: number;
    // Additional properties for backwards compatibility
    totalSleepDuration: number;
    snoringEvents: SleepDisturbanceEvent[];
    sleepTalkingEvents: SleepDisturbanceEvent[];
    sleepQuality: number;
}

export interface SleepDisturbanceEvent {
    timestamp: number;
    type: 'snoring' | 'movement' | 'talking' | 'other';
    intensity: 'low' | 'medium' | 'high';
    duration: number;
}

export interface SleepAnalysisConfig {
    sensitivity: 'low' | 'medium' | 'high';
    minRecordingLength: number;
    noiseThreshold: number;
}