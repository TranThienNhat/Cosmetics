import { Pool, RowDataPacket, ResultSetHeader } from "mysql2/promise";
import pool from "../config/db";

export interface IQueryOptions<T> {
  where?: Partial<T>;
  select?: string[];
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDir?: "ASC" | "DESC";
}

export class BaseModel<T> {
  protected tableName: string;
  protected db: Pool;
  protected primaryKey: string = "id";

  constructor(tableName: string) {
    this.tableName = tableName;
    this.db = pool;
  }

  // --- Helper xây dựng mệnh đề WHERE ---
  protected buildWhereClause(where: Partial<T>): {
    sql: string;
    values: any[];
  } {
    const keys = Object.keys(where);
    if (keys.length === 0) return { sql: "", values: [] };

    const conditions = keys.map((key) => `${key} = ?`).join(" AND ");
    return {
      sql: `WHERE ${conditions}`,
      values: Object.values(where),
    };
  }

  // --- READ ALL ---
  async findAll(options: IQueryOptions<T> = {}): Promise<T[]> {
    const {
      where = {},
      select = ["*"],
      limit,
      offset,
      orderBy,
      orderDir = "DESC",
    } = options;
    const { sql: whereClause, values } = this.buildWhereClause(where);
    const selectClause = select.join(", ");

    let query = `SELECT ${selectClause} FROM ${this.tableName} ${whereClause}`;

    if (orderBy) {
      query += ` ORDER BY ${orderBy} ${orderDir}`;
    }

    if (limit !== undefined) {
      query += ` LIMIT ?`;
      values.push(limit);
    }

    if (offset !== undefined) {
      query += ` OFFSET ?`;
      values.push(offset);
    }

    const [rows] = await this.db.query<(T & RowDataPacket)[]>(query, values);
    return rows;
  }

  // --- READ ONE ---
  async findOne(
    where: Partial<T>,
    select: string[] = ["*"]
  ): Promise<T | null> {
    const { sql: whereClause, values } = this.buildWhereClause(where);
    const selectClause = select.join(", ");

    const query = `SELECT ${selectClause} FROM ${this.tableName} ${whereClause} LIMIT 1`;

    const [rows] = await this.db.query<(T & RowDataPacket)[]>(query, values);
    return rows.length > 0 ? rows[0] : null;
  }

  // --- FIND BY ID ---
  async findById(
    id: number | string,
    select: string[] = ["*"]
  ): Promise<T | null> {
    const where: any = { [this.primaryKey]: id };
    return this.findOne(where, select);
  }

  // --- CREATE ---
  async create(data: Partial<T>): Promise<number> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map(() => "?").join(", ");

    const sql = `INSERT INTO ${this.tableName} (${keys.join(
      ", "
    )}) VALUES (${placeholders})`;

    const [result] = await this.db.query<ResultSetHeader>(sql, values);
    return result.insertId;
  }

  // --- UPDATE ---
  async update(id: number | string, data: Partial<T>): Promise<boolean> {
    const keys = Object.keys(data);
    if (keys.length === 0) return false;

    const values = Object.values(data);
    const setClause = keys.map((key) => `${key} = ?`).join(", ");

    const sql = `UPDATE ${this.tableName} SET ${setClause} WHERE ${this.primaryKey} = ?`;
    values.push(id);

    const [result] = await this.db.query<ResultSetHeader>(sql, values);
    return result.affectedRows > 0;
  }

  // --- DELETE ---
  async delete(id: number | string): Promise<boolean> {
    const sql = `DELETE FROM ${this.tableName} WHERE ${this.primaryKey} = ?`;
    const [result] = await this.db.query<ResultSetHeader>(sql, [id]);
    return result.affectedRows > 0;
  }

  // --- COUNT ---
  async count(where: Partial<T> = {}): Promise<number> {
    const { sql: whereClause, values } = this.buildWhereClause(where);
    const sql = `SELECT COUNT(*) as total FROM ${this.tableName} ${whereClause}`;

    const [rows] = await this.db.query<RowDataPacket[]>(sql, values);
    return rows[0].total;
  }
}
