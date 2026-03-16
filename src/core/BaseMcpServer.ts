import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import { isInitializeRequest, ToolAnnotations } from "@modelcontextprotocol/sdk/types.js";
import express, { Request, Response } from "express";
import { Server } from "http";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { Logger } from "../index.js";
import { ApiKeyManager } from "../utils/apiKeyManager.js";
import { runWithContext } from "../utils/requestContext.js";

const VERSION = "0.0.1";

// Define a structure for tool configurations
export interface ToolConfig {
  name: string;
  description: string;
  schema: Record<string, z.ZodTypeAny>;
  annotations?: ToolAnnotations;
  action: (params: any) => Promise<any>;
}

export interface SessionContext {
  apiKey?: string;
  transport: StreamableHTTPServerTransport;
}

export class BaseMcpServer {
  protected readonly server: McpServer;
  private sessions: { [sessionId: string]: SessionContext } = {};
  private httpServer: Server | null = null;
  private serverName: string;
  private tools: ToolConfig[];

  constructor(name: string, tools: ToolConfig[]) {
    this.serverName = name;
    this.tools = tools;
    this.server = this.createMcpServer();
  }

  private createMcpServer(): McpServer {
    const server = new McpServer(
      { name: this.serverName, version: VERSION },
      { capabilities: { logging: {}, tools: {} } }
    );
    this.tools.forEach((tool) => {
      server.registerTool(
        tool.name,
        {
          description: tool.description,
          inputSchema: z.object(tool.schema),
          annotations: tool.annotations,
        },
        async (params: any) => tool.action(params)
      );
    });
    return server;
  }

  async connect(transport: Transport): Promise<void> {
    await this.server.connect(transport);

    // Ensure stdout is only used for JSON messages
    const originalStdoutWrite = process.stdout.write.bind(process.stdout);
    process.stdout.write = (chunk: any, encoding?: any, callback?: any) => {
      if (typeof chunk === "string" && !chunk.startsWith("{")) {
        return true; // Silently skip non-JSON messages
      }
      return originalStdoutWrite(chunk, encoding, callback);
    };

    Logger.log(`${this.serverName} connected and ready to process requests`);
  }

  async startHttpServer(port: number): Promise<void> {
    const app = express();
    app.use(express.json());

    // Handle POST requests for client-to-server communication
    app.post("/mcp", async (req: Request, res: Response) => {
      const sessionId = req.headers["mcp-session-id"] as string | undefined;
      let context: SessionContext;

      // Extract API key from headers if provided
      const apiKeyManager = ApiKeyManager.getInstance();
      const requestApiKey = apiKeyManager.getApiKey(req);

      Logger.log(`${this.serverName} API key received from request context`);

      if (sessionId && this.sessions[sessionId]) {
        // Reuse existing session
        context = this.sessions[sessionId];
        // Update API key if provided in this request
        if (requestApiKey) {
          context.apiKey = requestApiKey;
        }
      } else if (!sessionId && isInitializeRequest(req.body)) {
        // New initialization request
        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          onsessioninitialized: (sessionId) => {
            this.sessions[sessionId] = context;
            Logger.log(`[${this.serverName}] New session initialized: ${sessionId}`);
          },
          // DNS rebinding protection is disabled by default for backwards compatibility
          // For production use, enable this:
          // enableDnsRebindingProtection: true,
          // allowedHosts: ['127.0.0.1'],
        });

        // Create session context
        context = {
          transport,
          apiKey: requestApiKey,
        };

        // Clean up transport when closed
        transport.onclose = () => {
          if (transport.sessionId) {
            delete this.sessions[transport.sessionId];
            Logger.log(`[${this.serverName}] Session closed: ${transport.sessionId}`);
          }
        };

        const sessionServer = this.createMcpServer();
        await sessionServer.connect(transport);
      } else {
        // Invalid request
        res.status(400).json({
          jsonrpc: "2.0",
          error: {
            code: -32000,
            message: "Bad Request: No valid session ID provided",
          },
          id: null,
        });
        return;
      }

      // Run the request handler with the API key in context
      await runWithContext({ apiKey: context.apiKey, sessionId }, async () => {
        await context.transport.handleRequest(req, res, req.body);
      });
    });

    // Reusable handler for GET and DELETE requests
    const handleSessionRequest = async (req: Request, res: Response) => {
      const sessionId = req.headers["mcp-session-id"] as string | undefined;
      if (!sessionId || !this.sessions[sessionId]) {
        res.status(400).send("Invalid or missing session ID");
        return;
      }

      const context = this.sessions[sessionId];

      // Check for updated API key in headers
      const apiKeyManager = ApiKeyManager.getInstance();
      const requestApiKey = apiKeyManager.getApiKey(req);
      if (requestApiKey) {
        context.apiKey = requestApiKey;
      }

      // Run the request handler with the API key in context
      await runWithContext({ apiKey: context.apiKey, sessionId }, async () => {
        await context.transport.handleRequest(req, res);
      });
    };

    // Handle GET requests for server-to-client notifications via SSE
    app.get("/mcp", handleSessionRequest);

    // Handle DELETE requests for session termination
    app.delete("/mcp", handleSessionRequest);

    this.httpServer = app.listen(port, () => {
      Logger.log(`[${this.serverName}] HTTP server listening on port ${port}`);
      Logger.log(`[${this.serverName}] MCP endpoint available at http://localhost:${port}/mcp`);
    });
  }

  async startStdio(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.connect(transport);
  }

  async stopHttpServer(): Promise<void> {
    if (!this.httpServer) {
      // Changed to Logger.warn and return, as throwing an error might be too harsh if called multiple times.
      Logger.error(`[${this.serverName}] HTTP server is not running or already stopped.`);
      return;
    }

    return new Promise((resolve, reject) => {
      this.httpServer!.close((err: Error | undefined) => {
        if (err) {
          Logger.error(`[${this.serverName}] Error stopping HTTP server:`, err);
          reject(err);
          return;
        }
        Logger.log(`[${this.serverName}] HTTP server stopped.`);
        this.httpServer = null;
        const closingSessions = Object.values(this.sessions).map((context) => {
          // Clean up session
          if (context.transport.sessionId) {
            delete this.sessions[context.transport.sessionId];
          }
          return Promise.resolve();
        });
        Promise.all(closingSessions)
          .then(() => {
            Logger.log(`[${this.serverName}] All transports closed.`);
            resolve();
          })
          .catch((transportCloseErr) => {
            // This catch might be redundant if individual transport close errors are handled
            Logger.error(`[${this.serverName}] Error during bulk transport closing:`, transportCloseErr);
            reject(transportCloseErr);
          });
      });
    });
  }
}
