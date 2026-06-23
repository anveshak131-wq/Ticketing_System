-- Indian Railway Demo Ticketing System — D1 Schema

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
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS trains (
  number TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  source_code TEXT NOT NULL REFERENCES stations(code),
  destination_code TEXT NOT NULL REFERENCES stations(code),
  departure_time TEXT NOT NULL,
  arrival_time TEXT NOT NULL,
  duration TEXT NOT NULL,
  runs_on TEXT NOT NULL,
  classes TEXT NOT NULL,
  base_fares TEXT NOT NULL,
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
  stop_order INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS reservations (
  pnr TEXT PRIMARY KEY,
  train_number TEXT NOT NULL REFERENCES trains(number),
  from_station TEXT NOT NULL REFERENCES stations(code),
  to_station TEXT NOT NULL REFERENCES stations(code),
  travel_date TEXT NOT NULL,
  travel_class TEXT NOT NULL,
  passengers TEXT NOT NULL,
  total_fare REAL NOT NULL,
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
