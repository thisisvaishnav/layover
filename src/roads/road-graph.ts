import cityConfig from "@/city-config.json";

export interface RoadWaypoint {
  x: number;
  z: number;
  heading: number; // in radians
  speedLimit: number; // in m/s
}

export interface Lane {
  id: string;
  roadType: "ring" | "radial";
  ringIndex?: number;
  radialIndex?: number;
  direction: "cw" | "ccw" | "inbound" | "outbound";
  waypoints: RoadWaypoint[];
  length: number;
}

export interface IntersectionNode {
  id: string;
  ringIndex: number;
  radialIndex: number;
  radius: number;
  angle: number;
  center: { x: number; z: number };
  priorityRoad: "radial";
  hasTrafficLight: boolean;
}

export interface BusStopLocation {
  id: string;
  roadType: "ring" | "radial";
  roadIndex: number;
  position: { x: number; z: number };
  side: "left" | "right";
  rotationY: number;
  routeIds: string[];
}

export interface FootpathWaypoint {
  id: string;
  position: { x: number; z: number };
  neighbors: string[];
  isCrossing: boolean;
  blockType?: "inner" | "middle" | "outer" | "park";
}

export class CityRoadGraph {
  public readonly config = cityConfig;
  public readonly centerX: number;
  public readonly centerZ: number;
  public readonly intersections: IntersectionNode[] = [];
  public readonly lanes: Lane[] = [];
  public readonly busStops: BusStopLocation[] = [];
  public readonly footpaths: FootpathWaypoint[] = [];
  public readonly footpathLookup = new Map<string, FootpathWaypoint>();

  constructor() {
    this.centerX = cityConfig.park.center[0];
    this.centerZ = cityConfig.park.center[1];

    this.buildIntersections();
    this.buildLanes();
    this.buildBusStops();
    this.buildFootpathGraph();
  }

  private buildIntersections() {
    const { rings, radialCount } = this.config;
    for (let rIdx = 0; rIdx < rings.length; rIdx++) {
      const radius = rings[rIdx];
      for (let radIdx = 0; radIdx < radialCount; radIdx++) {
        const angle = (radIdx * 2 * Math.PI) / radialCount;
        const x = this.centerX + radius * Math.cos(angle);
        const z = this.centerZ + radius * Math.sin(angle);

        // Section 6: Traffic lights at the 8 radial/ring intersections nearest the park
        const hasTrafficLight = rIdx === 0;

        this.intersections.push({
          id: `int_ring${rIdx}_rad${radIdx}`,
          ringIndex: rIdx,
          radialIndex: radIdx,
          radius,
          angle,
          center: { x, z },
          priorityRoad: "radial",
          hasTrafficLight,
        });
      }
    }
  }

