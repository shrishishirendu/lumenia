function makeTwoLineSvg(
  m1: number, c1: number, m2: number, c2: number,
  intersection: { x: number; y: number } | null,
  width: number = 460, height: number = 340,
  xMin: number = -6, xMax: number = 6, yMin: number = -6, yMax: number = 6,
): string {
  const pad = 30;
  const w = width - 2 * pad;
  const h = height - 2 * pad;
  const sx = (x: number) => pad + ((x - xMin) / (xMax - xMin)) * w;
  const sy = (y: number) => pad + ((yMax - y) / (yMax - yMin)) * h;
  const clipLine = (m: number, c: number) => {
    const pts: { x: number; y: number }[] = [];
    const yAtXmin = m * xMin + c;
    const yAtXmax = m * xMax + c;
    if (yAtXmin >= yMin && yAtXmin <= yMax) pts.push({ x: xMin, y: yAtXmin });
    if (yAtXmax >= yMin && yAtXmax <= yMax) pts.push({ x: xMax, y: yAtXmax });
    if (m !== 0) {
      const xAtYmin = (yMin - c) / m;
      if (xAtYmin > xMin && xAtYmin < xMax) pts.push({ x: xAtYmin, y: yMin });
      const xAtYmax = (yMax - c) / m;
      if (xAtYmax > xMin && xAtYmax < xMax) pts.push({ x: xAtYmax, y: yMax });
    }
    if (pts.length < 2) return { x1: xMin, y1: m * xMin + c, x2: xMax, y2: m * xMax + c };
    pts.sort((a, b) => a.x - b.x);
    return { x1: pts[0].x, y1: pts[0].y, x2: pts[pts.length - 1].x, y2: pts[pts.length - 1].y };
  };
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;
  svg += `<rect width="${width}" height="${height}" fill="#fafafa" rx="4"/>`;
  for (let x = xMin; x <= xMax; x++) {
    const px = sx(x);
    svg += `<line x1="${px}" y1="${pad}" x2="${px}" y2="${height - pad}" stroke="#e0e0e0" stroke-width="0.5"/>`;
    if (x !== 0) svg += `<text x="${px}" y="${height - pad + 14}" text-anchor="middle" fill="#888" font-size="10">${x}</text>`;
  }
  for (let y = yMin; y <= yMax; y++) {
    const py = sy(y);
    svg += `<line x1="${pad}" y1="${py}" x2="${width - pad}" y2="${py}" stroke="#e0e0e0" stroke-width="0.5"/>`;
    if (y !== 0) svg += `<text x="${pad - 6}" y="${py + 4}" text-anchor="end" fill="#888" font-size="10">${y}</text>`;
  }
  if (yMin <= 0 && yMax >= 0) {
    const y0 = sy(0);
    svg += `<line x1="${pad}" y1="${y0}" x2="${width - pad}" y2="${y0}" stroke="#333" stroke-width="1.5"/>`;
    svg += `<text x="${width - pad + 8}" y="${y0 + 4}" fill="#333" font-size="11">x</text>`;
  }
  if (xMin <= 0 && xMax >= 0) {
    const x0 = sx(0);
    svg += `<line x1="${x0}" y1="${pad}" x2="${x0}" y2="${height - pad}" stroke="#333" stroke-width="1.5"/>`;
    svg += `<text x="${x0 + 4}" y="${pad - 6}" fill="#333" font-size="11">y</text>`;
  }
  const l1 = clipLine(m1, c1);
  svg += `<line x1="${sx(l1.x1)}" y1="${sy(l1.y1)}" x2="${sx(l1.x2)}" y2="${sy(l1.y2)}" stroke="#2563eb" stroke-width="2.5" stroke-linecap="round"/>`;
  const l1mx = (sx(l1.x1) + sx(l1.x2)) / 2;
  const l1my = (sy(l1.y1) + sy(l1.y2)) / 2;
  svg += `<text x="${l1mx + 6}" y="${l1my - 8}" fill="#2563eb" font-size="12" font-weight="bold">L₁</text>`;
  const l2 = clipLine(m2, c2);
  svg += `<line x1="${sx(l2.x1)}" y1="${sy(l2.y1)}" x2="${sx(l2.x2)}" y2="${sy(l2.y2)}" stroke="#dc2626" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="8,4"/>`;
  const l2mx = (sx(l2.x1) + sx(l2.x2)) / 2;
  const l2my = (sy(l2.y1) + sy(l2.y2)) / 2;
  svg += `<text x="${l2mx + 6}" y="${l2my + 14}" fill="#dc2626" font-size="12" font-weight="bold">L₂</text>`;
  if (intersection) {
    svg += `<circle cx="${sx(intersection.x)}" cy="${sy(intersection.y)}" r="5" fill="#16a34a" stroke="#fff" stroke-width="1.5"/>`;
    svg += `<text x="${sx(intersection.x) + 8}" y="${sy(intersection.y) - 8}" fill="#16a34a" font-size="11" font-weight="bold">(${intersection.x},${intersection.y})</text>`;
  }
  svg += `</svg>`;
  return svg;
}

const svgs: Record<string, string> = {
  explanation: makeTwoLineSvg(2, -1, -1, 5, { x: 2, y: 3 }),
  example1: makeTwoLineSvg(2, -1, -1, 5, { x: 2, y: 3 }),
  example2: makeTwoLineSvg(-2, 2, 1, 5, { x: -1, y: 4 }),
  verify: makeTwoLineSvg(3, -4, -1, 8, { x: 3, y: 5 }),
  verify2: makeTwoLineSvg(2, 1, -1, -2, { x: -1, y: -1 }),
  parallel: makeTwoLineSvg(-1, 4, -1, 1, null),
  coincident: makeTwoLineSvg(2, -3, 2, -3, null),
  oneSolution: makeTwoLineSvg(1, 1, -2, 7, { x: 2, y: 3 }),
  practiceParallel: makeTwoLineSvg(3, 2, 3, -5, null),
  practiceOneSol: makeTwoLineSvg(-2, 4, 1, 1, { x: 1, y: 2 }),
};

import * as fs from "fs";
fs.writeFileSync("/tmp/lesson_svgs.json", JSON.stringify(svgs));
console.log("Generated SVGs saved to /tmp/lesson_svgs.json");
for (const [k, v] of Object.entries(svgs)) {
  console.log(`${k}: ${v.length} chars`);
}
