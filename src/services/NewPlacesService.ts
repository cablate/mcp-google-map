import { PlacesClient } from "@googlemaps/places";
import { Logger } from "../index.js";

/**
 * Service class for the new Google Places API (New)
 * This replaces the legacy Places API implementation
 */
export class NewPlacesService {
  private client: PlacesClient;
  private readonly defaultLanguage: string = "en";

  constructor(apiKey?: string) {
    // Initialize the new Places API client
    this.client = new PlacesClient({
      apiKey: apiKey || process.env.GOOGLE_MAPS_API_KEY || "",
    });
    
    if (!apiKey && !process.env.GOOGLE_MAPS_API_KEY) {
      throw new Error("Google Maps API Key is required");
    }
  }

  /**
   * Get detailed information about a specific place using the new Places API
   * @param placeId - The Google Maps place ID
   * @returns Promise with place details
   */
  async getPlaceDetails(placeId: string) {
    try {
      // The new API uses a different format for place names
      // Place IDs need to be formatted as "places/{place_id}"
      const placeName = `places/${placeId}`;
      
      const [place] = await this.client.getPlace({
        name: placeName,
        languageCode: this.defaultLanguage,
        // Field mask to specify which fields to return
        // This is required for the new API to avoid billing for unused fields
      });

      // Transform the new API response to match the expected format
      return this.transformPlaceResponse(place);
    } catch (error: any) {
      Logger.error("Error in getPlaceDetails (New API):", error);
      throw new Error(`Failed to get place details for ${placeId}: ${this.extractErrorMessage(error)}`);
    }
  }

  /**
   * Transform the new Places API response to match the legacy API format
   * This ensures backward compatibility with existing code
   */
  private transformPlaceResponse(place: any) {
    return {
      name: place.displayName?.text || place.name || "",
      place_id: place.id || "",
      formatted_address: place.formattedAddress || "",
      geometry: {
        location: {
          lat: place.location?.latitude || 0,
          lng: place.location?.longitude || 0,
        },
      },
      rating: place.rating || 0,
      user_ratings_total: place.userRatingCount || 0,
      opening_hours: place.regularOpeningHours ? {
        open_now: this.isCurrentlyOpen(place.regularOpeningHours),
        weekday_text: this.formatOpeningHours(place.regularOpeningHours),
      } : undefined,
      formatted_phone_number: place.nationalPhoneNumber || "",
      website: place.websiteUri || "",
      price_level: place.priceLevel || 0,
      reviews: place.reviews?.map((review: any) => ({
        rating: review.rating || 0,
        text: review.text?.text || "",
        time: review.publishTime?.seconds || 0,
        author_name: review.authorAttribution?.displayName || "",
      })) || [],
      photos: place.photos?.map((photo: any) => ({
        photo_reference: photo.name || "",
        height: photo.heightPx || 0,
        width: photo.widthPx || 0,
      })) || [],
    };
  }

  /**
   * Check if a place is currently open based on opening hours
   */
  private isCurrentlyOpen(openingHours: any): boolean {
    if (!openingHours?.weekdayDescriptions) {
      return false;
    }

    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const currentTime = now.getHours() * 60 + now.getMinutes();

    // Convert Google's weekday format to our day index
    const dayMapping = {
      "SUNDAY": 0,
      "MONDAY": 1,
      "TUESDAY": 2,
      "WEDNESDAY": 3,
      "THURSDAY": 4,
      "FRIDAY": 5,
      "SATURDAY": 6,
    };

    // Find today's opening hours
    const todayHours = openingHours.weekdayDescriptions.find((desc: string) => {
      const dayName = Object.keys(dayMapping).find(day => 
        desc.toUpperCase().includes(day)
      );
      return dayName && dayMapping[dayName as keyof typeof dayMapping] === currentDay;
    });

    if (!todayHours) {
      return false;
    }

    // Simple check for "Closed" or "Open 24 hours"
    if (todayHours.toLowerCase().includes("closed")) {
      return false;
    }
    if (todayHours.toLowerCase().includes("24 hours")) {
      return true;
    }

    // For more complex time parsing, you might want to implement
    // a more sophisticated parser here
    return true; // Default to open if we can't determine
  }

  /**
   * Format opening hours for display
   */
  private formatOpeningHours(openingHours: any): string[] {
    return openingHours?.weekdayDescriptions || [];
  }

  /**
   * Extract a meaningful error message from various error types
   */
  private extractErrorMessage(error: any): string {
    // Extract Google API error message if available
    const apiError = error?.message || error?.details || error?.status;
    
    if (apiError) {
      return `${apiError}`;
    }

    // Fallback to standard error message
    return error instanceof Error ? error.message : String(error);
  }
}