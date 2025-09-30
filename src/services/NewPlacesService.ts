import { PlacesClient } from "@googlemaps/places";
import { Logger } from "../index.js";

export class NewPlacesService {
  private client: PlacesClient;
  private readonly defaultLanguage: string = "en";

  constructor(apiKey?: string) {
    this.client = new PlacesClient({
      apiKey: apiKey || process.env.GOOGLE_MAPS_API_KEY || "",
    });
    
    if (!apiKey && !process.env.GOOGLE_MAPS_API_KEY) {
      throw new Error("Google Maps API Key is required");
    }
  }

  async getPlaceDetails(placeId: string) {
    try {
      const placeName = `places/${placeId}`;
      
      const [place] = await this.client.getPlace({
        name: placeName,
        languageCode: this.defaultLanguage,
      });

      return this.transformPlaceResponse(place);
    } catch (error: any) {
      Logger.error("Error in getPlaceDetails (New API):", error);
      throw new Error(`Failed to get place details for ${placeId}: ${this.extractErrorMessage(error)}`);
    }
  }

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

  private isCurrentlyOpen(openingHours: any): boolean {
    if (!openingHours?.weekdayDescriptions) {
      return false;
    }

    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const dayMapping = {
      "SUNDAY": 0,
      "MONDAY": 1,
      "TUESDAY": 2,
      "WEDNESDAY": 3,
      "THURSDAY": 4,
      "FRIDAY": 5,
      "SATURDAY": 6,
    };

    const todayHours = openingHours.weekdayDescriptions.find((desc: string) => {
      const dayName = Object.keys(dayMapping).find(day => 
        desc.toUpperCase().includes(day)
      );
      return dayName && dayMapping[dayName as keyof typeof dayMapping] === currentDay;
    });

    if (!todayHours) {
      return false;
    }

    if (todayHours.toLowerCase().includes("closed")) {
      return false;
    }
    if (todayHours.toLowerCase().includes("24 hours")) {
      return true;
    }

    return true;
  }

  private formatOpeningHours(openingHours: any): string[] {
    return openingHours?.weekdayDescriptions || [];
  }

  private extractErrorMessage(error: any): string {
    const apiError = error?.message || error?.details || error?.status;
    
    if (apiError) {
      return `${apiError}`;
    }

    return error instanceof Error ? error.message : String(error);
  }
}