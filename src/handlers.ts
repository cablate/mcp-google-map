import { Request, Response } from 'express';
import { StreamableHTTPServerTransport } from './StreamableHttp.js';
import { randomUUID } from 'node:crypto';

// Handler for POST /mcp
export function createMcpPostHandler(transports: { [sessionId: string]: StreamableHTTPServerTransport }, getServer: () => any) {
  return async (req: Request, res: Response) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    if (sessionId) {
      console.log(`Received MCP request for session: ${sessionId}`);
    } else {
      console.log('Request body:', req.body);
    }

    try {
      let transport: StreamableHTTPServerTransport;
      if (sessionId && transports[sessionId]) {
        // Reuse existing transport
        transport = transports[sessionId];
      } else if (!sessionId && req.body) {
        // Accept any request without session ID for initial connection
        console.log('Creating new transport for request without session ID:', req.body.method);
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          onsessioninitialized: (sid) => {
            console.log(`Session initialized with ID: ${sid}`);
            transports[sid] = transport;
          }
        });
        transport.onclose = () => {
          const sid = (transport as any).sessionId;
          if (sid && transports[sid]) {
            console.log(`Transport closed for session ${sid}, removing from transports map`);
            delete transports[sid];
          }
        };
        const server = getServer();
        (transport as any).server = server;
        (transport as any).sessionId = transport.options.sessionIdGenerator();
        (transport as any).isConnected = true;
        console.log('Manual connection setup - server:', !!(transport as any).server, 'isConnected:', (transport as any).isConnected);
        await server.connect(transport);
        await transport.start();
        await transport.handleRequest(req, res, req.body);
        return;
      } else {
        res.status(400).json({
          jsonrpc: '2.0',
          error: { code: -32000, message: 'Bad Request: No valid session ID provided' },
          id: null,
        });
        return;
      }
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      console.error('Error handling MCP request:', error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: { code: -32603, message: 'Internal server error' },
          id: null,
        });
      }
    }
  };
}

// Handler for GET /mcp (SSE)
export function createMcpGetHandler(transports: { [sessionId: string]: StreamableHTTPServerTransport }, getServer: () => any) {
  return async (req: Request, res: Response) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    if (!sessionId) {
      console.log('SSE connection request without session ID - creating new session');
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (sid) => {
          console.log(`SSE Session initialized with ID: ${sid}`);
          transports[sid] = transport;
        }
      });
      const server = getServer();
      (transport as any).server = server;
      (transport as any).sessionId = transport.options.sessionIdGenerator();
      (transport as any).isConnected = true;
      await server.connect(transport);
      await transport.start();
      transports[(transport as any).sessionId!] = transport;
      transport.onclose = () => {
        const sid = (transport as any).sessionId;
        if (sid && transports[sid]) {
          console.log(`SSE Transport closed for session ${sid}, removing from transports map`);
          delete transports[sid];
        }
      };
      await transport.handleRequest(req, res);
      return;
    }
    if (!transports[sessionId]) {
      res.status(400).send('Invalid or missing session ID');
      return;
    }
    const lastEventId = req.headers['last-event-id'] as string | undefined;
    if (lastEventId) {
      console.log(`Client reconnecting with Last-Event-ID: ${lastEventId}`);
    } else {
      console.log(`Establishing new SSE stream for session ${sessionId}`);
    }
    const transport = transports[sessionId];
    await transport.handleRequest(req, res);
  };
}

// Handler for DELETE /mcp (session termination)
export function createMcpDeleteHandler(transports: { [sessionId: string]: StreamableHTTPServerTransport }) {
  return async (req: Request, res: Response) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    if (!sessionId || !transports[sessionId]) {
      res.status(400).send('Invalid or missing session ID');
      return;
    }
    console.log(`Received session termination request for session ${sessionId}`);
    try {
      const transport = transports[sessionId];
      await transport.handleRequest(req, res);
    } catch (error) {
      console.error('Error handling session termination:', error);
      if (!res.headersSent) {
        res.status(500).send('Error processing session termination');
      }
    }
  };
} 