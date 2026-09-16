# Presenting Google Maps content

This Skill calls Google Maps Platform APIs with the user's key. Preserve the source metadata returned by `maps_place_details`; the agent or application displaying the result remains responsible for following the current [Places API policies](https://developers.google.com/maps/documentation/places/web-service/policies). Do not assume that plain tool output is a compliant end-user display.

- Attribute Google Maps content visibly. Places content shown without a Google Map generally needs the Google Maps logo; use the official attribution guidance for the actual interface. A text-only chat may have different display constraints, so do not claim that a source sentence alone satisfies every UI requirement.
- When showing a review, keep its author name, avatar/profile links where available, and `google_maps_uri` to the individual review. Explain any ordering or filtering of reviews. If required source metadata is absent, omit the quoted review rather than presenting it without attribution.
- When showing a photo, keep its `author_attributions` and `google_maps_uri` with the image. Do not detach the image URL from those fields.
- When showing `review_summary`, label it "Review summary," display `review_summary_attribution.disclosure_text` unmodified immediately below it, and provide its `reviews_uri` and `flag_content_uri`. When showing `generative_summary`, keep its disclosure and report link too. Provide Google's ["About this summary" explanation](https://support.google.com/local-listings/answer/9851099) with either summary. If required disclosure or links are missing, do not show the AI summary.
- Do not pre-fetch, cache, or store Places content beyond Google's permitted exceptions. Place IDs are exempt from the Places caching restriction; other fields are not automatically exempt.

These instructions help preserve metadata, but they are not a legal determination of compliance. Applications also need to check Google's requirements for their own terms, privacy policy, location, and presentation surface.
