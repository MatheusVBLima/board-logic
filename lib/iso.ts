// Projection kernel (iso-figure style): every flat shape is drawn in a face's local
// coordinates and placed on its 3D plane by one SVG matrix(). Units are grid cells;
// K converts a cell to SVG user units.
//
// The 3D view looks at the board from the front, tilted back: x stays horizontal,
// depth (y) is foreshortened and height (z) rises straight up. Only top and front
// faces are visible, so the board reads level instead of as a diagonal diamond.

export interface Proj {
  iso: boolean;
  K: number;
  P: (x: number, y: number, z: number) => [number, number];
  TOP: (x: number, y: number, z: number) => string;
  FRONT: (x: number, y: number, z: number) => string;
  /** screen radii of a circle of radius r lying on the board plane */
  ellipse: (r: number) => [number, number];
}

/** foreshortening of depth and of height in the 3D view */
export const TILT_Y = 0.62, TILT_Z = 0.78;

export function makeProj(iso: boolean, K = 20): Proj {
  const ay = iso ? TILT_Y : 1, az = iso ? TILT_Z : 0;
  const P = (x: number, y: number, z: number): [number, number] => [x * K, (y * ay - z * az) * K];
  const f = (n: number) => +n.toFixed(4);
  const plane = (O: number[], U: number[], V: number[]) => {
    const o = P(O[0], O[1], O[2]), u = P(U[0], U[1], U[2]), v = P(V[0], V[1], V[2]);
    return `matrix(${f(u[0])} ${f(u[1])} ${f(v[0])} ${f(v[1])} ${f(o[0])} ${f(o[1])})`;
  };
  return {
    iso, K, P,
    TOP: (x, y, z) => plane([x, y, z], [1, 0, 0], [0, 1, 0]),
    FRONT: (x, y, z) => plane([x, y, z], [1, 0, 0], [0, 0, -1]),
    ellipse: r => [r * K, r * K * ay],
  };
}
