import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import * as path from 'path';

export interface VoiceProcessingResult {
    transcription: string;
    summary: string;
    title: string;
    embedding: number[];
    tags: string[];
    extractedEntities: Array<{
        type: string;
        value: string;
        confidence: number;
    }>;
    sentiment: number;
    insights: Record<string, any>;
}

@Injectable()
export class VoiceProcessingService {
    private readonly logger = new Logger(VoiceProcessingService.name);
    private readonly ollamaModel: string;
    private readonly ollama: OpenAI;

    constructor(private readonly configService: ConfigService) {
        this.ollamaModel = this.configService.get<string>('app.ollama.model');
        this.ollama = new OpenAI({
            apiKey: 'ollama',
            baseURL: this.configService.get<string>('app.ollama.baseUrl'),
        });
    }

    async processVoiceNote(audioFilePath: string): Promise<VoiceProcessingResult> {
        this.logger.log(`Starting voice processing for: ${audioFilePath}`);

        try {
            // Step 1: Transcribe audio using Whisper
            const transcription = await this.transcribeAudio(audioFilePath);
            this.logger.log('Transcription completed');

            // Step 2: Extract insights using OpenRouter free model
            const analysis = await this.analyzeTranscription(transcription);
            this.logger.log('NLP analysis completed');

            // Step 3: Generate embedding for semantic search
            const embedding = await this.generateEmbedding(transcription);
            this.logger.log('Embedding generation completed');

            return {
                transcription,
                embedding,
                ...analysis,
            };
        } catch (error) {
            this.logger.error('Voice processing failed:', error);
            throw error;
        }
    }

    private async transcribeAudio(audioFilePath: string): Promise<string> {
        try {
            // Note: OpenRouter free models don't include Whisper for audio transcription
            // Using placeholder transcription for now

            const filename = path.basename(audioFilePath);
            const placeholderText = `Placeholder transcription for ${filename}. ` +
                `W przyszłości można użyć lokalnego modelu transkrypcji lub płatnej usługi.`;

            this.logger.warn('Using placeholder transcription - Whisper not available in OpenRouter free tier');
            return placeholderText;

        } catch (error) {
            this.logger.error('Transcription placeholder failed:', error);
            throw new Error(`Transcription failed: ${error.message}`);
        }
    }

