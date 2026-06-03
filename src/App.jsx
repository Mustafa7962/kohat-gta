import { useEffect, useRef, useState, useCallback } from "react";

// ─── MAP LAYOUT ───────────────────────────────────────────────────────────────
// Based on Kohat city structure: Fort, Bazaar, GT Road, Hangu Road, residential blocks

const MAP_W = 3200;
const MAP_H = 2400;
const TILE = 40;

// Road network: horizontal + vertical roads
const H_ROADS = [
  { y: 200, x1: 0,    x2: MAP_W, w: 60, name: "GT Road (North)" },
  { y: 600, x1: 0,    x2: MAP_W, w: 80, name: "Peshawar Rd" },
  { y: 1000,x1: 0,    x2: MAP_W, w: 60, name: "Hangu Road" },
  { y: 1400,x1: 0,    x2: MAP_W, w: 50, name: "Cantt Road" },
  { y: 1800,x1: 0,    x2: MAP_W, w: 60, name: "Jail Road" },
  { y: 2200,x1: 0,    x2: MAP_W, w: 50, name: "Circular Road" },
  { y: 400, x1: 400,  x2: 2800,  w: 36, name: "Link Road 1" },
  { y: 800, x1: 200,  x2: 3000,  w: 36, name: "Bazaar Rd" },
  { y: 1200,x1: 0,    x2: MAP_W, w: 36, name: "Link Road 3" },
  { y: 1600,x1: 0,    x2: MAP_W, w: 36, name: "Link Road 4" },
  { y: 2000,x1: 0,    x2: MAP_W, w: 36, name: "Link Road 5" },
];

const V_ROADS = [
  { x: 200,  y1: 0,    y2: MAP_H, w: 60, name: "Fort Rd" },
  { x: 600,  y1: 0,    y2: MAP_H, w: 80, name: "Main Bazaar" },
  { x: 1000, y1: 0,    y2: MAP_H, w: 50, name: "Industrial Rd" },
  { x: 1400, y1: 0,    y2: MAP_H, w: 60, name: "Civil Lines Rd" },
  { x: 1800, y1: 0,    y2: MAP_H, w: 50, name: "Airport Rd" },
  { x: 2200, y1: 0,    y2: MAP_H, w: 60, name: "Cantt Link" },
  { x: 2600, y1: 0,    y2: MAP_H, w: 50, name: "Eastern Bypass" },
  { x: 3000, y1: 0,    y2: MAP_H, w: 50, name: "Industrial Link" },
  { x: 400,  y1: 0,    y2: MAP_H, w: 36, name: "Side St 1" },
  { x: 800,  y1: 0,    y2: MAP_H, w: 36, name: "Side St 2" },
  { x: 1200, y1: 0,    y2: MAP_H, w: 36, name: "Side St 3" },
  { x: 1600, y1: 0,    y2: MAP_H, w: 36, name: "Side St 4" },
  { x: 2000, y1: 0,    y2: MAP_H, w: 36, name: "Side St 5" },
  { x: 2400, y1: 0,    y2: MAP_H, w: 36, name: "Side St 6" },
  { x: 2800, y1: 0,    y2: MAP_H, w: 36, name: "Side St 7" },
];

// Landmarks / large buildings
const LANDMARKS = [
  { x: 50,   y: 50,   w: 280, h: 260, color: "#8B4513", roof: "#6B3410", name: "🏰 Kohat Fort", type: "fort" },
  { x: 450,  y: 650,  w: 220, h: 180, color: "#CD853F", roof: "#A0522D", name: "🕌 Jama Masjid", type: "mosque" },
  { x: 1300, y: 450,  w: 300, h: 200, color: "#2F4F4F", roof: "#1a3333", name: "🏥 DHQ Hospital", type: "hospital" },
  { x: 1650, y: 50,   w: 280, h: 180, color: "#4682B4", roof: "#2d5a89", name: "✈️ Kohat Airport", type: "airport" },
  { x: 900,  y: 1050, w: 200, h: 150, color: "#DAA520", roof: "#B8860B", name: "🏫 Cadet College", type: "school" },
  { x: 2050, y: 850,  w: 250, h: 180, color: "#556B2F", roof: "#3d4d21", name: "🪖 Kohat Cantt", type: "military" },
  { x: 500,  y: 1450, w: 180, h: 140, color: "#8B0000", roof: "#6b0000", name: "🚓 Police Station", type: "police" },
  { x: 1100, y: 1850, w: 200, h: 160, color: "#228B22", roof: "#1a6b1a", name: "🌳 Public Park", type: "park" },
  { x: 2400, y: 1600, w: 220, h: 160, color: "#B8860B", roof: "#8B6914", name: "🏭 Industrial Area", type: "industry" },
  { x: 700,  y: 2050, w: 160, h: 120, color: "#4169E1", roof: "#2d4fc0", name: "🏦 MCB Bank", type: "bank" },
  { x: 1800, y: 2100, w: 180, h: 130, color: "#FF6347", roof: "#cc4f3a", name: "🛒 Saddar Bazaar", type: "market" },
  { x: 2700, y: 200,  w: 200, h: 160, color: "#708090", roof: "#556070", name: "🏗️ New Colony", type: "residential" },
];

