import { PlacesClient } from "@googlemaps/places";
import { Logger } from "../index.js";

export class NewPlacesService {
  private client: PlacesClient;
  private readonly defaultLanguage: string = "en";
  private readonly placeFieldMask: string = ["displayName", "name", "id", "formattedAddress", "location", "utcOffsetMinutes", "regularOpeningHours.periods", "regularOpeningHours.weekdayDescriptions", "currentOpeningHours.openNow", "nationalPhoneNumber", "websiteUri", "priceLevel", "rating", "userRatingCount", "reviews.rating", "reviews.text", "reviews.publishTime", "reviews.authorAttribution.displayName", "photos.heightPx", "photos.widthPx", "photos.name"].join(",");
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

      const [place] = await this.client.getPlace(
        {
          name: placeName,
          languageCode: this.defaultLanguage,
        },
        {
          otherArgs: {
            headers: {
              "X-Goog-FieldMask": this.placeFieldMask,
            },
          },
        }
      );

      return this.transformPlaceResponse(place);
    } catch (error: any) {
      Logger.error("Error in getPlaceDetails (New API):", error);
      throw new Error(`Failed to get place details for ${placeId}: ${this.extractErrorMessage(error)}`);
    }
  }

  private transformPlaceResponse(place: any) {
    return {
      name: place.displayName?.text || place.name || "",
      place_id: this.extractLegacyPlaceId(place),
      formatted_address: place.formattedAddress || "",
      geometry: {
        location: {
          lat: place.location?.latitude || 0,
          lng: place.location?.longitude || 0,
        },
      },
      rating: place.rating || 0,
      user_ratings_total: place.userRatingCount || 0,
      opening_hours: place.regularOpeningHours
        ? {
            open_now: this.isCurrentlyOpen(place.regularOpeningHours, place.utcOffsetMinutes, place.currentOpeningHours),
            weekday_text: this.formatOpeningHours(place.regularOpeningHours),
          }
        : undefined,
      formatted_phone_number: place.nationalPhoneNumber || "",
      website: place.websiteUri || "",
      price_level: place.priceLevel || 0,
      reviews:
        place.reviews?.map((review: any) => ({
          rating: review.rating || 0,
          text: review.text?.text || "",
          time: review.publishTime?.seconds || 0,
          author_name: review.authorAttribution?.displayName || "",
        })) || [],
      photos:
        place.photos?.map((photo: any) => ({
          photo_reference: photo.name || "",
          height: photo.heightPx || 0,
          width: photo.widthPx || 0,
        })) || [],
    };
  }

  private extractLegacyPlaceId(place: any): string {
    const resourceName = place?.name;

    if (typeof resourceName === "string" && resourceName.startsWith("places/")) {
      const legacyId = resourceName.substring("places/".length);
      if (legacyId) {
        return legacyId;
      }
    }

    return place?.id || "";
  }

  private isCurrentlyOpen(openingHours: any, utcOffsetMinutes?: number, currentOpeningHours?: any): boolean {
    if (typeof currentOpeningHours?.openNow === "boolean") {
      return currentOpeningHours.openNow;
    }

    if (typeof openingHours?.openNow === "boolean") {
      return openingHours.openNow;
    }

    const periods = openingHours?.periods;

    if (!Array.isArray(periods) || periods.length === 0) {
      return false;
    }

    const minutesInDay = 24 * 60;
    const minutesInWeek = minutesInDay * 7;

    const { day: localDay, minutes: localMinutes } = this.getLocalTimeComponents(utcOffsetMinutes);
    const localTimeValue = localDay * minutesInDay + localMinutes;

    const dayMapping = {
      SUNDAY: 0,
      MONDAY: 1,
      TUESDAY: 2,
      WEDNESDAY: 3,
      THURSDAY: 4,
      FRIDAY: 5,
      SATURDAY: 6,
    };

    const toDayNumber = (value: any): number | undefined => {
      if (typeof value === "number" && value >= 0 && value <= 6) {
        return value;
      }
      if (typeof value === "string") {
        const normalized = value.toUpperCase();
        if (normalized in dayMapping) {
          return dayMapping[normalized as keyof typeof dayMapping];
        }
      }
      return undefined;
    };

    const toMinutes = (time: any): number | undefined => {
      if (!time) {
        return undefined;
      }

      const hours = typeof time.hours === "number" ? time.hours : Number(time.hours ?? NaN);
      const minutes = typeof time.minutes === "number" ? time.minutes : Number(time.minutes ?? NaN);

      if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
        return undefined;
      }

      return hours * 60 + minutes;
    };

    for (const period of periods) {
      const openDay = toDayNumber(period?.openDay);
      const closeDay = toDayNumber(period?.closeDay ?? period?.openDay);
      const openMinutes = toMinutes(period?.openTime);
      const closeMinutes = toMinutes(period?.closeTime);

      if (openDay === undefined || openMinutes === undefined) {
        continue;
      }

      let start = openDay * minutesInDay + openMinutes;
      let end: number;

      if (closeDay === undefined || closeMinutes === undefined) {
        end = start + minutesInDay;
      } else {
        end = closeDay * minutesInDay + closeMinutes;
      }

      if (end <= start) {
        end += minutesInWeek;
      }

      let comparableLocalTime = localTimeValue;
      while (comparableLocalTime < start) {
        comparableLocalTime += minutesInWeek;
      }

      if (comparableLocalTime >= start && comparableLocalTime < end) {
        return true;
      }
    }

    return false;
  }

  private getLocalTimeComponents(utcOffsetMinutes?: number): { day: number; minutes: number } {
    const now = new Date();

    if (typeof utcOffsetMinutes === "number" && Number.isFinite(utcOffsetMinutes)) {
      const localTime = new Date(now.getTime() + utcOffsetMinutes * 60000);

      return {
        day: localTime.getUTCDay(),
        minutes: localTime.getUTCHours() * 60 + localTime.getUTCMinutes(),
      };
    }

    return {
      day: now.getDay(),
      minutes: now.getHours() * 60 + now.getMinutes(),
    };
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
