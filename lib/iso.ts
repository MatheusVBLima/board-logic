// Isometric projection kernel (iso-figure style): every flat shape is drawn in a
// face's local coordinates and placed on its 3D plane by one SVG matrix().
// Units are grid cells; K converts a cell to SVG user units.

export interface Proj {
  iso: boolean;
  K: number;
  P: (x: number, y: number, z: number) => [number, number];
  TOP: (x: number, y: number, z: number) => string;
  FRONT: (x: number, y: number, z: number) => string;
  SIDE: (x: number, y: number, z: number) => string;
  /** screen radii of a circle of radius r lying on the board plane */
  ellipse: (r: number) => [number, number];
}

const C = Math.cos(Math.PI / 6), S = Math.sin(Math.PI / 6);

export function makeProj(iso: boolean, K = 20): Proj {
  const P = iso
    ? (x: number, y: number, z: number): [number, number] => [(x - y) * C * K, ((x + y) * S - z) * K]
    : (x: number, y: number): [number, number] => [x * K, y * K];
  const D = P; // origin maps to 0,0 so directions project the same way
  const f = (n: number) => +n.toFixed(4);
  const plane = (O: number[], U: number[], V: number[]) => {
    const o = P(O[0], O[1], O[2]), u = D(U[0], U[1], U[2]), v = D(V[0], V[1], V[2]);
    return `matrix(${f(u[0])} ${f(u[1])} ${f(v[0])} ${f(v[1])} ${f(o[0])} ${f(o[1])})`;
  };
  return {
    iso, K, P,
    TOP: (x, y, z) => plane([x, y, z], [1, 0, 0], [0, 1, 0]),
    FRONT: (x, y, z) => plane([x, y, z], [1, 0, 0], [0, 0, -1]),
    SIDE: (x, y, z) => plane([x, y, z], [0, -1, 0], [0, 0, -1]),
    ellipse: r => (iso ? [r * K * Math.SQRT2 * C, r * K * Math.SQRT2 * S] : [r * K, r * K]),
  };
}
