import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { PlacesSearcher } from "./maps-tools/searchPlaces.js";
import {
  SEARCH_NEARBY_TOOL,
  GET_PLACE_DETAILS_TOOL,
  GEOCODE_TOOL,
  REVERSE_GEOCODE_TOOL,
  DISTANCE_MATRIX_TOOL,
  DIRECTIONS_TOOL,
  ELEVATION_TOOL
} from "./maps-tools/mapsTools.js";

export class StreamableHTTPServerTransport {
  private sessionId: string | null = null;
  public onclose: (() => void) | null = null;
  private server: Server | null = null;
  private eventQueue: any[] = [];
  private isConnected = false;
  private onMessageHandler: ((message: any) => void) | null = null;
  public options: {
    sessionIdGenerator: () => string;
    onsessioninitialized?: (sessionId: string) => void;
  };

  constructor(options: {
    sessionIdGenerator: () => string;
    onsessioninitialized?: (sessionId: string) => void;
  }) {
    this.options = options;
  }

  async connect(server: Server) {
    console.log('StreamableHTTPServerTransport.connect() called');
    this.server = server;
    this.sessionId = this.options.sessionIdGenerator();
    this.isConnected = true;
    console.log('Transport connected - server:', !!this.server, 'isConnected:', this.isConnected);
    this.onMessage((message) => {
      console.log('Received message:', message);
    });
    if (this.options.onsessioninitialized) {
      this.options.onsessioninitialized(this.sessionId);
    }
  }

  async start() {
    console.log('StreamableHTTPServerTransport.start() called');
    this.isConnected = true;
    console.log('StreamableHTTPServerTransport started - isConnected:', this.isConnected);
  }

  async stop() {
    this.isConnected = false;
    if (this.onclose) this.onclose();
    console.log('StreamableHTTPServerTransport stopped');
  }

  async sendMessage(message: any) {
    if (!this.isConnected) {
      throw new Error('Transport not connected');
    }
    this.eventQueue.push(message);
    console.log('Message queued for SSE delivery:', message);
  }

  onMessage(handler: (message: any) => void) {
    this.onMessageHandler = handler;
  }

