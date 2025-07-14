import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createMCPServer } from "./server.js";

export async function runStdioServer() {
  try {
    const server = createMCPServer();
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("MCP Maps Server started (stdio mode)");
  } catch (error) {
    console.error("Server startup failed:", error);
    process.exit(1);
  }
} 