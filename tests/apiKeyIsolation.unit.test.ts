import assert from "node:assert/strict";
import { once } from "node:events";
import type { Server } from "node:http";
import test from "node:test";
import { BaseMcpServer } from "../src/core/BaseMcpServer.js";
import { ApiKeyManager } from "../src/utils/apiKeyManager.js";
import { getCurrentApiKey } from "../src/utils/requestContext.js";

interface Session {
  id?: string;
  nextRequestId: number;
}

test("HTTP sessions retain distinct API keys when a server default is configured", async () => {
  const previousDefault = process.env.GOOGLE_MAPS_API_KEY;
  ApiKeyManager.getInstance().setDefaultApiKey("GLOBAL_DEFAULT_TEST_KEY");

  const mcpServer = new BaseMcpServer("api-key-isolation-test", [
    {
      name: "current_api_key",
      description: "Returns the current request's test key",
      schema: {},
      action: async () => ({
        content: [{ type: "text" as const, text: getCurrentApiKey() ?? "<missing>" }],
      }),
    },
  ]);

  try {
    await mcpServer.startHttpServer(0, "127.0.0.1");
    const httpServer = (mcpServer as unknown as { httpServer: Server }).httpServer;
    if (!httpServer.listening) await once(httpServer, "listening");
    const address = httpServer.address();
    assert(address && typeof address !== "string");
    const endpoint = `http://127.0.0.1:${address.port}/mcp`;

    async function request(session: Session, method: string, params: object, key?: string) {
      const requestId = session.nextRequestId++;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
      };
      if (session.id) headers["mcp-session-id"] = session.id;
      if (key) headers["X-Google-Maps-API-Key"] = key;

      const response = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({ jsonrpc: "2.0", id: requestId, method, params }),
      });
      assert.equal(response.status, 200);
      session.id = response.headers.get("mcp-session-id") ?? session.id;
      const body = await response.text();
      const messages = body
        .split("\n")
        .filter((line) => line.startsWith("data: "))
        .map((line) => JSON.parse(line.slice(6)));
      return messages.find((message) => message.id === requestId);
    }

    async function initialize(session: Session, key?: string) {
      const result = await request(
        session,
        "initialize",
        {
          protocolVersion: "2025-03-26",
          capabilities: {},
          clientInfo: { name: "api-key-isolation-test", version: "1.0.0" },
        },
        key
      );
      assert(result?.result);
      assert(session.id);
    }

    async function currentKey(session: Session, key?: string): Promise<string> {
      const result = await request(session, "tools/call", { name: "current_api_key", arguments: {} }, key);
      assert.equal(result?.result?.isError, undefined);
      return result.result.content[0].text;
    }

    const alice: Session = { nextRequestId: 1 };
    const bob: Session = { nextRequestId: 1 };
    const defaultSession: Session = { nextRequestId: 1 };
    await Promise.all([
      initialize(alice, "ALICE_TEST_KEY"),
      initialize(bob, "BOB_TEST_KEY"),
      initialize(defaultSession),
    ]);
    assert.notEqual(alice.id, bob.id);

    assert.deepEqual(await Promise.all([currentKey(alice), currentKey(bob)]), ["ALICE_TEST_KEY", "BOB_TEST_KEY"]);
    assert.equal(await currentKey(defaultSession), "GLOBAL_DEFAULT_TEST_KEY");

    assert.equal(await currentKey(alice, "ALICE_ROTATED_TEST_KEY"), "ALICE_ROTATED_TEST_KEY");
    assert.deepEqual(await Promise.all([currentKey(alice), currentKey(bob)]), [
      "ALICE_ROTATED_TEST_KEY",
      "BOB_TEST_KEY",
    ]);
  } finally {
    await mcpServer.stopHttpServer();
    if (previousDefault === undefined) delete process.env.GOOGLE_MAPS_API_KEY;
    else process.env.GOOGLE_MAPS_API_KEY = previousDefault;
  }
});
