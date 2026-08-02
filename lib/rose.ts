import * as THREE from "three";

export interface RosePointsData {
  positions: Float32Array;
  colors: Float32Array;
}

const DEG2RAD = Math.PI / 180;
const GOLDEN_ANGLE = 137.508 * DEG2RAD;

const COLOR_DARK = new THREE.Color("#5c0a24");
const COLOR_MID = new THREE.Color("#ff2d78");
const COLOR_PINK = new THREE.Color("#ff7ab8");
const COLOR_GOLD = new THREE.Color("#ffc96b");

export function buildRosePoints(count: number, radius = 2.3): RosePointsData {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const tmp = new THREE.Color();

  const petals = 7;
  const sector = (Math.PI * 2) / petals;
  const maxI = Math.max(count - 1, 1);

  for (let i = 0; i < count; i++) {
    const t = i / maxI;
    const phi = i * GOLDEN_ANGLE;
    const u = Math.sqrt(t);
    const r = u * radius;

    const within = ((phi % sector) + sector) % sector;
    const w = (within - sector / 2) / (sector / 2);
    const edge = 1 - Math.abs(w);

    const scallop = 1 - 0.3 * Math.pow(Math.abs(w), 1.6);
    const rr = r * scallop;

    const bud = Math.max(0, 1 - u / 0.16);
    const budY = bud * bud * 0.3 * radius;

    const curl = Math.pow(u, 1.2) * (0.6 + 0.4 * edge);
    const dip = 0.38 * u * u;
    const y = curl * radius * 0.8 - dip * radius + budY;

    const fold = Math.pow(u, 2.2) * 0.1;

    const jx = (Math.random() - 0.5) * 0.04;
    const jy = (Math.random() - 0.5) * 0.04;
    const jz = (Math.random() - 0.5) * 0.04;

    positions[i * 3 + 0] = rr * Math.cos(phi) * (1 - fold) + jx;
    positions[i * 3 + 1] = y + jy;
    positions[i * 3 + 2] = rr * Math.sin(phi) * (1 - fold) + jz;

    const rim = Math.min(1, Math.max(0, u * 1.1 + (edge - 0.5) * 0.35));
    if (rim < 0.45) tmp.copy(COLOR_DARK).lerp(COLOR_MID, rim / 0.45);
    else if (rim < 0.85)
      tmp.copy(COLOR_MID).lerp(COLOR_PINK, (rim - 0.45) / 0.4);
    else tmp.copy(COLOR_PINK).lerp(COLOR_GOLD, (rim - 0.85) / 0.15);

    const v = 0.75 + Math.random() * 0.25;
    colors[i * 3 + 0] = tmp.r * v;
    colors[i * 3 + 1] = tmp.g * v;
    colors[i * 3 + 2] = tmp.b * v;
  }

  return { positions, colors };
}
