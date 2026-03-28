// src/lib/moderation/types.ts
export interface ModerationContext {
    text: string;
    urls: string[]; // extraídas uma vez só
}

export interface ModerationResult {
    allowed: boolean;
    reason?: string;
}

export interface ModerationProvider {
    name: string;
    check(ctx: ModerationContext): Promise<ModerationResult>;
}