// Small buildings to fill blocks
function generateBuildings() {
  const buildings = [];
  const colors = ["#8B7355","#A0896B","#C8A882","#7B6B55","#9E8870","#B5976A","#6B5B45","#D4B896"];
  let id = 0;
  for (let bx = 0; bx < MAP_W; bx += 200) {
    for (let by = 0; by < MAP_H; by += 200) {
      // Check if it's a road area
      const onHRoad = H_ROADS.some(r => by + 10 >= r.y - r.w/2 && by <= r.y + r.w/2 + 50);
      const onVRoad = V_ROADS.some(r => bx + 10 >= r.x - r.w/2 && bx <= r.x + r.w/2 + 50);
      const onLandmark = LANDMARKS.some(l => bx >= l.x - 30 && bx <= l.x + l.w + 30 && by >= l.y - 30 && by <= l.y + l.h + 30);
      if (!onHRoad && !onVRoad && !onLandmark) {
        const count = 2 + Math.floor(Math.random() * 3);
        for (let i = 0; i < count; i++) {
          const w = 25 + Math.random() * 40;
          const h = 20 + Math.random() * 35;
          const ox = Math.random() * (160 - w);
          const oy = Math.random() * (160 - h);
          buildings.push({
            id: id++,
            x: bx + 20 + ox,
            y: by + 20 + oy,
            w, h,
            color: colors[Math.floor(Math.random() * colors.length)],
            roof: "#5a4a35",
          });
        }
      }
    }
  }
  return buildings;
}

// Trees
function generateTrees() {
  const trees = [];
  const roadY = new Set(H_ROADS.map(r => r.y));
  const roadX = new Set(V_ROADS.map(r => r.x));
  for (let i = 0; i < 400; i++) {
    const x = 30 + Math.random() * (MAP_W - 60);
    const y = 30 + Math.random() * (MAP_H - 60);
    const onHRoad = H_ROADS.some(r => y >= r.y - r.w/2 - 15 && y <= r.y + r.w/2 + 15);
    const onVRoad = V_ROADS.some(r => x >= r.x - r.w/2 - 15 && x <= r.x + r.w/2 + 15);
    const onLandmark = LANDMARKS.some(l => x >= l.x - 10 && x <= l.x + l.w + 10 && y >= l.y - 10 && y <= l.y + l.h + 10);
    if (!onHRoad && !onVRoad && !onLandmark) {
      trees.push({ id: i, x, y, r: 8 + Math.random() * 8 });
    }
  }
  return trees;
}

const STATIC_BUILDINGS = generateBuildings();
const STATIC_TREES = generateTrees();

// Spawn cars
function spawnCars() {
  const cars = [];
  const carColors = ["#e74c3c","#3498db","#2ecc71","#f39c12","#9b59b6","#1abc9c","#e67e22","#ecf0f1","#34495e"];
  for (let i = 0; i < 40; i++) {
    const onHRoad = H_ROADS[Math.floor(Math.random() * H_ROADS.length)];
    const x = Math.random() * MAP_W;
    cars.push({
      id: i,
      x,
      y: onHRoad.y,
      w: 28, h: 16,
      color: carColors[Math.floor(Math.random() * carColors.length)],
      angle: 0,
      speed: 1.5 + Math.random() * 2,
      dir: Math.random() < 0.5 ? 1 : -1,
      driven: false,
    });
  }
  for (let i = 40; i < 70; i++) {
    const onVRoad = V_ROADS[Math.floor(Math.random() * V_ROADS.length)];
    const y = Math.random() * MAP_H;
    cars.push({
      id: i,
      x: onVRoad.x,
      y,
      w: 16, h: 28,
      color: carColors[Math.floor(Math.random() * carColors.length)],
      angle: Math.PI / 2,
      speed: 1.5 + Math.random() * 2,
      dir: Math.random() < 0.5 ? 1 : -1,
      driven: false,
    });
  }
  return cars;
}

