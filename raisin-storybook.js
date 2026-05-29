/************************************************************
 * RAISIN BEST FRIENDS — STORYBOOK ENGINE
 * Pass 1: Layered puppet, blink, breathing, tail wag, buttons
 ************************************************************/

/************************************************************
 * 01. CONFIG
 ************************************************************/

const CONFIG = {
  assetPath: "assets/raisin/",
  debug: true,

  assets: {
    body: "body.png",
    head: "head-base.png",

    leftEar: "left-ear.png",
    rightEar: "right-ear.png",

    leftEyeOpen: "left-eye-open.png",
    rightEyeOpen: "right-eye-open.png",
    leftEyeClosed: "left-eye-closed.png",
    rightEyeClosed: "right-eye-closed.png",

    eyebrows: "eyebrows.png",
    nose: "nose.png",

    mouthNeutral: "mouth-neutral.png",
    mouthOpen: "mouth-open.png",

    frontPaws: "front-paws.png",
    backPaws: "back-paws.png",
    tail: "tail.png"
  }
};

/************************************************************
 * 02. DOM
 ************************************************************/

const canvas = document.getElementById("raisinCanvas");
const ctx = canvas.getContext("2d");

const moodText = document.getElementById("moodText");
const dialogueBubble = document.getElementById("dialogueBubble");
const bondFill = document.getElementById("bondFill");

const buttons = {
  treat: document.getElementById("treatBtn"),
  toy: document.getElementById("toyBtn"),
  call: document.getElementById("callBtn"),
  nap: document.getElementById("napBtn"),
  photo: document.getElementById("photoBtn"),
  reset: document.getElementById("resetBtn")
};

/************************************************************
 * 03. STATE
 ************************************************************/

const State = {
  ready: false,
  time: 0,
  lastTime: 0,

  mood: "Curious",
  message: "Quiet companionship mode.",
  bond: 42,

  blinkTimer: 0,
  blinkDuration: 0,
  nextBlink: 1.8,

  petFlash: 0,
  mouthMode: "neutral",

  pointer: {
    down: false,
    x: 0,
    y: 0,
    lastX: 0,
    lastY: 0
  }
};

/************************************************************
 * 04. ASSETS
 ************************************************************/

const Images = {};

function loadImage(name, file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      Images[name] = img;
      resolve(img);
    };
    img.onerror = () => {
      reject(new Error(`Could not load ${file}`));
    };
    img.src = CONFIG.assetPath + file;
  });
}

async function loadAssets() {
  const entries = Object.entries(CONFIG.assets);
  await Promise.all(entries.map(([name, file]) => loadImage(name, file)));
}

/************************************************************
 * 05. CANVAS SIZE
 ************************************************************/

function resizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);

  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

window.addEventListener("resize", resizeCanvas);

/************************************************************
 * 06. DRAW HELPERS
 ************************************************************/

function drawImageCentered(img, x, y, w, h, opts = {}) {
  if (!img) return;

  const {
    rotation = 0,
    alpha = 1,
    scaleX = 1,
    scaleY = 1
  } = opts;

  ctx.save();

  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.scale(scaleX, scaleY);

  ctx.drawImage(img, -w / 2, -h / 2, w, h);

  ctx.restore();
}

