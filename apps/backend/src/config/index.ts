import dotenv from 'dotenv';
import path from 'path';

// 加载 .env（开发环境）；生产环境由 docker compose 注入
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const required = (key: string, fallback?: string): string => {
  const v = process.env[key] ?? fallback;
  if (v === undefined) {
    throw new Error(`环境变量 ${key} 缺失`);
  }
  return v;
};

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  jwt: {
    secret: required('JWT_SECRET', 'plms_jwt_secret_change_in_production'),
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  database: {
    url: process.env.DATABASE_URL || 'postgresql://plms:plms_pass_2026@localhost:5432/plms',
  },
  upload: {
    dir: process.env.UPLOAD_DIR || path.resolve(process.cwd(), 'uploads'),
    maxSizeMB: parseInt(process.env.MAX_FILE_SIZE_MB || '100', 10),
  },
  cors: {
    origin: (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost').split(','),
  },
  oa: {
    hmacSecret: process.env.OA_HMAC_SECRET || 'oa_hmac_secret',
    apiBaseUrl: process.env.OA_API_BASE_URL || '',
  },
  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM || 'plms@yuce.local',
  },
} as const;

export type AppConfig = typeof config;
