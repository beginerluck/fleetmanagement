# Requirement: Auto-Link Fuel Receipt to Driver's Confirmed Vehicle

## Context
When a driver has already confirmed a vehicle (i.e. has an active booking or an in-progress trip),
the fuel receipt upload screen must automatically pre-select and lock that vehicle.

## Behaviour

### When driver has an ACTIVE TRIP (trip started, not yet ended):
- Vehicle field is **pre-filled and locked** (read-only) — shows the vehicle from the active trip
- Trip field is **pre-filled and locked** — automatically linked to the active trip
- Odometer Reading is **pre-filled** with the trip's `odometer_start` value (editable)
- Show a blue info banner:
  > "⛽ Linked to your active trip: [Destination] — [Vehicle Plate] [Make Model]"

### When driver has a CONFIRMED BOOKING (approved, not yet started):
- Vehicle field is **pre-filled** (but editable — driver may fuel a different vehicle)
- Trip field shows the upcoming booking
- Show a subtle info banner:
  > "📅 Pre-filled from your upcoming booking: [Vehicle Plate] [Make Model]"

### When driver has NO active trip or booking:
- Vehicle dropdown is open and editable (all available vehicles listed)
- Trip dropdown defaults to "Not linked to a trip"

## API Changes Required

### New endpoint: `GET /api/driver/active-context`
- Auth: JWT required (driver role)
- Returns the driver's current active trip OR upcoming confirmed booking
- Response:
```json
{
  "success": true,
  "data": {
    "activeTrip": {
      "id": 5,
      "vehicle_id": 2,
      "vehicle": { "id": 2, "registration_number": "ABC 123 NSW", "make": "Toyota", "model": "HiLux" },
      "odometer_start": 145230,
      "destination": "Head Office",
      "start_time": "2026-05-12T09:05:00Z"
    },
    "upcomingBooking": null
  }
}
```

## Frontend Changes in `FuelUpload.jsx`

1. On component mount, call `GET /api/driver/active-context`
2. If `activeTrip` exists:
   - Set `vehicle_id` = activeTrip.vehicle_id (locked, show as read-only badge)
   - Set `trip_id` = activeTrip.id (locked)
   - Set `odometer_reading` = activeTrip.odometer_start (editable)
   - Show blue info banner with trip details
3. If only `upcomingBooking` exists:
   - Pre-select vehicle in dropdown (still editable)
   - Show subtle info banner
4. If neither: normal open form

## UI — Info Banner (active trip)
```
┌─────────────────────────────────────────┐
│ ⛽ Linked to your active trip           │
│ 🚗 ABC 123 NSW — Toyota HiLux          │
│ 📍 Head Office  🕐 Started 9:05am      │
│ Vehicle & trip are locked               │
└─────────────────────────────────────────┘
```

## UI — Vehicle field when locked
- Show as a styled read-only card instead of dropdown:
```
┌─────────────────────────────────────────┐
│ 🚗 ABC 123 NSW                         │
│    Toyota HiLux 2023          🔒 Locked │
└─────────────────────────────────────────┘
```
