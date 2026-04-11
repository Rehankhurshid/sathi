import * as THREE from "three";

const CFG = window.PARALLAX_CONFIG;

const vertexShader = `
  precision highp float;

  uniform sampler2D uDepth;
  uniform vec2      uMouse;
  uniform float     uDepthStrength;
  uniform float     uXYShiftStrength;

  varying vec2  vUv;
  varying float vDepth;

  // Large-radius multi-ring depth blur.
  // The depth map has HARD cliffs (white → black) at figure edges.
  // A 3-ring kernel spanning 0.036 UV units (~36 px at 1024 wide) creates
  // a gentle slope so no two adjacent vertices jump dramatically in depth.
  float smoothDepth(vec2 uv) {
    float d = texture2D(uDepth, uv).r * 4.0;

    float s1 = 0.010;
    d += texture2D(uDepth, uv + vec2( s1,  0.0)).r * 2.0;
    d += texture2D(uDepth, uv + vec2(-s1,  0.0)).r * 2.0;
    d += texture2D(uDepth, uv + vec2( 0.0,  s1)).r * 2.0;
    d += texture2D(uDepth, uv + vec2( 0.0, -s1)).r * 2.0;
    d += texture2D(uDepth, uv + vec2( s1,   s1)).r * 1.0;
    d += texture2D(uDepth, uv + vec2(-s1,   s1)).r * 1.0;
    d += texture2D(uDepth, uv + vec2( s1,  -s1)).r * 1.0;
    d += texture2D(uDepth, uv + vec2(-s1,  -s1)).r * 1.0;

    float s2 = 0.022;
    d += texture2D(uDepth, uv + vec2( s2,  0.0)).r * 1.5;
    d += texture2D(uDepth, uv + vec2(-s2,  0.0)).r * 1.5;
    d += texture2D(uDepth, uv + vec2( 0.0,  s2)).r * 1.5;
    d += texture2D(uDepth, uv + vec2( 0.0, -s2)).r * 1.5;

    float s3 = 0.036;
    d += texture2D(uDepth, uv + vec2( s3,  0.0)).r * 1.0;
    d += texture2D(uDepth, uv + vec2(-s3,  0.0)).r * 1.0;
    d += texture2D(uDepth, uv + vec2( 0.0,  s3)).r * 1.0;
    d += texture2D(uDepth, uv + vec2( 0.0, -s3)).r * 1.0;

    return d / 38.0;
  }

  void main() {
    vUv = uv;

    float depth    = smoothDepth(uv);
    vDepth         = depth;

    float zDisplace      = depth * uDepthStrength;
    float parallaxAmount = depth * uXYShiftStrength;
    float xDisplace      = uMouse.x * parallaxAmount;
    float yDisplace      = uMouse.y * parallaxAmount;


    vec3 displaced = position + vec3(xDisplace, yDisplace, zDisplace);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;

  uniform sampler2D uTexture;
  uniform float     uChromaticAberration;
  uniform float     uBrightness;
  uniform float     uFgExposure;
  uniform float     uSaturation;

  varying vec2  vUv;
  varying float vDepth;

  void main() {
    vec2  dir   = vUv - 0.5;
    float aberr = uChromaticAberration * (1.0 + vDepth * 0.4);

    float r = texture2D(uTexture, vUv + dir * aberr).r;
    float g = texture2D(uTexture, vUv              ).g;
    float b = texture2D(uTexture, vUv - dir * aberr).b;

    vec3  color    = vec3(r, g, b);
    float exposure = uBrightness + uFgExposure * vDepth;
    color = 1.0 - exp(-color * exposure);

    // Warm ambient fill — gently lifts dark shadow areas
    color += vec3(0.025, 0.018, 0.010) * (1.0 - color);

    // Saturation control
    float luma = dot(color, vec3(0.299, 0.587, 0.114));
    color = mix(vec3(luma), color, uSaturation);

    gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
  }
`;

