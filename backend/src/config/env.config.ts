import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load .env file from root, backend, or current working directory
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'backend/.env') });

// Support both MONGO_URI and MONGODB_URI
const resolvedMongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || '';
if (!process.env.MONGO_URI && resolvedMongoUri) {
  process.env.MONGO_URI = resolvedMongoUri;
}

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().default(5000),
    API_PREFIX: z.string().default('/api/v1'),
    CLIENT_URL: z.string().default('http://localhost:3000'),

    // Database: accepts MONGO_URI or MONGODB_URI
    MONGO_URI: z.string().min(1, 'MONGO_URI or MONGODB_URI is required'),
    MONGODB_URI: z.string().optional(),

    // Auth
    JWT_ACCESS_SECRET: z.string().min(16, 'JWT_ACCESS_SECRET must be at least 16 characters'),
    JWT_ACCESS_EXPIRY: z.string().default('15m'),
    JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET must be at least 16 characters'),
    JWT_REFRESH_EXPIRY: z.string().default('7d'),
    COOKIE_SECRET: z.string().default('hrms-default-cookie-secret-key-32ch'),

    // Super Admin Initial Credentials
    SUPER_ADMIN_EMAIL: z.string().email().default('superadmin@hrms.local'),
    SUPER_ADMIN_PASSWORD: z.string().min(8).default('SuperAdmin@12345'),
    SUPER_ADMIN_FIRSTNAME: z.string().default('Super'),
    SUPER_ADMIN_LASTNAME: z.string().default('Admin'),

    // SMTP Mailer
    SMTP_HOST: z.string().optional().default('smtp.mailtrap.io'),
    SMTP_PORT: z.coerce.number().optional().default(2525),
    SMTP_USER: z.string().optional().default(''),
    SMTP_PASS: z.string().optional().default(''),
    SMTP_FROM: z.string().optional().default('noreply@hrms.local'),

    // Upload
    UPLOAD_DIR: z.string().default('uploads'),
    MAX_FILE_SIZE_MB: z.coerce.number().default(5),

    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000), // 15 mins
    RATE_LIMIT_MAX: z.coerce.number().default(1000),
  })
  .refine(
    (data) => {
      if (data.NODE_ENV === 'production') {
        return data.JWT_ACCESS_SECRET.length >= 32 && data.JWT_REFRESH_SECRET.length >= 32;
      }
      return true;
    },
    {
      message:
        'In production, JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be at least 32 characters long',
      path: ['JWT_ACCESS_SECRET'],
    },
  );

const parseEnv = () => {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error(
      '❌ Invalid environment variables:',
      JSON.stringify(parsed.error.format(), null, 2),
    );
    throw new Error('Invalid environment configuration');
  }
  return parsed.data;
};

export const env = parseEnv();
export type Environment = z.infer<typeof envSchema>;
