import { Loader } from '@googlemaps/js-api-loader';

export class MapService {
  constructor() {
    this.loader = new Loader({
      apiKey: process.env.GOOGLE_MAPS_API_KEY,
      version: "weekly",
      libraries: ["drawing", "geometry"]
    });
  }
  
  async initMap(elementId) {
    // Implementation
  }
}