class ParallaxHero {
  #renderer;
  #scene;
  #camera;
  #mesh = null;
  #material = null;
  #targetMouse = new THREE.Vector2();
  #currentMouse = new THREE.Vector2();
  #animId = null;
  #cfg;
  #baseZ = 1.2;
  #imgAspect = 1;
  #isVisible = true;

  constructor(canvas, cfg = {}) {
    this.#cfg = cfg;

    const w = cfg.width ?? canvas.clientWidth ?? window.innerWidth;
    const h = cfg.height ?? canvas.clientHeight ?? window.innerHeight;

    // Safari's Metal WebGL is slower — cap pixel ratio lower
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const maxDPR = isSafari ? 1.5 : 2;

    this.#renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !isSafari, // skip AA on Safari — big perf win
      alpha: false,
      powerPreference: 'high-performance',
    });
    this.#renderer.setPixelRatio(Math.min(devicePixelRatio, maxDPR));
    this.#renderer.setSize(w, h, false);

    this.#scene = new THREE.Scene();
    this.#scene.background = new THREE.Color(0x060608);

    this.#camera = new THREE.PerspectiveCamera(45, w / h, 0.01, 100);
    this.#camera.position.set(0, 0, this.#baseZ);
  }

  async load(colorUrl, depthUrl) {
    const loader = new THREE.TextureLoader();
    const [colorTex, depthTex] = await Promise.all([
      loader.loadAsync(colorUrl),
      loader.loadAsync(depthUrl),
    ]);

    colorTex.minFilter = THREE.LinearFilter;
    colorTex.magFilter = THREE.LinearFilter;
    colorTex.colorSpace = THREE.SRGBColorSpace;

    depthTex.minFilter = THREE.LinearMipmapLinearFilter;
    depthTex.magFilter = THREE.LinearFilter;
    depthTex.generateMipmaps = true;

    this.#imgAspect = colorTex.image.width / colorTex.image.height;

    this.#material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTexture: { value: colorTex },
        uDepth: { value: depthTex },
        uMouse: { value: this.#currentMouse },
        uDepthStrength: { value: this.#cfg.depthStrength },
        uXYShiftStrength: { value: this.#cfg.xyShiftStrength },
        uChromaticAberration: { value: this.#cfg.chromaticAberration },
        uBrightness: { value: this.#cfg.brightness },
        uFgExposure: { value: this.#cfg.fgExposure },
        uSaturation: { value: this.#cfg.saturation ?? 1.0 },
      },
    });

    this.#rebuildGeometry();
  }

  getImageAspect() {
    return this.#imgAspect;
  }

  #rebuildGeometry() {
    if (!this.#material) return;

    if (this.#mesh) {
      this.#scene.remove(this.#mesh);
      this.#mesh.geometry.dispose();
      this.#mesh = null;
    }

    const vFovRad = (this.#camera.fov * Math.PI) / 180;
    const frustumH = 2 * Math.tan(vFovRad / 2) * this.#baseZ;
    const frustumW = frustumH * this.#camera.aspect;

    const OVERDRAW = 1.07;
    const coverScale =
      Math.max(frustumW / this.#imgAspect, frustumH) * OVERDRAW;

    const geo = new THREE.PlaneGeometry(
      this.#imgAspect * coverScale,
      1.0 * coverScale,
      128,
      128,
    );

    this.#mesh = new THREE.Mesh(geo, this.#material);
    this.#scene.add(this.#mesh);
  }

  start() {
    this.#isVisible = true;

    const loop = () => {
      this.#animId = requestAnimationFrame(loop);

      // Skip rendering when off-screen — huge Safari perf win
      if (!this.#isVisible) return;

      this.#currentMouse.lerp(this.#targetMouse, this.#cfg.lerpSpeed);

      this.#camera.position.x =
        -this.#currentMouse.x * this.#cfg.cameraDriftStrength;
      this.#camera.position.y =
        -this.#currentMouse.y * this.#cfg.cameraDriftStrength;
      this.#camera.position.z = this.#baseZ;
      this.#camera.lookAt(0, 0, 0);

      if (this.#material) {
        this.#material.uniforms.uMouse.value = this.#currentMouse;
      }
      this.#renderer.render(this.#scene, this.#camera);
    };
    loop();
  }

  setVisible(v) {
    this.#isVisible = v;
  }

  onMouseMove(x, y) {
    this.#targetMouse.set(x, y);
  }

  onResize(w, h) {
    this.#renderer.setSize(w, h, false);
    this.#camera.aspect = w / h;
    this.#camera.updateProjectionMatrix();
    this.#rebuildGeometry();
  }

  dispose() {
    if (this.#animId !== null) cancelAnimationFrame(this.#animId);
    this.#mesh?.geometry.dispose();
    this.#material?.dispose();
    this.#renderer.dispose();
  }
}

const container = document.getElementById("parallax-hero");
const spinner = document.getElementById("parallax-spinner");

const calcHeight = (vpW, vpH, imgAspect) => Math.round(vpW * 0.75);

function showFallback() {
  spinner?.remove();
  container.innerHTML = "";
  const img = document.createElement("img");
  img.src = CFG.colorUrl;
  img.alt = "Hero";
  img.className = "fallback";
  container.appendChild(img);
}

let hero;

const canvas = document.createElement("canvas");
const vpW0 = window.innerWidth;
const vpH0 = Math.round(vpW0 * 0.75);
canvas.width = vpW0;
canvas.height = vpH0;
canvas.style.display = "block";
canvas.style.width = "100%";
canvas.style.height = "100%";
container.style.height = vpH0 + "px";
container.appendChild(canvas);

try {
  const isSafariFallback = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  if (isSafariFallback) throw new Error("Safari detected: disabling Three.js for performance");
  
  hero = new ParallaxHero(canvas, CFG);
} catch {
  showFallback();
  throw new Error("ParallaxHero: WebGL context failed or disabled manually");
}

hero
  .load(CFG.colorUrl, CFG.depthUrl)
  .then(() => {
    const vpW = window.innerWidth;
    const vpH = window.innerHeight;
    const h = calcHeight(vpW, vpH, hero.getImageAspect());

    canvas.width = vpW;
    canvas.height = h;
    hero.onResize(vpW, h);
    container.style.height = h + "px";

    hero.start();
    spinner?.remove();

    // Pause rendering when hero is off-screen
    const visObs = new IntersectionObserver(
      ([entry]) => hero.setVisible(entry.isIntersecting),
      { threshold: 0 },
    );
    visObs.observe(container);
  })
  .catch((err) => {
    console.error("ParallaxHero: texture load failed", err);
    showFallback();
  });

// Mouse
window.addEventListener("mousemove", (e) => {
  const x = (e.clientX / window.innerWidth) * 2 - 1;
  const y = -((e.clientY / window.innerHeight) * 2 - 1);
  hero.onMouseMove(x, y);
});

// Touch
window.addEventListener(
  "touchmove",
  (e) => {
    const t = e.touches[0];
    if (!t) return;
    const x = (t.clientX / window.innerWidth) * 2 - 1;
    const y = -((t.clientY / window.innerHeight) * 2 - 1);
    hero.onMouseMove(x, y);
  },
  { passive: true },
);

// Scroll
/*window.addEventListener('scroll', () => {
  if (hero) {
    hero.onScroll(window.scrollY / window.innerHeight);
  }
}, { passive: true });*/

window.addEventListener("resize", () => {
  if (!hero) return;
  const vpW = window.innerWidth;
  const vpH = window.innerHeight;
  const h = calcHeight(vpW, vpH, hero.getImageAspect());
  canvas.width = vpW;
  canvas.height = h;
  hero.onResize(vpW, h);
  container.style.height = h + "px";
});