function drawEllipseShadow(x, y, w, h, alpha = 0.2) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.ellipse(x, y, w / 2, h / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/************************************************************
 * 07. LAYOUT
 ************************************************************/

function getSceneLayout() {
  const w = window.innerWidth;
  const h = window.innerHeight;

  const baseScale = Math.min(w / 390, h / 820);
  const dogScale = Math.min(Math.max(baseScale, 0.78), 1.18);

  const cx = w / 2;
  const floorY = h * 0.68;

  return {
    w,
    h,
    cx,
    floorY,
    dogScale,

    body: {
      x: cx,
      y: floorY - 12 * dogScale,
      w: 255 * dogScale,
      h: 280 * dogScale
    },

    backPaws: {
      x: cx,
      y: floorY + 84 * dogScale,
      w: 190 * dogScale,
      h: 110 * dogScale
    },

    frontPaws: {
      x: cx,
      y: floorY + 84 * dogScale,
      w: 190 * dogScale,
      h: 110 * dogScale
    },

    tail: {
      x: cx + 126 * dogScale,
      y: floorY - 44 * dogScale,
      w: 190 * dogScale,
      h: 118 * dogScale
    },

    head: {
      x: cx,
      y: floorY - 198 * dogScale,
      w: 236 * dogScale,
      h: 210 * dogScale
    },

    leftEar: {
      x: cx - 104 * dogScale,
      y: floorY - 182 * dogScale,
      w: 98 * dogScale,
      h: 190 * dogScale
    },

    rightEar: {
      x: cx + 104 * dogScale,
      y: floorY - 182 * dogScale,
      w: 98 * dogScale,
      h: 190 * dogScale
    },

    eyes: {
      leftX: cx - 42 * dogScale,
      rightX: cx + 42 * dogScale,
      y: floorY - 210 * dogScale,
      w: 62 * dogScale,
      h: 52 * dogScale
    },

    eyebrows: {
      x: cx,
      y: floorY - 252 * dogScale,
      w: 120 * dogScale,
      h: 36 * dogScale
    },

    nose: {
      x: cx,
      y: floorY - 168 * dogScale,
      w: 76 * dogScale,
      h: 58 * dogScale
    },

    mouth: {
      x: cx,
      y: floorY - 127 * dogScale,
      w: 94 * dogScale,
      h: 55 * dogScale
    }
  };
}

/************************************************************
 * 08. BACKGROUND
 ************************************************************/

function drawBackground(layout) {
  const { w, h } = layout;

  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, "#2b1a16");
  bg.addColorStop(0.52, "#1a100e");
  bg.addColorStop(1, "#0d0706");

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  const glow = ctx.createRadialGradient(
    w / 2,
    h * 0.38,
    20,
    w / 2,
    h * 0.42,
    h * 0.55
  );

  glow.addColorStop(0, "rgba(255, 203, 139, 0.22)");
  glow.addColorStop(0.4, "rgba(185, 103, 57, 0.13)");
  glow.addColorStop(1, "rgba(0, 0, 0, 0)");

  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  drawDogBed(layout);
}

