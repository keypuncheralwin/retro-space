// Types for AI grouping functionality

export interface AICardData {
  id: string;
  content: string;
  authorName: string;
}

export interface AICardGroup {
  cards: AICardData[];
  spacerName: string;
  spacerColor: string;
}

export interface AIGroupingRequest {
  cards: AICardData[];
  columnTitle: string;
}

export interface AIGroupingResponse {
  success: boolean;
  groups: AICardGroup[];
  totalCards: number;
  groupCount: number;
  error?: string;
  details?: string;
}

export interface OpenAIGroupingResult {
  groups: Array<{
    name: string;
    cardNumbers: number[];
  }>;
}
