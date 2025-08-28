/**
 * Vercel Serverless Functions entry point
 * Converts Express app to serverless handler using serverless-http
 */
import serverless from 'serverless-http';
import app from './app';

// Convert Express app to serverless handler
const handler = serverless(app, {
  binary: ['image/*', 'audio/*', 'video/*', 'application/octet-stream']
});

export default handler;