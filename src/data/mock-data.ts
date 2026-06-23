import { getStations, getTrains, getStation, getStationLabel, searchTrains } from "@/lib/train-search";

export { getStations, getTrains, getStation, getStationLabel, searchTrains };

// Backward-compatible static exports (seed defaults for SSR)
export { SEED_STATIONS as stations, SEED_TRAINS as trains } from "@/data/seed-data";