  async handleRequest(req: Request, res: Response, body?: any) {
    console.log('handleRequest called - server:', !!this.server, 'isConnected:', this.isConnected);
    if (!this.server || !this.isConnected) {
      console.error('Connection check failed - server:', !!this.server, 'isConnected:', this.isConnected);
      throw new Error('Transport not connected to server');
    }
    if (req.method === 'GET') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      });
      while (this.eventQueue.length > 0) {
        const event = this.eventQueue.shift();
        res.write(`data: ${JSON.stringify(event)}\n\n`);
      }
      const keepAlive = setInterval(() => {
        res.write(': keepalive\n\n');
      }, 30000);
      req.on('close', () => {
        clearInterval(keepAlive);
        if (this.onclose) this.onclose();
      });
      return;
    }
    if (req.method === 'POST') {
      try {
        const requestBody = body || req.body;
        if (this.onMessageHandler) {
          this.onMessageHandler(requestBody);
        }
        if (requestBody.method === 'initialize') {
          const response = {
            jsonrpc: '2.0',
            id: requestBody.id,
            result: {
              protocolVersion: '2024-11-05',
              capabilities: {
                tools: {},
                prompts: {},
                resources: {},
                logging: {}
              },
              serverInfo: {
                name: "mcp-server/maps_executor",
                version: "0.0.1"
              }
            }
          };
          console.log('Sending initialize response:', JSON.stringify(response, null, 2));
          res.json(response);
          return;
        }
        if (requestBody.method === 'tools/list') {
          const response = {
            jsonrpc: '2.0',
            id: requestBody.id,
            result: {
              tools: [
                SEARCH_NEARBY_TOOL,
                GET_PLACE_DETAILS_TOOL,
                GEOCODE_TOOL,
                REVERSE_GEOCODE_TOOL,
                DISTANCE_MATRIX_TOOL,
                DIRECTIONS_TOOL,
                ELEVATION_TOOL
              ]
            }
          };
          console.log('Sending tools/list response:', JSON.stringify(response, null, 2));
          res.json(response);
          return;
        }
        if (requestBody.method === 'notifications/initialized') {
          console.log('Received client initialized notification');
          const notification = {
            jsonrpc: '2.0',
            method: 'notifications/initialized',
            params: {}
          };
          this.eventQueue.push(notification);
          console.log('Queued server initialized notification for SSE delivery');
          const toolsNotification = {
            jsonrpc: '2.0',
            method: 'tools/list',
            params: {
              tools: [
                SEARCH_NEARBY_TOOL,
                GET_PLACE_DETAILS_TOOL,
                GEOCODE_TOOL,
                REVERSE_GEOCODE_TOOL,
                DISTANCE_MATRIX_TOOL,
                DIRECTIONS_TOOL,
                ELEVATION_TOOL
              ]
            }
          };
          this.eventQueue.push(toolsNotification);
          console.log('Queued tools list notification for SSE delivery');
          res.status(200).send('OK');
          return;
        }
        if (requestBody.method === 'tools/call') {
          const result = await this.handleToolCall(requestBody.params);
          const response = {
            jsonrpc: '2.0',
            id: requestBody.id,
            result
          };
          console.log('Sending tools/call response:', JSON.stringify(response, null, 2));
          res.json(response);
          return;
        }
        const errorResponse = {
          jsonrpc: '2.0',
          id: requestBody.id,
          error: {
            code: -32601,
            message: 'Method not found'
          }
        };
        console.log('Sending method not found response:', JSON.stringify(errorResponse, null, 2));
        res.json(errorResponse);
      } catch (error) {
        console.error('Error handling MCP request:', error);
        res.status(500).json({
          jsonrpc: '2.0',
          id: req.body?.id || null,
          error: {
            code: -32603,
            message: 'Internal server error'
          }
        });
      }
    }
    if (req.method === 'DELETE') {
      this.isConnected = false;
      if (this.onclose) this.onclose();
      res.status(200).send('Session terminated');
    }
  }

  private async handleToolCall(params: any) {
    const { name, arguments: args } = params;
    const placesSearcher = new PlacesSearcher();
    try {
      if (name === "search_nearby") {
        const { center, keyword, radius, openNow, minRating } = args;
        const result = await placesSearcher.searchNearby({
          center,
          keyword,
          radius,
          openNow,
          minRating,
        });
        if (!result.success) {
          return {
            content: [{ type: "text", text: result.error || "搜尋失敗" }],
            isError: true,
          };
        }
        return {
          content: [
            {
              type: "text",
              text: `location: ${JSON.stringify(result.location, null, 2)}\n` + JSON.stringify(result.data, null, 2),
            },
          ],
          isError: false,
        };
      }
      if (name === "get_place_details") {
        const { placeId } = args;
        const result = await placesSearcher.getPlaceDetails(placeId);
        if (!result.success) {
          return {
            content: [{ type: "text", text: result.error || "獲取詳細資訊失敗" }],
            isError: true,
          };
        }
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result.data, null, 2),
            },
          ],
          isError: false,
        };
      }
      if (name === "maps_geocode") {
        const { address } = args;
        const result = await placesSearcher.geocode(address);
        if (!result.success) {
          return {
            content: [{ type: "text", text: result.error || "地址轉換座標失敗" }],
            isError: true,
          };
        }
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result.data, null, 2),
            },
          ],
          isError: false,
        };
      }
      if (name === "maps_reverse_geocode") {
        const { latitude, longitude } = args;
        const result = await placesSearcher.reverseGeocode(latitude, longitude);
        if (!result.success) {
          return {
            content: [{ type: "text", text: result.error || "座標轉換地址失敗" }],
            isError: true,
          };
        }
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result.data, null, 2),
            },
          ],
          isError: false,
        };
      }
      if (name === "maps_distance_matrix") {
        const { origins, destinations, mode } = args;
        const result = await placesSearcher.calculateDistanceMatrix(origins, destinations, mode || "driving");
        if (!result.success) {
          return {
            content: [{ type: "text", text: result.error || "計算距離矩陣失敗" }],
            isError: true,
          };
        }
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result.data, null, 2),
            },
          ],
          isError: false,
        };
      }
      if (name === "maps_directions") {
        const { origin, destination, mode, arrival_time, departure_time } = args;
        const result = await placesSearcher.getDirections(origin, destination, mode, departure_time, arrival_time);
        if (!result.success) {
          return {
            content: [{ type: "text", text: result.error || "獲取路線指引失敗" }],
            isError: true,
          };
        }
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result.data, null, 2),
            },
          ],
          isError: false,
        };
      }
      if (name === "maps_elevation") {
        const { locations } = args;
        const result = await placesSearcher.getElevation(locations);
        if (!result.success) {
          return {
            content: [{ type: "text", text: result.error || "獲取海拔數據失敗" }],
            isError: true,
          };
        }
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result.data, null, 2),
            },
          ],
          isError: false,
        };
      }
      return {
        content: [{ type: "text", text: `錯誤：未知的工具 ${name}` }],
        isError: true,
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `錯誤：${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  async close() {
    this.isConnected = false;
    if (this.onclose) this.onclose();
  }
} 