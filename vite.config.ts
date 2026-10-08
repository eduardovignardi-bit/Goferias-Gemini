import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { loadEnv, type Plugin } from 'vite';
import { fileURLToPath, URL } from 'node:url';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import chatHandler from './api/chat';
import pricingSuggestionHandler from './api/pricing-suggestion';

type ApiHandler = (request: VercelRequest, response: VercelResponse) => unknown;

function localApi(route: string, handler: ApiHandler): Plugin {
  return {
    name: `local-api-${route}`,
    configureServer(server) {
      server.middlewares.use(`/api/${route}`, (request, response) => {
        if (request.method !== 'POST') {
          response.statusCode = 405;
          response.setHeader('Allow', 'POST');
          response.setHeader('Content-Type', 'application/json');
          response.end(JSON.stringify({ error: 'Método não permitido.' }));
          return;
        }

        const chunks: Buffer[] = [];
        let bodyLength = 0;

        request.on('data', (chunk: Buffer | string) => {
          const buffer = typeof chunk === 'string' ? Buffer.from(chunk) : chunk;
          bodyLength += buffer.length;
          if (bodyLength > 100_000) {
            response.statusCode = 413;
            response.end(JSON.stringify({ error: 'A conversa enviada é muito longa.' }));
            request.destroy();
            return;
          }
          chunks.push(buffer);
        });

        request.on('end', () => {
          if (response.writableEnded) return;

          let body: unknown;
          try {
            body = JSON.parse(Buffer.concat(chunks).toString('utf-8'));
          } catch {
            response.statusCode = 400;
            response.setHeader('Content-Type', 'application/json');
            response.end(JSON.stringify({ error: 'O corpo da requisição deve ser JSON válido.' }));
            return;
          }

          const vercelResponse = {
            setHeader(name: string, value: string | number | readonly string[]) {
              response.setHeader(name, value);
              return this;
            },
            status(code: number) {
              response.statusCode = code;
              return this;
            },
            json(payload: unknown) {
              response.setHeader('Content-Type', 'application/json');
              response.end(JSON.stringify(payload));
              return this;
            },
          };

          void handler(
            Object.assign(request, { body }) as VercelRequest,
            vercelResponse as unknown as VercelResponse,
          );
        });
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  Object.assign(process.env, loadEnv(mode, process.cwd(), ''));

  return {
    plugins: [react(), localApi('chat', chatHandler), localApi('pricing-suggestion', pricingSuggestionHandler)],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
  };
});
