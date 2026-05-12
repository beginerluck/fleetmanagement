CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'driver',
  phone VARCHAR(20),
  department VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE vehicles (
  id SERIAL PRIMARY KEY,
  registration_number VARCHAR(20) UNIQUE NOT NULL,
  make VARCHAR(50),
  model VARCHAR(50),
  year INT,
  status VARCHAR(20) DEFAULT 'available',
  odometer_current INT DEFAULT 0,
  cost_centre VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE bookings (
  id SERIAL PRIMARY KEY,
  vehicle_id INT REFERENCES vehicles(id),
  driver_id INT REFERENCES users(id),
  date_from TIMESTAMP NOT NULL,
  date_to TIMESTAMP NOT NULL,
  purpose VARCHAR(255),
  usage_type VARCHAR(10) DEFAULT 'business',
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE trips (
  id SERIAL PRIMARY KEY,
  booking_id INT REFERENCES bookings(id),
  vehicle_id INT REFERENCES vehicles(id) NOT NULL,
  driver_id INT REFERENCES users(id) NOT NULL,
  odometer_start INT NOT NULL,
  odometer_end INT,
  destination VARCHAR(255),
  purpose VARCHAR(255),
  usage_type VARCHAR(10) DEFAULT 'business',
  start_time TIMESTAMP DEFAULT NOW(),
  end_time TIMESTAMP,
  distance_km INT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE fuel_records (
  id SERIAL PRIMARY KEY,
  vehicle_id INT REFERENCES vehicles(id),
  trip_id INT REFERENCES trips(id),
  driver_id INT REFERENCES users(id),
  date DATE NOT NULL,
  litres DECIMAL(8,2),
  cost DECIMAL(10,2),
  cost_centre VARCHAR(100),
  receipt_image_url VARCHAR(500),
  odometer_reading INT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE compliance (
  id SERIAL PRIMARY KEY,
  vehicle_id INT REFERENCES vehicles(id),
  type VARCHAR(30) NOT NULL,
  due_date DATE,
  due_km INT,
  last_done_date DATE,
  last_done_km INT,
  document_url VARCHAR(500),
  alert_60_sent BOOLEAN DEFAULT FALSE,
  alert_30_sent BOOLEAN DEFAULT FALSE,
  alert_7_sent BOOLEAN DEFAULT FALSE,
  status VARCHAR(20) DEFAULT 'ok',
  created_at TIMESTAMP DEFAULT NOW()
);
