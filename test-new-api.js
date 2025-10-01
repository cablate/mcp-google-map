#!/usr/bin/env node

import { PlacesSearcher } from './dist/services/PlacesSearcher.js';

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
    
    const testPlaceId = 'ChIJQ2BmJhVwhlQRPkt6FWiet90';
    console.log(`Testing with place ID: ${testPlaceId}`);
    
    const result = await placesSearcher.getPlaceDetails(testPlaceId);
    
    if (result.success) {
      console.log('✅ Successfully retrieved place details using new Places API!');
      console.log('Place details:');
      console.log(JSON.stringify(result.data, null, 2));
    } else {
      console.error('❌ Failed to retrieve place details:');
      console.error(result.error);
    }
    
  } catch (error) {
    console.error('❌ Error during test:');
    console.error(error.message);
  }
}

testNewPlacesAPI().catch(console.error);