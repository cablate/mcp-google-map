export const Logger = {
  log: (...args: any[]) => {
    console.error("[INFO]", ...args);
  },
  error: (...args: any[]) => {
    console.error("[ERROR]", ...args);
  },
};

export { PlacesSearcher } from "./services/PlacesSearcher.js";
export { NewPlacesService } from "./services/NewPlacesService.js";