function drawDogBed(layout) {
  const { cx, floorY, dogScale } = layout;

  drawEllipseShadow(
    cx,
    floorY + 92 * dogScale,
    330 * dogScale,
    80 * dogScale,
    0.28
  );

  ctx.save();

  const bedGradient = ctx.createLinearGradient(
    cx,
    floorY - 10 * dogScale,
    cx,
    floorY + 130 * dogScale
  );

  bedGradient.addColorStop(0, "#b6774e");
  bedGradient.addColorStop(1, "#6f3f2d");

  ctx.fillStyle = bedGradient;
  ctx.beginPath();
  ctx.ellipse(
    cx,
    floorY + 78 * dogScale,
    176 * dogScale,
    58 * dogScale,
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();

  ctx.globalAlpha = 0.5;
  ctx.fillStyle = "#f0b47a";
  ctx.beginPath();
  ctx.ellipse(
    cx,
    floorY + 58 * dogScale,
    126 * dogScale,
    32 * dogScale,
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();

  ctx.restore();
}

/************************************************************
 * 09. RAISIN DRAWING
 ************************************************************/

function drawRaisin(layout) {
  const t = State.time;

  const breath = Math.sin(t * 2) * 0.018;
  const headBob = Math.sin(t * 1.25) * 2.5 * layout.dogScale;
  const idleTilt = Math.sin(t * 0.72) * 0.025;

  const tailWag =
    State.mood === "Excited" ? Math.sin(t * 11) * 0.18 :
    State.mood === "Happy" ? Math.sin(t * 8) * 0.12 :
    Math.sin(t * 4) * 0.045;

  const petLean = State.petFlash > 0 ? State.petFlash * 5 * layout.dogScale : 0;

  // Tail behind body
  drawImageCentered(
    Images.tail,
    layout.tail.x,
    layout.tail.y,
    layout.tail.w,
    layout.tail.h,
    {
      rotation: tailWag,
      scaleY: 1 + breath * 0.4
    }
  );

  // Body
  drawImageCentered(
    Images.body,
    layout.body.x,
    layout.body.y,
    layout.body.w,
    layout.body.h,
    {
      scaleX: 1 + breath * 0.25,
      scaleY: 1 + breath
    }
  );

  // Paws
  drawImageCentered(
    Images.backPaws,
    layout.backPaws.x,
    layout.backPaws.y,
    layout.backPaws.w,
    layout.backPaws.h
  );

  drawImageCentered(
    Images.frontPaws,
    layout.frontPaws.x,
    layout.frontPaws.y,
    layout.frontPaws.w,
    layout.frontPaws.h
  );

  // Ears behind head
  drawImageCentered(
    Images.leftEar,
    layout.leftEar.x,
    layout.leftEar.y + headBob,
    layout.leftEar.w,
    layout.leftEar.h,
    {
      rotation: -0.03 + Math.sin(t * 2.4) * 0.018
    }
  );

  drawImageCentered(
    Images.rightEar,
    layout.rightEar.x,
    layout.rightEar.y + headBob,
    layout.rightEar.w,
    layout.rightEar.h,
    {
      rotation: 0.03 - Math.sin(t * 2.4) * 0.018
    }
  );

  // Head base
  drawImageCentered(
    Images.head,
    layout.head.x,
    layout.head.y + headBob + petLean,
    layout.head.w,
    layout.head.h,
    {
      rotation: idleTilt
    }
  );

  // Eyes
  const blinking = State.blinkDuration > 0;
  const leftEye = blinking ? Images.leftEyeClosed : Images.leftEyeOpen;
  const rightEye = blinking ? Images.rightEyeClosed : Images.rightEyeOpen;

  drawImageCentered(
    leftEye,
    layout.eyes.leftX,
    layout.eyes.y + headBob + petLean,
    layout.eyes.w,
    layout.eyes.h,
    { rotation: idleTilt }
  );

  drawImageCentered(
    rightEye,
    layout.eyes.rightX,
    layout.eyes.y + headBob + petLean,
    layout.eyes.w,
    layout.eyes.h,
    { rotation: idleTilt }
  );

  // Eyebrows
  const eyebrowLift =
    State.mood === "Curious" ? -4 * layout.dogScale :
    State.mood === "Sleepy" ? 5 * layout.dogScale :
    0;

  drawImageCentered(
    Images.eyebrows,
    layout.eyebrows.x,
    layout.eyebrows.y + headBob + petLean + eyebrowLift,
    layout.eyebrows.w,
    layout.eyebrows.h,
    { rotation: idleTilt }
  );

  // Nose
  drawImageCentered(
    Images.nose,
    layout.nose.x,
    layout.nose.y + headBob + petLean,
    layout.nose.w,
    layout.nose.h,
    { rotation: idleTilt }
  );

  // Mouth
  const mouthImg = State.mouthMode === "open"
    ? Images.mouthOpen
    : Images.mouthNeutral;

  drawImageCentered(
    mouthImg,
    layout.mouth.x,
    layout.mouth.y + headBob + petLean,
    layout.mouth.w,
    layout.mouth.h,
    { rotation: idleTilt }
  );
}

/************************************************************
 * 10. ANIMATION STATE
 ************************************************************/

function updateAnimation(dt) {
  State.blinkTimer += dt;

  if (State.blinkTimer >= State.nextBlink) {
    State.blinkTimer = 0;
    State.blinkDuration = 0.12;
    State.nextBlink = 2 + Math.random() * 3;
  }

  if (State.blinkDuration > 0) {
    State.blinkDuration -= dt;
  }

  if (State.petFlash > 0) {
    State.petFlash = Math.max(0, State.petFlash - dt * 1.8);
  }

  if (State.mouthMode === "open" && State.mood !== "Excited") {
    State.mouthMode = "neutral";
  }
}

/************************************************************
 * 11. INTERACTION
 ************************************************************/

function setupInteraction() {
  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerUp);

  buttons.treat?.addEventListener("click", () => {
    setMood("Excited", "Raisin gently takes the treat.", 8);
    State.mouthMode = "open";
    State.petFlash = 1;
  });

  buttons.toy?.addEventListener("click", () => {
    setMood("Curious", "Raisin spots the toy.", 5);
  });

  buttons.call?.addEventListener("click", () => {
    setMood("Happy", "Raisin looks up when you call her.", 4);
    State.petFlash = 0.7;
  });

  buttons.nap?.addEventListener("click", () => {
    setMood("Sleepy", "Raisin gets cosy.", 3);
    State.mouthMode = "neutral";
    State.blinkDuration = 999;
  });

  buttons.photo?.addEventListener("click", () => {
    setMood("Settled", "Photo moment saved in your heart, for now.", 2);
  });

  buttons.reset?.addEventListener("click", () => {
    State.blinkDuration = 0;
    State.mouthMode = "neutral";
    setMood("Curious", "Quiet companionship mode.", 0);
  });
}

function onPointerDown(event) {
  State.pointer.down = true;
  updatePointer(event);

  const zone = getTouchZone(State.pointer.x, State.pointer.y);

  if (zone === "head") {
    setMood("Happy", "Raisin leans into your hand.", 2);
    State.petFlash = 1;
  } else if (zone === "nose") {
    setMood("Curious", "Boop. Raisin sniffs your finger.", 2);
    State.petFlash = 1;
  } else if (zone === "body") {
    setMood("Settled", "Soft fuss. Raisin relaxes.", 1);
    State.petFlash = 0.6;
  }
}

function onPointerMove(event) {
  if (!State.pointer.down) return;

  updatePointer(event);

  const dx = Math.abs(State.pointer.x - State.pointer.lastX);
  const dy = Math.abs(State.pointer.y - State.pointer.lastY);

  if (dx + dy > 8) {
    const zone = getTouchZone(State.pointer.x, State.pointer.y);

    if (zone) {
      setMood("Happy", "Raisin enjoys the fuss.", 0.3);
      State.petFlash = 0.75;
    }
  }

  State.pointer.lastX = State.pointer.x;
  State.pointer.lastY = State.pointer.y;
}

function onPointerUp() {
  State.pointer.down = false;
}

function updatePointer(event) {
  const rect = canvas.getBoundingClientRect();

  State.pointer.x = event.clientX - rect.left;
  State.pointer.y = event.clientY - rect.top;

  State.pointer.lastX = State.pointer.x;
  State.pointer.lastY = State.pointer.y;
}

function getTouchZone(x, y) {
  const layout = getSceneLayout();

  if (pointInEllipse(x, y, layout.head.x, layout.head.y, layout.head.w * 0.45, layout.head.h * 0.43)) {
    return "head";
  }

  if (pointInEllipse(x, y, layout.nose.x, layout.nose.y, layout.nose.w * 0.5, layout.nose.h * 0.5)) {
    return "nose";
  }

  if (pointInEllipse(x, y, layout.body.x, layout.body.y, layout.body.w * 0.45, layout.body.h * 0.45)) {
    return "body";
  }

  return null;
}

function pointInEllipse(px, py, cx, cy, rx, ry) {
  const dx = (px - cx) / rx;
  const dy = (py - cy) / ry;

  return dx * dx + dy * dy <= 1;
}

/************************************************************
 * 12. UI
 ************************************************************/

function setMood(mood, message, bondGain = 0) {
  State.mood = mood;
  State.message = message;
  State.bond = Math.min(100, State.bond + bondGain);

  if (moodText) moodText.textContent = mood;
  if (dialogueBubble) dialogueBubble.textContent = message;
  if (bondFill) bondFill.style.width = `${State.bond}%`;
}

/************************************************************
 * 13. MAIN LOOP
 ************************************************************/

function loop(timestamp) {
  if (!State.lastTime) State.lastTime = timestamp;

  const dt = Math.min((timestamp - State.lastTime) / 1000, 0.033);
  State.lastTime = timestamp;
  State.time += dt;

  updateAnimation(dt);

  const layout = getSceneLayout();

  ctx.clearRect(0, 0, layout.w, layout.h);
  drawBackground(layout);
  drawRaisin(layout);

  requestAnimationFrame(loop);
}

/************************************************************
 * 14. BOOT
 ************************************************************/

async function boot() {
  try {
    resizeCanvas();

    setMood("Curious", "Finding Raisin...", 0);

    await loadAssets();

    setupInteraction();

    State.ready = true;

    setMood("Curious", "Raisin is here. Stroke her head or boop her nose.", 0);

    requestAnimationFrame(loop);
  } catch (error) {
    console.error(error);

    setMood("Missing assets", error.message, 0);

    ctx.fillStyle = "#1b120f";
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

    ctx.fillStyle = "#fff6e8";
    ctx.font = "14px system-ui";
    ctx.fillText("Raisin could not load.", 24, 80);
    ctx.fillText(error.message, 24, 108);
  }
}

boot();