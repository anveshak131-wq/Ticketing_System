import type { Station, StationNetwork, Train, TrainCategory } from "@/types";

export function getStationNetwork(station: Station): StationNetwork {
  return station.network ?? "intercity";
}

export function getTrainCategory(train: Train): TrainCategory {
  return train.category ?? "intercity";
}

export function isUrbanNetwork(network: StationNetwork): boolean {
  return network === "metro" || network === "local";
}

export function filterStationsByNetwork(
  stations: Station[],
  network: StationNetwork
): Station[] {
  return stations.filter((s) => {
    const net = getStationNetwork(s);
    // Treat specialized metro networks (e.g. 'hyderabad-metro') as part of 'metro'
    if (network === "metro" || network === "local") {
      return net.includes(network);
    }
    return net === network;
  });
}

export function getNetworkCities(
  stations: Station[],
  network: StationNetwork
): string[] {
  const cities = new Set(
    filterStationsByNetwork(stations, network).map((s) => s.city)
  );
  return [...cities].sort((a, b) => a.localeCompare(b));
}

export function filterStationsByNetworkAndCity(
  stations: Station[],
  network: StationNetwork,
  city: string
): Station[] {
  return filterStationsByNetwork(stations, network).filter((s) => s.city === city);
}
