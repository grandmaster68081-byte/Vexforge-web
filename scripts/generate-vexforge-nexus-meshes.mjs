import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(
  root,
  'unity/Assets/Resources/VexforgeTier1/Models',
);
const materialNames = [
  'VEXFORGE_OBSIDIAN',
  'VEXFORGE_IRON',
  'VEXFORGE_BRASS',
  'VEXFORGE_CYAN',
  'VEXFORGE_ACCENT',
];

fs.mkdirSync(output, { recursive: true });

function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function subtract(a, b) {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function cross(a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

function normalize(value) {
  const length = Math.hypot(value[0], value[1], value[2]) || 1;
  return value.map((component) => component / length);
}

function pngChunk(type, data) {
  const name = Buffer.from(type, 'ascii');
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const crcInput = Buffer.concat([name, data]);
  let crc = 0xffffffff;
  for (const byte of crcInput) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE((crc ^ 0xffffffff) >>> 0);
  return Buffer.concat([length, name, data, checksum]);
}

function writeTexture(name, color, style) {
  const width = 256;
  const height = 256;
  const raw = Buffer.alloc((width * 3 + 1) * height);
  let state = style.seed >>> 0;
  const random = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0xffffffff;
  };

  for (let y = 0; y < height; y++) {
    const row = y * (width * 3 + 1);
    raw[row] = 0;
    for (let x = 0; x < width; x++) {
      const grain = (random() - 0.5) * style.grain;
      const broad = Math.sin((x + style.phase) * 0.047) *
        Math.cos((y - style.phase) * 0.031) * style.wave;
      const seam = style.seam &&
        (x % 64 < 2 || y % 64 < 2) ? style.seam : 0;
      const fleck = style.fleck &&
        random() > 0.998 ? style.fleck : 0;
      for (let channel = 0; channel < 3; channel++) {
        const value = color[channel] + grain + broad + seam + fleck;
        raw[row + 1 + x * 3 + channel] =
          Math.max(0, Math.min(255, Math.round(value)));
      }
    }
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 2;
  header[10] = 0;
  header[11] = 0;
  header[12] = 0;
  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', header),
    pngChunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
  fs.writeFileSync(path.join(output, name), png);
}

writeTexture('VF_NEXUS_OBSIDIAN_ALBEDO.png', [38, 34, 52], {
  seed: 17291,
  phase: 13,
  grain: 19,
  wave: 8,
  seam: 8,
  fleck: 9,
});
writeTexture('VF_NEXUS_IRON_ALBEDO.png', [70, 76, 86], {
  seed: 31907,
  phase: 47,
  grain: 16,
  wave: 5,
  seam: 10,
  fleck: 4,
});
writeTexture('VF_NEXUS_BRASS_ALBEDO.png', [121, 83, 36], {
  seed: 9181,
  phase: 71,
  grain: 21,
  wave: 6,
  seam: 16,
  fleck: 17,
});
writeTexture('VF_NEXUS_CYAN_ALBEDO.png', [24, 106, 133], {
  seed: 49021,
  phase: 101,
  grain: 12,
  wave: 11,
  seam: 21,
  fleck: 3,
});

class ObjBuilder {
  constructor(name) {
    this.name = name;
    this.lines = [
      '# Original VEXFORGE Nexus geometry. Generated deterministically from source.',
      'mtllib VEXFORGE_NEXUS_KIT.mtl',
      's off',
    ];
    this.faceCount = 0;
  }

  object(name) {
    this.lines.push(`o ${name}`);
  }

  triangle(points, material, expectedNormal, uvs) {
    let vertices = points;
    const firstNormal = cross(
      subtract(vertices[1], vertices[0]),
      subtract(vertices[2], vertices[0]),
    );
    if (dot(firstNormal, expectedNormal) < 0) {
      vertices = [vertices[0], vertices[2], vertices[1]];
    }
    const normal = normalize(
      cross(
        subtract(vertices[1], vertices[0]),
        subtract(vertices[2], vertices[0]),
      ),
    );
    this.lines.push(`usemtl ${material}`);
    const indices = [];
    for (let index = 0; index < 3; index++) {
      const p = vertices[index];
      let projection;
      if (Math.abs(normal[1]) >= Math.abs(normal[0]) &&
          Math.abs(normal[1]) >= Math.abs(normal[2])) {
        projection = [p[0], p[2]];
      } else if (Math.abs(normal[0]) >= Math.abs(normal[2])) {
        projection = [p[2], p[1]];
      } else {
        projection = [p[0], p[1]];
      }
      const uv = uvs ? uvs[index] : projection.map((value) => value * 0.14);
      this.lines.push(`v ${p[0].toFixed(5)} ${p[1].toFixed(5)} ${p[2].toFixed(5)}`);
      this.lines.push(`vt ${uv[0].toFixed(5)} ${uv[1].toFixed(5)}`);
      this.lines.push(`vn ${normal.map((value) => value.toFixed(5)).join(' ')}`);
      indices.push(this.faceCount * 3 + index + 1);
    }
    this.lines.push(`f ${indices.map((index) => `${index}/${index}/${index}`).join(' ')}`);
    this.faceCount++;
  }

  quad(points, material, expectedNormal) {
    this.triangle([points[0], points[1], points[2]], material, expectedNormal);
    this.triangle([points[0], points[2], points[3]], material, expectedNormal);
  }

  write() {
    fs.writeFileSync(
      path.join(output, `${this.name}.obj`),
      `${this.lines.join('\n')}\n`,
    );
    return this.faceCount;
  }
}

function radialPoint(radius, angle, y, center = [0, 0, 0], variation = 0) {
  const adjusted = radius * (1 + variation * Math.sin(angle * 5.0 + 0.4));
  return [
    center[0] + Math.cos(angle) * adjusted,
    center[1] + y,
    center[2] + Math.sin(angle) * adjusted,
  ];
}

function buildSteppedDais() {
  const mesh = new ObjBuilder('VF_NEXUS_CITADEL_DAIS');
  const sides = 32;
  const levels = [
    { radius: 10.8, y: -0.72, material: 'VEXFORGE_OBSIDIAN' },
    { radius: 10.8, y: -0.46, material: 'VEXFORGE_IRON' },
    { radius: 10.35, y: -0.18, material: 'VEXFORGE_IRON' },
    { radius: 9.62, y: -0.12, material: 'VEXFORGE_BRASS' },
    { radius: 9.24, y: 0.05, material: 'VEXFORGE_OBSIDIAN' },
    { radius: 8.55, y: 0.08, material: 'VEXFORGE_OBSIDIAN' },
  ];
  const rings = levels.map((level, ringIndex) => {
    return Array.from({ length: sides }, (_, index) => {
      const angle = (index / sides) * Math.PI * 2;
      const variation = ringIndex === 4 ? 0.012 : 0.004;
      return radialPoint(level.radius, angle, level.y, [0, 0, 0], variation);
    });
  });

  for (let level = 0; level < levels.length - 1; level++) {
    for (let index = 0; index < sides; index++) {
      const next = (index + 1) % sides;
      const a = rings[level][index];
      const b = rings[level][next];
      const c = rings[level + 1][next];
      const d = rings[level + 1][index];
      const angle = ((index + 0.5) / sides) * Math.PI * 2;
      mesh.quad(
        [a, b, c, d],
        levels[level].material,
        [Math.cos(angle), 0.12, Math.sin(angle)],
      );
    }
  }

  const topRing = rings[rings.length - 1];
  const center = [0, levels[levels.length - 1].y, 0];
  for (let index = 0; index < sides; index++) {
    const next = (index + 1) % sides;
    mesh.triangle(
      [center, topRing[index], topRing[next]],
      index % 8 === 0 ? 'VEXFORGE_IRON' : 'VEXFORGE_OBSIDIAN',
      [0, 1, 0],
    );
  }

  mesh.object('VF_NEXUS_COURTYARD_RELIEFS');
  for (let index = 0; index < 8; index++) {
    const angle = (index / 8) * Math.PI * 2 + Math.PI / 8;
    const inner = radialPoint(3.2, angle, 0.105, [0, 0, 0]);
    const outerA = radialPoint(8.15, angle - 0.012, 0.105, [0, 0, 0]);
    const outerB = radialPoint(8.15, angle + 0.012, 0.105, [0, 0, 0]);
    const innerA = radialPoint(3.2, angle - 0.038, 0.105, [0, 0, 0]);
    const innerB = radialPoint(3.2, angle + 0.038, 0.105, [0, 0, 0]);
    mesh.quad([innerA, outerA, outerB, innerB], 'VEXFORGE_BRASS', [0, 1, 0]);
  }

  mesh.object('VF_NEXUS_PERIMETER_BUTTRESSES');
  for (let pillar = 0; pillar < 8; pillar++) {
    const angle = (pillar / 8) * Math.PI * 2;
    const centerX = Math.cos(angle) * 8.95;
    const centerZ = Math.sin(angle) * 8.95;
    const sidesForPillar = 8;
    const pillarLevels = [
      { y: 0.10, radius: 0.60 },
      { y: 0.42, radius: 0.48 },
      { y: 1.24 + (pillar % 2) * 0.28, radius: 0.26 },
      { y: 1.45 + (pillar % 2) * 0.28, radius: 0.16 },
    ];
    for (let level = 0; level < pillarLevels.length - 1; level++) {
      for (let side = 0; side < sidesForPillar; side++) {
        const a0 = angle + (side / sidesForPillar) * Math.PI * 2;
        const a1 = angle + ((side + 1) / sidesForPillar) * Math.PI * 2;
        const lower = pillarLevels[level];
        const upper = pillarLevels[level + 1];
        const midpoint = (a0 + a1) * 0.5;
        mesh.quad(
          [
            radialPoint(lower.radius, a0, lower.y, [centerX, 0, centerZ]),
            radialPoint(lower.radius, a1, lower.y, [centerX, 0, centerZ]),
            radialPoint(upper.radius, a1, upper.y, [centerX, 0, centerZ]),
            radialPoint(upper.radius, a0, upper.y, [centerX, 0, centerZ]),
          ],
          level === 1 && side % 3 === 0 ? 'VEXFORGE_BRASS' : 'VEXFORGE_OBSIDIAN',
          [Math.cos(midpoint), 0, Math.sin(midpoint)],
        );
      }
    }
  }
  return mesh.write();
}

function addFacetedStack(mesh, objectName, center, sides, levels, variation = 0.025) {
  mesh.object(objectName);
  const rings = levels.map((level, levelIndex) => {
    return Array.from({ length: sides }, (_, index) => {
      const angle = (index / sides) * Math.PI * 2 + Math.PI / sides;
      return radialPoint(
        level.radius,
        angle,
        level.y,
        center,
        levelIndex === 0 || levelIndex === levels.length - 1 ? 0 : variation,
      );
    });
  });

  for (let level = 0; level < levels.length - 1; level++) {
    for (let index = 0; index < sides; index++) {
      const next = (index + 1) % sides;
      const angle = ((index + 0.5) / sides) * Math.PI * 2 + Math.PI / sides;
      mesh.quad(
        [
          rings[level][index],
          rings[level][next],
          rings[level + 1][next],
          rings[level + 1][index],
        ],
        levels[level].material,
        [Math.cos(angle), 0.08, Math.sin(angle)],
      );
    }
  }

  const top = rings[rings.length - 1];
  const topCenter = [center[0], center[1] + levels[levels.length - 1].y, center[2]];
  for (let index = 0; index < sides; index++) {
    mesh.triangle(
      [topCenter, top[index], top[(index + 1) % sides]],
      levels[levels.length - 1].material,
      [0, 1, 0],
    );
  }
}

function buildCitadelSpine() {
  const mesh = new ObjBuilder('VF_NEXUS_CITADEL_SPINE');
  addFacetedStack(
    mesh,
    'VF_NEXUS_OBSIDIAN_SPINE',
    [0, 0, 0],
    12,
    [
      { y: 0, radius: 1.30, material: 'VEXFORGE_OBSIDIAN' },
      { y: 0.38, radius: 1.58, material: 'VEXFORGE_IRON' },
      { y: 0.86, radius: 1.42, material: 'VEXFORGE_OBSIDIAN' },
      { y: 1.12, radius: 1.00, material: 'VEXFORGE_BRASS' },
      { y: 1.34, radius: 0.82, material: 'VEXFORGE_OBSIDIAN' },
      { y: 4.40, radius: 0.62, material: 'VEXFORGE_OBSIDIAN' },
      { y: 4.70, radius: 0.92, material: 'VEXFORGE_IRON' },
      { y: 4.96, radius: 0.72, material: 'VEXFORGE_CYAN' },
      { y: 5.25, radius: 0.48, material: 'VEXFORGE_OBSIDIAN' },
      { y: 6.18, radius: 0.10, material: 'VEXFORGE_BRASS' },
    ],
  );

  mesh.object('VF_NEXUS_SPINE_LUMEN_VANES');
  for (let vane = 0; vane < 8; vane++) {
    const angle = (vane / 8) * Math.PI * 2;
    const angleOffset = Math.PI / 12;
    const low = 1.6;
    const high = 4.35;
    const radius = 0.78;
    const points = [
      radialPoint(radius, angle - angleOffset, low, [0, 0, 0]),
      radialPoint(radius + 0.02, angle, low + 0.32, [0, 0, 0]),
      radialPoint(radius, angle + angleOffset, low, [0, 0, 0]),
      radialPoint(radius * 0.80, angle, high, [0, 0, 0]),
    ];
    mesh.triangle(
      [points[0], points[1], points[3]],
      vane % 2 ? 'VEXFORGE_CYAN' : 'VEXFORGE_ACCENT',
      [Math.cos(angle), 0.1, Math.sin(angle)],
    );
    mesh.triangle(
      [points[1], points[2], points[3]],
      vane % 2 ? 'VEXFORGE_ACCENT' : 'VEXFORGE_CYAN',
      [Math.cos(angle), 0.1, Math.sin(angle)],
    );
  }

  return mesh.write();
}

function addPylon(mesh, name, x, z, levels, sides, material) {
  addFacetedStack(mesh, name, [x, 0, z], sides, levels.map((entry) => ({
    ...entry,
    material: entry.material || material,
  })), 0.04);
}

function buildPortalGate() {
  const mesh = new ObjBuilder('VF_NEXUS_PORTAL_GATE');
  const depth = 0.42;
  const front = -depth * 0.5;
  const back = depth * 0.5;
  const outer = [
    [-1.42, 0.12], [-1.42, 2.06], [-1.31, 2.45], [-1.03, 2.82],
    [-0.56, 3.15], [0, 3.31], [0.56, 3.15], [1.03, 2.82],
    [1.31, 2.45], [1.42, 2.06], [1.42, 0.12],
  ];
  const inner = [
    [-0.74, 0.12], [-0.74, 1.98], [-0.68, 2.22], [-0.48, 2.45],
    [-0.25, 2.61], [0, 2.68], [0.25, 2.61], [0.48, 2.45],
    [0.68, 2.22], [0.74, 1.98], [0.74, 0.12],
  ];
  const frontPoint = (point) => [point[0], point[1], front];
  const backPoint = (point) => [point[0], point[1], back];

  mesh.object('VF_PORTAL_OBSIDIAN_ARCH');
  for (let index = 0; index < outer.length - 1; index++) {
    const next = index + 1;
    const material = index >= 3 && index <= 7 ? 'VEXFORGE_IRON' : 'VEXFORGE_OBSIDIAN';
    mesh.quad(
      [
        frontPoint(outer[index]),
        frontPoint(outer[next]),
        frontPoint(inner[next]),
        frontPoint(inner[index]),
      ],
      material,
      [0, 0, -1],
    );
    mesh.quad(
      [
        backPoint(outer[index]),
        backPoint(outer[next]),
        backPoint(inner[next]),
        backPoint(inner[index]),
      ],
      material,
      [0, 0, 1],
    );
    const radial = normalize([
      (outer[index][0] + outer[next][0]) * 0.5,
      (outer[index][1] + outer[next][1]) * 0.5 - 1.6,
      0,
    ]);
    mesh.quad(
      [
        frontPoint(outer[index]),
        frontPoint(outer[next]),
        backPoint(outer[next]),
        backPoint(outer[index]),
      ],
      'VEXFORGE_OBSIDIAN',
      radial,
    );
    const apertureNormal = normalize([
      -(inner[index][0] + inner[next][0]) * 0.5,
      1.7 - (inner[index][1] + inner[next][1]) * 0.5,
      0,
    ]);
    mesh.quad(
      [
        frontPoint(inner[index]),
        frontPoint(inner[next]),
        backPoint(inner[next]),
        backPoint(inner[index]),
      ],
      'VEXFORGE_IRON',
      apertureNormal,
    );
  }

  mesh.object('VF_PORTAL_BASTION_FEET');
  addPylon(mesh, 'VF_PORTAL_LEFT_BASTION', -1.15, 0, [
    { y: 0.04, radius: 0.48 },
    { y: 0.28, radius: 0.60 },
    { y: 0.64, radius: 0.44 },
    { y: 1.18, radius: 0.27 },
    { y: 1.38, radius: 0.36 },
  ], 8, 'VEXFORGE_OBSIDIAN');
  addPylon(mesh, 'VF_PORTAL_RIGHT_BASTION', 1.15, 0, [
    { y: 0.04, radius: 0.48 },
    { y: 0.28, radius: 0.60 },
    { y: 0.64, radius: 0.44 },
    { y: 1.18, radius: 0.27 },
    { y: 1.38, radius: 0.36 },
  ], 8, 'VEXFORGE_OBSIDIAN');

  mesh.object('VF_PORTAL_RUNIC_INLAY');
  const glyphZ = front - 0.025;
  const rune = [
    [-0.18, 2.92, glyphZ],
    [0, 3.18, glyphZ],
    [0.18, 2.92, glyphZ],
    [0, 2.68, glyphZ],
  ];
  mesh.quad(rune, 'VEXFORGE_ACCENT', [0, 0, -1]);
  const sideGlyphs = [
    [[-1.12, 0.62, glyphZ], [-0.94, 0.92, glyphZ], [-0.82, 0.64, glyphZ], [-0.95, 0.38, glyphZ]],
    [[1.12, 0.62, glyphZ], [0.95, 0.38, glyphZ], [0.82, 0.64, glyphZ], [0.94, 0.92, glyphZ]],
  ];
  for (const side of sideGlyphs) {
    mesh.quad(side, 'VEXFORGE_CYAN', [0, 0, -1]);
  }

  addPylon(mesh, 'VF_PORTAL_KESTONE', 0, front - 0.08, [
    { y: 2.98, radius: 0.27 },
    { y: 3.12, radius: 0.34 },
    { y: 3.31, radius: 0.22 },
    { y: 3.47, radius: 0.05 },
  ], 6, 'VEXFORGE_BRASS');

  return mesh.write();
}

function battleOvalPoint(radiusX, radiusZ, angle, y) {
  return [
    Math.cos(angle) * radiusX,
    y,
    Math.sin(angle) * radiusZ,
  ];
}

function addBattleStack(mesh, name, centerX, centerZ, levels, sides = 8) {
  mesh.object(name);
  const rings = levels.map((level) =>
    Array.from({ length: sides }, (_, index) => {
      const angle = (index / sides) * Math.PI * 2 + Math.PI / sides;
      return [
        centerX + Math.cos(angle) * level.radius,
        level.y,
        centerZ + Math.sin(angle) * level.radius,
      ];
    }),
  );

  for (let levelIndex = 0; levelIndex < levels.length - 1; levelIndex++) {
    const current = levels[levelIndex];
    const next = levels[levelIndex + 1];
    for (let index = 0; index < sides; index++) {
      const nextIndex = (index + 1) % sides;
      const angle = ((index + 0.5) / sides) * Math.PI * 2 + Math.PI / sides;
      mesh.quad(
        [
          rings[levelIndex][index],
          rings[levelIndex][nextIndex],
          rings[levelIndex + 1][nextIndex],
          rings[levelIndex + 1][index],
        ],
        current.material,
        [Math.cos(angle), 0, Math.sin(angle)],
      );
    }
  }

  const top = rings[rings.length - 1];
  const topY = levels[levels.length - 1].y;
  for (let index = 0; index < sides; index++) {
    const nextIndex = (index + 1) % sides;
    mesh.triangle(
      [
        [centerX, topY, centerZ],
        top[index],
        top[nextIndex],
      ],
      levels[levels.length - 1].material,
      [0, 1, 0],
    );
  }
}

function addBattleGate(mesh, centerZ, name) {
  const outer = [
    [-1.74, -0.18], [-1.74, 1.48], [-1.51, 2.02], [-1.06, 2.49],
    [-0.54, 2.83], [0, 3.00], [0.54, 2.83], [1.06, 2.49],
    [1.51, 2.02], [1.74, 1.48], [1.74, -0.18],
  ];
  const inner = [
    [-1.26, -0.18], [-1.26, 1.43], [-1.08, 1.83], [-0.72, 2.18],
    [-0.36, 2.41], [0, 2.55], [0.36, 2.41], [0.72, 2.18],
    [1.08, 1.83], [1.26, 1.43], [1.26, -0.18],
  ];
  const frontZ = centerZ - 0.32;
  const backZ = centerZ + 0.32;
  mesh.object(name);

  for (let index = 0; index < outer.length - 1; index++) {
    const frontOuter = [outer[index][0], outer[index][1], frontZ];
    const frontNextOuter = [outer[index + 1][0], outer[index + 1][1], frontZ];
    const frontInner = [inner[index][0], inner[index][1], frontZ];
    const frontNextInner = [inner[index + 1][0], inner[index + 1][1], frontZ];
    const backOuter = [outer[index][0], outer[index][1], backZ];
    const backNextOuter = [outer[index + 1][0], outer[index + 1][1], backZ];
    const backInner = [inner[index][0], inner[index][1], backZ];
    const backNextInner = [inner[index + 1][0], inner[index + 1][1], backZ];

    const trim = index === 4 || index === 5
      ? 'VEXFORGE_BRASS'
      : 'VEXFORGE_IRON';
    mesh.quad(
      [frontOuter, frontNextOuter, frontNextInner, frontInner],
      trim,
      [0, 0, -1],
    );
    mesh.quad(
      [backNextOuter, backOuter, backInner, backNextInner],
      'VEXFORGE_OBSIDIAN',
      [0, 0, 1],
    );
    mesh.quad(
      [frontOuter, frontNextOuter, backNextOuter, backOuter],
      'VEXFORGE_OBSIDIAN',
      [0, 1, 0],
    );
    mesh.quad(
      [frontInner, backInner, backNextInner, frontNextInner],
      'VEXFORGE_CYAN',
      [0, 0, -1],
    );
  }
}

function buildBattleArena() {
  const mesh = new ObjBuilder('VF_BATTLE_CITADEL_ARENA');
  const segments = 48;
  const levels = [
    { radiusX: 8.9, radiusZ: 7.35, y: -0.70, material: 'VEXFORGE_OBSIDIAN' },
    { radiusX: 8.9, radiusZ: 7.35, y: -0.48, material: 'VEXFORGE_IRON' },
    { radiusX: 8.64, radiusZ: 7.08, y: -0.34, material: 'VEXFORGE_BRASS' },
    { radiusX: 8.38, radiusZ: 6.83, y: -0.24, material: 'VEXFORGE_IRON' },
    { radiusX: 7.84, radiusZ: 6.34, y: -0.18, material: 'VEXFORGE_OBSIDIAN' },
  ];

  mesh.object('VF_BATTLE_TIERED_OVAL_DAIS');
  for (let levelIndex = 0; levelIndex < levels.length - 1; levelIndex++) {
    const current = levels[levelIndex];
    const next = levels[levelIndex + 1];
    for (let index = 0; index < segments; index++) {
      const angle = (index / segments) * Math.PI * 2;
      const nextAngle = ((index + 1) / segments) * Math.PI * 2;
      const outward = [Math.cos(angle + Math.PI / segments), 0.12, Math.sin(angle + Math.PI / segments)];
      mesh.quad(
        [
          battleOvalPoint(current.radiusX, current.radiusZ, angle, current.y),
          battleOvalPoint(current.radiusX, current.radiusZ, nextAngle, current.y),
          battleOvalPoint(next.radiusX, next.radiusZ, nextAngle, next.y),
          battleOvalPoint(next.radiusX, next.radiusZ, angle, next.y),
        ],
        current.material,
        outward,
      );
    }
  }

  const top = levels[levels.length - 1];
  for (let index = 0; index < segments; index++) {
    const angle = (index / segments) * Math.PI * 2;
    const nextAngle = ((index + 1) / segments) * Math.PI * 2;
    const material = index % 8 === 0 ? 'VEXFORGE_BRASS' : 'VEXFORGE_OBSIDIAN';
    mesh.triangle(
      [
        [0, top.y, 0],
        battleOvalPoint(top.radiusX, top.radiusZ, angle, top.y),
        battleOvalPoint(top.radiusX, top.radiusZ, nextAngle, top.y),
      ],
      material,
      [0, 1, 0],
    );
  }

  mesh.object('VF_BATTLE_PLAYER_AND_RIVAL_WARD_INLAYS');
  for (const side of [-1, 1]) {
    const material = side < 0 ? 'VEXFORGE_CYAN' : 'VEXFORGE_ACCENT';
    const zoneZ = side * 2.95;
    for (const x of [-5.3, -3.4, 3.4, 5.3]) {
      const halfWidth = 0.20;
      const halfDepth = 0.34;
      const y = -0.155;
      mesh.quad(
        [
          [x, y, zoneZ - halfDepth],
          [x + halfWidth, y, zoneZ],
          [x, y, zoneZ + halfDepth],
          [x - halfWidth, y, zoneZ],
        ],
        material,
        [0, 1, 0],
      );
    }
    for (const x of [-6.1, 6.1]) {
      mesh.quad(
        [
          [x - 0.52, -0.15, zoneZ - 0.08],
          [x + 0.52, -0.15, zoneZ - 0.08],
          [x + 0.36, -0.15, zoneZ + 0.08],
          [x - 0.36, -0.15, zoneZ + 0.08],
        ],
        'VEXFORGE_BRASS',
        [0, 1, 0],
      );
    }
  }

  mesh.object('VF_BATTLE_GATEWAYS');
  addBattleGate(mesh, -6.12, 'VF_BATTLE_GATEWAY_PLAYER');
  addBattleGate(mesh, 6.12, 'VF_BATTLE_GATEWAY_RIVAL');

  const pillarLevels = [
    { y: -0.18, radius: 0.72, material: 'VEXFORGE_OBSIDIAN' },
    { y: 0.08, radius: 0.72, material: 'VEXFORGE_IRON' },
    { y: 0.34, radius: 0.52, material: 'VEXFORGE_BRASS' },
    { y: 1.44, radius: 0.30, material: 'VEXFORGE_OBSIDIAN' },
    { y: 1.68, radius: 0.45, material: 'VEXFORGE_BRASS' },
    { y: 1.92, radius: 0.26, material: 'VEXFORGE_IRON' },
    { y: 2.48, radius: 0.11, material: 'VEXFORGE_CYAN' },
  ];
  for (const x of [-7.0, 7.0]) {
    for (const z of [-5.65, 5.65]) {
      addBattleStack(
        mesh,
        `VF_BATTLE_SENTINEL_${x < 0 ? 'WEST' : 'EAST'}_${z < 0 ? 'PLAYER' : 'RIVAL'}`,
        x,
        z,
        pillarLevels,
      );
    }
  }

  return mesh.write();
}

function buildBattleCore() {
  const mesh = new ObjBuilder('VF_BATTLE_CITADEL_CORE');
  addBattleStack(mesh, 'VF_BATTLE_CORE_RELIQUARY', 0, 0, [
    { y: -0.12, radius: 0.96, material: 'VEXFORGE_OBSIDIAN' },
    { y: 0.04, radius: 1.12, material: 'VEXFORGE_IRON' },
    { y: 0.25, radius: 0.82, material: 'VEXFORGE_BRASS' },
    { y: 0.46, radius: 0.55, material: 'VEXFORGE_OBSIDIAN' },
    { y: 1.46, radius: 0.28, material: 'VEXFORGE_IRON' },
    { y: 1.68, radius: 0.43, material: 'VEXFORGE_BRASS' },
    { y: 1.94, radius: 0.06, material: 'VEXFORGE_CYAN' },
  ], 12);

  mesh.object('VF_BATTLE_CORE_SIGIL');
  const coreAngles = [0, Math.PI / 2, Math.PI, Math.PI * 1.5];
  for (let index = 0; index < coreAngles.length; index++) {
    const angle = coreAngles[index];
    const direction = [Math.cos(angle), 0, Math.sin(angle)];
    const side = [-direction[2], 0, direction[0]];
    const base = [
      [direction[0] * 0.40 + side[0] * 0.12, 0.62, direction[2] * 0.40 + side[2] * 0.12],
      [direction[0] * 0.88 + side[0] * 0.12, 0.86, direction[2] * 0.88 + side[2] * 0.12],
      [direction[0] * 1.02, 1.15, direction[2] * 1.02],
      [direction[0] * 0.88 - side[0] * 0.12, 0.86, direction[2] * 0.88 - side[2] * 0.12],
    ];
    mesh.quad(
      base,
      index % 2 === 0 ? 'VEXFORGE_CYAN' : 'VEXFORGE_ACCENT',
      direction,
    );
  }
  return mesh.write();
}

function writeMaterials() {
  const definitions = {
    VEXFORGE_OBSIDIAN: {
      color: '0.68 0.63 0.78',
      texture: 'VF_NEXUS_OBSIDIAN_ALBEDO.png',
      specular: '0.30 0.32 0.42',
    },
    VEXFORGE_IRON: {
      color: '0.74 0.78 0.84',
      texture: 'VF_NEXUS_IRON_ALBEDO.png',
      specular: '0.48 0.52 0.62',
    },
    VEXFORGE_BRASS: {
      color: '0.90 0.78 0.52',
      texture: 'VF_NEXUS_BRASS_ALBEDO.png',
      specular: '0.72 0.52 0.22',
    },
    VEXFORGE_CYAN: {
      color: '0.66 0.88 0.96',
      texture: 'VF_NEXUS_CYAN_ALBEDO.png',
      specular: '0.26 0.78 0.96',
    },
    VEXFORGE_ACCENT: {
      color: '0.92 0.78 0.48',
      texture: 'VF_NEXUS_BRASS_ALBEDO.png',
      specular: '0.85 0.54 0.18',
    },
  };
  const lines = [];
  for (const name of materialNames) {
    const material = definitions[name];
    lines.push(
      `newmtl ${name}`,
      'Ka 0.08 0.08 0.08',
      `Kd ${material.color}`,
      `Ks ${material.specular}`,
      'Ns 96',
      'd 1.0',
      'illum 2',
      `map_Kd ${material.texture}`,
      '',
    );
  }
  fs.writeFileSync(
    path.join(output, 'VEXFORGE_NEXUS_KIT.mtl'),
    `${lines.join('\n').trimEnd()}\n`,
  );
}

function writeManifest() {
  const manifest = {
    schema_version: '1.0',
    product: 'VEXFORGE',
    source_of_truth: 'scripts/generate-vexforge-nexus-meshes.mjs',
    intent: 'Original Unity mesh assets; no official card art or remote backgrounds.',
    materials: materialNames,
    assets: [
      {
        asset_id: 'VF_NEXUS_CITADEL_DAIS',
        domain: 'world/environment',
        resources_key: 'VexforgeTier1/Models/VF_NEXUS_CITADEL_DAIS',
        source_file: 'VF_NEXUS_CITADEL_DAIS.obj',
        material_slots: [
          'VEXFORGE_OBSIDIAN',
          'VEXFORGE_IRON',
          'VEXFORGE_BRASS',
        ],
        consumers: ['VexforgeAlphaWorldDirector', 'NexusPresentationRoot'],
      },
      {
        asset_id: 'VF_NEXUS_CITADEL_SPINE',
        domain: 'world/environment',
        resources_key: 'VexforgeTier1/Models/VF_NEXUS_CITADEL_SPINE',
        source_file: 'VF_NEXUS_CITADEL_SPINE.obj',
        material_slots: materialNames,
        consumers: ['VexforgeAlphaWorldDirector', 'NexusPresentationRoot'],
      },
      {
        asset_id: 'VF_NEXUS_PORTAL_GATE',
        domain: 'world/portal',
        resources_key: 'VexforgeTier1/Models/VF_NEXUS_PORTAL_GATE',
        source_file: 'VF_NEXUS_PORTAL_GATE.obj',
        material_slots: materialNames,
        consumers: ['VexforgeAlphaWorldDirector', 'NexusPresentationRoot'],
      },
      {
        asset_id: 'VF_BATTLE_CITADEL_ARENA',
        domain: 'world/environment',
        resources_key: 'VexforgeTier1/Models/VF_BATTLE_CITADEL_ARENA',
        source_file: 'VF_BATTLE_CITADEL_ARENA.obj',
        material_slots: materialNames,
        consumers: ['VexforgeBattlefieldStage'],
      },
      {
        asset_id: 'VF_BATTLE_CITADEL_CORE',
        domain: 'world/prop',
        resources_key: 'VexforgeTier1/Models/VF_BATTLE_CITADEL_CORE',
        source_file: 'VF_BATTLE_CITADEL_CORE.obj',
        material_slots: materialNames,
        consumers: ['VexforgeBattlefieldStage'],
      },
    ],
  };
  fs.writeFileSync(
    path.join(output, 'VexforgeWorldMeshManifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
}

writeMaterials();
const faces = {
  VF_NEXUS_CITADEL_DAIS: buildSteppedDais(),
  VF_NEXUS_CITADEL_SPINE: buildCitadelSpine(),
  VF_NEXUS_PORTAL_GATE: buildPortalGate(),
  VF_BATTLE_CITADEL_ARENA: buildBattleArena(),
  VF_BATTLE_CITADEL_CORE: buildBattleCore(),
};
writeManifest();

for (const [name, count] of Object.entries(faces)) {
  console.log(`${name}: ${count} authored triangles`);
}
console.log(`Wrote original VEXFORGE Nexus mesh kit to ${output}`);