function spawnPolice() {
  return [
    { id: "p1", x: 520, y: 1490, w: 28, h: 16, angle: 0, speed: 0, driven: false, alert: false, color: "#1a1aff" },
    { id: "p2", x: 1400, y: 600, w: 28, h: 16, angle: 0, speed: 0, driven: false, alert: false, color: "#1a1aff" },
  ];
}

// ─── CANVAS RENDERER ─────────────────────────────────────────────────────────

function drawMap(ctx, camX, camY, cw, ch, cars, police, player, wantedLevel, nearbyText) {
  // Ground — satellite-like dark olive/tan
  const grad = ctx.createLinearGradient(0, 0, cw, ch);
  grad.addColorStop(0, "#4a5240");
  grad.addColorStop(1, "#3d4535");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, cw, ch);

  ctx.save();
  ctx.translate(-camX, -camY);

  // Ground patches
  for (let gx = 0; gx < MAP_W; gx += 120) {
    for (let gy = 0; gy < MAP_H; gy += 120) {
      ctx.fillStyle = (gx + gy) % 240 === 0 ? "#4f5a45" : "#454d3c";
      ctx.fillRect(gx, gy, 120, 120);
    }
  }

  // Roads shadow
  H_ROADS.forEach(r => {
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(r.x1, r.y - r.w/2 + 3, r.x2 - r.x1, r.w);
  });
  V_ROADS.forEach(r => {
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(r.x - r.w/2 + 3, r.y1, r.w, r.y2 - r.y1);
  });

  // Roads
  H_ROADS.forEach(r => {
    ctx.fillStyle = "#2c2c2c";
    ctx.fillRect(r.x1, r.y - r.w/2, r.x2 - r.x1, r.w);
    // Center line
    ctx.strokeStyle = "#FFD700";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([30, 20]);
    ctx.beginPath();
    ctx.moveTo(r.x1, r.y);
    ctx.lineTo(r.x2, r.y);
    ctx.stroke();
    ctx.setLineDash([]);
    // Edge lines
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(r.x1, r.y - r.w/2 + 3);
    ctx.lineTo(r.x2, r.y - r.w/2 + 3);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(r.x1, r.y + r.w/2 - 3);
    ctx.lineTo(r.x2, r.y + r.w/2 - 3);
    ctx.stroke();
  });
  V_ROADS.forEach(r => {
    ctx.fillStyle = "#2c2c2c";
    ctx.fillRect(r.x - r.w/2, r.y1, r.w, r.y2 - r.y1);
    ctx.strokeStyle = "#FFD700";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([30, 20]);
    ctx.beginPath();
    ctx.moveTo(r.x, r.y1);
    ctx.lineTo(r.x, r.y2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(r.x - r.w/2 + 3, r.y1);
    ctx.lineTo(r.x - r.w/2 + 3, r.y2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(r.x + r.w/2 - 3, r.y1);
    ctx.lineTo(r.x + r.w/2 - 3, r.y2);
    ctx.stroke();
  });

  // Trees
  STATIC_TREES.forEach(t => {
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.beginPath();
    ctx.ellipse(t.x + 2, t.y + 2, t.r, t.r * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#2d5a1b";
    ctx.beginPath();
    ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#3a7a24";
    ctx.beginPath();
    ctx.arc(t.x - t.r * 0.2, t.y - t.r * 0.2, t.r * 0.7, 0, Math.PI * 2);
    ctx.fill();
  });

  // Small buildings
  STATIC_BUILDINGS.forEach(b => {
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fillRect(b.x + 4, b.y + 4, b.w, b.h);
    ctx.fillStyle = b.color;
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.fillStyle = b.roof;
    ctx.fillRect(b.x + 2, b.y + 2, b.w - 4, b.h - 4);
    // windows
    ctx.fillStyle = "rgba(255,255,150,0.6)";
    for (let wx = b.x + 4; wx < b.x + b.w - 4; wx += 8) {
      for (let wy = b.y + 4; wy < b.y + b.h - 4; wy += 8) {
        ctx.fillRect(wx, wy, 4, 4);
      }
    }
  });

  // Landmarks
  LANDMARKS.forEach(l => {
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(l.x + 6, l.y + 6, l.w, l.h);
    ctx.fillStyle = l.color;
    ctx.fillRect(l.x, l.y, l.w, l.h);
    ctx.fillStyle = l.roof;
    ctx.fillRect(l.x + 4, l.y + 4, l.w - 8, l.h - 8);
    // Landmark label
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.font = "bold 11px 'Courier New'";
    ctx.textAlign = "center";
    ctx.fillText(l.name, l.x + l.w / 2, l.y + l.h / 2 + 4);
  });

  // Traffic cars
  cars.forEach(c => {
    if (c.driven) return;
    drawCar(ctx, c.x, c.y, c.w, c.h, c.color, c.angle);
  });

  // Police cars
  police.forEach(p => {
    if (p.driven) return;
    drawCar(ctx, p.x, p.y, 28, 16, "#1a1aff", p.angle, true);
  });

  // Player
  if (player.inCar) {
    const car = [...cars, ...police].find(c => c.driven);
    if (car) {
      drawCar(ctx, player.x, player.y, car.w, car.h, car.color, player.angle, car.isPolice);
    }
  } else {
    drawPlayer(ctx, player.x, player.y, player.angle);
  }

  // Nearby action hint
  if (nearbyText) {
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.beginPath();
    ctx.roundRect(player.x - 70, player.y - 55, 140, 22, 6);
    ctx.fill();
    ctx.fillStyle = "#FFD700";
    ctx.font = "bold 11px 'Courier New'";
    ctx.textAlign = "center";
    ctx.fillText(nearbyText, player.x, player.y - 40);
  }

  ctx.restore();

  // HUD
  drawHUD(ctx, cw, ch, player, wantedLevel);
}

function drawCar(ctx, x, y, w, h, color, angle, isPolice = false) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.fillRect(-w/2 + 3, -h/2 + 3, w, h);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(-w/2, -h/2, w, h, 4);
  ctx.fill();
  // windshield
  ctx.fillStyle = "rgba(150,220,255,0.7)";
  ctx.fillRect(w/2 - 10, -h/2 + 3, 8, h - 6);
  ctx.fillStyle = "rgba(100,180,220,0.5)";
  ctx.fillRect(-w/2 + 2, -h/2 + 3, 6, h - 6);
  // wheels
  ctx.fillStyle = "#111";
  [[-w/2+2,-h/2+1],[w/2-8,-h/2+1],[-w/2+2,h/2-5],[w/2-8,h/2-5]].forEach(([wx,wy]) => {
    ctx.fillRect(wx, wy, 6, 4);
  });
  if (isPolice) {
    // Police light bar
    ctx.fillStyle = "#ff0000";
    ctx.fillRect(-6, -h/2 - 3, 6, 5);
    ctx.fillStyle = "#0000ff";
    ctx.fillRect(1, -h/2 - 3, 6, 5);
  }
  ctx.restore();
}

function drawPlayer(ctx, x, y, angle) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.beginPath();
  ctx.ellipse(2, 2, 8, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  // Body
  ctx.fillStyle = "#2ecc71";
  ctx.beginPath();
  ctx.ellipse(0, 0, 8, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  // Head
  ctx.fillStyle = "#e8c49a";
  ctx.beginPath();
  ctx.arc(0, 0, 5, 0, Math.PI * 2);
  ctx.fill();
  // Direction dot
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(5, 0, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawHUD(ctx, cw, ch, player, wantedLevel) {
  // Minimap background
  const mm = { x: cw - 185, y: ch - 185, w: 170, h: 170, scale: 170 / MAP_W };
  ctx.fillStyle = "rgba(0,0,0,0.75)";
  ctx.beginPath();
  ctx.roundRect(mm.x - 5, mm.y - 5, mm.w + 10, mm.h + 10, 8);
  ctx.fill();
  ctx.strokeStyle = "#FFD700";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Mini roads
  ctx.save();
  ctx.beginPath();
  ctx.rect(mm.x, mm.y, mm.w, mm.h);
  ctx.clip();
  H_ROADS.forEach(r => {
    ctx.fillStyle = "#444";
    const ry = mm.y + r.y * mm.scale;
    ctx.fillRect(mm.x, ry - 2, mm.w, 4);
  });
  V_ROADS.forEach(r => {
    ctx.fillStyle = "#444";
    const rx = mm.x + r.x * mm.scale;
    ctx.fillRect(rx - 2, mm.y, 4, mm.h);
  });
  LANDMARKS.forEach(l => {
    ctx.fillStyle = l.color;
    ctx.fillRect(mm.x + l.x * mm.scale, mm.y + l.y * mm.scale, l.w * mm.scale + 2, l.h * mm.scale + 2);
  });
  // Player dot
  ctx.fillStyle = "#00ff00";
  ctx.beginPath();
  ctx.arc(mm.x + player.x * mm.scale, mm.y + player.y * mm.scale, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // "KOHAT CITY" label on minimap
  ctx.fillStyle = "#FFD700";
  ctx.font = "bold 9px 'Courier New'";
  ctx.textAlign = "center";
  ctx.fillText("KOHAT CITY", mm.x + mm.w / 2, mm.y - 8);

  // Health bar
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.beginPath();
  ctx.roundRect(20, ch - 50, 160, 18, 6);
  ctx.fill();
  const hpColor = player.health > 60 ? "#2ecc71" : player.health > 30 ? "#f39c12" : "#e74c3c";
  ctx.fillStyle = hpColor;
  ctx.beginPath();
  ctx.roundRect(22, ch - 48, (player.health / 100) * 156, 14, 4);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.font = "bold 10px 'Courier New'";
  ctx.textAlign = "left";
  ctx.fillText(`❤ ${player.health}`, 26, ch - 37);

  // Wanted stars
  ctx.font = "14px sans-serif";
  ctx.textAlign = "left";
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = i < wantedLevel ? "#FFD700" : "rgba(255,255,255,0.2)";
    ctx.fillText("★", 20 + i * 22, ch - 60);
  }

  // Money
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.beginPath();
  ctx.roundRect(20, ch - 80, 120, 20, 5);
  ctx.fill();
  ctx.fillStyle = "#2ecc71";
  ctx.font = "bold 12px 'Courier New'";
  ctx.textAlign = "left";
  ctx.fillText(`₨ ${player.money.toLocaleString()}`, 28, ch - 65);

  // Speed if in car
  if (player.inCar) {
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.beginPath();
    ctx.roundRect(20, ch - 108, 100, 20, 5);
    ctx.fill();
    ctx.fillStyle = "#3498db";
    ctx.font = "bold 11px 'Courier New'";
    ctx.textAlign = "left";
    ctx.fillText(`🚗 ${Math.round(Math.abs(player.speed) * 20)} km/h`, 28, ch - 93);
  }

  // Title
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.beginPath();
  ctx.roundRect(cw/2 - 110, 10, 220, 32, 8);
  ctx.fill();
  ctx.fillStyle = "#FFD700";
  ctx.font = "bold 16px 'Courier New'";
  ctx.textAlign = "center";
  ctx.fillText("⚡ KOHAT CITY STREETS ⚡", cw/2, 32);

  // Zone label
  const zoneX = cw/2;
  const zoneY = ch - 20;
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.beginPath();
  ctx.roundRect(zoneX - 80, zoneY - 16, 160, 20, 5);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.font = "10px 'Courier New'";
  ctx.textAlign = "center";
  ctx.fillText(player.zone || "Kohat City", zoneX, zoneY - 2);
}

// ─── MAIN GAME COMPONENT ──────────────────────────────────────────────────────

export default function KohatGTA() {
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const animRef = useRef(null);
  const keysRef = useRef({});
  const [started, setStarted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [wantedLevel, setWantedLevel] = useState(0);
  const [playerInfo, setPlayerInfo] = useState({ health: 100, money: 500, inCar: false, speed: 0 });
  const [message, setMessage] = useState("");

  const showMsg = useCallback((txt) => {
    setMessage(txt);
    setTimeout(() => setMessage(""), 3000);
  }, []);

  function initState() {
    return {
      player: {
        x: 620, y: 620, angle: 0, speed: 0,
        health: 100, money: 500, inCar: false, drivingCarId: null, zone: "Main Bazaar",
      },
      cars: spawnCars(),
      police: spawnPolice(),
      wantedLevel: 0,
      wantedTimer: 0,
      nearbyText: null,
    };
  }

  useEffect(() => {
    if (!started) return;
    stateRef.current = initState();

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    function resize() {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    const onKey = (e) => {
      keysRef.current[e.code] = e.type === "keydown";
      if (e.type === "keydown") e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKey);

    function update() {
      const s = stateRef.current;
      const k = keysRef.current;
      const p = s.player;
      const dt = 1;

      // Determine zone
      const zone = LANDMARKS.find(l => p.x >= l.x && p.x <= l.x + l.w && p.y >= l.y && p.y <= l.y + l.h);
      p.zone = zone ? zone.name : (H_ROADS.find(r => Math.abs(p.y - r.y) < r.w/2)?.name || V_ROADS.find(r => Math.abs(p.x - r.x) < r.w/2)?.name || "Kohat City");

      if (p.inCar) {
        // Car movement
        const acc = 0.18, brake = 0.12, maxSpd = 7, friction = 0.93;
        if (k["ArrowUp"] || k["KeyW"]) p.speed = Math.min(p.speed + acc, maxSpd);
        else if (k["ArrowDown"] || k["KeyS"]) p.speed = Math.max(p.speed - brake, -maxSpd * 0.5);
        else p.speed *= friction;
        if (Math.abs(p.speed) > 0.05) {
          const turn = 0.04 * (p.speed > 0 ? 1 : -1);
          if (k["ArrowLeft"] || k["KeyA"]) p.angle -= turn * Math.min(Math.abs(p.speed), 1) * 3;
          if (k["ArrowRight"] || k["KeyD"]) p.angle += turn * Math.min(Math.abs(p.speed), 1) * 3;
        }
        p.x += Math.cos(p.angle) * p.speed;
        p.y += Math.sin(p.angle) * p.speed;
        p.x = Math.max(20, Math.min(MAP_W - 20, p.x));
        p.y = Math.max(20, Math.min(MAP_H - 20, p.y));

        // Increment money while driving
        if (Math.abs(p.speed) > 2) p.money += 0.02;

        // Collision with police — damage
        s.police.forEach(pol => {
          if (!pol.driven) {
            const dx = p.x - pol.x, dy = p.y - pol.y;
            if (Math.sqrt(dx*dx+dy*dy) < 30) {
              p.health = Math.max(0, p.health - 0.3);
              s.wantedLevel = Math.min(5, s.wantedLevel + 0.005);
            }
          }
        });
      } else {
        // On-foot movement
        const walkSpeed = 2.5;
        let dx = 0, dy = 0;
        if (k["ArrowUp"] || k["KeyW"]) dy = -walkSpeed;
        if (k["ArrowDown"] || k["KeyS"]) dy = walkSpeed;
        if (k["ArrowLeft"] || k["KeyA"]) dx = -walkSpeed;
        if (k["ArrowRight"] || k["KeyD"]) dx = walkSpeed;
        if (dx || dy) p.angle = Math.atan2(dy, dx);
        p.x = Math.max(10, Math.min(MAP_W - 10, p.x + dx));
        p.y = Math.max(10, Math.min(MAP_H - 10, p.y + dy));
        p.speed = 0;
      }

      // Move NPC cars
      s.cars.forEach(c => {
        if (c.driven) return;
        if (c.angle === 0) {
          c.x += c.speed * c.dir;
          if (c.x > MAP_W + 50) c.x = -50;
          if (c.x < -50) c.x = MAP_W + 50;
        } else {
          c.y += c.speed * c.dir;
          if (c.y > MAP_H + 50) c.y = -50;
          if (c.y < -50) c.y = MAP_H + 50;
        }
      });

      // Police AI when wanted
      if (s.wantedLevel >= 1) {
        s.police.forEach(pol => {
          if (pol.driven) return;
          const dx = p.x - pol.x, dy = p.y - pol.y;
          const dist = Math.sqrt(dx*dx+dy*dy);
          if (dist > 20) {
            pol.x += (dx/dist) * 2.2;
            pol.y += (dy/dist) * 2.2;
            pol.angle = Math.atan2(dy, dx);
            // Catch player on foot
            if (!p.inCar && dist < 25) {
              p.health = Math.max(0, p.health - 0.4);
              s.wantedLevel = Math.min(5, s.wantedLevel + 0.003);
            }
          }
        });
        s.wantedTimer -= dt;
        if (s.wantedTimer <= 0) s.wantedLevel = Math.max(0, s.wantedLevel - 0.003);
      }

      // Nearby car detection
      let nearbyText = null;
      if (!p.inCar) {
        const nearby = s.cars.find(c => {
          const dx = p.x - c.x, dy = p.y - c.y;
          return !c.driven && Math.sqrt(dx*dx+dy*dy) < 35;
        });
        if (nearby) nearbyText = "[F] Steal Car";
        else {
          const nearPol = s.police.find(c => {
            const dx = p.x - c.x, dy = p.y - c.y;
            return !c.driven && Math.sqrt(dx*dx+dy*dy) < 35;
          });
          if (nearPol) nearbyText = "[F] Take Police Car ⚠️";
        }
      }
      s.nearbyText = nearbyText;

      p.x = Math.round(p.x * 100) / 100;
      p.y = Math.round(p.y * 100) / 100;
    }

    function gameLoop() {
      if (!stateRef.current) return;
      const s = stateRef.current;
      const p = s.player;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const cw = canvas.width, ch = canvas.height;

      update();

      // Camera
      let camX = p.x - cw / 2;
      let camY = p.y - ch / 2;
      camX = Math.max(0, Math.min(MAP_W - cw, camX));
      camY = Math.max(0, Math.min(MAP_H - ch, camY));

      drawMap(ctx, camX, camY, cw, ch, s.cars, s.police, p, Math.floor(s.wantedLevel), s.nearbyText);

      // Update react state (throttled)
      if (animRef._tick === undefined) animRef._tick = 0;
      animRef._tick++;
      if (animRef._tick % 10 === 0) {
        setWantedLevel(Math.floor(s.wantedLevel));
        setPlayerInfo({ health: Math.round(p.health), money: Math.round(p.money), inCar: p.inCar, speed: p.speed });
      }

      animRef.current = requestAnimationFrame(gameLoop);
    }

    // F key handler for car interaction
    function onKeyF(e) {
      if (e.code !== "KeyF") return;
      const s = stateRef.current;
      const p = s.player;

      if (p.inCar) {
        // Exit car
        p.inCar = false;
        const car = [...s.cars, ...s.police].find(c => c.driven);
        if (car) {
          car.driven = false;
          car.x = p.x + Math.cos(p.angle + Math.PI/2) * 20;
          car.y = p.y + Math.sin(p.angle + Math.PI/2) * 20;
        }
        p.drivingCarId = null;
        p.speed = 0;
        showMsg("Stepped out of vehicle");
      } else {
        // Enter nearby car
        const nearby = s.cars.find(c => {
          const dx = p.x - c.x, dy = p.y - c.y;
          return !c.driven && Math.sqrt(dx*dx+dy*dy) < 35;
        });
        if (nearby) {
          nearby.driven = true;
          p.inCar = true;
          p.drivingCarId = nearby.id;
          p.angle = nearby.angle;
          s.wantedLevel = Math.min(5, s.wantedLevel + 1);
          s.wantedTimer = 600;
          showMsg("Car stolen! ⭐ Wanted level up!");
        } else {
          const nearPol = s.police.find(c => {
            const dx = p.x - c.x, dy = p.y - c.y;
            return !c.driven && Math.sqrt(dx*dx+dy*dy) < 35;
          });
          if (nearPol) {
            nearPol.driven = true;
            p.inCar = true;
            p.drivingCarId = nearPol.id;
            nearPol.isPolice = true;
            p.angle = nearPol.angle;
            s.wantedLevel = Math.min(5, s.wantedLevel + 2);
            s.wantedTimer = 600;
            showMsg("Police car stolen! ⭐⭐ High alert!");
          }
        }
      }
    }
    window.addEventListener("keydown", onKeyF);

    animRef.current = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKey);
      window.removeEventListener("keydown", onKeyF);
    };
  }, [started, showMsg]);

  // Touch controls
  const touchRef = useRef({});
  function handleTouch(dir, down) {
    const map = { up: "ArrowUp", down: "ArrowDown", left: "ArrowLeft", right: "ArrowRight" };
    keysRef.current[map[dir]] = down;
  }

  if (!started) {
    return (
      <div style={{
        width: "100%", height: "100vh", background: "#0a0a0a",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        fontFamily: "'Courier New', monospace", color: "#fff",
        backgroundImage: "radial-gradient(ellipse at center, #1a2a1a 0%, #0a0a0a 70%)",
      }}>
        <div style={{ textAlign: "center", maxWidth: 480 }}>
          <div style={{ fontSize: 60, marginBottom: 8 }}>🏙️</div>
          <h1 style={{
            fontSize: 36, fontWeight: 900, letterSpacing: 3,
            background: "linear-gradient(90deg, #FFD700, #FF6B35)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            margin: "0 0 4px",
          }}>KOHAT CITY</h1>
          <h2 style={{ fontSize: 14, letterSpacing: 6, color: "#888", margin: "0 0 30px", fontWeight: 400 }}>
            STREETS • OPEN WORLD
          </h2>
          <div style={{
            background: "rgba(255,215,0,0.08)", border: "1px solid #333",
            borderRadius: 12, padding: "20px 28px", marginBottom: 28, textAlign: "left",
          }}>
            <p style={{ color: "#FFD700", fontWeight: 700, margin: "0 0 10px", fontSize: 12, letterSpacing: 2 }}>CONTROLS</p>
            {[
              ["W A S D / ↑ ↓ ← →", "Move / Drive"],
              ["F", "Enter / Exit vehicle"],
              ["Drive fast", "Earn money"],
              ["Avoid police", "Stay alive"],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid #1a1a1a", fontSize: 12 }}>
                <span style={{ color: "#FFD700", fontFamily: "monospace" }}>{k}</span>
                <span style={{ color: "#888" }}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 28, fontSize: 11, color: "#666",
          }}>
            {LANDMARKS.slice(0,6).map(l => (
              <div key={l.name} style={{ background: "#111", borderRadius: 6, padding: "6px 10px", border: "1px solid #222" }}>
                {l.name}
              </div>
            ))}
          </div>
          <button
            onClick={() => setStarted(true)}
            style={{
              background: "linear-gradient(135deg, #FFD700, #FF6B35)",
              border: "none", borderRadius: 8, padding: "14px 48px",
              fontSize: 16, fontWeight: 900, letterSpacing: 2, cursor: "pointer",
              color: "#000", fontFamily: "'Courier New', monospace",
              boxShadow: "0 0 30px rgba(255,215,0,0.3)",
            }}
          >
            ▶ START GAME
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: "100vh", background: "#000", position: "relative", overflow: "hidden" }}>
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />

      {/* Message banner */}
      {message && (
        <div style={{
          position: "absolute", top: 60, left: "50%", transform: "translateX(-50%)",
          background: "rgba(0,0,0,0.85)", border: "1px solid #FFD700",
          color: "#FFD700", padding: "8px 20px", borderRadius: 8,
          fontFamily: "monospace", fontSize: 13, fontWeight: 700,
          pointerEvents: "none", whiteSpace: "nowrap",
        }}>
          {message}
        </div>
      )}

      {/* Mobile touch controls */}
      <div style={{
        position: "absolute", bottom: 200, left: 20,
        display: "grid", gridTemplateColumns: "44px 44px 44px", gridTemplateRows: "44px 44px 44px",
        gap: 4,
      }}>
        {[
          [null, { dir: "up", label: "▲", row: 1, col: 2 }, null],
          [{ dir: "left", label: "◀", row: 2, col: 1 }, null, { dir: "right", label: "▶", row: 2, col: 3 }],
          [null, { dir: "down", label: "▼", row: 3, col: 2 }, null],
        ].flat().map((btn, i) => btn ? (
          <button
            key={btn.dir}
            onTouchStart={() => handleTouch(btn.dir, true)}
            onTouchEnd={() => handleTouch(btn.dir, false)}
            onMouseDown={() => handleTouch(btn.dir, true)}
            onMouseUp={() => handleTouch(btn.dir, false)}
            style={{
              background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)",
              color: "#fff", fontSize: 16, borderRadius: 8, cursor: "pointer",
              gridColumn: btn.col, gridRow: btn.row, width: 44, height: 44,
            }}
          >{btn.label}</button>
        ) : <div key={i} />)}
      </div>

      {/* F button for mobile */}
      <button
        onTouchStart={() => {
          const evt = new KeyboardEvent("keydown", { code: "KeyF", bubbles: true });
          window.dispatchEvent(evt);
        }}
        onMouseDown={() => {
          const evt = new KeyboardEvent("keydown", { code: "KeyF", bubbles: true });
          window.dispatchEvent(evt);
        }}
        style={{
          position: "absolute", bottom: 200, right: 20,
          width: 64, height: 64, borderRadius: "50%",
          background: "rgba(255,215,0,0.25)", border: "2px solid #FFD700",
          color: "#FFD700", fontSize: 16, fontWeight: 900, cursor: "pointer",
          fontFamily: "monospace",
        }}
      >F</button>
    </div>
  );
}
