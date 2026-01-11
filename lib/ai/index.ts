// AI Integration Module
// Uses Claude API for summarization, translation, and content scoring

export { summarizeArticle, batchSummarize, selectModel, AI_MODELS } from './summarize';
export type { SummarizeOptions, BatchSummarizeRequest, AIModelTier } from './summarize';
export { translateContent } from './translate';
export { scoreContent } from './score';
export type { AISummaryRequest, AISummaryResponse } from '@/types';