  private buildLanes() {
    const { speedKmh } = this.config.traffic;
    const ringRadii = this.config.rings;
    const parkCenter = this.config.park.center;

    // Convert km/h to m/s
    const ringSpeedMs = ((speedKmh.ring[0] + speedKmh.ring[1]) / 2) * (1000 / 3600);
    const radialSpeedMs = ((speedKmh.radial[0] + speedKmh.radial[1]) / 2) * (1000 / 3600);

    // 1. Ring Lanes: inner (cw) and outer (ccw)
    // Ring road width = 12m. 2 drive lanes (3.5m each), lane offsets: -1.75m and +1.75m
    ringRadii.forEach((radius, rIdx) => {
      const numSegments = 128;
      const innerWaypoints: RoadWaypoint[] = [];
      const outerWaypoints: RoadWaypoint[] = [];

      const innerRadius = radius - 1.75;
      const outerRadius = radius + 1.75;

      for (let i = 0; i <= numSegments; i++) {
        const frac = i / numSegments;
        const theta = frac * 2 * Math.PI;

        // Clockwise lane (inner)
        const cwTheta = 2 * Math.PI - theta;
        const ix = parkCenter[0] + innerRadius * Math.cos(cwTheta);
        const iz = parkCenter[1] + innerRadius * Math.sin(cwTheta);
        const cwHeading = cwTheta - Math.PI / 2;
        innerWaypoints.push({ x: ix, z: iz, heading: cwHeading, speedLimit: ringSpeedMs });

        // Counter-Clockwise lane (outer)
        const ox = parkCenter[0] + outerRadius * Math.cos(theta);
        const oz = parkCenter[1] + outerRadius * Math.sin(theta);
        const ccwHeading = theta + Math.PI / 2;
        outerWaypoints.push({ x: ox, z: oz, heading: ccwHeading, speedLimit: ringSpeedMs });
      }

      const innerCircumference = 2 * Math.PI * innerRadius;
      const outerCircumference = 2 * Math.PI * outerRadius;

      this.lanes.push({
        id: `ring_${rIdx}_cw`,
        roadType: "ring",
        ringIndex: rIdx,
        direction: "cw",
        waypoints: innerWaypoints,
        length: innerCircumference,
      });

      this.lanes.push({
        id: `ring_${rIdx}_ccw`,
        roadType: "ring",
        ringIndex: rIdx,
        direction: "ccw",
        waypoints: outerWaypoints,
        length: outerCircumference,
      });
    });

    // 2. Radial Lanes: outbound and inbound
    // Radial road width = 14m. 2 drive lanes + center turning lane.
    // Drive lane centers are at -2.5m (inbound) and +2.5m (outbound) from radial centerline.
    // Starts at inner ring (220m) out to outer boundary (~1000m).
    const innerR = ringRadii[0];
    const outerR = this.config.world.width / 2; // 1000m

    for (let radIdx = 0; radIdx < this.config.radialCount; radIdx++) {
      const angle = (radIdx * 2 * Math.PI) / this.config.radialCount;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const normalX = -sin;
      const normalZ = cos;

      const outboundPoints: RoadWaypoint[] = [];
      const inboundPoints: RoadWaypoint[] = [];

      const numSteps = 50;
      for (let s = 0; s <= numSteps; s++) {
        const frac = s / numSteps;
        const dist = innerR + frac * (outerR - innerR);

        // Center point on radial line
        const cx = parkCenter[0] + dist * cos;
        const cz = parkCenter[1] + dist * sin;

        // Outbound lane: shifted right (+2.5m)
        const ox = cx + normalX * 2.5;
        const oz = cz + normalZ * 2.5;
        outboundPoints.push({
          x: ox,
          z: oz,
          heading: angle,
          speedLimit: radialSpeedMs,
        });

        // Inbound lane: opposite direction, shifted left (-2.5m)
        const inFrac = 1 - frac;
        const inDist = innerR + inFrac * (outerR - innerR);
        const inCx = parkCenter[0] + inDist * cos;
        const inCz = parkCenter[1] + inDist * sin;
        const ix = inCx - normalX * 2.5;
        const iz = inCz - normalZ * 2.5;
        inboundPoints.push({
          x: ix,
          z: iz,
          heading: angle + Math.PI,
          speedLimit: radialSpeedMs,
        });
      }

      this.lanes.push({
        id: `radial_${radIdx}_outbound`,
        roadType: "radial",
        radialIndex: radIdx,
        direction: "outbound",
        waypoints: outboundPoints,
        length: outerR - innerR,
      });

      this.lanes.push({
        id: `radial_${radIdx}_inbound`,
        roadType: "radial",
        radialIndex: radIdx,
        direction: "inbound",
        waypoints: inboundPoints,
        length: outerR - innerR,
      });
    }
  }