    private async analyzeTranscription(transcription: string): Promise<{
        summary: string;
        title: string;
        tags: string[];
        extractedEntities: Array<{ type: string; value: string; confidence: number }>;
        sentiment: number;
        insights: Record<string, any>;
    }> {
        const prompt = `
Analyze the following transcription from a voice note and provide a comprehensive analysis in JSON format:

Transcription:
"${transcription}"

Provide the analysis in this exact JSON structure:
{
  "summary": "A concise 2-3 sentence summary of the key points",
  "title": "A short, descriptive title (max 6 words)",
  "tags": ["relevant", "tags", "for", "categorization"],
  "extractedEntities": [
    {
      "type": "PERSON|ORGANIZATION|LOCATION|DATE|TIME|TASK|GOAL|EMOTION",
      "value": "extracted entity",
      "confidence": 0.95
    }
  ],
  "sentiment": 0.7,
  "insights": {
    "mood": "positive|neutral|negative",
    "urgency": "high|medium|low",
    "topics": ["main", "topics", "discussed"],
    "actionItems": ["identified", "action", "items"],
    "questions": ["any", "questions", "mentioned"]
  }
}

        Rules:
- Sentiment should be a number between -1 (very negative) and 1 (very positive)
- Entity confidence should be between 0 and 1
- Keep tags relevant and lowercase
- Extract specific, actionable insights
- Focus on productivity, goals, and personal development context
`;

        try {
            const response = await this.ollama.chat.completions.create({
                model: this.ollamaModel,
                messages: [
                    {
                        role: 'system',
                        content: 'You are an AI assistant specialized in analyzing personal voice notes for productivity and self-improvement. Always respond with valid JSON only.',
                    },
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                temperature: 0.3,
                max_tokens: 1500,
            });

            const analysisText = response.choices[0].message.content;

            // Parse JSON response
            try {
                return JSON.parse(analysisText);
            } catch (parseError) {
                this.logger.error('Failed to parse analysis JSON:', parseError);
                // Fallback with basic analysis
                return this.createFallbackAnalysis(transcription);
            }
        } catch (error) {
            this.logger.error('Analysis failed:', error);
            return this.createFallbackAnalysis(transcription);
        }
    }

    private async generateEmbedding(text: string): Promise<number[]> {
        try {
            // OpenRouter free models don't support embeddings, using simple hash-based fallback
            const hash = this.simpleHashToVector(text);
            return hash;
        } catch (error) {
            this.logger.error('Embedding generation failed:', error);
            throw new Error(`Embedding generation failed: ${error.message}`);
        }
    }

    private simpleHashToVector(text: string): number[] {
        // Simple fallback embedding - convert text to 1536-dimensional vector
        const hash = text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const vector: number[] = [];
        for (let i = 0; i < 1536; i++) {
            vector.push(Math.sin(hash * (i + 1) * 0.1) * 0.1);
        }
        return vector;
    }

    private createFallbackAnalysis(transcription: string): {
        summary: string;
        title: string;
        tags: string[];
        extractedEntities: Array<{ type: string; value: string; confidence: number }>;
        sentiment: number;
        insights: Record<string, any>;
    } {
        // Basic fallback analysis when OpenAI analysis fails
        const words = transcription.toLowerCase().split(' ');
        const wordCount = words.length;

        // Simple sentiment analysis based on positive/negative words
        const positiveWords = ['good', 'great', 'happy', 'success', 'achieve', 'love', 'excellent'];
        const negativeWords = ['bad', 'terrible', 'sad', 'fail', 'problem', 'difficult', 'stress'];

        const positiveCount = words.filter(word => positiveWords.includes(word)).length;
        const negativeCount = words.filter(word => negativeWords.includes(word)).length;

        const sentiment = positiveCount > negativeCount ? 0.3 :
            negativeCount > positiveCount ? -0.3 : 0;

        // Generate basic title (first few words)
        const title = transcription
            .split(' ')
            .slice(0, 6)
            .join(' ')
            .replace(/[^a-zA-Z0-9 ]/g, '')
            .trim() || 'Voice Note';

        return {
            summary: transcription.length > 100
                ? `${transcription.substring(0, 100)}...`
                : transcription,
            title,
            tags: ['voice-note', 'unprocessed'],
            extractedEntities: [],
            sentiment,
            insights: {
                mood: sentiment > 0 ? 'positive' : sentiment < 0 ? 'negative' : 'neutral',
                urgency: 'medium',
                topics: ['general'],
                actionItems: [],
                questions: [],
                wordCount,
                fallback: true,
            },
        };
    }

    private getMimeType(filePath: string): string {
        const extension = path.extname(filePath).toLowerCase();
        const mimeTypes = {
            '.wav': 'audio/wav',
            '.mp3': 'audio/mpeg',
            '.m4a': 'audio/mp4',
            '.mp4': 'audio/mp4',
            '.flac': 'audio/flac',
            '.ogg': 'audio/ogg',
        };
        return mimeTypes[extension] || 'audio/wav';
    }

    async generateTitleFromTranscription(transcription: string): Promise<string> {
        try {
            const response = await this.ollama.chat.completions.create({
                model: this.ollamaModel,
                messages: [
                    {
                        role: 'system',
                        content: 'Generate a short, descriptive title (max 6 words) for this voice note transcription.',
                    },
                    {
                        role: 'user',
                        content: transcription,
                    },
                ],
                temperature: 0.5,
                max_tokens: 20,
            });

            return response.choices[0].message.content?.trim() || 'Voice Note';
        } catch (error) {
            this.logger.error('Title generation failed:', error);
            return 'Voice Note';
        }
    }

    async searchSimilarContent(
        query: string,
        limit = 5
    ): Promise<number[]> {
        try {
            const embedding = await this.generateEmbedding(query);
            return embedding;
        } catch (error) {
            this.logger.error('Search embedding generation failed:', error);
            throw error;
        }
    }
}
