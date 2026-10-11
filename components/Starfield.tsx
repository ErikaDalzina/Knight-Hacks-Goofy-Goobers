'use client';

import { useEffect, useRef } from 'react';

type Three = typeof import('three');

// Port of the Umbra mockup's night-stars.js: a slowly turning sky of twinkling stars with a
// Milky Way band and the odd meteor. It sits behind every page (see app/layout.tsx).

// Stars a pixel or two wide flicker as the sky turns: each frame their sharp core lands at a
// different spot inside a pixel, so they blink several times a second. Below MIN_PX they're drawn
// in a bigger sprite as a soft dot about a pixel wide, which spreads over neighbouring pixels and
// glides instead. Stars from 2 px up to MIN_PX blend between the two looks; bigger ones are unchanged.
const VERTEX = `
attribute float aSize; attribute float aPhase; attribute vec3 aColor;
uniform float uTime; uniform float uPR; uniform float uTw;
varying vec3 vC; varying float vA; varying float vPx; varying float vDrawn; varying float vSoft;
const float MIN_PX = 4.0;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  vA = 1.0 - uTw * (0.5 + 0.5 * sin(uTime * (0.6 + aPhase * 2.4) + aPhase * 61.0)) * 0.55;
  vC = aColor;
  vPx = aSize * uPR;
  vDrawn = max(vPx, MIN_PX);
  vSoft = 1.0 - smoothstep(2.0, MIN_PX, vPx);
  gl_PointSize = vDrawn;
}`;

const FRAGMENT = `
varying vec3 vC; varying float vA; varying float vPx; varying float vDrawn; varying float vSoft;
const float SIGMA = 0.6;     // soft dot's width, in pixels
const float SOFT_PEAK = 0.35; // soft dot's brightness; higher makes the faint stars stand out more
void main() {
  float d = length(gl_PointCoord - 0.5);
  float dt = d * vDrawn / vPx; // the original shape, at the star's real size
  float sharp = pow(smoothstep(0.5, 0.0, dt), 2.4) + 0.5 * smoothstep(0.16, 0.0, dt);
  float dp = d * vDrawn;       // distance from the center, in pixels
  float soft = SOFT_PEAK * exp(-dp * dp / (2.0 * SIGMA * SIGMA));
  gl_FragColor = vec4(vC, mix(sharp, soft, vSoft) * vA);
}`;

// Star tints: warm, blue-white and white.
const TINTS = [[1, 0.82, 0.66], [0.76, 0.84, 1], [1, 0.98, 0.95]];

// Seeded, so the sky looks the same on every visit.
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function buildStars(T: Three, density: number) {
  const R = rng(11);
  const gauss = () => Math.sqrt(-2 * Math.log(R() + 1e-9)) * Math.cos(2 * Math.PI * R());
  const field = Math.round(2400 * density);
  const total = field + Math.round(5600 * density);
  const pos = new Float32Array(total * 3);
  const col = new Float32Array(total * 3);
  const size = new Float32Array(total);
  const phase = new Float32Array(total);

  // The Milky Way is a great circle around the normal n, spanned by u and v.
  const n = new T.Vector3(0.2, 1, 0.3).normalize();
  const u = new T.Vector3(1, 0, 0).cross(n).normalize();
  const v = n.clone().cross(u).normalize();
  const d = new T.Vector3();

  for (let i = 0; i < total; i++) {
    let brightness: number;
    if (i < field) {
      // Spread evenly over the sky, with a few large, bright stars.
      const z = 2 * R() - 1, p = 2 * Math.PI * R(), s = Math.sqrt(1 - z * z);
      d.set(s * Math.cos(p), s * Math.sin(p), z);
      const k = Math.pow(R(), 7);
      size[i] = 0.9 + k * 4.2;
      brightness = 0.45 + 0.55 * Math.min(1, k * 3 + R() * 0.4);
    } else {
      // Small, dim stars bunched along the band.
      const th = 2 * Math.PI * R(), lat = gauss() * (R() < 0.6 ? 0.045 : 0.13);
      d.copy(u).multiplyScalar(Math.cos(th)).addScaledVector(v, Math.sin(th)).addScaledVector(n, lat).normalize();
      size[i] = 0.7 + Math.pow(R(), 6) * 1.8;
      brightness = 0.25 + R() * 0.35;
    }
    pos.set([d.x * 100, d.y * 100, d.z * 100], i * 3);
    const t = R();
    const c = TINTS[t < 0.14 ? 0 : t < 0.5 ? 1 : 2];
    col.set([c[0] * brightness, c[1] * brightness, c[2] * brightness], i * 3);
    phase[i] = R();
  }

  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.BufferAttribute(pos, 3));
  g.setAttribute('aColor', new T.BufferAttribute(col, 3));
  g.setAttribute('aSize', new T.BufferAttribute(size, 1));
  g.setAttribute('aPhase', new T.BufferAttribute(phase, 1));
  return g;
}

