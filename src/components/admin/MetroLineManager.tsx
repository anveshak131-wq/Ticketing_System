"use client";

import { useState, useEffect } from "react";
import { MetroLineManager, type MetroLineFormData, type LineStationFormData, type FareZoneFormData, type ZoneMatrixFormData } from "@/lib/metro-line-manager";
import type { MetroLine, LineStation, FareZone, ZoneMatrix, Station } from "@/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { NETWORK_LABELS, FARE_TYPE_LABELS, DIRECTION_LABELS } from "@/types";

export default function MetroLineManagement() {
  const [lines, setLines] = useState<MetroLine[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedLine, setSelectedLine] = useState<MetroLine | null>(null);
  const [lineStations, setLineStations] = useState<LineStation[]>([]);
  const [fareZones, setFareZones] = useState<FareZone[]>([]);
  const [zoneMatrix, setZoneMatrix] = useState<ZoneMatrix[]>([]);
  const [activeTab, setActiveTab] = useState<"lines" | "stations" | "zones">("lines");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [linesData, stationsData, zonesData, matrixData] = await Promise.all([
        MetroLineManager.getLines(),
        fetch("/api/catalog").then(r => r.json()).then((data: any) => data.stations || []),
        MetroLineManager.getFareZones(),
        MetroLineManager.getZoneMatrix(),
      ]);
      setLines(linesData);
      setStations(stationsData);
      setFareZones(zonesData);
      setZoneMatrix(matrixData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadLineStations = async (lineId: number) => {
    try {
      const stationsData = await MetroLineManager.getLineStations(lineId);
      setLineStations(stationsData);
    } catch (error) {
      console.error("Error loading line stations:", error);
    }
  };

  const handleCreateLine = async (data: MetroLineFormData) => {
    try {
      await MetroLineManager.createLine(data);
      await loadData();
      setShowForm(false);
    } catch (error) {
      console.error("Error creating line:", error);
      alert("Failed to create metro line");
    }
  };

  const handleDeleteLine = async (id: number) => {
    if (!confirm("Are you sure you want to delete this metro line?")) return;
    try {
      await MetroLineManager.deleteLine(id);
      await loadData();
      if (selectedLine?.id === id) {
        setSelectedLine(null);
        setLineStations([]);
      }
    } catch (error) {
      console.error("Error deleting line:", error);
      alert("Failed to delete metro line");
    }
  };

  const handleAddStation = async (data: LineStationFormData) => {
    try {
      await MetroLineManager.addStationToLine(data);
      if (selectedLine) {
        await loadLineStations(selectedLine.id);
      }
    } catch (error) {
      console.error("Error adding station:", error);
      alert("Failed to add station to line");
    }
  };

  const handleRemoveStation = async (id: number) => {
    try {
      await MetroLineManager.removeStationFromLine(id);
      if (selectedLine) {
        await loadLineStations(selectedLine.id);
      }
    } catch (error) {
      console.error("Error removing station:", error);
      alert("Failed to remove station from line");
    }
  };

  const handleCreateZone = async (data: FareZoneFormData) => {
    try {
      await MetroLineManager.createFareZone(data);
      await loadData();
    } catch (error) {
      console.error("Error creating zone:", error);
      alert("Failed to create fare zone");
    }
  };

  const handleCreateZoneMatrix = async (data: ZoneMatrixFormData) => {
    try {
      await MetroLineManager.createZoneMatrixEntry(data);
      await loadData();
    } catch (error) {
      console.error("Error creating zone matrix entry:", error);
      alert("Failed to create zone matrix entry");
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Metro Line Management</h1>
        <Button onClick={() => setShowForm(true)}>Create New Line</Button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 border-b">
        <button
          onClick={() => setActiveTab("lines")}
          className={`px-4 py-2 ${activeTab === "lines" ? "border-b-2 border-blue-500" : ""}`}
        >
          Lines
        </button>
        <button
          onClick={() => setActiveTab("stations")}
          className={`px-4 py-2 ${activeTab === "stations" ? "border-b-2 border-blue-500" : ""}`}
          disabled={!selectedLine}
        >
          Line Stations
        </button>
        <button
          onClick={() => setActiveTab("zones")}
          className={`px-4 py-2 ${activeTab === "zones" ? "border-b-2 border-blue-500" : ""}`}
        >
          Fare Zones
        </button>
      </div>

      {showForm && (
        <LineForm
          onSubmit={handleCreateLine}
          onCancel={() => setShowForm(false)}
          stations={stations}
        />
      )}

      {activeTab === "lines" && (
        <div className="grid gap-4">
          {lines.map((line) => (
            <Card key={line.id} className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold">{line.name}</h3>
                  <div className="text-sm text-gray-600 mt-2">
                    <p>Network: {NETWORK_LABELS[line.network]}</p>
                    <p>Route: {line.startStation} → {line.endStation}</p>
                    <p>Distance: {line.totalDistance} km</p>
                    <p>Stations: {line.totalStations}</p>
                    <p>Fare Type: {FARE_TYPE_LABELS[line.fareType]}</p>
                    {line.fareType === "distance" && (
                      <p>Base Fare: ₹{line.baseFare} + ₹{line.farePerKm}/km</p>
                    )}
                    {line.fareType === "flat" && (
                      <p>Flat Fare: ₹{line.baseFare}</p>
                    )}
                  </div>
                </div>
                <div className="space-x-2">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setSelectedLine(line);
                      loadLineStations(line.id);
                      setActiveTab("stations");
                    }}
                  >
                    Manage Stations
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => handleDeleteLine(line.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {activeTab === "stations" && selectedLine && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">
              Stations for {selectedLine.name}
            </h2>
            <StationForm
              lineId={selectedLine.id}
              stations={stations}
              onSubmit={handleAddStation}
            />
          </div>
          
          <div className="grid gap-2">
            {lineStations
              .sort((a, b) => a.stopOrder - b.stopOrder)
              .map((lineStation) => (
                <Card key={lineStation.id} className="p-3 flex justify-between items-center">
                  <div>
                    <span className="font-semibold">Stop {lineStation.stopOrder}:</span>
                    <span className="ml-2">{stations.find(s => s.code === lineStation.stationCode)?.name}</span>
                    <span className="ml-4 text-sm text-gray-600">
                      {lineStation.distanceFromStart} km from start | {DIRECTION_LABELS[lineStation.direction]}
                    </span>
                  </div>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleRemoveStation(lineStation.id)}
                  >
                    Remove
                  </Button>
                </Card>
              ))}
          </div>
        </div>
      )}

      {activeTab === "zones" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Fare Zones</h2>
            <ZoneForm onSubmit={handleCreateZone} />
          </div>

          <div className="grid gap-4">
            {fareZones.map((zone) => (
              <Card key={zone.id} className="p-4">
                <h3 className="text-xl font-semibold">{zone.name}</h3>
                <p className="text-sm text-gray-600">
                  Network: {NETWORK_LABELS[zone.network]} | Base Fare: ₹{zone.baseFare}
                </p>
              </Card>
            ))}
          </div>

          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Zone Matrix</h2>
            <ZoneMatrixForm
              zones={fareZones}
              onSubmit={handleCreateZoneMatrix}
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="p-2 text-left">From Zone</th>
                  <th className="p-2 text-left">To Zone</th>
                  <th className="p-2 text-left">Fare</th>
                </tr>
              </thead>
              <tbody>
                {zoneMatrix.map((entry) => (
                  <tr key={entry.id} className="border-b">
                    <td className="p-2">{fareZones.find(z => z.id === entry.fromZone)?.name}</td>
                    <td className="p-2">{fareZones.find(z => z.id === entry.toZone)?.name}</td>
                    <td className="p-2">₹{entry.fare}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function LineForm({ onSubmit, onCancel, stations }: { onSubmit: (data: MetroLineFormData) => void; onCancel: () => void; stations: Station[] }) {
  const [formData, setFormData] = useState<MetroLineFormData>({
    name: "",
    color: "#3B82F6",
    network: "metro",
    startStation: "",
    endStation: "",
    totalDistance: 0,
    totalStations: 0,
    fareType: "distance",
    baseFare: 0,
    farePerKm: 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Create New Metro Line</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Line Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
        <Input
          label="Color"
          type="color"
          value={formData.color}
          onChange={(e) => setFormData({ ...formData, color: e.target.value })}
        />
        <select
          value={formData.network}
          onChange={(e) => setFormData({ ...formData, network: e.target.value as "metro" | "local" })}
          className="w-full p-2 border rounded"
        >
          <option value="metro">Metro</option>
          <option value="local">Local Train</option>
        </select>
        <select
          value={formData.startStation}
          onChange={(e) => setFormData({ ...formData, startStation: e.target.value })}
          className="w-full p-2 border rounded"
          required
        >
          <option value="">Select Start Station</option>
          {stations.map((s) => (
            <option key={s.code} value={s.code}>{s.name}</option>
          ))}
        </select>
        <select
          value={formData.endStation}
          onChange={(e) => setFormData({ ...formData, endStation: e.target.value })}
          className="w-full p-2 border rounded"
          required
        >
          <option value="">Select End Station</option>
          {stations.map((s) => (
            <option key={s.code} value={s.code}>{s.name}</option>
          ))}
        </select>
        <Input
          label="Total Distance (km)"
          type="number"
          value={formData.totalDistance}
          onChange={(e) => setFormData({ ...formData, totalDistance: parseFloat(e.target.value) })}
          required
        />
        <Input
          label="Total Stations"
          type="number"
          value={formData.totalStations}
          onChange={(e) => setFormData({ ...formData, totalStations: parseInt(e.target.value) })}
          required
        />
        <select
          value={formData.fareType}
          onChange={(e) => setFormData({ ...formData, fareType: e.target.value as "distance" | "zone" | "flat" })}
          className="w-full p-2 border rounded"
        >
          <option value="distance">Distance-Based</option>
          <option value="zone">Zone-Based</option>
          <option value="flat">Flat Rate</option>
        </select>
        <Input
          label="Base Fare"
          type="number"
          value={formData.baseFare}
          onChange={(e) => setFormData({ ...formData, baseFare: parseFloat(e.target.value) })}
          required
        />
        {formData.fareType === "distance" && (
          <Input
            label="Fare per km"
            type="number"
            value={formData.farePerKm}
            onChange={(e) => setFormData({ ...formData, farePerKm: parseFloat(e.target.value) })}
            required
          />
        )}
        <div className="flex space-x-2">
          <Button type="submit">Create Line</Button>
          <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        </div>
      </form>
    </Card>
  );
}

function StationForm({ lineId, stations, onSubmit }: { lineId: number; stations: Station[]; onSubmit: (data: LineStationFormData) => void }) {
  const [formData, setFormData] = useState<LineStationFormData>({
    lineId,
    stationCode: "",
    stopOrder: 0,
    distanceFromStart: 0,
    direction: "both",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({ ...formData, stationCode: "", stopOrder: 0, distanceFromStart: 0 });
  };

  return (
    <Card className="p-4">
      <form onSubmit={handleSubmit} className="space-y-2 flex items-end gap-2">
        <select
          value={formData.stationCode}
          onChange={(e) => setFormData({ ...formData, stationCode: e.target.value })}
          className="p-2 border rounded"
          required
        >
          <option value="">Select Station</option>
          {stations.map((s) => (
            <option key={s.code} value={s.code}>{s.name}</option>
          ))}
        </select>
        <Input
          label="Stop Order"
          type="number"
          value={formData.stopOrder}
          onChange={(e) => setFormData({ ...formData, stopOrder: parseInt(e.target.value) })}
          required
        />
        <Input
          label="Distance from Start (km)"
          type="number"
          value={formData.distanceFromStart}
          onChange={(e) => setFormData({ ...formData, distanceFromStart: parseFloat(e.target.value) })}
          required
        />
        <select
          value={formData.direction}
          onChange={(e) => setFormData({ ...formData, direction: e.target.value as "up" | "down" | "both" })}
          className="p-2 border rounded"
        >
          <option value="both">Both Directions</option>
          <option value="up">Up Line</option>
          <option value="down">Down Line</option>
        </select>
        <Button type="submit">Add</Button>
      </form>
    </Card>
  );
}

function ZoneForm({ onSubmit }: { onSubmit: (data: FareZoneFormData) => void }) {
  const [formData, setFormData] = useState<FareZoneFormData>({
    name: "",
    network: "metro",
    baseFare: 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({ name: "", network: "metro", baseFare: 0 });
  };

  return (
    <Card className="p-4">
      <form onSubmit={handleSubmit} className="space-y-2 flex items-end gap-2">
        <Input
          label="Zone Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
        <select
          value={formData.network}
          onChange={(e) => setFormData({ ...formData, network: e.target.value as "metro" | "local" })}
          className="p-2 border rounded"
        >
          <option value="metro">Metro</option>
          <option value="local">Local Train</option>
        </select>
        <Input
          label="Base Fare"
          type="number"
          value={formData.baseFare}
          onChange={(e) => setFormData({ ...formData, baseFare: parseFloat(e.target.value) })}
          required
        />
        <Button type="submit">Add Zone</Button>
      </form>
    </Card>
  );
}

function ZoneMatrixForm({ zones, onSubmit }: { zones: FareZone[]; onSubmit: (data: ZoneMatrixFormData) => void }) {
  const [formData, setFormData] = useState<ZoneMatrixFormData>({
    fromZone: 0,
    toZone: 0,
    fare: 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({ fromZone: 0, toZone: 0, fare: 0 });
  };

  return (
    <Card className="p-4">
      <form onSubmit={handleSubmit} className="space-y-2 flex items-end gap-2">
        <select
          value={formData.fromZone}
          onChange={(e) => setFormData({ ...formData, fromZone: parseInt(e.target.value) })}
          className="p-2 border rounded"
          required
        >
          <option value="">From Zone</option>
          {zones.map((z) => (
            <option key={z.id} value={z.id}>{z.name}</option>
          ))}
        </select>
        <select
          value={formData.toZone}
          onChange={(e) => setFormData({ ...formData, toZone: parseInt(e.target.value) })}
          className="p-2 border rounded"
          required
        >
          <option value="">To Zone</option>
          {zones.map((z) => (
            <option key={z.id} value={z.id}>{z.name}</option>
          ))}
        </select>
        <Input
          label="Fare"
          type="number"
          value={formData.fare}
          onChange={(e) => setFormData({ ...formData, fare: parseFloat(e.target.value) })}
          required
        />
        <Button type="submit">Add Matrix Entry</Button>
      </form>
    </Card>
  );
}