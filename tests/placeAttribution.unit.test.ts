import assert from "node:assert/strict";
import test from "node:test";
import { NewPlacesService } from "../src/services/NewPlacesService.js";
import { PlacesSearcher } from "../src/services/PlacesSearcher.js";

const place = {
  name: "places/example",
  displayName: { text: "Example Cafe" },
  googleMapsUri: "https://www.google.com/maps/place/example",
  location: { latitude: 1, longitude: 2 },
  reviews: [
    {
      rating: 5,
      text: { text: "Great coffee", languageCode: "en" },
      publishTime: { seconds: 123 },
      authorAttribution: {
        displayName: "Reviewer",
        uri: "https://www.google.com/maps/contrib/reviewer",
        photoUri: "https://example.com/avatar",
      },
      googleMapsUri: "https://www.google.com/maps/reviews/example",
      flagContentUri: "https://www.google.com/local/review/report/example",
      relativePublishTimeDescription: "2 days ago",
    },
  ],
  photos: [
    {
      name: "places/example/photos/1",
      widthPx: 800,
      heightPx: 600,
      googleMapsUri: "https://www.google.com/maps/photos/example",
      flagContentUri: "https://www.google.com/local/photo/report/example",
      authorAttributions: [{ displayName: "Photographer", uri: "https://example.com/author", photoUri: "" }],
    },
  ],
  reviewSummary: {
    text: { text: "Popular for coffee" },
    disclosureText: { text: "Summarized with Gemini" },
    flagContentUri: "https://www.google.com/local/summary/report/example",
    reviewsUri: "https://www.google.com/maps/place/example/reviews",
  },
  generativeSummary: {
    overview: { text: "A neighborhood cafe" },
    disclosureText: { text: "Summarized with Gemini" },
    flagContentUri: "https://www.google.com/local/place-summary/report/example",
  },
};

test("Place Details retains source and disclosure metadata through the service facade", async () => {
  const service = new NewPlacesService("test-key");
  let requestedMask = "";
  (service as unknown as { client: { getPlace: (...args: any[]) => Promise<[typeof place]> } }).client = {
    getPlace: async (_request, options) => {
      requestedMask = options.otherArgs.headers["X-Goog-FieldMask"];
      return [place];
    },
  };
  const searcher = new PlacesSearcher("test-key");
  (searcher as unknown as { newPlacesService: NewPlacesService }).newPlacesService = service;
  service.getPhotoUri = async () => "https://example.com/photo";

  const response = await searcher.getPlaceDetails("example", 1);
  assert.equal(response.success, true);
  assert.equal(response.data.google_maps_uri, place.googleMapsUri);
  assert.deepEqual(response.data.reviews[0], {
    rating: 5,
    text: "Great coffee",
    language: "en",
    time: 123,
    author_name: "Reviewer",
    author_uri: "https://www.google.com/maps/contrib/reviewer",
    author_photo_uri: "https://example.com/avatar",
    google_maps_uri: "https://www.google.com/maps/reviews/example",
    flag_content_uri: "https://www.google.com/local/review/report/example",
    relative_publish_time_description: "2 days ago",
  });
  assert.deepEqual(response.data.photos[0], {
    url: "https://example.com/photo",
    width: 800,
    height: 600,
    google_maps_uri: "https://www.google.com/maps/photos/example",
    flag_content_uri: "https://www.google.com/local/photo/report/example",
    author_attributions: [{ display_name: "Photographer", uri: "https://example.com/author", photo_uri: "" }],
  });
  assert.deepEqual(response.data.review_summary_attribution, {
    disclosure_text: "Summarized with Gemini",
    flag_content_uri: "https://www.google.com/local/summary/report/example",
    reviews_uri: "https://www.google.com/maps/place/example/reviews",
  });
  assert.deepEqual(response.data.generative_summary_attribution, {
    disclosure_text: "Summarized with Gemini",
    flag_content_uri: "https://www.google.com/local/place-summary/report/example",
  });
  for (const field of [
    "reviews.authorAttribution.uri",
    "reviews.authorAttribution.photoUri",
    "reviews.googleMapsUri",
    "photos.authorAttributions",
    "photos.googleMapsUri",
    "reviewSummary",
    "generativeSummary",
  ]) {
    assert.ok(requestedMask.split(",").includes(field), `${field} missing from field mask`);
  }
});
