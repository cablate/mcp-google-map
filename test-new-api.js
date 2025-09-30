#!/usr/bin/env node

/**
 * Test script to verify the new Places API implementation
 * This script tests the get_place_details functionality with the new API
 */

import { PlacesSearcher } from './dist/services/PlacesSearcher.js';

async function testNewPlacesAPI() {
  console.log('Testing new Places API implementation...');
  
  // Check if API key is available
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.error('❌ GOOGLE_MAPS_API_KEY environment variable is not set');
    console.log('Please set your Google Maps API key:');
    console.log('export GOOGLE_MAPS_API_KEY="your-api-key-here"');
    process.exit(1);
  }

  try {
    const placesSearcher = new PlacesSearcher(apiKey);
    
    // Test with a known place ID (Google's headquarters)
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

// Run the test
testNewPlacesAPI().catch(console.error);