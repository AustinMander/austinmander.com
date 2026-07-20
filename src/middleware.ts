import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/lib/env';

// Generate a nonce for Content Security Policy
function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Buffer.from(array).toString('base64');
}

// Security headers configuration
const securityHeaders = {
  // Prevent clickjacking attacks
  'X-Frame-Options': 'DENY',
  
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  
  // Enable XSS protection (legacy browsers)
  'X-XSS-Protection': '1; mode=block',
  
  // Control referrer information
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Permissions Policy (formerly Feature Policy)
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  
  // Strict Transport Security (HSTS)
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  
  // DNS Prefetch Control
  'X-DNS-Prefetch-Control': 'on',
  
  // Download Options
  'X-Download-Options': 'noopen',
  
  // Permitted Cross-Domain Policies
  'X-Permitted-Cross-Domain-Policies': 'none',
};

// Content Security Policy configuration
function getCSP(nonce: string): string {
  const isDevelopment = env.NODE_ENV === 'development';
  
  const directives = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      `'nonce-${nonce}'`,
      "'strict-dynamic'",
      isDevelopment && "'unsafe-eval'", // Allow eval in development for HMR
      'https://www.googletagmanager.com',
      'https://www.google-analytics.com',
      'https://plausible.io',
      'https://vercel.live',
    ].filter(Boolean),
    'style-src': [
      "'self'",
      `'nonce-${nonce}'`,
      "'unsafe-inline'", // Required for inline styles from libraries
      'https://fonts.googleapis.com',
    ],
    'img-src': [
      "'self'",
      'data:',
      'blob:',
      'https://images.unsplash.com',
      'https://*.vercel.app',
      'https://austinmander.com',
      'https://www.google-analytics.com',
      'https://plausible.io',
    ],
    'font-src': [
      "'self'",
      'data:',
      'https://fonts.gstatic.com',
    ],
    'connect-src': [
      "'self'",
      'https://www.google-analytics.com',
      'https://plausible.io',
      'https://vitals.vercel-insights.com',
      'https://*.supabase.co',
      'wss://*.supabase.co',
      isDevelopment && 'ws://localhost:*',
      isDevelopment && 'http://localhost:*',
    ].filter(Boolean),
    'media-src': ["'self'"],
    'object-src': ["'none'"],
    'child-src': ["'self'"],
    'frame-src': [
      "'self'",
      'https://calendly.com',
    ],
    'worker-src': ["'self'", 'blob:'],
    'form-action': ["'self'"],
    'base-uri': ["'self'"],
    'manifest-src': ["'self'"],
    'upgrade-insecure-requests': !isDevelopment ? [] : undefined,
  };

  return Object.entries(directives)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => {
      const values = Array.isArray(value) ? value : [value];
      return values.length > 0 ? `${key} ${values.join(' ')}` : '';
    })
    .filter(Boolean)
    .join('; ');
}

// Request size limits
const MAX_REQUEST_SIZE = 10 * 1024 * 1024; // 10MB

// Rate limiting tracking (in-memory for now, use Redis in production)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

// Clean up old rate limit entries
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of requestCounts.entries()) {
    if (value.resetTime < now) {
      requestCounts.delete(key);
    }
  }
}, 60000); // Clean every minute

// Simple rate limiting (more sophisticated version uses Redis)
function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const windowMs = 60000; // 1 minute
  const maxRequests = 100; // 100 requests per minute
  
  const record = requestCounts.get(identifier);
  
  if (!record || record.resetTime < now) {
    requestCounts.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    });
    return true;
  }
  
  if (record.count >= maxRequests) {
    return false;
  }
  
  record.count++;
  return true;
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const nonce = generateNonce();
  
  // Store nonce in response for use in pages
  response.headers.set('X-Nonce', nonce);
  
  // Apply security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  // Apply Content Security Policy
  // (skipped for the static byline homepage — it is fully inline by design)
  const csp = getCSP(nonce);
  const p = request.nextUrl.pathname;
  if (p !== '/' && p !== '/byline.html') {
    response.headers.set('Content-Security-Policy', csp);
  }
  
  // Request validation for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Check request size
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > MAX_REQUEST_SIZE) {
      return NextResponse.json(
        { error: 'Request too large' },
        { status: 413 }
      );
    }
    
    // Simple rate limiting (use Redis in production)
    const forwarded = request.headers.get('x-forwarded-for');
    const identifier = forwarded ? forwarded.split(',')[0].trim() : 
                      request.headers.get('x-real-ip') ||
                      request.headers.get('cf-connecting-ip') ||
                      'unknown';
    if (!checkRateLimit(identifier)) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }
    
    // Validate content type for POST/PUT/PATCH requests
    const method = request.method;
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      const contentType = request.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        return NextResponse.json(
          { error: 'Content-Type must be application/json' },
          { status: 400 }
        );
      }
    }
    
    // CORS headers for API routes
    response.headers.set('Access-Control-Allow-Origin', env.NEXT_PUBLIC_SITE_URL);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.headers.set('Access-Control-Max-Age', '86400');
  }
  
  // Add security headers for authentication pages
  if (request.nextUrl.pathname.startsWith('/admin')) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
  }
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};