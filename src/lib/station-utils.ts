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
  return stations.filter((s) => getStationNetwork(s) === network);
}
