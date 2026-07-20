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
        id: 'llama3.2:3b',
        name: 'Three Three AI',
        provider: 'Self-hosted (Ollama)',
        contextLength: 128000,
        pricing: { input: 0, output: 0 },
        description: 'Lokalny model AI uruchomiony na naszym serwerze'
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