  private buildBusStops() {
    // Section 4: Place 1 bus stop every 120-150m (spacing 135m).
    // Alternating sides of the road.
    // 3m x 2m shelter footprint set back 1.5m from road edge on the sidewalk.
    const spacing = this.config.busStop.spacing; // 135
    const ringRadii = this.config.rings;
    const parkCenter = this.config.park.center;

    let stopCounter = 0;

    // Rings
    ringRadii.forEach((radius, rIdx) => {
      const circ = 2 * Math.PI * radius;
      const count = Math.round(circ / spacing);
      const angleStep = (2 * Math.PI) / count;
      const routeName =
        rIdx === 0
          ? "innerRingLoop"
          : rIdx === 1
          ? "middleRingLoop"
          : "outerRingLoop";

      for (let i = 0; i < count; i++) {
        const theta = i * angleStep;
        // Alternate side: inner vs outer sidewalk
        const isOuterSide = i % 2 === 0;
        // Road edge is at radius +/- 6m (road width 12m).
        // Set back 1.5m from road edge into 2.5m sidewalk: offset = 6m + 1.5m = 7.5m
        const rOffset = isOuterSide ? 7.5 : -7.5;
        const stopR = radius + rOffset;

        const x = parkCenter[0] + stopR * Math.cos(theta);
        const z = parkCenter[1] + stopR * Math.sin(theta);
        const rotY = theta + (isOuterSide ? Math.PI / 2 : -Math.PI / 2);

        this.busStops.push({
          id: `bus_stop_ring${rIdx}_${i}`,
          roadType: "ring",
          roadIndex: rIdx,
          position: { x, z },
          side: isOuterSide ? "right" : "left",
          rotationY: rotY,
          routeIds: [routeName],
        });
        stopCounter++;
      }
    });

    // Radials
    const innerR = ringRadii[0];
    const outerR = this.config.world.width / 2;
    const radialLen = outerR - innerR; // 780m
    const radialCount = Math.round(radialLen / spacing); // ~6 stops per radial

    for (let radIdx = 0; radIdx < this.config.radialCount; radIdx++) {
      const angle = (radIdx * 2 * Math.PI) / this.config.radialCount;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const normalX = -sin;
      const normalZ = cos;

      // Radial Express route serves radial 0 (and radial 4 across town)
      const routes = radIdx === 0 || radIdx === 4 ? ["radialExpress"] : [];

      for (let i = 0; i < radialCount; i++) {
        const dist = innerR + (i + 0.5) * spacing;
        if (dist > outerR - 20) continue;

        // Alternate left (-8.5m) and right (+8.5m) from centerline (road width 14m, edge at 7m + 1.5m = 8.5m)
        const isRight = i % 2 === 0;
        const offset = isRight ? 8.5 : -8.5;

        const cx = parkCenter[0] + dist * cos;
        const cz = parkCenter[1] + dist * sin;

        const x = cx + normalX * offset;
        const z = cz + normalZ * offset;
        const rotY = angle + (isRight ? 0 : Math.PI);

        this.busStops.push({
          id: `bus_stop_rad${radIdx}_${i}`,
          roadType: "radial",
          roadIndex: radIdx,
          position: { x, z },
          side: isRight ? "right" : "left",
          rotationY: rotY,
          routeIds: routes,
        });
        stopCounter++;
      }
    }
  }

