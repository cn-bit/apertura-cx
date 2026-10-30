/* Apertura CX hero lens, rendered in 3D.
   The page's hero script calls window.lens3d.draw() every frame with the lens position,
   housing radius, opening radius, rotation and how far the lens has opened.
   Everything is modelled at a housing radius of 1 and scaled to the screen. */
import * as THREE from './vendor/three.module.min.js';
import { RoomEnvironment } from './vendor/RoomEnvironment.js';

const TAU = Math.PI * 2;
const N = 9;                       // blades
const R_OUT = 1.0;                // blades run under the barrel to here
const STOPS = ['22', '16', '11', '8', '5.6', '4', '2.8', '2', '1.4'];
const STEP = .26;                  // angle between engraved stops

function fail() { window.lens3dState = 'fail'; }

try {
  const host = document.querySelector('.frame');
  const canvas = document.createElement('canvas');
  canvas.id = 'lens3d';
  canvas.setAttribute('aria-hidden', 'true');
  host.querySelector('#iris').after(canvas);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = .95;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), .04).texture;

  const camera = new THREE.PerspectiveCamera(20, 1, 10, 100000);

  /* ---------- lights ---------- */
  scene.add(new THREE.AmbientLight(0xfff4ea, .25));
  const fill = new THREE.DirectionalLight(0xffe2c8, .6);
  scene.add(fill, fill.target);
  const key = new THREE.DirectionalLight(0xfff1e2, 2.6);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.bias = -.0004;
  key.shadow.normalBias = .02;
  key.shadow.radius = 6;
  scene.add(key, key.target);

  /* ---------- the lens, built at unit radius ---------- */
  const lens = new THREE.Group();
  scene.add(lens);

  const mats = {
    blade: new THREE.MeshStandardMaterial({ color: 0x1d1a19, metalness: .78, roughness: .4, envMapIntensity: 1.25 }),
    ring: new THREE.MeshStandardMaterial({ color: 0x161413, metalness: .35, roughness: .7, transparent: true, side: THREE.DoubleSide }),
    grip: new THREE.MeshStandardMaterial({ color: 0x24211f, metalness: .8, roughness: .4, transparent: true, side: THREE.DoubleSide, envMapIntensity: 1.3 }),
    chrome: new THREE.MeshStandardMaterial({ color: 0x9a938c, metalness: 1, roughness: .22, transparent: true, side: THREE.DoubleSide, envMapIntensity: 1.4 }),
    mark: new THREE.MeshStandardMaterial({ color: 0xd49a68, metalness: .3, roughness: .45, transparent: true }),
  };

  // shadow catcher so the lens casts onto the page
  const catcher = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), new THREE.ShadowMaterial({ opacity: .42, transparent: true }));
  catcher.position.z = -.02;
  catcher.receiveShadow = true;
  lens.add(catcher);

  // barrel, turned on a lathe: points are [radius, height]
  const barrel = new THREE.Group();
  lens.add(barrel);
  function lathe(points, mat) {
    const g = new THREE.LatheGeometry(points.map(([r, z]) => new THREE.Vector2(r, z)), 180);
    g.rotateX(Math.PI / 2);
    const m = new THREE.Mesh(g, mat);
    m.castShadow = true; m.receiveShadow = true;
    barrel.add(m);
    return m;
  }
  lathe([[.965, .05], [.975, .068], [.995, .086], [1.03, .095], [1.06, .095]], mats.chrome);            // polished bevel
  lathe([[1.06, .095], [1.062, .108], [1.068, .112], [1.162, .112], [1.168, .108], [1.17, .09]], mats.ring); // aperture ring
  lathe([[1.17, .09], [1.175, .085], [1.295, .085], [1.3, .09]], mats.grip);                         // grip base
  lathe([[1.3, .09], [1.305, .1], [1.322, .1], [1.335, .085], [1.338, .03], [1.335, 0]], mats.chrome); // front lip

  // knurled grip
  const ridges = 220;
  const ridge = new THREE.BoxGeometry(.118, .013, .026);
  const knurl = new THREE.InstancedMesh(ridge, mats.grip, ridges);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s1 = new THREE.Vector3(1, 1, 1);
  for (let k = 0; k < ridges; k++) {
    const a = k * TAU / ridges;
    q.setFromAxisAngle(new THREE.Vector3(0, 0, 1), a);
    m4.compose(new THREE.Vector3(Math.cos(a) * 1.235, Math.sin(a) * 1.235, .097), q, s1);
    knurl.setMatrixAt(k, m4);
  }
  knurl.castShadow = true; knurl.receiveShadow = true;
  barrel.add(knurl);

  // index mark
  const mark = new THREE.Mesh(new THREE.ConeGeometry(.016, .03, 3), mats.mark);
  mark.rotation.z = Math.PI;
  mark.position.set(0, 1.18, .1);
  barrel.add(mark);

  // engraved f-numbers on a turning ring
  const tc = document.createElement('canvas');
  tc.width = tc.height = 2048;
  const tx = tc.getContext('2d');
  const span = 2.4, px = tc.width / span;
  tx.translate(tc.width / 2, tc.height / 2);
  tx.fillStyle = '#ece4d8';
  tx.textAlign = 'center'; tx.textBaseline = 'middle';
  tx.font = `500 ${Math.round(.042 * px)}px "DM Sans", "Helvetica Neue", Arial, sans-serif`;
  STOPS.forEach((st, i) => {
    const phi = Math.PI / 2 - i * STEP;
    const R = 1.115 * px;
    tx.save(); tx.translate(R * Math.cos(phi), -R * Math.sin(phi)); tx.rotate(-phi + Math.PI / 2); tx.fillText(st, 0, 0); tx.restore();
    const pt = phi - STEP / 2;
    tx.beginPath(); tx.arc(R * Math.cos(pt), -R * Math.sin(pt), .005 * px, 0, TAU); tx.globalAlpha = .55; tx.fill(); tx.globalAlpha = 1;
  });
  const engr = new THREE.CanvasTexture(tc);
  engr.colorSpace = THREE.SRGBColorSpace;
  engr.anisotropy = 4;
  const scaleMat = new THREE.MeshStandardMaterial({ map: engr, transparent: true, metalness: .2, roughness: .6, depthWrite: false });
  const scaleRing = new THREE.Mesh(new THREE.PlaneGeometry(span, span), scaleMat);
  scaleRing.position.z = .1125;
  barrel.add(scaleRing);
  document.fonts && document.fonts.ready.then(() => { // redraw once the brand font has loaded
    tx.clearRect(-tc.width, -tc.height, tc.width * 2, tc.height * 2);
    tx.font = `500 ${Math.round(.042 * px)}px "DM Sans", "Helvetica Neue", Arial, sans-serif`;
    STOPS.forEach((st, i) => {
      const phi = Math.PI / 2 - i * STEP, R = 1.115 * px;
      tx.save(); tx.translate(R * Math.cos(phi), -R * Math.sin(phi)); tx.rotate(-phi + Math.PI / 2); tx.fillText(st, 0, 0); tx.restore();
      const pt = phi - STEP / 2;
      tx.beginPath(); tx.arc(R * Math.cos(pt), -R * Math.sin(pt), .005 * px, 0, TAU); tx.globalAlpha = .55; tx.fill(); tx.globalAlpha = 1;
    });
    engr.needsUpdate = true; dirty = true;
  });

  /* ---------- blades, rebuilt when the opening changes ---------- */
  const bladeGroup = new THREE.Group();
  lens.add(bladeGroup);
  const blades = [];
  for (let i = 0; i < N; i++) {
    const m = new THREE.Mesh(new THREE.BufferGeometry(), mats.blade);
    m.castShadow = true; m.receiveShadow = true;
    bladeGroup.add(m); blades.push(m);
  }
  const extrude = { depth: .012, bevelEnabled: true, bevelThickness: .004, bevelSize: .0035, bevelSegments: 2, curveSegments: 14 };

  function farPoint(p, d) {                       // where a ray from p along d meets the outer circle
    const pd = p.x * d.x + p.y * d.y, pp = p.x * p.x + p.y * p.y;
    const L = -pd + Math.sqrt(Math.max(0, pd * pd - pp + R_OUT * R_OUT));
    return new THREE.Vector2(p.x + d.x * L, p.y + d.y * L);
  }
  function buildBlades(rr, rot) {
    const v = [];
    for (let i = 0; i < N; i++) { const a = -(rot + i * TAU / N); v.push(new THREE.Vector2(rr * Math.cos(a), rr * Math.sin(a))); }
    const e = v.map((p, i) => v[(i + 1) % N].clone().sub(p).normalize());
    for (let i = 0; i < N; i++) {
      const p = v[i], qv = v[(i + 1) % N], ep = e[(i - 1 + N) % N], ei = e[i];
      const pFar = farPoint(p, ep);
      const qFar = farPoint(qv, ei);
      const mid = p.clone().add(qv).multiplyScalar(.5);
      const out = mid.clone().normalize();
      const cp = mid.clone().add(out.multiplyScalar(p.distanceTo(qv) * .2));
      const sh = new THREE.Shape();
      sh.moveTo(pFar.x, pFar.y);
      sh.lineTo(p.x, p.y);
      sh.quadraticCurveTo(cp.x, cp.y, qv.x, qv.y);
      sh.lineTo(qFar.x, qFar.y);
      const aQ = Math.atan2(qFar.y, qFar.x), aP = Math.atan2(pFar.y, pFar.x);
      let d = aP - aQ; while (d > Math.PI) d -= TAU; while (d <= -Math.PI) d += TAU;
      sh.absarc(0, 0, R_OUT, aQ, aP, d < 0);
      const g = new THREE.ExtrudeGeometry(sh, extrude);
      blades[i].geometry.dispose();
      blades[i].geometry = g;
      // tilt each blade about its own radial line so neighbours overlap like real shingled blades
      const axis = new THREE.Vector3(mid.x, mid.y, 0).normalize();
      blades[i].quaternion.setFromAxisAngle(axis, .032);
      blades[i].position.z = .004 + (i % 2) * .002;
    }
  }

  /* ---------- per frame ---------- */
  let W = 0, Hs = 0, last = {}, dirty = true;
  function resize(w, h) {
    if (w === W && h === Hs) return;
    W = w; Hs = h;
    renderer.setSize(w, h, false);
    canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
    const D = h * 2.6;
    camera.fov = 2 * Math.atan(h / 2 / D) * 180 / Math.PI;
    camera.aspect = w / h;
    camera.position.set(0, 0, D);
    camera.lookAt(0, 0, 0);
    camera.near = D * .2; camera.far = D * 3;
    camera.updateProjectionMatrix();
    dirty = true;
  }

  window.lens3d = {
    draw(o) {
      const { w, h, cx, cy, house: H, r, rot, open } = o;
      resize(w, h);
      const rr = Math.min(r / H, .985);
      if (Math.abs(rr - (last.rr ?? -1)) > .0015 || Math.abs(rot - (last.rot ?? 99)) > .002) {
        buildBlades(rr, rot); last.rr = rr; last.rot = rot; dirty = true;
      }
      const X = cx - w / 2, Y = h / 2 - cy;
      if (X !== last.X || Y !== last.Y || H !== last.H || open !== last.open) dirty = true;
      if (!dirty) return;
      last.X = X; last.Y = Y; last.H = H; last.open = open;

      lens.position.set(X, Y, 0);
      lens.scale.setScalar(H);
      const barrelA = Math.max(0, 1 - open * 3);
      barrel.visible = barrelA > .001;
      ['ring', 'grip', 'chrome', 'mark'].forEach(k => { mats[k].opacity = barrelA; });
      scaleMat.opacity = barrelA;
      catcher.material.opacity = .42 * Math.max(.25, barrelA);
      scaleRing.rotation.z = open * (STOPS.length - 1) * STEP;

      key.position.set(X - H * 2.2, Y + H * 2.6, H * 4);
      key.target.position.set(X, Y, 0);
      fill.position.set(X + H * 3, Y - H * 2, H * 2); fill.target.position.set(X, Y, 0);
      const sc = key.shadow.camera, ext = H * 1.6;
      sc.left = -ext; sc.right = ext; sc.top = ext; sc.bottom = -ext; sc.near = H * .5; sc.far = H * 10;
      sc.updateProjectionMatrix();

      renderer.render(scene, camera);
      dirty = false;
    }
  };
  window.lens3dState = 'ok';
} catch (err) {
  console.warn('Lens could not be rendered in 3D', err);
  fail();
}
