export interface LLMModel {
    id: string;
    name: string;
    provider: string;
    contextLength: number;
    pricing: {
        input: number;
        output: number;
    };
    description: string;
}

export const AVAILABLE_MODELS: LLMModel[] = [
    {
        id: 'tngtech/deepseek-r1t2-chimera:free',
        name: 'DeepSeek R1T2 Chimera',
        provider: 'DeepSeek',
        contextLength: 32000,
        pricing: { input: 0, output: 0 },
        description: 'Darmowy model wysokiej jakości'
    },
    {
        id: 'anthropic/claude-3-5-sonnet-20241022',
        name: 'Claude 3.5 Sonnet',
        provider: 'Anthropic',
        contextLength: 200000,
        pricing: { input: 3.0, output: 15.0 },
        description: 'Najlepszy model do rozumowania i analizy'
    },
    {
        id: 'microsoft/phi-3-medium-128k-instruct:free',
        name: 'Phi-3 Medium (Darmowy)',
        provider: 'Microsoft via OpenRouter',
        contextLength: 128000,
        pricing: { input: 0, output: 0 },
        description: 'Darmowy model Microsoft o wysokiej jakości'
    },
    {
        id: 'meta-llama/llama-3.2-3b-instruct:free',
        name: 'Llama 3.2 3B (Darmowy)',
        provider: 'Meta via OpenRouter',
        contextLength: 32000,
        pricing: { input: 0, output: 0 },
        description: 'Darmowy model Meta Llama'
    },
    {
        id: 'google/gemini-pro-1.5',
        name: 'Gemini Pro 1.5',
        provider: 'Google',
        contextLength: 1000000,
        pricing: { input: 1.25, output: 5.0 },
        description: 'Model z największym kontekstem'
    },
    {
        id: 'meta-llama/llama-3.1-70b-instruct',
        name: 'Llama 3.1 70B',
        provider: 'Meta',
        contextLength: 128000,
        pricing: { input: 0.9, output: 0.9 },
        description: 'Open source model wysokiej jakości'
    }
];

export interface ChatCompletionMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface ChatCompletionRequest {
    model: string;
    messages: ChatCompletionMessage[];
    temperature?: number;
    max_tokens?: number;
    stream?: boolean;
}

export interface ChatCompletionResponse {
    id: string;
    choices: {
        message: {
            role: string;
            content: string;
        };
        finish_reason: string;
    }[];
    usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}