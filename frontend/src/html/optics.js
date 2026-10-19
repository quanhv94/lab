const canvas = document.getElementById("cv");
const ctx = canvas.getContext("2d");
const LOGICAL_CANVAS_WIDTH = canvas.width;
const LOGICAL_CANVAS_HEIGHT = canvas.height;
const SCALE = 10;
const CENTER_X = canvas.width / 2;
const CENTER_Y = canvas.height / 2;
const X_MIN = -CENTER_X / SCALE;
const X_MAX = CENTER_X / SCALE;
const LENS_HALF_HEIGHT = 25;
const INFINITY_EPSILON = 0.05;
const EXTENSION_MARGIN = 3;
const DASH = [8, 6];
const COLORS = {
  ray1: "#e53935",
  ray2: "#2e7d32",
  object: "#ef6c00",
  image: "#6a1b9a",
  axis: "#333",
};

const LENS_TYPES = {
  converging: {
    title: "Ảnh của vật qua thấu kính hội tụ: 1/d + 1/d' = 1/f (f > 0)",
    ray1Legend: "Tia song song trục chính → tia ló qua F'",
    focalSign: 1,
  },
  diverging: {
    title: "Ảnh của vật qua thấu kính phân kỳ: 1/d + 1/d' = 1/f (f < 0)",
    ray1Legend: "Tia song song trục chính → tia ló có đường kéo dài qua F'",
    focalSign: -1,
  },
};

const RAY_LENGTH = 26;
const ANGLE_ARC_RADIUS = 50;
const CRITICAL_ANGLE_TOLERANCE = 1e-9;
const MIRROR_HALF_WIDTH = 32;
const MODE_TITLES = {
  reflection:
    "Phản xạ ánh sáng qua gương phẳng: góc phản xạ bằng góc tới (i' = i)",
  refraction: "Khúc xạ ánh sáng: n₁·sin i = n₂·sin r",
};
const SYSTEM_TYPES = {
  systemConverging: {
    title: "Hệ hai thấu kính hội tụ đồng trục: d₂ = a − d₁', k = k₁·k₂",
    lens2Name: "hội tụ",
    focalSign: 1,
  },
  systemDiverging: {
    title:
      "Hệ thấu kính hội tụ – thấu kính phân kỳ đồng trục: d₂ = a − d₁', k = k₁·k₂",
    lens2Name: "phân kỳ",
    focalSign: -1,
  },
};
const SYSTEM_LENS1_X = -20;
const INTERMEDIATE_IMAGE_COLOR = "#1565c0";
const FOCAL_PLANE_COLOR = "#00838f";
const SECONDARY_AXIS_MARGIN = 6;
const PANELS = {
  converging: "lensPanel",
  diverging: "lensPanel",
  systemConverging: "systemPanel",
  systemDiverging: "systemPanel",
  reflection: "reflectionPanel",
  refraction: "refractionPanel",
  prism: "prismPanel",
  dispersion: "prismPanel",
  mirrors: "mirrorsPanel",
};
const MIRROR_VERTEX = { x: 0, y: 0 };
const MIRROR_LENGTH = 28;
const MIRROR_EXIT_LENGTH = 35;
const MIRROR_NORMAL_LENGTH = 5;
const MAX_MIRROR_REFLECTIONS = 30;
const MAX_MIRROR_IMAGES = 60;
const MIRROR_LABEL_LIMIT = 12;
const MIRROR_SOURCE_RATIO_MARGIN = 0.03;
const MIRROR_SOURCE_GRAB_RADIUS = 2.5;
const CONSTRUCTION_LINE_COLOR = "#8e24aa";
const RIGHT_ANGLE_MARK_SIZE = 0.8;
const PRISM_APEX_Y = 16;
const PRISM_BASE_Y = -14;
const PRISM_RAY_LENGTH = 24;
const PRISM_NORMAL_LENGTH = 7;
const PRISM_ARC_RADIUS = 34;
const MAX_PRISM_BOUNCES = 6;
const PRISM_POINT_LABELS = ["J", "K", "M", "P", "Q", "T"];
const MIN_DEVIATION_TOLERANCE = 0.05;
const PRISM_COLORS = { ray: "#e53935", fill: "rgba(30, 136, 229, 0.12)" };
const DISPERSION_RAY_LENGTH = 40;
const WHITE_RAY_OUTLINE = "#9e9e9e";
const SPECTRUM = [
  { name: "Đỏ", color: "#e53935" },
  { name: "Cam", color: "#fb8c00" },
  { name: "Vàng", color: "#fdd835" },
  { name: "Lục", color: "#43a047" },
  { name: "Lam", color: "#1e88e5" },
  { name: "Chàm", color: "#3949ab" },
  { name: "Tím", color: "#8e24aa" },
];
const ANGLE_INPUT_KEYS = {
  reflection: "reflectionAngle",
  refraction: "refractionAngle",
};

const INPUT_IDS = {
  d: "dIn",
  focalLength: "fIn",
  h: "hIn",
  reflectionAngle: "reflectionAngleIn",
  n1: "n1In",
  n2: "n2In",
  refractionAngle: "refractionAngleIn",
  systemD1: "systemD1In",
  systemF1: "systemF1In",
  systemF2: "systemF2In",
  systemDistance: "systemDistanceIn",
  systemH: "systemHIn",
  prismApex: "prismApexIn",
  prismIndex: "prismIndexIn",
  prismIncidence: "prismIncidenceIn",
  dispersionRedIndex: "dispersionRedIndexIn",
  dispersionVioletIndex: "dispersionVioletIndexIn",
  mirrorAngle: "mirrorAngleIn",
  mirrorRayAngle: "mirrorRayAngleIn",
};
const inputs = Object.fromEntries(
  Object.entries(INPUT_IDS).map(([key, id]) => [
    key,
    document.getElementById(id),
  ])
);
const state = {
  mode: window.OPTICS_MODE || "reflection",
  d: 30,
  focalLength: 12,
  h: 6,
  reflectionAngle: 40,
  n1: 1,
  n2: 1.33,
  refractionAngle: 30,
  systemD1: 20,
  systemF1: 10,
  systemF2: 10,
  systemDistance: 35,
  systemH: 4,
  prismApex: 60,
  prismIndex: 1.5,
  prismIncidence: 45,
  prismBaseReflective: false,
  dispersionRedIndex: 1.5,
  dispersionVioletIndex: 1.58,
  mirrorAngle: 60,
  mirrorRayAngle: 300,
  mirrorSourceRadius: 16,
  mirrorSourceRatio: 0.35,
};
const isLensMode = () => state.mode in LENS_TYPES;
const isSystemMode = () => state.mode in SYSTEM_TYPES;
const isPrismMode = () => state.mode === "prism" || state.mode === "dispersion";
const toRad = (degrees) => (degrees * Math.PI) / 180;
const toDeg = (radians) => (radians * 180) / Math.PI;
const pointAtAngle = (angle, length = RAY_LENGTH) => ({
  x: length * Math.cos(angle),
  y: length * Math.sin(angle),
});

const toPx = ({ x, y }) => ({
  x: CENTER_X + x * SCALE,
  y: CENTER_Y - y * SCALE,
});
const toWorld = ({ x, y }) => ({
  x: (x - CENTER_X) / SCALE,
  y: (CENTER_Y - y) / SCALE,
});
const pointOnLineAtX = (p1, p2, x) => ({
  x,
  y: p1.y + ((p2.y - p1.y) * (x - p1.x)) / (p2.x - p1.x),
});
const getSignedFocal = () =>
  LENS_TYPES[state.mode].focalSign * state.focalLength;

function drawSegment(p1, p2, { color, width = 2, dashed = false }) {
  const a = toPx(p1);
  const b = toPx(p2);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.setLineDash(dashed ? DASH : []);
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
  ctx.restore();
}

