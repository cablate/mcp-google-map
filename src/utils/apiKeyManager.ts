import { Request } from "express";

export class ApiKeyManager {
  private static instance: ApiKeyManager;
  private defaultApiKey: string | undefined;

  private constructor() {
    // Initialize with environment variable or command-line provided key
    this.defaultApiKey = process.env.GOOGLE_MAPS_API_KEY;
  }

  public static getInstance(): ApiKeyManager {
    if (!ApiKeyManager.instance) {
      ApiKeyManager.instance = new ApiKeyManager();
    }
    return ApiKeyManager.instance;
  }

  /**
   * Set the default API key (from command line or environment)
   */
  public setDefaultApiKey(key: string): void {
    this.defaultApiKey = key;
    process.env.GOOGLE_MAPS_API_KEY = key;
  }

  /**
   * Get API key with priority:
   * 1. HTTP Header (X-Google-Maps-API-Key or Authorization: Bearer)
   * 2. Session-specific API key
   * 3. Default API key (command line or environment)
   */
  public getApiKey(req?: Request, sessionApiKey?: string): string | undefined {
    if (req) {
      // Check for API key in headers
      const headerApiKey = req.headers['x-google-maps-api-key'] as string;
      if (headerApiKey) {
        return headerApiKey;
      }

      // Check for Bearer token in Authorization header
      const authHeader = req.headers['authorization'] as string;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
      }
    }

    // Use session-specific API key if available
    if (sessionApiKey) {
      return sessionApiKey;
    }

    // Fall back to default API key
    return this.defaultApiKey;
  }

  /**
   * Check if any API key is available
   */
  public hasApiKey(req?: Request, sessionApiKey?: string): boolean {
    return !!this.getApiKey(req, sessionApiKey);
  }

  /**
   * Validate API key format (basic validation)
   */
  public isValidApiKeyFormat(key: string): boolean {
    // Google Maps API keys are typically 39 characters long
    // and contain alphanumeric characters, hyphens, and underscores
    return /^[A-Za-z0-9_-]{20,50}$/.test(key);
  }
}