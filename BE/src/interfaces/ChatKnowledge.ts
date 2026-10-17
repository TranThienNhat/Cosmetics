export interface IChatKnowledge {
  id?: number;
  user_query: string;
  normalized_query: string;
  intent?: string;
  response: string;
  suggested_products?: any;
  quick_suggestions?: any;
  source?: "llm" | "intent_engine" | "manual" | "trained" | "knowledge_memory";
  use_count?: number;
  is_active?: boolean | number;
  created_at?: Date;
  updated_at?: Date;
}
