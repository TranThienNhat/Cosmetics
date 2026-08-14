export interface IQueryOptions<T> {
  where?: Partial<T>;
  select?: string[];
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDir?: "ASC" | "DESC";
}
