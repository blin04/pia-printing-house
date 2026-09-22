import 'dotenv/config'

// Read a required variable, or fail fast at startup if it is missing.
function required(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`missing required env variable: ${name}`)
  }
  return value
}

// Read an optional variable with a fallback.
function optional(name: string, fallback: string): string {
  return process.env[name] ?? fallback
}

export const env = {
  nodeEnv: optional('NODE_ENV', 'development'),
  isProduction: optional('NODE_ENV', 'development') === 'production',

  port: Number(optional('PORT', '4000')),

  mongoUri: optional('MONGODB_URI', 'mongodb://127.0.0.1:27017/stamparija'),

  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: optional('JWT_EXPIRES_IN', '1d'),

  clientUrl: optional('CLIENT_URL', 'http://localhost:4200'),

  resetTokenTtlMin: Number(optional('RESET_TOKEN_TTL_MIN', '5')),

  smtp: {
    host: optional('SMTP_HOST', ''),
    port: Number(optional('SMTP_PORT', '587')),
    user: optional('SMTP_USER', ''),
    pass: optional('SMTP_PASS', ''),
    from: optional('MAIL_FROM', 'Printing House <no-reply@printinghouse.rs>'),
  },

  stripeSecretKey: optional('STRIPE_SECRET_KEY', ''),
} as const

Object.freeze(env)
