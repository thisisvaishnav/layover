# MAPLE HOLLOW MASTER SPECIFICATION (SINGLE SOURCE OF TRUTH)

**Tech stack:** Three.js ^0.186.0, raw imperative OOP (no @react-three/fiber / @react-three/drei).
**Reference human scale:** Average adult height ≈ 1.75m (5'9").

---

## 1. Core Principles
1. **One JSON config (`city-config.json`)** is the only place numbers live. Agents read it, never hardcode.
2. **Modular ownership:** Each agent owns one module folder and never touches another's files.
3. **Roads + park built first:** Buildings, bus stops, traffic, and pedestrians position relative to the road graph.
4. **Behavioral specs:** Strict vehicle speeds, follow gaps, pedestrian walk cycles, idle pauses, and intersection yields.

---

## 2. City Layout
- **World dimensions:** 2000m × 2000m (center: [1000, 1000]).
- **Central Park:** Circular, center [1000, 1000], radius 180m.
- **Rings (3 concentric ring roads):** Radii at 220m, 460m, 760m. Width 12m.
- **Radials (8 radial roads):** Spaced every 45° from inner ring (220m) to perimeter (~1000m). Width 14m.
- **Blocks:** 24 wedge-shaped blocks (8 radials × 3 ring bands).
- **Zoning:**
  - Inner ring (220–460m): Houses, salon, café, shops.
  - Middle ring (460–760m): Apartment towers, church, temple, school, town hall/library.
  - Outer ring (760m–1000m): Airport & runway, hospital, police station, train station, bus depot.

---

## 3. Building Dimensions & Minimum Counts
| Building | Footprint (W×D) | Height | Floors | Count | Ring |
|---|---|---|---|---|---|
| House (type A) | 10m × 8m | 6m | 2 | 12 | Inner |
| House (type B) | 12m × 9m | 6m | 2 | 8 | Inner |
| Apartment building (big) | 40m × 25m | 45m | 15 | 2 | Middle |
| Shop unit | 8m × 10m | 5m | 1 | 10 | Inner |
| Café | 9m × 9m | 5m | 1 | 2 | Inner |
| Salon | 8m × 8m | 5m | 1 | 2 | Inner |
| Church | 18m × 30m | 22m | 1 | 1 | Middle |
| Temple | 20m × 20m | 18m | 1 | 1 | Middle |
| School | 40m × 30m | 12m | 3 | 1 | Middle |
| Town hall / library | 35m × 25m | 14m | 2 | 1 | Middle |
| Hospital | 50m × 35m | 20m | 5 | 1 | Outer |
| Police station | 25m × 20m | 10m | 2 | 1 | Outer |
| Airport terminal | 60m × 30m | 12m | 2 | 1 | Outer |
| Runway | 400m × 45m | 0m | - | 1 | Outer |
| Train station | 40m × 20m | 10m | 1 | 1 | Outer |
| Bus depot | 30m × 20m | 8m | 1 | 1 | Outer |

---

## 4. Bus Stops & Routes
- Spaced every 135m (120–150m) along all ring and radial roads (total ≈ 110–115 stops).
- Alternating sides of road.
- 3m × 2m shelter footprint set back 1.5m from road edge on the sidewalk.
- 4 fixed routes: `innerRingLoop`, `middleRingLoop`, `outerRingLoop`, `radialExpress`.
- Buses stop for 8–12 seconds per stop.

---

## 5. Road Cross-Section
- Footpath: 2.5m both sides.
- Verge: 0.5m.
- Parking lane: 1.0m (rings).
- Drive lanes: 2 × 3.5m.
- Radial center turning lane: 3.0m at intersections.

---

## 6. Traffic Specification
- Concurrent active vehicles: 150.
- Mix: 55% cars, 15% taxis, 12% vans, 10% buses, 8% motorbikes.
- Speeds:
  - Radials: 30–45 km/h (8.33–12.5 m/s)
  - Rings: 20–30 km/h (5.56–8.33 m/s)
  - Motorbikes: +10 km/h
  - Buses: 30 km/h max
- Lane center following, 2-second follow gap, intersection yield/traffic light rules.

---

## 7. Pedestrian Specification
- Active pedestrians: 25–40 (target 30).
- Speed: 1.2–1.5 m/s (±10% individual variance).
- Movement: Sinusoidal vertical bob, arm/leg swing via `avatar-kinematics.ts`.
- Behavior: Idle pauses (1–3s), collision avoidance, street crossing behavior at marked crossings.
