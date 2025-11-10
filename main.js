let video;
let sliderLight;
let sliderTolerance;
let sliderDetail;
let sliderScale;

function setup() {
  createCanvas(1920, 1080);
  noStroke();
  colorMode(HSL, 360, 100, 100, 1);
  textFont('Courier New');
  textSize(15);

  // 🎥 Cámara
  video = createCapture(VIDEO);
  video.size(320, 240);
  video.hide();

  // 🎛️ Sliders
  sliderLight = createSlider(0, 1, 0.5, 0.001);
  sliderLight.position(30, 60);
  sliderLight.style('width', '200px');

  sliderTolerance = createSlider(1, 50, 10, 1);
  sliderTolerance.position(30, 100);
  sliderTolerance.style('width', '200px');

  sliderDetail = createSlider(2, 10, 3, 1);
  sliderDetail.position(30, 140);
  sliderDetail.style('width', '200px');

  sliderScale = createSlider(1, 30, 5, 0.5);
  sliderScale.position(30, 180);
  sliderScale.style('width', '200px');

  // 🎨 Estilo visual
  styleAllSliders();
}

function draw() {
  fill(0, 0, 95, 0.1);
  rect(0, 0, width, height);

  video.loadPixels();

  let baseHue = 220; // 🎨 hue fijo (azul violeta)
  let baseColor = color(baseHue, 70, 50);

  let lightControl = sliderLight.value();
  let tileSize = sliderDetail.value();
  let scaleFactor = sliderScale.value();
  let tolerance = sliderTolerance.value();

  if (video.pixels.length > 0) {
    drawCameraWithGradient(video, baseColor, lightControl, tileSize, scaleFactor, tolerance);
  }

  fill(30);
  noStroke();
  text("Luz / Color", 30, 50);
  text("Tolerancia Rep.", 30, 90);
  text("Detalle", 30, 130);
  text("Tamaño", 30, 170);
}

function drawCameraWithGradient(video, baseColor, lightControl, tileSize, scaleFactor, tolerance) {
  let colorCounts = new Map();

  for (let y = 0; y < video.height; y += tileSize) {
    for (let x = 0; x < video.width; x += tileSize) {
      let index = (x + y * video.width) * 4;
      let r = video.pixels[index + 0];
      let g = video.pixels[index + 1];
      let b = video.pixels[index + 2];

      let hsl = rgbToHsl(r, g, b);
      if (hsl.l > 85 || hsl.s < 5) continue;

      let key = `${Math.round(hsl.h / 10) * 10},${Math.round(hsl.s / 10) * 10},${Math.round(hsl.l / 10) * 10}`;
      if (!colorCounts.has(key)) colorCounts.set(key, 1);
      else colorCounts.set(key, colorCounts.get(key) + 1);
      if (colorCounts.get(key) > tolerance) continue;

      let h = hsl.h;
      let s = lerp(hsl.s, 20, lightControl);
      let l = lerp(hsl.l, 95, lightControl);

      let px = map(x, 0, video.width, width, 0);
      let py = map(y, 0, video.height, 0, height);

      drawVolumetricPixel(px, py, tileSize, color(h, s, l), lightControl, scaleFactor);
    }
  }
}

function drawVolumetricPixel(x, y, d, baseColor, lightControl, scaleFactor) {
  let layers = 16;
  let baseHue = hue(baseColor);

  for (let i = layers; i > 0; i--) {
    let size = map(i, 0, layers, 0, d * scaleFactor);
    let alpha = map(i, 0, layers, 0, 0.06);

    let centerIntensity = map(i, layers * 0.9, layers, 1, 0);
    let isCore = i > layers * 0.9;
    let lightness = map(i, 0, layers, 100, 40);

    let h, s, l;
    if (i < layers * 0.4) {
      h = (baseHue + map(i, 0, layers * 0.4, -10, 10)) % 360;
      s = lerp(10, 25, 1 - lightControl);
      l = lerp(85, 98, lightControl);
    } else {
      h = (baseHue + map(i, 0, layers, -20, 20)) % 360;
      s = lerp(isCore ? 45 : 65, isCore ? 10 : 25, lightControl);
      l = lerp(lightness + centerIntensity * 25, 98, lightControl);
    }

    if (i < 3) {
      fill(0, 0, 85 + i * 3, 0.15);
      ellipse(x, y, size * 1.4);
    }

    fill(h, s, constrain(l, 0, 100), alpha);
    ellipse(x, y, size);
  }
}

function styleAllSliders() {
  const css = document.createElement('style');
  css.innerHTML = `
    input[type=range] {
      -webkit-appearance: none;
      width: 200px;
      height: 5px;
      background: rgba(180, 180, 180, 0.2);
      border-radius: 2px;
      outline: none;
    }

    input[type=range]::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 6px;
      height: 18px;
      background: rgba(120, 120, 120, 0.2);
      border: none;
      border-radius: 2px;
      cursor: pointer;
    }

    input[type=range]::-moz-range-thumb {
      width: 6px;
      height: 18px;
      background: rgba(120, 120, 120, 0.2);
      border: none;
      border-radius: 2px;
      cursor: pointer;
    }
  `;
  document.head.appendChild(css);
}

function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  let max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) {
    h = s = 0;
  } else {
    let d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h *= 60;
  }
  return { h: floor(h % 360), s: floor(s * 100), l: floor(l * 100) };
}