/** Draws the sky into `host` and returns a function that tears it all down. */
function startSky(T: Three, host: HTMLElement): () => void {
  const renderer = new T.WebGLRenderer({ alpha: true, antialias: false });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.setClearColor(0, 0);
  renderer.domElement.style.cssText = 'width:100%;height:100%;display:block';
  host.appendChild(renderer.domElement);

  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(58, 1, 0.1, 500);
  const group = new T.Group();
  group.rotation.set(0.35, 0, 0.55);
  scene.add(group);

  const starMaterial = new T.ShaderMaterial({
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    transparent: true,
    depthWrite: false,
    blending: T.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uPR: { value: renderer.getPixelRatio() }, uTw: { value: 1 } },
  });
  // Fewer stars on phones, where the screen is small and the GPU is weaker.
  const starGeometry = buildStars(T, window.innerWidth >= 768 ? 2 : 1);
  group.add(new T.Points(starGeometry, starMaterial));

  // A meteor is a two-point line: a bright head fading to a black (invisible) tail.
  const meteorGeometry = new T.BufferGeometry();
  meteorGeometry.setAttribute('position', new T.Float32BufferAttribute([0, 0, 0, 0, 0, 0], 3));
  meteorGeometry.setAttribute('color', new T.Float32BufferAttribute([1, 1, 1, 0, 0, 0], 3));
  const meteorMaterial = new T.LineBasicMaterial({
    vertexColors: true, transparent: true, blending: T.AdditiveBlending, depthWrite: false,
  });
  const meteor = new T.Line(meteorGeometry, meteorMaterial);
  meteor.visible = false;
  meteor.frustumCulled = false; // its bounding sphere would go stale as it moves
  scene.add(meteor);

  const resize = () => {
    const w = host.clientWidth || 1, h = host.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
  };
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  resize();

  const start = new T.Vector3(), dir = new T.Vector3(), head = new T.Vector3(), tail = new T.Vector3();
  let nextMeteor = 3 + Math.random() * 5;
  let meteorAge = -1; // seconds since the current meteor appeared; -1 when none
  const t0 = performance.now();
  let last = t0;
  let raf = 0;

  const frame = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    starMaterial.uniforms.uTime.value = (now - t0) / 1000;
    group.rotation.y += dt * 0.006;

    nextMeteor -= dt;
    if (nextMeteor <= 0 && meteorAge < 0) {
      meteorAge = 0;
      nextMeteor = 7 + Math.random() * 9;
      start.set((Math.random() * 2 - 1) * 35, 10 + Math.random() * 25, -80);
      dir.set(-0.8 - Math.random() * 0.4, -0.5, 0).normalize();
      meteor.visible = true;
    }
    if (meteorAge >= 0) {
      meteorAge += dt;
      const p = meteorAge / 0.9;
      if (p >= 1) {
        meteorAge = -1;
        meteor.visible = false;
      } else {
        head.copy(start).addScaledVector(dir, p * 60);
        tail.copy(head).addScaledVector(dir, -14 * Math.sin(Math.PI * p));
        const { position, color } = meteorGeometry.attributes;
        position.setXYZ(0, head.x, head.y, head.z);
        position.setXYZ(1, tail.x, tail.y, tail.z);
        position.needsUpdate = true;
        const f = Math.sin(Math.PI * p);
        color.setXYZ(0, f, f, f);
        color.needsUpdate = true;
      }
    }

    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  };

  // Reduced motion: one still frame with steady (untwinkled) stars.
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const applyMotion = () => {
    cancelAnimationFrame(raf);
    if (reduced.matches) {
      meteor.visible = false;
      meteorAge = -1;
      starMaterial.uniforms.uTw.value = 0;
      renderer.render(scene, camera);
    } else {
      starMaterial.uniforms.uTw.value = 1;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
  };
  reduced.addEventListener('change', applyMotion);
  applyMotion();

  return () => {
    cancelAnimationFrame(raf);
    reduced.removeEventListener('change', applyMotion);
    observer.disconnect();
    starGeometry.dispose();
    starMaterial.dispose();
    meteorGeometry.dispose();
    meteorMaterial.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    renderer.domElement.remove();
  };
}

export default function Starfield() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    let stopped = false;
    let stop = () => {};
    // three.js loads as its own chunk, so it never holds up the page.
    import('three')
      .then((T) => { if (!stopped) stop = startSky(T, host); })
      .catch(() => {}); // no WebGL: the page keeps its plain night background
    return () => {
      stopped = true;
      stop();
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      style={{ position: 'fixed', inset: 0, zIndex: -1, pointerEvents: 'none', overflow: 'hidden' }}
    />
  );
}
