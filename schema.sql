-- Indian Railway Demo Ticketing System — D1 Schema
-- Enhanced for Metro/Local Train Systems

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'agent')),
  agent_code TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS stations (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  network TEXT NOT NULL DEFAULT 'intercity' CHECK (network IN ('intercity', 'metro', 'local')),
  -- Metro/Local specific fields
  zone_id INTEGER,  -- For zone-based fare systems
  latitude REAL,
  longitude REAL,
  is_terminus INTEGER DEFAULT 0,  -- True if this is an end station
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS metro_lines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,  -- e.g., "Blue Line", "Red Line"
  color TEXT,  -- Hex color for UI display
  network TEXT NOT NULL DEFAULT 'metro' CHECK (network IN ('metro', 'local')),
  start_station TEXT NOT NULL REFERENCES stations(code),
  end_station TEXT NOT NULL REFERENCES stations(code),
  total_distance REAL NOT NULL,  -- Total line distance in km
  total_stations INTEGER NOT NULL,  -- Number of stations on line
  fare_type TEXT NOT NULL DEFAULT 'distance' CHECK (fare_type IN ('distance', 'zone', 'flat')),
  base_fare REAL DEFAULT 0,  -- Base fare for flat rate
  fare_per_km REAL DEFAULT 0,  -- Per km rate for distance-based
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS line_stations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  line_id INTEGER NOT NULL REFERENCES metro_lines(id) ON DELETE CASCADE,
  station_code TEXT NOT NULL REFERENCES stations(code),
  stop_order INTEGER NOT NULL,  -- Order of station along the line
  distance_from_start REAL NOT NULL,  -- Distance from line start in km
  direction TEXT NOT NULL DEFAULT 'both' CHECK (direction IN ('up', 'down', 'both')),
  UNIQUE(line_id, station_code, direction)
);

CREATE TABLE IF NOT EXISTS fare_zones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,  -- e.g., "Zone 1", "Central Zone"
  network TEXT NOT NULL DEFAULT 'metro',
  base_fare REAL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS zone_matrix (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  from_zone INTEGER NOT NULL REFERENCES fare_zones(id),
  to_zone INTEGER NOT NULL REFERENCES fare_zones(id),
  fare REAL NOT NULL,
  UNIQUE(from_zone, to_zone)
);

CREATE TABLE IF NOT EXISTS trains (
  number TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'intercity' CHECK (category IN ('intercity', 'metro', 'local')),
  -- For intercity trains
  source_code TEXT NOT NULL REFERENCES stations(code),
  destination_code TEXT NOT NULL REFERENCES stations(code),
  -- For metro/local trains
  line_id INTEGER REFERENCES metro_lines(id),
  direction TEXT CHECK (direction IN ('up', 'down', 'both')),
  departure_time TEXT NOT NULL,
  arrival_time TEXT NOT NULL,
  duration TEXT NOT NULL,
  runs_on TEXT NOT NULL,
  classes TEXT NOT NULL,
  base_fares TEXT NOT NULL,
  -- Scheduling fields
  headway_minutes INTEGER,  -- Time between trains in minutes
  peak_hours_start TEXT,  -- e.g., "08:00"
  peak_hours_end TEXT,    -- e.g., "10:00"
  peak_headway_minutes INTEGER,  -- Headway during peak hours
  off_peak_headway_minutes INTEGER,  -- Headway during off-peak
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS train_schedule (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  train_number TEXT NOT NULL REFERENCES trains(number) ON DELETE CASCADE,
  station_code TEXT NOT NULL REFERENCES stations(code),
  arrival TEXT,
  departure TEXT,
  day INTEGER NOT NULL DEFAULT 1,
  distance INTEGER NOT NULL DEFAULT 0,
  stop_order INTEGER NOT NULL,
  is_terminal INTEGER DEFAULT 0  -- True if this is a terminal stop
);

CREATE TABLE IF NOT EXISTS reservations (
  pnr TEXT PRIMARY KEY,
  booking_type TEXT NOT NULL DEFAULT 'intercity' CHECK (booking_type IN ('intercity', 'metro', 'local')),
  train_number TEXT NOT NULL REFERENCES trains(number),
  line_id INTEGER REFERENCES metro_lines(id),  -- For metro bookings
  from_station TEXT NOT NULL REFERENCES stations(code),
  to_station TEXT NOT NULL REFERENCES stations(code),
  travel_date TEXT NOT NULL,
  travel_class TEXT NOT NULL,
  passengers TEXT NOT NULL,
  total_fare REAL NOT NULL,
  -- Fare calculation details
  distance_km REAL,  -- Distance traveled in km
  fare_type TEXT,  -- 'distance', 'zone', 'flat'
  from_zone INTEGER,
  to_zone INTEGER,
  status TEXT NOT NULL DEFAULT 'confirmed',
  booking_channel TEXT NOT NULL DEFAULT 'public' CHECK (booking_channel IN ('public', 'agent')),
  booked_by_user_id TEXT REFERENCES users(id),
  booked_by_name TEXT,
  agent_code TEXT,
  booked_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_travel_date ON reservations(travel_date);
CREATE INDEX IF NOT EXISTS idx_reservations_booked_by ON reservations(booked_by_user_id);
CREATE INDEX IF NOT EXISTS idx_train_schedule_train ON train_schedule(train_number);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_stations_network ON stations(network);
CREATE INDEX IF NOT EXISTS idx_metro_lines_network ON metro_lines(network);
CREATE INDEX IF NOT EXISTS idx_line_stations_line ON line_stations(line_id);
CREATE INDEX IF NOT EXISTS idx_line_stations_station ON line_stations(station_code);
CREATE INDEX IF NOT EXISTS idx_trains_category ON trains(category);
CREATE INDEX IF NOT EXISTS idx_trains_line ON trains(line_id);