  private buildFootpathGraph() {
    // Generate footpath waypoints along all sidewalks and pedestrian crossings
    const parkCenter = this.config.park.center;
    const ringRadii = this.config.rings;

    // 1. Ring Footpaths (inner and outer sidewalks for each ring)
    ringRadii.forEach((radius, rIdx) => {
      const count = 48;
      const innerSidewalkR = radius - 7.5;
      const outerSidewalkR = radius + 7.5;

      const innerIds: string[] = [];
      const outerIds: string[] = [];

      for (let i = 0; i < count; i++) {
        const theta = (i * 2 * Math.PI) / count;

        const iId = `fp_ring${rIdx}_inner_${i}`;
        const ix = parkCenter[0] + innerSidewalkR * Math.cos(theta);
        const iz = parkCenter[1] + innerSidewalkR * Math.sin(theta);
        const iNode: FootpathWaypoint = {
          id: iId,
          position: { x: ix, z: iz },
          neighbors: [],
          isCrossing: false,
          blockType: rIdx === 0 ? "inner" : rIdx === 1 ? "middle" : "outer",
        };
        this.footpaths.push(iNode);
        this.footpathLookup.set(iId, iNode);
        innerIds.push(iId);

        const oId = `fp_ring${rIdx}_outer_${i}`;
        const ox = parkCenter[0] + outerSidewalkR * Math.cos(theta);
        const oz = parkCenter[1] + outerSidewalkR * Math.sin(theta);
        const oNode: FootpathWaypoint = {
          id: oId,
          position: { x: ox, z: oz },
          neighbors: [],
          isCrossing: false,
          blockType: rIdx === 0 ? "inner" : rIdx === 1 ? "middle" : "outer",
        };
        this.footpaths.push(oNode);
        this.footpathLookup.set(oId, oNode);
        outerIds.push(oId);
      }

      // Connect perimeter loops
      for (let i = 0; i < count; i++) {
        const next = (i + 1) % count;
        const prev = (i - 1 + count) % count;
        const inNode = this.footpathLookup.get(innerIds[i])!;
        inNode.neighbors.push(innerIds[next], innerIds[prev]);

        const outNode = this.footpathLookup.get(outerIds[i])!;
        outNode.neighbors.push(outerIds[next], outerIds[prev]);
      }
    });

    // 2. Crossings at each intersection (connecting inner and outer sidewalks)
    this.intersections.forEach((inter) => {
      const cId = `fp_crossing_${inter.id}`;
      const cNode: FootpathWaypoint = {
        id: cId,
        position: { x: inter.center.x, z: inter.center.z },
        neighbors: [],
        isCrossing: true,
      };
      this.footpaths.push(cNode);
      this.footpathLookup.set(cId, cNode);

      // Connect crossing to nearest inner and outer sidewalk nodes of this ring
      const sidewalkStep = Math.round((inter.radialIndex * 48) / this.config.radialCount) % 48;
      const innerSidewalkId = `fp_ring${inter.ringIndex}_inner_${sidewalkStep}`;
      const outerSidewalkId = `fp_ring${inter.ringIndex}_outer_${sidewalkStep}`;

      const innerNode = this.footpathLookup.get(innerSidewalkId);
      const outerNode = this.footpathLookup.get(outerSidewalkId);

      if (innerNode) {
        cNode.neighbors.push(innerSidewalkId);
        innerNode.neighbors.push(cId);
      }
      if (outerNode) {
        cNode.neighbors.push(outerSidewalkId);
        outerNode.neighbors.push(cId);
      }
    });

    // 3. Central Park perimeter connection to inner ring sidewalk
    const parkRadius = this.config.park.radius; // 180m
    const parkSteps = 24;
    for (let i = 0; i < parkSteps; i++) {
      const theta = (i * 2 * Math.PI) / parkSteps;
      const pId = `fp_park_${i}`;
      const px = parkCenter[0] + (parkRadius - 5) * Math.cos(theta);
      const pz = parkCenter[1] + (parkRadius - 5) * Math.sin(theta);
      const pNode: FootpathWaypoint = {
        id: pId,
        position: { x: px, z: pz },
        neighbors: [],
        isCrossing: false,
        blockType: "park",
      };
      this.footpaths.push(pNode);
      this.footpathLookup.set(pId, pNode);
    }

    // Connect park perimeter loop and connect radial avenues to inner ring sidewalk
    for (let i = 0; i < parkSteps; i++) {
      const nextId = `fp_park_${(i + 1) % parkSteps}`;
      const prevId = `fp_park_${(i - 1 + parkSteps) % parkSteps}`;
      const pNode = this.footpathLookup.get(`fp_park_${i}`)!;
      pNode.neighbors.push(nextId, prevId);

      // 8 radial connections from park to innermost ring inner sidewalk
      if (i % 3 === 0) {
        const innerIdx = ((i / 3) * (48 / 8)) % 48;
        const ringSidewalkId = `fp_ring0_inner_${innerIdx}`;
        const ringNode = this.footpathLookup.get(ringSidewalkId);
        if (ringNode) {
          pNode.neighbors.push(ringSidewalkId);
          ringNode.neighbors.push(`fp_park_${i}`);
        }
      }
    }
  }

  public getBusStopsForRoute(routeId: string): BusStopLocation[] {
    return this.busStops.filter((s) => s.routeIds.includes(routeId));
  }
}

export const roadGraph = new CityRoadGraph();
