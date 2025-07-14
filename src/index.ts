#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express, { Request, Response } from "express";
import cors from "cors";
import { createMCPServer } from "./server.js";
import { randomUUID } from "crypto";
import { runStdioServer } from "./stdio.js";

const SESSION_ID_HEADER_NAME = "mcp-session-id";
const PORT = process.env.MCP_PORT ? parseInt(process.env.MCP_PORT, 10) : 3000;

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const transport = args.find((arg: string) => arg.startsWith('--transport='))?.split('=')[1] || 'stdio';
  return { transport };
}

class MCPServer {
  server: Server;
  transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};

  constructor(server: Server) {
    this.server = server;
  }

  async handleGetRequest(req: Request, res: Response) {
    const sessionId = req.headers[SESSION_ID_HEADER_NAME] as string | undefined;
    if (!sessionId || !this.transports[sessionId]) {
      res.status(400).json({ error: "Bad Request: invalid session ID or method." });
      return;
    }
    const transport = this.transports[sessionId];
    await transport.handleRequest(req, res);
    return;
  }

  async handlePostRequest(req: Request, res: Response) {
    const sessionId = req.headers[SESSION_ID_HEADER_NAME] as string | undefined;
    console.log('POST /mcp - sessionId:', sessionId, 'method:', req.body?.method, 'body keys:', Object.keys(req.body || {}));
    console.log('Available transports:', Object.keys(this.transports));
    let transport: StreamableHTTPServerTransport;
    try {
      if (!sessionId && req.body && req.body.method === "initialize") {
        console.log('Creating new transport for initialization');
        const newSessionId = randomUUID();
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => newSessionId,
        });
        await this.server.connect(transport);
        // Set the session ID header before handling the request
        res.setHeader(SESSION_ID_HEADER_NAME, newSessionId);
        await transport.handleRequest(req, res, req.body);
        // Store the transport with our generated session ID
        this.transports[newSessionId] = transport;
        console.log('Stored transport with sessionId:', newSessionId);
        return;
      }
      if (sessionId && this.transports[sessionId]) {
        console.log('Using existing transport for sessionId:', sessionId, 'method:', req.body?.method);
        transport = this.transports[sessionId];
        await transport.handleRequest(req, res, req.body);
        return;
      }
      if (sessionId && !this.transports[sessionId]) {
        console.log('Session ID provided but transport not found:', sessionId);
        console.log('Available session IDs:', Object.keys(this.transports));
      }
      console.log('Invalid request - no sessionId and not initialize method');
      res.status(400).json({ error: "Bad Request: invalid session ID or method." });
      return;
    } catch (error) {
      console.error("Error handling MCP request:", error);
      res.status(500).json({ error: "Internal server error." });
      return;
    }
  }

  async handleDeleteRequest(req: Request, res: Response) {
    const sessionId = req.headers[SESSION_ID_HEADER_NAME] as string | undefined;
    if (!sessionId || !this.transports[sessionId]) {
      res.status(400).send("Invalid or missing session ID");
      return;
    }
    try {
      const transport = this.transports[sessionId];
      await transport.handleRequest(req, res);
      delete this.transports[sessionId];
    } catch (error) {
      console.error("Error handling session termination:", error);
      if (!res.headersSent) {
        res.status(500).send("Error processing session termination");
      }
    }
  }
}

async function runHttpServer() {
  const app = express();
  app.use(express.json());
  app.use(cors({ origin: "*", exposedHeaders: [SESSION_ID_HEADER_NAME] }));

  const mcpServer = createMCPServer();
  const mcpHttpServer = new MCPServer(mcpServer);

  app.post("/mcp", async (req: Request, res: Response) => {
    await mcpHttpServer.handlePostRequest(req, res);
  });

  app.get("/mcp", async (req: Request, res: Response) => {
    await mcpHttpServer.handleGetRequest(req, res);
  });

  app.delete("/mcp", async (req: Request, res: Response) => {
    await mcpHttpServer.handleDeleteRequest(req, res);
  });

  app.listen(PORT, (error?: any) => {
    if (error) {
      console.error("Failed to start server:", error);
      process.exit(1);
    }
    console.log(`MCP Streamable HTTP Server listening on port ${PORT}`);
  });

  process.on("SIGINT", async () => {
    console.log("Shutting down server...");
    for (const sessionId in mcpHttpServer.transports) {
      try {
        await mcpHttpServer.transports[sessionId].close();
        delete mcpHttpServer.transports[sessionId];
      } catch (error) {
        console.error(`Error closing transport for session ${sessionId}:`, error);
      }
    }
    console.log("Server shutdown complete");
    process.exit(0);
  });
}

// Main entry point
async function main() {
  const { transport } = parseArgs();
  
  console.log(`Starting MCP Maps Server with transport: ${transport}`);
  
  if (transport === 'stdio') {
    await runStdioServer();
  } else if (transport === 'http') {
    await runHttpServer();
  } else {
    console.error(`Unknown transport: ${transport}. Supported transports: stdio, http`);
    process.exit(1);
  }
}

// Run the main function
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