function drawArrowHead(from, to, color) {
  const a = toPx(from);
  const b = toPx(to);
  const angle = Math.atan2(b.y - a.y, b.x - a.x);
  const size = 10;
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(b.x, b.y);
  ctx.lineTo(
    b.x - size * Math.cos(angle - 0.4),
    b.y - size * Math.sin(angle - 0.4)
  );
  ctx.lineTo(
    b.x - size * Math.cos(angle + 0.4),
    b.y - size * Math.sin(angle + 0.4)
  );
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawRayDirection(p1, p2, color) {
  const mid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
  const length = Math.hypot(p2.x - p1.x, p2.y - p1.y) || 1;
  const step = 0.01 / length;
  drawArrowHead(
    mid,
    { x: mid.x + (p2.x - p1.x) * step, y: mid.y + (p2.y - p1.y) * step },
    color
  );
}

function drawLabel(text, p, color = "#222", offset = { x: 6, y: -6 }) {
  const q = toPx(p);
  ctx.fillStyle = color;
  ctx.font = "15px system-ui";
  ctx.fillText(text, q.x + offset.x, q.y + offset.y);
}

function drawArrowObject({ x, height, color, dashed, labels }) {
  const base = { x, y: 0 };
  const top = { x, y: height };
  drawSegment(base, top, { color, width: 3, dashed });
  drawArrowHead(base, top, color);
  drawLabel(labels[0], base, color, { x: 4, y: height >= 0 ? 18 : -8 });
  drawLabel(labels[1], top, color, { x: 6, y: height >= 0 ? -8 : 18 });
}

function drawLensSymbol({ x = 0, isConverging }) {
  const lensTop = { x, y: LENS_HALF_HEIGHT };
  const lensBottom = { x, y: -LENS_HALF_HEIGHT };
  drawSegment(lensBottom, lensTop, { color: "#000", width: 3 });

  if (isConverging) {
    drawArrowHead(lensBottom, lensTop, "#000");
    drawArrowHead(lensTop, lensBottom, "#000");

    return;
  }

  drawArrowHead({ x, y: LENS_HALF_HEIGHT + 1 }, lensTop, "#000");
  drawArrowHead({ x, y: -LENS_HALF_HEIGHT - 1 }, lensBottom, "#000");
}

function drawAxisMarks(marks, labelOffsetY = 20) {
  marks.forEach(({ x, label }) => {
    const p = toPx({ x, y: 0 });
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
    ctx.fill();
    drawLabel(label, { x, y: 0 }, "#000", { x: -8, y: labelOffsetY });
  });
}

function drawAxisAndLens(f) {
  drawSegment(
    { x: X_MIN, y: 0 },
    { x: X_MAX, y: 0 },
    { color: COLORS.axis, width: 1 }
  );
  drawLensSymbol({ isConverging: state.mode === "converging" });
  drawLabel("O", { x: 0, y: 0 }, "#000", { x: 6, y: 18 });
  drawAxisMarks([
    { x: -f, label: "F" },
    { x: f, label: "F'" },
    { x: -2 * f, label: "2F" },
    { x: 2 * f, label: "2F'" },
  ]);
}

function computeImage({ d, f, h }) {
  if (Math.abs(d - f) < INFINITY_EPSILON) {
    return null;
  }

  const dPrime = (d * f) / (d - f);
  const hPrime = (-h * dPrime) / d;

  return { dPrime, hPrime, magnification: -dPrime / d, isReal: dPrime > 0 };
}

function buildRays({ d, f, h }) {
  const objectTop = { x: -d, y: h };
  const rays = [
    { color: COLORS.ray1, hit: { x: 0, y: h }, through: { x: f, y: 0 } },
    { color: COLORS.ray2, hit: { x: 0, y: 0 }, through: { x: 1, y: -h / d } },
  ];

  return { objectTop, rays };
}

function drawRays({ d, f, h }, image) {
  const { objectTop, rays } = buildRays({ d, f, h });

  rays.forEach(({ color, hit, through }) => {
    drawSegment(objectTop, hit, { color });
    drawRayDirection(objectTop, hit, color);

    const exitEnd = pointOnLineAtX(hit, through, X_MAX);
    drawSegment(hit, exitEnd, { color });
    drawRayDirection(hit, exitEnd, color);

    if (image && !image.isReal) {
      const backEnd = pointOnLineAtX(
        hit,
        through,
        Math.min(image.dPrime, f) - EXTENSION_MARGIN
      );
      drawSegment(hit, backEnd, { color, width: 1.5, dashed: true });
    }
  });
}

function describeImage(image) {
  if (!image) {
    return "d = f: các tia ló song song nhau → <b>ảnh ở vô cực</b> (không tạo ảnh).";
  }

  const absMagnification = Math.abs(image.magnification);
  const size =
    absMagnification > 1
      ? "lớn hơn vật"
      : absMagnification < 1
      ? "nhỏ hơn vật"
      : "bằng vật";
  const nature = image.isReal
    ? "Ảnh thật, ngược chiều vật"
    : "Ảnh ảo, cùng chiều vật";
  const position =
    state.mode === "diverging" ? "<br>Ảnh nằm trong khoảng từ F' đến O" : "";

  return (
    `d' = ${image.dPrime.toFixed(2)} cm (${
      image.isReal ? "d' > 0" : "d' < 0"
    })<br>` +
    `h' = ${image.hPrime.toFixed(2)} cm<br>` +
    `k = -d'/d = ${image.magnification.toFixed(2)}<br>` +
    `<b>${nature}, ${size}</b>${position}`
  );
}

function renderLensTexts(f) {
  const lens = LENS_TYPES[state.mode];
  document.getElementById("title").textContent = lens.title;
  document.getElementById("ray1Legend").textContent = lens.ray1Legend;
  document.getElementById("dVal").textContent = state.d;
  document.getElementById("fVal").textContent = f;
  document.getElementById("hVal").textContent = state.h;
}

function renderLens() {
  const { d, h } = state;
  const f = getSignedFocal();
  renderLensTexts(f);
  drawAxisAndLens(f);

  const image = computeImage({ d, f, h });
  drawRays({ d, f, h }, image);
  drawArrowObject({
    x: -d,
    height: h,
    color: COLORS.object,
    dashed: false,
    labels: ["A", "B"],
  });

  if (image) {
    drawArrowObject({
      x: image.dPrime,
      height: image.hPrime,
      color: COLORS.image,
      dashed: !image.isReal,
      labels: ["A'", "B'"],
    });
  }

  const fText = f < 0 ? `(${f})` : f;
  document.getElementById("result").innerHTML =
    `1/${d} + 1/d' = 1/${fText}<br>` + describeImage(image);
}

function getSystemConfig() {
  const f1 = state.systemF1;
  const f2 = SYSTEM_TYPES[state.mode].focalSign * state.systemF2;
  const lens1X = SYSTEM_LENS1_X;
  const lens2X = SYSTEM_LENS1_X + state.systemDistance;

  return {
    d1: state.systemD1,
    h: state.systemH,
    a: state.systemDistance,
    f1,
    f2,
    lens1X,
    lens2X,
  };
}

function computeSecondImage({ d2, f2, height }) {
  if (Math.abs(d2) < INFINITY_EPSILON) {
    return { dPrime: 0, hPrime: height, magnification: 1, isReal: true };
  }

  return computeImage({ d: d2, f: f2, h: height });
}

function computeSystem({ d1, h, a, f1, f2 }) {
  const image1 = computeImage({ d: d1, f: f1, h });

  if (!image1) {
    const hPrime = (-h * f2) / f1;

    return {
      image1,
      d2: null,
      image2: { dPrime: f2, hPrime, magnification: hPrime / h, isReal: f2 > 0 },
    };
  }

  const d2 = a - image1.dPrime;
  const image2 = computeSecondImage({ d2, f2, height: image1.hPrime });

  return { image1, d2, image2 };
}

function traceRay({ start, slope, lenses }) {
  const segments = [];
  let point = start;
  let currentSlope = slope;

  for (const lens of lenses) {
    const hit = { x: lens.x, y: point.y + currentSlope * (lens.x - point.x) };
    segments.push({ from: point, to: hit });
    currentSlope -= hit.y / lens.f;
    point = hit;
  }

  segments.push({
    from: point,
    to: { x: X_MAX, y: point.y + currentSlope * (X_MAX - point.x) },
  });

  return segments;
}

function drawExtension({ segment: { from, to }, targetX, color }) {
  if (targetX >= from.x && targetX <= to.x) {
    return;
  }

  const isBackward = targetX < from.x;
  const edge = isBackward ? from : to;
  const endX = isBackward
    ? targetX - EXTENSION_MARGIN
    : targetX + EXTENSION_MARGIN;
  drawSegment(edge, pointOnLineAtX(from, to, endX), {
    color,
    width: 1.5,
    dashed: true,
  });
}

function drawSystemRays(config, { image1, image2 }) {
  const { d1, h, f1, f2, lens1X, lens2X } = config;
  const objectTop = { x: lens1X - d1, y: h };
  const lenses = [
    { x: lens1X, f: f1 },
    { x: lens2X, f: f2 },
  ];
  const rays = [
    { color: COLORS.ray1, slope: 0 },
    { color: COLORS.ray2, slope: -h / d1 },
  ];

  rays.forEach(({ color, slope }) => {
    const segments = traceRay({ start: objectTop, slope, lenses });
    segments.forEach(({ from, to }) => drawRay(from, to, { color, width: 2 }));

    if (image1) {
      drawExtension({
        segment: segments[1],
        targetX: lens1X + image1.dPrime,
        color,
      });
    }

    if (image2) {
      drawExtension({
        segment: segments[2],
        targetX: lens2X + image2.dPrime,
        color,
      });
    }

    drawSecondaryAxis({
      incident: segments[1],
      emergent: segments[2],
      lens2X,
      f2,
      color,
    });
  });
}

function drawSecondaryAxis({ incident, emergent, lens2X, f2, color }) {
  const slope =
    (incident.to.y - incident.from.y) / (incident.to.x - incident.from.x);
  const focalPoint = { x: lens2X + f2, y: slope * f2 };
  const startX = Math.min(lens2X, focalPoint.x) - SECONDARY_AXIS_MARGIN;
  const endX = Math.max(lens2X, focalPoint.x) + SECONDARY_AXIS_MARGIN;
  const pointAt = (x) => ({ x, y: slope * (x - lens2X) });

  drawSegment(pointAt(startX), pointAt(endX), {
    color,
    width: 1,
    dashed: true,
  });
  drawExtension({ segment: emergent, targetX: focalPoint.x, color });
  drawPoint(focalPoint, FOCAL_PLANE_COLOR);
  drawLabel("F'ₚ", focalPoint, FOCAL_PLANE_COLOR, {
    x: 6,
    y: slope >= 0 ? -6 : 16,
  });
}

function drawSystemAxis({ f1, f2, lens1X, lens2X }) {
  drawSegment(
    { x: X_MIN, y: 0 },
    { x: X_MAX, y: 0 },
    { color: COLORS.axis, width: 1 }
  );
  drawLensSymbol({ x: lens1X, isConverging: true });
  drawLensSymbol({ x: lens2X, isConverging: f2 > 0 });
  drawLabel("L₁", { x: lens1X, y: LENS_HALF_HEIGHT }, "#000", {
    x: -8,
    y: -12,
  });
  drawLabel("L₂", { x: lens2X, y: LENS_HALF_HEIGHT }, "#000", {
    x: -8,
    y: -12,
  });
  drawLabel("O₁", { x: lens1X, y: 0 }, "#000", { x: 6, y: 18 });
  drawLabel("O₂", { x: lens2X, y: 0 }, "#000", { x: 6, y: 18 });
  drawAxisMarks(
    [
      { x: lens1X - f1, label: "F₁" },
      { x: lens1X + f1, label: "F₁'" },
    ],
    20
  );
  drawAxisMarks(
    [
      { x: lens2X - f2, label: "F₂" },
      { x: lens2X + f2, label: "F₂'" },
    ],
    -10
  );
  drawFocalPlane({ x: lens2X + f2, label: "Tiêu diện ảnh của L₂ (qua F₂')" });
}

function drawFocalPlane({ x, label }) {
  const bottom = { x, y: -LENS_HALF_HEIGHT };
  drawSegment(
    bottom,
    { x, y: LENS_HALF_HEIGHT },
    { color: FOCAL_PLANE_COLOR, width: 1.5, dashed: true }
  );
  drawLabel(label, bottom, FOCAL_PLANE_COLOR, { x: -90, y: 22 });
}

function describeNature({ isReal, magnification }) {
  const absMagnification = Math.abs(magnification);
  const size =
    absMagnification > 1
      ? "lớn hơn vật"
      : absMagnification < 1
      ? "nhỏ hơn vật"
      : "bằng vật";
  const orientation = magnification > 0 ? "cùng chiều vật" : "ngược chiều vật";

  return `${isReal ? "Ảnh thật" : "Ảnh ảo"}, ${orientation}, ${size}`;
}

function describeSystem({ d1, h, f1, f2 }, { image1, d2, image2 }) {
  const fText = (f) => (f < 0 ? `(${f})` : f);
  const lines = [`<b>Qua L₁:</b> 1/${d1} + 1/d₁' = 1/${fText(f1)}`];

  if (image1) {
    lines.push(
      `d₁' = ${image1.dPrime.toFixed(
        2
      )} cm, k₁ = ${image1.magnification.toFixed(2)}`
    );
    lines.push(
      `<b>Qua L₂:</b> d₂ = a − d₁' = ${d2.toFixed(2)} cm${
        d2 < 0 ? " (vật ảo đối với L₂)" : ""
      }`
    );
  } else {
    lines.push(
      "d₁ = f₁ → A₁B₁ ở vô cực, chùm tia tới L₂ song song → ảnh cuối nằm tại tiêu diện ảnh của L₂"
    );
  }

  if (!image2) {
    lines.push("d₂ = f₂ → <b>ảnh cuối ở vô cực</b> (không tạo ảnh).");

    return lines.join("<br>");
  }

  if (image1) {
    lines.push(
      `d₂' = ${image2.dPrime.toFixed(
        2
      )} cm, k₂ = ${image2.magnification.toFixed(2)}`
    );
  } else {
    lines.push(`d₂' = f₂ = ${image2.dPrime.toFixed(2)} cm`);
  }

  const magnification = image2.hPrime / h;
  lines.push(
    `k = ${image1 ? "k₁·k₂ = " : ""}${magnification.toFixed(
      2
    )}, h₂ = ${image2.hPrime.toFixed(2)} cm`
  );
  lines.push(
    `<b>${describeNature({ isReal: image2.isReal, magnification })}</b>`
  );

  return lines.join("<br>");
}

function renderSystemTexts(config) {
  const system = SYSTEM_TYPES[state.mode];
  document.getElementById("title").textContent = system.title;
  document.getElementById("systemLens2Name").textContent = system.lens2Name;
  document.getElementById("systemD1Val").textContent = config.d1;
  document.getElementById("systemF1Val").textContent = config.f1;
  document.getElementById("systemF2Val").textContent = config.f2;
  document.getElementById("systemDistanceVal").textContent = config.a;
  document.getElementById("systemHVal").textContent = config.h;
}

function renderSystem() {
  const config = getSystemConfig();
  const result = computeSystem(config);
  const { image1, image2 } = result;
  renderSystemTexts(config);
  drawSystemAxis(config);
  drawSystemRays(config, result);
  drawArrowObject({
    x: config.lens1X - config.d1,
    height: config.h,
    color: COLORS.object,
    dashed: false,
    labels: ["A", "B"],
  });

  if (image1) {
    const isVirtualForL2 = image1.dPrime < 0 || image1.dPrime > config.a;
    drawArrowObject({
      x: config.lens1X + image1.dPrime,
      height: image1.hPrime,
      color: INTERMEDIATE_IMAGE_COLOR,
      dashed: isVirtualForL2,
      labels: ["A₁", "B₁"],
    });
  }

  if (image2) {
    drawArrowObject({
      x: config.lens2X + image2.dPrime,
      height: image2.hPrime,
      color: COLORS.image,
      dashed: !image2.isReal,
      labels: ["A₂", "B₂"],
    });
  }

  document.getElementById("systemResult").innerHTML = describeSystem(
    config,
    result
  );
}

function drawPoint(p, color = "#000") {
  const q = toPx(p);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(q.x, q.y, 4, 0, Math.PI * 2);
  ctx.fill();
}

function drawRay(from, to, { color, width = 3 }) {
  drawSegment(from, to, { color, width });
  drawRayDirection(from, to, color);
}

function drawAngleArc({
  from,
  to,
  label,
  color,
  center = { x: 0, y: 0 },
  radius = ANGLE_ARC_RADIUS,
}) {
  if (Math.abs(to - from) < 1e-6) {
    return;
  }

  const origin = toPx(center);
  const start = -Math.max(from, to);
  const end = -Math.min(from, to);
  const middle = (start + end) / 2;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(origin.x, origin.y, radius, start, end);
  ctx.stroke();
  ctx.font = "15px system-ui";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(
    label,
    origin.x + (radius + 16) * Math.cos(middle),
    origin.y + (radius + 16) * Math.sin(middle)
  );
  ctx.restore();
}

function drawNormal(labels) {
  const top = { x: 0, y: RAY_LENGTH + 2 };
  const bottom = { x: 0, y: -(RAY_LENGTH + 2) };
  drawSegment(bottom, top, { color: "#555", width: 1.5, dashed: true });
  drawLabel(labels[0], top, "#555", { x: 6, y: 4 });

  if (labels[1]) {
    drawLabel(labels[1], bottom, "#555", { x: 6, y: 4 });
  }
}

function drawMirror() {
  const left = { x: -MIRROR_HALF_WIDTH, y: 0 };
  const right = { x: MIRROR_HALF_WIDTH, y: 0 };
  drawSegment(left, right, { color: "#000", width: 4 });

  for (let x = -MIRROR_HALF_WIDTH; x < MIRROR_HALF_WIDTH; x += 1.5) {
    drawSegment(
      { x, y: 0 },
      { x: x - 1, y: -1.2 },
      { color: "#777", width: 1 }
    );
  }
}

function renderReflection() {
  const incidence = toRad(state.reflectionAngle);
  const source = pointAtAngle(Math.PI / 2 + incidence);
  const reflected = pointAtAngle(Math.PI / 2 - incidence);
  const virtualImage = { x: source.x, y: -source.y };
  const origin = { x: 0, y: 0 };

  drawMirror();
  drawNormal(["N"]);
  // Đường dóng vuông góc gương nối vật S với ảnh ảo S'.
  drawSegment(source, virtualImage, {
    color: "#9e9e9e",
    width: 1.5,
    dashed: true,
  });
  drawSegment(origin, virtualImage, {
    color: "#555",
    width: 1.5,
    dashed: true,
  });
  drawRay(source, origin, { color: COLORS.ray1 });
  drawRay(origin, reflected, { color: COLORS.object });
  drawAngleArc({
    from: Math.PI / 2,
    to: Math.PI / 2 + incidence,
    label: "i",
    color: COLORS.ray1,
  });
  drawAngleArc({
    from: Math.PI / 2 - incidence,
    to: Math.PI / 2,
    label: "i'",
    color: COLORS.object,
  });

  drawPoint(source, COLORS.ray1);
  drawPoint(virtualImage, COLORS.image);
  drawLabel("S", source, COLORS.ray1, { x: -18, y: -8 });
  drawLabel("S' (ảnh ảo)", virtualImage, COLORS.image, { x: -30, y: 22 });
  drawLabel("I", origin, "#000", { x: 6, y: 20 });
  drawLabel("R", reflected, COLORS.object, { x: 8, y: -8 });
  drawLabel("Gương phẳng", { x: MIRROR_HALF_WIDTH, y: 0 }, "#000", {
    x: -110,
    y: 28,
  });

  const angle = state.reflectionAngle;
  document.getElementById("title").textContent = MODE_TITLES.reflection;
  document.getElementById("reflectionAngleVal").textContent = angle;
  document.getElementById("reflectionResult").innerHTML =
    `Góc tới i = ${angle}°<br>` +
    `Góc phản xạ i' = <b>${angle}°</b><br>` +
    "Tia phản xạ nằm trong mặt phẳng tới, ở bên kia pháp tuyến so với tia tới.<br>" +
    "Ảnh S' đối xứng với S qua gương: <b>ảnh ảo</b>, đường kéo dài của tia phản xạ đi qua S'.";
}

function computeRefraction({ n1, n2, incidenceDeg }) {
  const criticalDeg = n1 > n2 ? toDeg(Math.asin(n2 / n1)) : null;
  const isCritical =
    criticalDeg !== null &&
    Math.abs(incidenceDeg - criticalDeg) < CRITICAL_ANGLE_TOLERANCE;
  const sinRefraction = (n1 * Math.sin(toRad(incidenceDeg))) / n2;

  if (isCritical) {
    return { criticalDeg, kind: "critical", refractionDeg: 90 };
  }

  if (sinRefraction > 1) {
    return { criticalDeg, kind: "total", refractionDeg: null };
  }

  return {
    criticalDeg,
    kind: "partial",
    refractionDeg: toDeg(Math.asin(sinRefraction)),
  };
}

function getMediumColor(n) {
  const alpha = 0.06 + ((n - 1) / 1.5) * 0.3;

  return `rgba(30, 136, 229, ${alpha.toFixed(3)})`;
}

function drawMedia({ n1, n2 }) {
  ctx.fillStyle = getMediumColor(n1);
  ctx.fillRect(0, 0, LOGICAL_CANVAS_WIDTH, CENTER_Y);
  ctx.fillStyle = getMediumColor(n2);
  ctx.fillRect(0, CENTER_Y, LOGICAL_CANVAS_WIDTH, CENTER_Y);
  drawSegment(
    { x: X_MIN, y: 0 },
    { x: X_MAX, y: 0 },
    { color: "#000", width: 2 }
  );
  drawLabel(`Môi trường 1: n₁ = ${n1}`, { x: X_MIN, y: 0 }, "#0d47a1", {
    x: 16,
    y: -16,
  });
  drawLabel(`Môi trường 2: n₂ = ${n2}`, { x: X_MIN, y: 0 }, "#0d47a1", {
    x: 16,
    y: 28,
  });
}

function describeRefraction({ n1, n2, incidenceDeg }, refraction) {
  const criticalText =
    refraction.criticalDeg === null
      ? "n₁ ≤ n₂: không có góc tới hạn, luôn có tia khúc xạ"
      : `sin i<sub>gh</sub> = n₂/n₁ → i<sub>gh</sub> = ${refraction.criticalDeg.toFixed(
          2
        )}°`;
  const lines = [
    `n₁·sin i = n₂·sin r → ${n1}·sin ${incidenceDeg}° = ${n2}·sin r`,
    criticalText,
  ];

  if (refraction.kind === "partial") {
    lines.push(
      `Góc khúc xạ r = <b>${refraction.refractionDeg.toFixed(2)}°</b>`
    );
    lines.push("<b>Vừa khúc xạ vừa phản xạ một phần</b> (tia phản xạ yếu).");
  } else if (refraction.kind === "critical") {
    lines.push(
      "i = i<sub>gh</sub>: r = <b>90°</b>, tia khúc xạ đi sát mặt phân cách."
    );
    lines.push(
      "<b>Có đồng thời tia khúc xạ (sát mặt phân cách) và tia phản xạ.</b>"
    );
  } else {
    lines.push("sin r > 1 → không có tia khúc xạ.");
    lines.push(
      "<b>i > i<sub>gh</sub>: phản xạ toàn phần</b>, toàn bộ ánh sáng bị phản xạ trở lại môi trường 1."
    );
  }

  return lines.join("<br>");
}

function renderRefraction() {
  const { n1, n2 } = state;
  const incidenceDeg = state.refractionAngle;
  const incidence = toRad(incidenceDeg);
  const incidenceText = Number(incidenceDeg.toFixed(2));
  const refraction = computeRefraction({ n1, n2, incidenceDeg });
  const source = pointAtAngle(Math.PI / 2 + incidence);
  const reflected = pointAtAngle(Math.PI / 2 - incidence);
  const origin = { x: 0, y: 0 };

  drawMedia({ n1, n2 });
  drawNormal(["N", "N'"]);
  drawRay(source, origin, { color: COLORS.ray1 });
  drawRay(origin, reflected, {
    color: COLORS.object,
    width: refraction.kind === "total" ? 3 : 1.5,
  });
  drawAngleArc({
    from: Math.PI / 2,
    to: Math.PI / 2 + incidence,
    label: "i",
    color: COLORS.ray1,
  });
  drawAngleArc({
    from: Math.PI / 2 - incidence,
    to: Math.PI / 2,
    label: "i'",
    color: COLORS.object,
  });

  if (refraction.refractionDeg !== null) {
    const refractionAngle = toRad(refraction.refractionDeg);
    const refracted = pointAtAngle(-Math.PI / 2 + refractionAngle);
    drawRay(origin, refracted, { color: COLORS.ray2 });
    drawAngleArc({
      from: -Math.PI / 2,
      to: -Math.PI / 2 + refractionAngle,
      label: "r",
      color: COLORS.ray2,
    });
    drawLabel("K", refracted, COLORS.ray2, {
      x: 8,
      y: refraction.kind === "critical" ? -8 : 18,
    });
  }

  drawPoint(source, COLORS.ray1);
  drawLabel("S", source, COLORS.ray1, { x: -18, y: -8 });
  drawLabel("I", origin, "#000", { x: -16, y: 20 });
  drawLabel("R", reflected, COLORS.object, { x: 8, y: -8 });

  const criticalButton = document.getElementById("criticalBtn");
  criticalButton.disabled = refraction.criticalDeg === null;
  document.getElementById("title").textContent = MODE_TITLES.refraction;
  document.getElementById("n1Val").textContent = Number(n1);
  document.getElementById("n2Val").textContent = Number(n2);
  document.getElementById("refractionAngleVal").textContent = incidenceText;
  document.getElementById("refractionResult").innerHTML = describeRefraction(
    { n1, n2, incidenceDeg: incidenceText },
    refraction
  );
}

function computePrism({ apexDeg, n, incidenceDeg }) {
  const r1 = toDeg(Math.asin(Math.sin(toRad(incidenceDeg)) / n));
  const r2 = apexDeg - r1;
  const sinEmergence = n * Math.sin(toRad(r2));
  const isTotalReflection = Math.abs(sinEmergence) > 1;
  const i2 = isTotalReflection ? null : toDeg(Math.asin(sinEmergence));
  const sinHalfMinimum = n * Math.sin(toRad(apexDeg / 2));
  const minDeviation =
    sinHalfMinimum <= 1 ? 2 * toDeg(Math.asin(sinHalfMinimum)) - apexDeg : null;

  return {
    r1,
    r2,
    i2,
    isTotalReflection,
    criticalDeg: toDeg(Math.asin(1 / n)),
    deviation: isTotalReflection ? null : incidenceDeg + i2 - apexDeg,
    minDeviation,
    minIncidence: minDeviation === null ? null : (minDeviation + apexDeg) / 2,
  };
}

const pointAlong = (p, angle, length) => ({
  x: p.x + length * Math.cos(angle),
  y: p.y + length * Math.sin(angle),
});

function intersectLines({ p, angleP, q, angleQ }) {
  const dp = { x: Math.cos(angleP), y: Math.sin(angleP) };
  const dq = { x: Math.cos(angleQ), y: Math.sin(angleQ) };
  const cross = dp.x * dq.y - dp.y * dq.x;
  const t = ((q.x - p.x) * dq.y - (q.y - p.y) * dq.x) / cross;

  return pointAlong(p, angleP, t);
}

function getPrismGeometry(apexDeg) {
  const halfApex = toRad(apexDeg / 2);
  const halfWidth = (PRISM_APEX_Y - PRISM_BASE_Y) * Math.tan(halfApex);
  const apex = { x: 0, y: PRISM_APEX_Y };
  const baseLeft = { x: -halfWidth, y: PRISM_BASE_Y };
  const baseRight = { x: halfWidth, y: PRISM_BASE_Y };
  const entry = { x: (apex.x + baseLeft.x) / 2, y: (apex.y + baseLeft.y) / 2 };

  return {
    halfApex,
    apex,
    baseLeft,
    baseRight,
    entry,
    rightFaceAngle: -Math.PI / 2 + halfApex,
  };
}

const normalizeAngle = (angle) => Math.atan2(Math.sin(angle), Math.cos(angle));

function getPrismFaces({ halfApex, apex, baseLeft, baseRight }) {
  return [
    {
      name: "left",
      label: "mặt bên thứ nhất",
      start: baseLeft,
      end: apex,
      outward: Math.PI - halfApex,
    },
    {
      name: "right",
      label: "mặt bên thứ hai",
      start: apex,
      end: baseRight,
      outward: halfApex,
    },
    {
      name: "base",
      label: "mặt đáy",
      start: baseRight,
      end: baseLeft,
      outward: -Math.PI / 2,
    },
  ];
}

function intersectFace(point, angle, face) {
  const direction = { x: Math.cos(angle), y: Math.sin(angle) };
  const edge = { x: face.end.x - face.start.x, y: face.end.y - face.start.y };
  const cross = direction.x * edge.y - direction.y * edge.x;

  if (Math.abs(cross) < 1e-12) {
    return null;
  }

  const offset = { x: face.start.x - point.x, y: face.start.y - point.y };
  const distance = (offset.x * edge.y - offset.y * edge.x) / cross;
  const edgeRatio = (offset.x * direction.y - offset.y * direction.x) / cross;
  const isOnFace = distance > 1e-9 && edgeRatio >= 0 && edgeRatio <= 1;

  return isOnFace
    ? { distance, point: pointAlong(point, angle, distance) }
    : null;
}

function findNextFace({ faces, point, angle, currentFace }) {
  const hits = faces
    .filter((face) => face.name !== currentFace)
    .map((face) => ({ face, hit: intersectFace(point, angle, face) }))
    .filter(({ hit }) => hit !== null)
    .sort((first, second) => first.hit.distance - second.hit.distance);

  return hits[0] || null;
}

function traceInsidePrism({ faces, entry, insideAngle, n, isBaseReflective }) {
  const events = [];
  let point = entry;
  let angle = insideAngle;
  let currentFace = "left";

  for (let bounce = 0; bounce < MAX_PRISM_BOUNCES; bounce++) {
    const next = findNextFace({ faces, point, angle, currentFace });

    if (!next) {
      break;
    }

    const { face, hit } = next;
    const incidence = normalizeAngle(angle - face.outward);
    const event = {
      from: point,
      to: hit.point,
      face,
      incidence,
      insideAngle: angle,
    };
    const sinEmergence = n * Math.sin(incidence);

    if (face.name === "base" && isBaseReflective) {
      events.push({ ...event, kind: "mirror" });
    } else if (Math.abs(sinEmergence) <= 1) {
      const emergence = Math.asin(sinEmergence);
      events.push({
        ...event,
        kind: "exit",
        emergence,
        emergentAngle: face.outward + emergence,
      });

      return events;
    } else {
      events.push({ ...event, kind: "total" });
    }

    angle = 2 * (face.outward + Math.PI / 2) - angle;
    point = hit.point;
    currentFace = face.name;
  }

  return events;
}

const isSimplePrismPath = (events) =>
  events.length === 1 &&
  events[0].kind === "exit" &&
  events[0].face.name === "right";

function drawPrismBody(
  { halfApex, apex, baseLeft, baseRight },
  isBaseReflective
) {
  const corners = [apex, baseRight, baseLeft].map(toPx);
  ctx.save();
  ctx.fillStyle = PRISM_COLORS.fill;
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 2;
  ctx.beginPath();
  corners.forEach(({ x, y }, index) =>
    index === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
  );
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  drawAngleArc({
    from: -Math.PI / 2 - halfApex,
    to: -Math.PI / 2 + halfApex,
    label: "A",
    color: "#000",
    center: apex,
    radius: 28,
  });

  if (isBaseReflective) {
    drawSegment(baseLeft, baseRight, { color: "#000", width: 4 });

    for (let x = baseLeft.x + 1; x <= baseRight.x; x += 1.5) {
      drawSegment(
        { x, y: PRISM_BASE_Y },
        { x: x - 1, y: PRISM_BASE_Y - 1.2 },
        { color: "#777", width: 1 }
      );
    }
  }
}

function drawNormalAt(point, outwardAngle) {
  drawSegment(
    pointAlong(point, outwardAngle, PRISM_NORMAL_LENGTH),
    pointAlong(point, outwardAngle + Math.PI, PRISM_NORMAL_LENGTH),
    {
      color: "#555",
      width: 1.5,
      dashed: true,
    }
  );
}

function getDeviationAngle(incidentAngle, emergentAngle) {
  return normalizeAngle(incidentAngle - emergentAngle);
}

function drawDeviation({ entry, exit, incidentAngle, emergentAngle }) {
  const deviation = getDeviationAngle(incidentAngle, emergentAngle);

  if (Math.abs(toDeg(deviation)) < 0.5 || Math.abs(toDeg(deviation)) > 179.5) {
    return;
  }

  const meeting = intersectLines({
    p: entry,
    angleP: incidentAngle,
    q: exit,
    angleQ: emergentAngle,
  });
  const isAheadOfIncident =
    (meeting.x - entry.x) * Math.cos(incidentAngle) +
      (meeting.y - entry.y) * Math.sin(incidentAngle) >
    0;
  const isBehindEmergent =
    (meeting.x - exit.x) * Math.cos(emergentAngle) +
      (meeting.y - exit.y) * Math.sin(emergentAngle) <
    0;

  if (!isAheadOfIncident || !isBehindEmergent) {
    return;
  }

  drawSegment(entry, pointAlong(meeting, incidentAngle, 8), {
    color: "#555",
    width: 1.5,
    dashed: true,
  });
  drawSegment(exit, meeting, { color: "#555", width: 1.5, dashed: true });
  drawAngleArc({
    from: incidentAngle - deviation,
    to: incidentAngle,
    label: "D",
    color: "#6a1b9a",
    center: meeting,
    radius: 60,
  });
}

function drawPrismEvents(events) {
  events.forEach((event, index) => {
    drawRay(event.from, event.to, { color: PRISM_COLORS.ray });
    drawNormalAt(event.to, event.face.outward);
    drawLabel(PRISM_POINT_LABELS[index], event.to, "#000", {
      x: 8,
      y: event.face.name === "base" ? 20 : -8,
    });
  });
}

function drawPrismExit(exitEvent, isSimple) {
  const { to: exit, face, insideAngle, emergentAngle } = exitEvent;
  const end = pointAlong(exit, emergentAngle, PRISM_RAY_LENGTH);
  const labels = isSimple ? ["r₂", "i₂"] : ["r'", "i'"];
  drawAngleArc({
    from: insideAngle + Math.PI,
    to: face.outward + Math.PI,
    label: labels[0],
    color: PRISM_COLORS.ray,
    center: exit,
    radius: PRISM_ARC_RADIUS,
  });
  drawRay(exit, end, { color: PRISM_COLORS.ray });
  drawAngleArc({
    from: emergentAngle,
    to: face.outward,
    label: labels[1],
    color: PRISM_COLORS.ray,
    center: exit,
    radius: PRISM_ARC_RADIUS,
  });
  drawLabel("R", end, PRISM_COLORS.ray, { x: 8, y: 4 });
}

function renderPrism() {
  const {
    prismApex: apexDeg,
    prismIndex: n,
    prismIncidence: incidenceDeg,
    prismBaseReflective: isBaseReflective,
  } = state;
  const geometry = getPrismGeometry(apexDeg);
  const { halfApex, entry } = geometry;
  const result = computePrism({ apexDeg, n, incidenceDeg });
  const incidentAngle = -halfApex + toRad(incidenceDeg);
  const insideAngle = -halfApex + toRad(result.r1);
  const source = pointAlong(entry, incidentAngle + Math.PI, PRISM_RAY_LENGTH);
  const events = traceInsidePrism({
    faces: getPrismFaces(geometry),
    entry,
    insideAngle,
    n,
    isBaseReflective,
  });
  const exitEvent = events.find((event) => event.kind === "exit");

  drawPrismBody(geometry, isBaseReflective);
  drawNormalAt(entry, Math.PI - halfApex);
  drawRay(source, entry, { color: PRISM_COLORS.ray });
  drawAngleArc({
    from: Math.PI - halfApex,
    to: Math.PI - halfApex + toRad(incidenceDeg),
    label: "i₁",
    color: PRISM_COLORS.ray,
    center: entry,
    radius: PRISM_ARC_RADIUS,
  });
  drawAngleArc({
    from: -halfApex,
    to: insideAngle,
    label: "r₁",
    color: PRISM_COLORS.ray,
    center: entry,
    radius: PRISM_ARC_RADIUS,
  });
  drawLabel("S", source, PRISM_COLORS.ray, { x: -18, y: -6 });
  drawLabel("I", entry, "#000", { x: -18, y: -8 });
  drawPrismEvents(events);

  if (exitEvent) {
    drawPrismExit(exitEvent, isSimplePrismPath(events));
    drawDeviation({
      entry,
      exit: exitEvent.to,
      incidentAngle,
      emergentAngle: exitEvent.emergentAngle,
    });
  }

  renderPrismTexts({ apexDeg, n, incidenceDeg, result, events, incidentAngle });
}

function describeSimplePrism({ incidenceDeg, result }) {
  const lines = [
    `sin i₂ = n·sin r₂ → i₂ = <b>${result.i2.toFixed(2)}°</b>`,
    `Góc lệch D = i₁ + i₂ − A = <b>${result.deviation.toFixed(2)}°</b>`,
  ];

  if (result.minDeviation !== null) {
    lines.push(
      `D<sub>min</sub>: sin((D<sub>min</sub> + A)/2) = n·sin(A/2) → D<sub>min</sub> = ${result.minDeviation.toFixed(
        2
      )}°`
    );
  }

  if (
    result.minDeviation !== null &&
    Math.abs(incidenceDeg - result.i2) < MIN_DEVIATION_TOLERANCE
  ) {
    lines.push("<b>i₁ = i₂, r₁ = r₂ = A/2: góc lệch cực tiểu</b>");
  }

  return lines;
}

function describePrismEvent(event, label, criticalDeg) {
  const incidenceText = `${Math.abs(toDeg(event.incidence)).toFixed(2)}°`;

  if (event.kind === "mirror") {
    return `Tại ${label}: tia chạm <b>đáy phản xạ</b> → phản xạ đi lên (góc phản xạ = góc tới = ${incidenceText})`;
  }

  if (event.kind === "total") {
    return `Tại ${label} (${
      event.face.label
    }): góc tới ${incidenceText} > i<sub>gh</sub> = ${criticalDeg.toFixed(
      2
    )}° → <b>phản xạ toàn phần</b>`;
  }

  return `Tại ${label} (${
    event.face.label
  }): góc tới ${incidenceText}, góc ló ${Math.abs(
    toDeg(event.emergence)
  ).toFixed(2)}° → <b>khúc xạ ra ngoài</b>`;
}

function describePrism({ incidenceDeg, result, events, incidentAngle }) {
  const lines = [`sin i₁ = n·sin r₁ → r₁ = <b>${result.r1.toFixed(2)}°</b>`];

  if (events[0] && events[0].face.name === "right") {
    lines.push(`r₂ = A − r₁ = <b>${result.r2.toFixed(2)}°</b>`);
  }

  if (isSimplePrismPath(events)) {
    return lines
      .concat(describeSimplePrism({ incidenceDeg, result }))
      .join("<br>");
  }

  events.forEach((event, index) =>
    lines.push(
      describePrismEvent(event, PRISM_POINT_LABELS[index], result.criticalDeg)
    )
  );
  const exitEvent = events.find((event) => event.kind === "exit");

  if (!exitEvent) {
    const isTrapped = events.length >= MAX_PRISM_BOUNCES;
    lines.push(
      isTrapped
        ? "Tia sáng bị giữ lại trong lăng kính sau nhiều lần phản xạ."
        : "Tia sáng đi đúng vào cạnh của lăng kính."
    );

    return lines.join("<br>");
  }

  const deviationDeg = Math.abs(
    toDeg(getDeviationAngle(incidentAngle, exitEvent.emergentAngle))
  );
  lines.push(
    `Góc lệch giữa tia ló và tia tới: D = <b>${deviationDeg.toFixed(2)}°</b>`
  );

  return lines.join("<br>");
}

function renderPrismTexts({
  apexDeg,
  n,
  incidenceDeg,
  result,
  events,
  incidentAngle,
}) {
  const minDeviationButton = document.getElementById("minDeviationBtn");
  minDeviationButton.disabled =
    result.minIncidence === null ||
    result.minIncidence > Number(inputs.prismIncidence.max);
  document.getElementById("title").textContent =
    "Lăng kính: sin i₁ = n·sin r₁, sin i₂ = n·sin r₂, A = r₁ + r₂, D = i₁ + i₂ − A";
  document.getElementById("prismApexVal").textContent = apexDeg;
  document.getElementById("prismIndexVal").textContent = n;
  document.getElementById("prismIncidenceVal").textContent = Number(
    incidenceDeg.toFixed(2)
  );
  document.getElementById("prismResult").innerHTML = describePrism({
    incidenceDeg,
    result,
    events,
    incidentAngle,
  });
}

function getSpectrumIndex(index) {
  const { dispersionRedIndex: nRed, dispersionVioletIndex: nViolet } = state;

  return nRed + ((nViolet - nRed) * index) / (SPECTRUM.length - 1);
}

function traceSpectrumRay({ geometry, faces, incidenceDeg, spectralIndex }) {
  const n = getSpectrumIndex(spectralIndex);
  const r1 = toDeg(Math.asin(Math.sin(toRad(incidenceDeg)) / n));
  const insideAngle = -geometry.halfApex + toRad(r1);
  const events = traceInsidePrism({
    faces,
    entry: geometry.entry,
    insideAngle,
    n,
    isBaseReflective: false,
  });

  return {
    ...SPECTRUM[spectralIndex],
    n,
    r1,
    events,
    exitEvent: events.find((event) => event.kind === "exit"),
  };
}

function drawWhiteRay(from, to) {
  drawSegment(from, to, { color: WHITE_RAY_OUTLINE, width: 7 });
  drawSegment(from, to, { color: "#fff", width: 4 });
  drawRayDirection(from, to, WHITE_RAY_OUTLINE);
}

function drawSpectrumRay({ color, events, exitEvent }) {
  events.forEach((event) =>
    drawSegment(event.from, event.to, { color, width: 2 })
  );

  if (!exitEvent) {
    return null;
  }

  const end = pointAlong(
    exitEvent.to,
    exitEvent.emergentAngle,
    DISPERSION_RAY_LENGTH
  );
  drawRay(exitEvent.to, end, { color, width: 2.5 });

  return end;
}

function drawSpectrumLabels(rays, ends) {
  [0, rays.length - 1].forEach((index) => {
    if (ends[index]) {
      drawLabel(rays[index].name, ends[index], rays[index].color, {
        x: 8,
        y: index === 0 ? -6 : 16,
      });
    }
  });
}

function getSpectrumDeviationDeg(ray, incidentAngle) {
  return ray.exitEvent
    ? Math.abs(
        toDeg(getDeviationAngle(incidentAngle, ray.exitEvent.emergentAngle))
      )
    : null;
}

function describeSpectrumRay(ray, incidentAngle) {
  const deviationDeg = getSpectrumDeviationDeg(ray, incidentAngle);
  const outcome =
    deviationDeg === null
      ? "<b>không ló ra</b> (phản xạ toàn phần)"
      : `D = <b>${deviationDeg.toFixed(2)}°</b>`;

  return `<span style="color:${ray.color}">■</span> ${
    ray.name
  }: n = ${ray.n.toFixed(3)}, r₁ = ${ray.r1.toFixed(2)}°, ${outcome}`;
}

function describeDispersion(rays, incidentAngle) {
  const lines = rays.map((ray) => describeSpectrumRay(ray, incidentAngle));
  const redDeviation = getSpectrumDeviationDeg(rays[0], incidentAngle);
  const violetDeviation = getSpectrumDeviationDeg(
    rays[rays.length - 1],
    incidentAngle
  );

  if (redDeviation !== null && violetDeviation !== null) {
    lines.push(
      `Góc mở chùm tia ló: ΔD = D<sub>tím</sub> − D<sub>đỏ</sub> = <b>${(
        violetDeviation - redDeviation
      ).toFixed(2)}°</b>`
    );
  }

  lines.push(
    "n<sub>đỏ</sub> < n<sub>tím</sub> → tia đỏ lệch ít nhất, tia tím lệch nhiều nhất: <b>ánh sáng trắng bị tán sắc</b>"
  );

  return lines.join("<br>");
}

function renderDispersionTexts({ apexDeg, incidenceDeg, rays, incidentAngle }) {
  document.getElementById("title").textContent =
    "Tán sắc ánh sáng qua lăng kính: n đỏ < n tím → D đỏ < D tím";
  document.getElementById("prismApexVal").textContent = apexDeg;
  document.getElementById("prismIncidenceVal").textContent = Number(
    incidenceDeg.toFixed(2)
  );
  document.getElementById("dispersionRedIndexVal").textContent =
    state.dispersionRedIndex;
  document.getElementById("dispersionVioletIndexVal").textContent =
    state.dispersionVioletIndex;
  document.getElementById("prismResult").innerHTML = describeDispersion(
    rays,
    incidentAngle
  );
}

function renderDispersion() {
  const { prismApex: apexDeg, prismIncidence: incidenceDeg } = state;
  const geometry = getPrismGeometry(apexDeg);
  const { halfApex, entry } = geometry;
  const faces = getPrismFaces(geometry);
  const incidentAngle = -halfApex + toRad(incidenceDeg);
  const source = pointAlong(entry, incidentAngle + Math.PI, PRISM_RAY_LENGTH);
  const rays = SPECTRUM.map((_, spectralIndex) =>
    traceSpectrumRay({ geometry, faces, incidenceDeg, spectralIndex })
  );

  drawPrismBody(geometry, false);
  drawNormalAt(entry, Math.PI - halfApex);
  const ends = rays.map(drawSpectrumRay);
  drawWhiteRay(source, entry);
  drawAngleArc({
    from: Math.PI - halfApex,
    to: Math.PI - halfApex + toRad(incidenceDeg),
    label: "i₁",
    color: "#555",
    center: entry,
    radius: PRISM_ARC_RADIUS,
  });
  drawLabel("S", source, "#555", { x: -18, y: -6 });
  drawLabel("I", entry, "#000", { x: -18, y: -8 });
  drawSpectrumLabels(rays, ends);
  renderDispersionTexts({ apexDeg, incidenceDeg, rays, incidentAngle });
}

const toSubscript = (value) =>
  String(value).replace(/\d/g, (digit) => "₀₁₂₃₄₅₆₇₈₉"[digit]);
const distanceBetween = (p, q) => Math.hypot(p.x - q.x, p.y - q.y);

function getMirrorSystem() {
  const alpha = toRad(state.mirrorAngle);
  const firstAngle = Math.PI / 2 - alpha / 2;
  const createMirror = (label, angle, side) => ({
    label,
    angle,
    side,
    start: MIRROR_VERTEX,
    end: pointAlong(MIRROR_VERTEX, angle, MIRROR_LENGTH),
  });
  const mirrors = [
    createMirror("G₁", firstAngle, 1),
    createMirror("G₂", firstAngle + alpha, -1),
  ];
  const sourceAngle = firstAngle + state.mirrorSourceRatio * alpha;

  return {
    alpha,
    mirrors,
    source: pointAlong(MIRROR_VERTEX, sourceAngle, state.mirrorSourceRadius),
  };
}

function reflectAcrossMirror(p, mirror) {
  const unit = { x: Math.cos(mirror.angle), y: Math.sin(mirror.angle) };
  const offset = { x: p.x - MIRROR_VERTEX.x, y: p.y - MIRROR_VERTEX.y };
  const projection = offset.x * unit.x + offset.y * unit.y;

  return {
    x: MIRROR_VERTEX.x + 2 * projection * unit.x - offset.x,
    y: MIRROR_VERTEX.y + 2 * projection * unit.y - offset.y,
  };
}

function isInFrontOfMirror(p, mirror) {
  const cross =
    Math.cos(mirror.angle) * (p.y - MIRROR_VERTEX.y) -
    Math.sin(mirror.angle) * (p.x - MIRROR_VERTEX.x);

  return mirror.side * cross > 1e-9;
}

function computeMirrorImages({ source, mirrors }) {
  const images = [];

  for (const firstIndex of [0, 1]) {
    let image = source;
    let index = firstIndex;

    for (
      let step = 0;
      step < MAX_MIRROR_IMAGES && isInFrontOfMirror(image, mirrors[index]);
      step++
    ) {
      const parent = image;
      image = reflectAcrossMirror(parent, mirrors[index]);
      const isNew = images.every(
        (existing) => distanceBetween(existing.point, image) > 1e-6
      );

      if (isNew) {
        images.push({ point: image, parent, mirror: mirrors[index] });
      }

      index = 1 - index;
    }
  }

  return images;
}

function traceMirrorRay({ source, rayAngle, mirrors }) {
  const hits = [];
  let point = source;
  let direction = rayAngle;
  let lastMirror = null;

  for (let step = 0; step < MAX_MIRROR_REFLECTIONS; step++) {
    const next = mirrors
      .filter((mirror) => mirror !== lastMirror)
      .map((mirror) => ({
        mirror,
        hit: intersectFace(point, direction, mirror),
      }))
      .filter(({ hit }) => hit !== null)
      .sort((first, second) => first.hit.distance - second.hit.distance)[0];

    if (!next) {
      break;
    }

    hits.push({
      from: point,
      point: next.hit.point,
      mirror: next.mirror,
      incomingAngle: direction,
    });
    direction = 2 * next.mirror.angle - direction;
    point = next.hit.point;
    lastMirror = next.mirror;
  }

  return { hits, finalAngle: direction, lastPoint: point };
}

function drawPlaneMirror(mirror) {
  const outward = mirror.angle - (mirror.side * Math.PI) / 2;
  drawSegment(mirror.start, mirror.end, { color: "#000", width: 4 });

  for (let distance = 1; distance <= MIRROR_LENGTH; distance += 1.5) {
    const base = pointAlong(MIRROR_VERTEX, mirror.angle, distance);
    drawSegment(
      base,
      pointAlong(pointAlong(base, outward, 1.2), mirror.angle, -1),
      { color: "#777", width: 1 }
    );
  }

  drawLabel(mirror.label, mirror.end, "#000", { x: 8, y: -8 });
}

function drawMirrorImages({ source, images }) {
  const center = toPx(MIRROR_VERTEX);
  ctx.save();
  ctx.strokeStyle = "#999";
  ctx.setLineDash(DASH);
  ctx.beginPath();
  ctx.arc(
    center.x,
    center.y,
    distanceBetween(source, MIRROR_VERTEX) * SCALE,
    0,
    Math.PI * 2
  );
  ctx.stroke();
  ctx.restore();

  images.forEach(drawConstructionLine);
  images.forEach(({ point }, index) => {
    drawPoint(point, COLORS.image);

    if (images.length <= MIRROR_LABEL_LIMIT) {
      drawLabel(`S${toSubscript(index + 1)}`, point, COLORS.image, {
        x: 6,
        y: -6,
      });
    }
  });
}

function drawExtendedMirrorLines(mirrors) {
  const reach = Math.hypot(X_MAX, CENTER_Y / SCALE);
  mirrors.forEach(({ angle }) => {
    drawSegment(
      pointAlong(MIRROR_VERTEX, angle, -reach),
      pointAlong(MIRROR_VERTEX, angle, reach),
      { color: "#bbb", width: 1, dashed: true }
    );
  });
}

function drawRightAngleMark(foot, alongAngle, towardAngle) {
  const corner = pointAlong(
    pointAlong(foot, alongAngle, RIGHT_ANGLE_MARK_SIZE),
    towardAngle,
    RIGHT_ANGLE_MARK_SIZE
  );
  drawSegment(pointAlong(foot, alongAngle, RIGHT_ANGLE_MARK_SIZE), corner, {
    color: CONSTRUCTION_LINE_COLOR,
    width: 1,
  });
  drawSegment(pointAlong(foot, towardAngle, RIGHT_ANGLE_MARK_SIZE), corner, {
    color: CONSTRUCTION_LINE_COLOR,
    width: 1,
  });
}

function drawConstructionLine({ point, parent, mirror }) {
  const foot = { x: (point.x + parent.x) / 2, y: (point.y + parent.y) / 2 };
  drawSegment(parent, point, {
    color: CONSTRUCTION_LINE_COLOR,
    width: 1.2,
    dashed: true,
  });
  drawRightAngleMark(
    foot,
    mirror.angle,
    Math.atan2(parent.y - foot.y, parent.x - foot.x)
  );
}

function drawMirrorRay({ source, mirrors, rayAngle }) {
  const trace = traceMirrorRay({ source, rayAngle, mirrors });
  const { hits, finalAngle, lastPoint } = trace;

  hits.forEach((hit, index) => {
    const inward = hit.mirror.angle + (hit.mirror.side * Math.PI) / 2;
    drawRay(hit.from, hit.point, {
      color: index === 0 ? COLORS.ray1 : COLORS.object,
      width: 2.5,
    });
    drawSegment(
      hit.point,
      pointAlong(hit.point, inward, MIRROR_NORMAL_LENGTH),
      { color: "#555", width: 1, dashed: true }
    );
    drawLabel(`I${toSubscript(index + 1)}`, hit.point, "#000", { x: 6, y: 16 });
  });

  const exitEnd = pointAlong(lastPoint, finalAngle, MIRROR_EXIT_LENGTH);
  drawRay(lastPoint, exitEnd, {
    color: hits.length === 0 ? COLORS.ray1 : COLORS.ray2,
    width: 2.5,
  });

  if (hits.length > 0) {
    const finalImage = hits.reduce(
      (image, hit) => reflectAcrossMirror(image, hit.mirror),
      source
    );
    drawSegment(lastPoint, finalImage, {
      color: COLORS.ray2,
      width: 1.5,
      dashed: true,
    });
  }

  return trace;
}

function describeImageCountRule() {
  const ratio = 360 / state.mirrorAngle;
  const rounded = Math.round(ratio);

  if (Math.abs(ratio - rounded) > 1e-9) {
    return `360°/α = ${ratio.toFixed(
      2
    )} không nguyên → số ảnh phụ thuộc vị trí của S`;
  }

  if (rounded % 2 === 0) {
    return `360°/α = ${rounded} chẵn → số ảnh n = 360°/α − 1 = ${rounded - 1}`;
  }

  return `360°/α = ${rounded} lẻ → n = ${
    rounded - 1
  } nếu S nằm trên đường phân giác của góc α, ngược lại n = ${rounded}`;
}

function describeMirrorImages({ images }) {
  return [
    describeImageCountRule(),
    `Số ảnh của S tạo bởi hệ: <b>${images.length}</b> (cùng nằm trên đường tròn tâm O, bán kính OS)`,
  ];
}

function describeMirrorRay({ hits, finalAngle }) {
  if (hits.length === 0) {
    return ["Tia sáng không gặp gương nào."];
  }

  const lines = hits.map((hit, index) => {
    const inward = hit.mirror.angle + (hit.mirror.side * Math.PI) / 2;
    const incidence = Math.abs(
      toDeg(normalizeAngle(hit.incomingAngle + Math.PI - inward))
    );

    return `Tại I${toSubscript(index + 1)} (gương ${
      hit.mirror.label
    }): i = i' = ${incidence.toFixed(2)}°`;
  });
  const deviation = Math.abs(
    toDeg(normalizeAngle(finalAngle - toRad(state.mirrorRayAngle)))
  );
  lines.push(
    `Tia sáng phản xạ <b>${
      hits.length
    }</b> lần rồi ló ra; góc giữa tia ló và tia tới: <b>${deviation.toFixed(
      2
    )}°</b>`
  );

  if (hits.length === 2) {
    lines.push(
      `Phản xạ lần lượt trên hai gương: tia ló bị quay một góc 2α = ${
        2 * state.mirrorAngle
      }° so với tia tới`
    );
  }

  lines.push(
    "Đường kéo dài của tia ló đi qua ảnh tương ứng của S (nét đứt xanh lá)."
  );

  return lines;
}

function renderMirrors() {
  const { alpha, mirrors, source } = getMirrorSystem();
  const rayAngle = toRad(state.mirrorRayAngle);
  const images = computeMirrorImages({ source, mirrors });

  drawExtendedMirrorLines(mirrors);
  drawMirrorImages({ source, images });
  mirrors.forEach(drawPlaneMirror);
  drawAngleArc({
    from: mirrors[0].angle,
    to: mirrors[1].angle,
    label: "α",
    color: "#000",
    center: MIRROR_VERTEX,
    radius: 30,
  });
  drawLabel("O", MIRROR_VERTEX, "#000", { x: -6, y: 20 });
  const trace = drawMirrorRay({ source, mirrors, rayAngle });
  drawPoint(source, COLORS.ray1);
  drawLabel("S", source, COLORS.ray1, { x: 8, y: -8 });

  document.getElementById("title").textContent =
    "Hệ hai gương phẳng hợp với nhau một góc α";
  document.getElementById("mirrorAngleVal").textContent = Math.round(
    toDeg(alpha)
  );
  document.getElementById("mirrorRayAngleVal").textContent =
    state.mirrorRayAngle;
  document.getElementById("mirrorsResult").innerHTML = describeMirrorImages({
    images,
  })
    .concat(describeMirrorRay(trace))
    .join("<br>");
}

const RENDERERS = {
  converging: renderLens,
  diverging: renderLens,
  systemConverging: renderSystem,
  systemDiverging: renderSystem,
  reflection: renderReflection,
  refraction: renderRefraction,
  prism: renderPrism,
  dispersion: renderDispersion,
  mirrors: renderMirrors,
};

function clearCanvas() {
  // clearRect follows the current transform. After sharpenCanvas() maps
  // logical → device pixels, clearing with canvas.width/height only wipes a
  // fraction of the surface when the CSS box is smaller than the logical size
  // (typical in the 16:9 embed) — leaving previous strokes visible.
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
}

function render() {
  clearCanvas();
  RENDERERS[state.mode]();
}

const criticalBtn = document.getElementById("criticalBtn");

if (criticalBtn) {
  criticalBtn.addEventListener("click", () => {
    const refraction = computeRefraction({
      n1: state.n1,
      n2: state.n2,
      incidenceDeg: state.refractionAngle,
    });

    if (refraction.criticalDeg === null) {
      return;
    }

    state.refractionAngle = refraction.criticalDeg;
    inputs.refractionAngle.value = refraction.criticalDeg;
    render();
  });
}

const minDeviationBtn = document.getElementById("minDeviationBtn");

if (minDeviationBtn) {
  minDeviationBtn.addEventListener("click", () => {
    const { minIncidence } = computePrism({
      apexDeg: state.prismApex,
      n: state.prismIndex,
      incidenceDeg: state.prismIncidence,
    });

    if (minIncidence === null) {
      return;
    }

    state.prismIncidence = minIncidence;
    inputs.prismIncidence.value = minIncidence;
    render();
  });
}

const prismBaseReflectiveIn = document.getElementById("prismBaseReflectiveIn");

if (prismBaseReflectiveIn) {
  prismBaseReflectiveIn.addEventListener("change", (event) => {
    state.prismBaseReflective = event.target.checked;
    render();
  });
}

Object.entries(inputs).forEach(([key, input]) => {
  if (!input) {
    return;
  }

  // Prefer HTML default values (e.g. n₂ = 1.33) over hardcoded state.
  if (state[key] !== undefined) {
    state[key] = Number(input.value);
  }

  input.addEventListener("input", () => {
    state[key] = Number(input.value);
    render();
  });
});

let isDragging = false;

function getMouseWorld(event) {
  const rect = canvas.getBoundingClientRect();

  return toWorld({
    x: ((event.clientX - rect.left) * LOGICAL_CANVAS_WIDTH) / rect.width,
    y: ((event.clientY - rect.top) * LOGICAL_CANVAS_HEIGHT) / rect.height,
  });
}

const isNearObject = ({ p, objectX, height }) =>
  Math.abs(p.x - objectX) < 2 && p.y > -1 && p.y < height + 2;

let mirrorDragTarget = "direction";

function canStartDrag(p) {
  if (state.mode === "mirrors") {
    mirrorDragTarget =
      distanceBetween(p, getMirrorSystem().source) < MIRROR_SOURCE_GRAB_RADIUS
        ? "source"
        : "direction";

    return true;
  }

  if (isPrismMode()) {
    return p.x < getPrismGeometry(state.prismApex).entry.x;
  }

  if (isLensMode()) {
    return isNearObject({ p, objectX: -state.d, height: state.h });
  }

  if (isSystemMode()) {
    return isNearObject({
      p,
      objectX: SYSTEM_LENS1_X - state.systemD1,
      height: state.systemH,
    });
  }

  return p.y > 0;
}

canvas.addEventListener("mousedown", (event) => {
  isDragging = canStartDrag(getMouseWorld(event));
});

const clampToInput = (value, input) =>
  Math.min(
    Number(input.max),
    Math.max(Number(input.min), Math.round(value * 2) / 2)
  );

function dragObject({ p, distanceKey, heightKey, lensX }) {
  state[distanceKey] = clampToInput(lensX - p.x, inputs[distanceKey]);
  state[heightKey] = clampToInput(p.y, inputs[heightKey]);
  inputs[distanceKey].value = state[distanceKey];
  inputs[heightKey].value = state[heightKey];
  render();
}

function dragIncidenceAngle(p) {
  const key = ANGLE_INPUT_KEYS[state.mode];
  const input = inputs[key];
  const angle = toDeg(Math.atan2(-p.x, p.y));
  state[key] = Math.min(
    Number(input.max),
    Math.max(Number(input.min), Math.round(angle * 2) / 2)
  );
  input.value = state[key];
  render();
}

window.addEventListener("mouseup", () => {
  isDragging = false;
});

canvas.addEventListener("mousemove", (event) => {
  if (!isDragging) {
    return;
  }

  const p = getMouseWorld(event);

  if (isLensMode()) {
    dragObject({ p, distanceKey: "d", heightKey: "h", lensX: 0 });

    return;
  }

  if (isSystemMode()) {
    dragObject({
      p,
      distanceKey: "systemD1",
      heightKey: "systemH",
      lensX: SYSTEM_LENS1_X,
    });

    return;
  }

  if (isPrismMode()) {
    dragPrismIncidence(p);

    return;
  }

  if (state.mode === "mirrors") {
    dragMirrorSystem(p);

    return;
  }

  dragIncidenceAngle(p);
});

function dragMirrorSource(p) {
  const { alpha, mirrors } = getMirrorSystem();
  const angleFromFirstMirror = normalizeAngle(
    Math.atan2(p.y - MIRROR_VERTEX.y, p.x - MIRROR_VERTEX.x) - mirrors[0].angle
  );
  const ratio = angleFromFirstMirror / alpha;
  state.mirrorSourceRatio = Math.min(
    1 - MIRROR_SOURCE_RATIO_MARGIN,
    Math.max(MIRROR_SOURCE_RATIO_MARGIN, ratio)
  );
  state.mirrorSourceRadius = Math.min(
    MIRROR_LENGTH - 2,
    Math.max(2, distanceBetween(p, MIRROR_VERTEX))
  );
}

function dragMirrorRayAngle(p) {
  const { source } = getMirrorSystem();
  const angle = (toDeg(Math.atan2(p.y - source.y, p.x - source.x)) + 360) % 360;
  state.mirrorRayAngle = Math.round(angle * 2) / 2;
  inputs.mirrorRayAngle.value = state.mirrorRayAngle;
}

function dragMirrorSystem(p) {
  if (mirrorDragTarget === "source") {
    dragMirrorSource(p);
  } else {
    dragMirrorRayAngle(p);
  }

  render();
}

function dragPrismIncidence(p) {
  const { entry, halfApex } = getPrismGeometry(state.prismApex);
  const rawAngle = toDeg(
    Math.atan2(p.y - entry.y, p.x - entry.x) - (Math.PI - halfApex)
  );
  const angle = (((rawAngle % 360) + 540) % 360) - 180;
  state.prismIncidence = clampToInput(angle, inputs.prismIncidence);
  inputs.prismIncidence.value = state.prismIncidence;
  render();
}

function sharpenCanvas() {
  const rect = canvas.getBoundingClientRect();
  const pixelRatio = Math.max(1, window.devicePixelRatio || 1);
  const targetWidth = Math.max(1, Math.round(rect.width * pixelRatio));
  const targetHeight = Math.max(1, Math.round(rect.height * pixelRatio));
  const needsResize =
    canvas.width !== targetWidth || canvas.height !== targetHeight;

  if (needsResize) {
    canvas.width = targetWidth;
    canvas.height = targetHeight;
  }

  // Setting canvas.width resets the transform; always re-apply.
  ctx.setTransform(
    targetWidth / LOGICAL_CANVAS_WIDTH,
    0,
    0,
    targetHeight / LOGICAL_CANVAS_HEIGHT,
    0,
    0
  );

  if (needsResize) {
    render();
  }
}

window.addEventListener("resize", sharpenCanvas);
render();
window.requestAnimationFrame(sharpenCanvas);
