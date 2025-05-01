import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

interface IConfig {
  env: string;
  port: number;
  mongoose: {
    url: string;
    options: {
      useNewUrlParser: boolean;
      useUnifiedTopology: boolean;
    };
  };
  jwt: {
    secret: string;
    expiresIn: string;
    refreshExpiresIn: string;
  };
  logs: string;
  rateLimit: {
    windowMs: number;
    max: number;
  };
  email: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
    from: string;
  };
}

const config: IConfig = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '9000', 10),
  mongoose: {
    url: process.env.MONGODB_URI || 'mongodb://localhost:27017/law-firm-management',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your_jwt_secret_key',
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '90d',
  },
  logs: process.env.LOG_LEVEL || 'debug',
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10), // limit each IP to 100 requests per windowMs
  },
  email: {
    host: process.env.SMTP_HOST || 'smtp.example.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER || 'user@example.com',
      pass: process.env.SMTP_PASSWORD || 'password',
    },
    from: process.env.EMAIL_FROM || 'Law Firm <no-reply@lawfirm.com>',
  },
};


export default config;