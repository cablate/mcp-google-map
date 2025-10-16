#!/usr/bin/env node

import { PlacesSearcher, NewPlacesService } from './dist/index.js';

async function testNewPlacesAPI() {
  console.log('Testing new Places API implementation...');
  
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.error('❌ GOOGLE_MAPS_API_KEY environment variable is not set');
    console.log('Please set your Google Maps API key:');
    console.log('export GOOGLE_MAPS_API_KEY="your-api-key-here"');
    process.exit(1);
  }

  try {
    const placesSearcher = new PlacesSearcher(apiKey);
    const placesService = new NewPlacesService(apiKey);
    
    const testPlaceId = 'ChIJQ2BmJhVwhlQRPkt6FWiet90';
    console.log(`Testing with place ID: ${testPlaceId}`);
    
    const rawDetails = await placesService.getPlaceDetails(testPlaceId);
    if (rawDetails.place_id !== testPlaceId) {
      console.error('❌ Legacy place_id mismatch');
      console.error(`Expected: ${testPlaceId}`);
      console.error(`Received: ${rawDetails.place_id}`);
      process.exit(1);
    } else {
      console.log('✅ Legacy place_id preserved');
    }

    if (rawDetails.opening_hours?.open_now !== undefined) {
      console.log(`ℹ️  open_now flag from NewPlacesService: ${rawDetails.opening_hours.open_now}`);
    } else {
      console.log('ℹ️  open_now flag unavailable for this place (no opening hours data).');
    }
    
    const result = await placesSearcher.getPlaceDetails(testPlaceId);
    
    if (result.success) {
      console.log('✅ Successfully retrieved place details using PlacesSearcher wrapper!');
      console.log('Place details:');
      console.log(JSON.stringify(result.data, null, 2));
    } else {
      console.error('❌ Failed to retrieve place details via PlacesSearcher:');
      console.error(result.error);
    }
    
  } catch (error) {
    console.error('❌ Error during test:');
    console.error(error.message);
    process.exit(1);
  }
}

testNewPlacesAPI().catch((error) => {
  console.error('❌ Unhandled error during test:', error);
  process.exit(1);
});
