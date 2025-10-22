import bcrypt from "bcrypt";
import crypto from "crypto";
import { QueryResult } from "pg";
import pool from "../config/database";

export interface User {
  id: number;
  email: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
}

export interface AuthToken {
  id: number;
  user_id: number;
  token: string;
  kind: "regular" | "refresh";
  expire_at: Date;
  created_at: Date;
  updated_at: Date;
}

export class UserModel {
  static async create(email: string, password: string): Promise<User> {
    const passwordHash = await bcrypt.hash(password, 10);
    const result: QueryResult<User> = await pool.query(
      "INSERT INTO users (email, password_hash, created_at, updated_at) VALUES ($1, $2, NOW(), NOW()) RETURNING *",
      [email, passwordHash],
    );
    return result.rows[0]!;
  }

  static async findByEmail(email: string): Promise<User | null> {
    const result: QueryResult<User> = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email],
    );
    return result.rows[0] || null;
  }

  static async findById(id: number): Promise<User | null> {
    const result: QueryResult<User> = await pool.query(
      "SELECT * FROM users WHERE id = $1",
      [id],
    );
    return result.rows[0] || null;
  }

  static async authenticate(
    email: string,
    password: string,
  ): Promise<User | null> {
    const user = await this.findByEmail(email);
    if (!user) return null;

    const isValid = await bcrypt.compare(password, user.password_hash);
    return isValid ? user : null;
  }

  static async generateToken(
    userId: number,
    kind: "regular" | "refresh",
  ): Promise<AuthToken> {
    const token = crypto.randomBytes(32).toString("hex");
    const expireAt = new Date();

    if (kind === "regular") {
      expireAt.setDate(expireAt.getDate() + 1); // 1 day
    } else {
      expireAt.setDate(expireAt.getDate() + 30); // 30 days
    }

    const result: QueryResult<AuthToken> = await pool.query(
      "INSERT INTO auth_tokens (user_id, token, kind, expire_at, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING *",
      [userId, token, kind, expireAt],
    );
    return result.rows[0]!;
  }

  static async findByToken(
    token: string,
  ): Promise<{ user: User; authToken: AuthToken } | null> {
    const result: QueryResult<AuthToken & User> = await pool.query(
      `SELECT auth_tokens.*, users.*
       FROM auth_tokens
       JOIN users ON users.id = auth_tokens.user_id
       WHERE auth_tokens.token = $1 AND auth_tokens.expire_at > NOW()`,
      [token],
    );

    if (result.rows.length === 0) return null;

    const row = result.rows[0]!;
    return {
      authToken: {
        id: row.id,
        user_id: row.user_id,
        token: row.token,
        kind: row.kind,
        expire_at: row.expire_at,
        created_at: row.created_at,
        updated_at: row.updated_at,
      },
      user: {
        id: row.user_id,
        email: row.email,
        password_hash: row.password_hash,
        created_at: row.created_at,
        updated_at: row.updated_at,
      },
    };
  }

  static async deleteToken(token: string): Promise<void> {
    await pool.query("DELETE FROM auth_tokens WHERE token = $1", [token]);
  }

  static async deleteUserTokens(
    userId: number,
    kind?: "regular" | "refresh",
  ): Promise<void> {
    if (kind) {
      await pool.query(
        "DELETE FROM auth_tokens WHERE user_id = $1 AND kind = $2",
        [userId, kind],
      );
    } else {
      await pool.query("DELETE FROM auth_tokens WHERE user_id = $1", [userId]);
    }
  }
}
