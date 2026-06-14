// Hiace route stops with cumulative fare from the origin.

export type Stop = { name: string; fare: number; time?: string };

export function parseStops(json: string | null | undefined): Stop[] {
  if (!json) return [];
  try {
    const arr = JSON.parse(json);
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((s) => s && typeof s.name === "string")
      .map((s) => ({ name: String(s.name).trim(), fare: Number(s.fare) || 0, time: s.time ? String(s.time) : "" }));
  } catch {
    return [];
  }
}

// Effective stop list for a bus. Always anchored by the trip's origin (fare 0,
// first) and destination (fare = baseFare, last), with any admin-listed
// intermediate stops in between. This way a from→to search always works even if
// the admin only entered the in-between stops.
export function effectiveStops(
  stopsJson: string | null | undefined,
  fromName: string,
  toName: string,
  baseFare: number,
  originTime = "",
  destTime = ""
): Stop[] {
  const parsed = parseStops(stopsJson);
  const has = (n: string) => parsed.some((s) => s.name.toLowerCase() === n.toLowerCase());

  let stops = parsed;
  if (!has(fromName)) stops = [{ name: fromName, fare: 0, time: originTime }, ...stops];
  if (!has(toName)) stops = [...stops, { name: toName, fare: baseFare, time: destTime }];

  // need at least origin + destination
  if (stops.length < 2) return [{ name: fromName, fare: 0, time: originTime }, { name: toName, fare: baseFare, time: destTime }];
  return stops;
}

export function stopTime(stops: Stop[], name: string): string {
  return stops.find((s) => s.name.toLowerCase() === name.toLowerCase())?.time || "";
}

// Find the segment fare between two stop names (order matters). Returns null if
// the bus does not serve that segment (either stop missing or wrong direction).
export function segmentFare(
  stops: Stop[],
  from: string,
  to: string
): { fare: number; fromName: string; toName: string } | null {
  const i = stops.findIndex((s) => s.name.toLowerCase() === from.toLowerCase());
  const j = stops.findIndex((s) => s.name.toLowerCase() === to.toLowerCase());
  if (i < 0 || j < 0 || i >= j) return null;
  return { fare: Math.max(0, stops[j].fare - stops[i].fare), fromName: stops[i].name, toName: stops[j].name };
}

export function stopIdx(stops: Stop[], name: string): number {
  return stops.findIndex((s) => s.name.toLowerCase() === name.toLowerCase());
}

// Two boarding→alighting segments overlap (i.e. compete for the same physical
// seat) only if they share road in between — touching at a single stop is fine.
export function segmentsOverlap(aFrom: number, aTo: number, bFrom: number, bTo: number): boolean {
  return aFrom < bTo && bFrom < aTo;
}

// Overlap test that is direction-agnostic (uses min/max), for comparing two
// segments by their physical positions along the corridor.
export function rangesOverlap(a1: number, a2: number, b1: number, b2: number): boolean {
  const aLo = Math.min(a1, a2), aHi = Math.max(a1, a2);
  const bLo = Math.min(b1, b2), bHi = Math.max(b1, b2);
  return aLo < bHi && bLo < aHi;
}

// Whether a seat already booked on segment [f,t] conflicts with the requested
// segment [reqLo,reqHi]. Fails SAFE: if positions are unknown (-1) or degenerate
// (a segment whose ends map to the same position, i.e. mis-ordered places), it
// treats the seat as taken so it's never oversold.
export function seatsConflict(reqLo: number, reqHi: number, f: number, t: number): boolean {
  if ([reqLo, reqHi, f, t].some((x) => x < 0)) return true;
  if (reqLo === reqHi || f === t) return true;
  return rangesOverlap(reqLo, reqHi, f, t);
}
