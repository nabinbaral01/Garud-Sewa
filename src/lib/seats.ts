// Seat-map generation for Hiace / buses.
// Layouts: "hiace" (14-seat: 2 + 4 + 4 + 4, front-right driver), "2-2", "2-1".

export type Seat = {
  id: string;
  row: number;
  col: number;
  label: string;
  aisleAfter: boolean;
  driver?: boolean; // driver position — shown but not bookable
};

export function buildSeatMap(totalSeats: number, layout: string): Seat[] {
  if (layout === "hiace") return buildHiaceSeatMap();

  const perRow = layout === "2-1" ? 3 : 4;
  const aisleCol = 1; // aisle after this column index (0-based)
  const seats: Seat[] = [];
  let n = 0;
  let row = 0;
  while (n < totalSeats) {
    for (let col = 0; col < perRow && n < totalSeats; col++) {
      n++;
      seats.push({ id: `S${n}`, row, col, label: String(n), aisleAfter: col === aisleCol });
    }
    row++;
  }
  return seats;
}

// Hiace 13-seater: front row has 1 passenger seat + the driver (right, not bookable),
// then three rows of four (2 + aisle + 2).
function buildHiaceSeatMap(): Seat[] {
  const seats: Seat[] = [];
  // front row: 1 passenger seat + driver (right, not bookable)
  seats.push({ id: "S1", row: 0, col: 0, label: "1", aisleAfter: true });
  seats.push({ id: "DRIVER", row: 0, col: 1, label: "", aisleAfter: false, driver: true });

  let n = 1;
  for (let row = 1; row <= 3; row++) {
    for (let col = 0; col < 4; col++) {
      n++;
      seats.push({ id: `S${n}`, row, col, label: String(n), aisleAfter: col === 1 });
    }
  }
  return seats;
}

export function seatRows(seats: Seat[]): Seat[][] {
  const rows: Seat[][] = [];
  for (const s of seats) {
    (rows[s.row] ||= []).push(s);
  }
  return rows;
}
