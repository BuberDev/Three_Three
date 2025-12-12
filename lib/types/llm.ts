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
        id: 'openai/gpt-4o-2024-11-20',
        name: 'GPT-4o',
        provider: 'OpenAI',
        contextLength: 128000,
        pricing: { input: 2.5, output: 10.0 },
        description: 'Zaawansowany model multimodalny'
    },
    {
        id: 'openai/gpt-4o-mini-2024-07-18',
        name: 'GPT-4o Mini',
        provider: 'OpenAI',
        contextLength: 128000,
        pricing: { input: 0.15, output: 0.6 },
        description: 'Szybki i ekonomiczny model'
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