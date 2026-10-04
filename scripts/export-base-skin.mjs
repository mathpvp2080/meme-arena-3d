#!/usr/bin/env node
/* =====================================================================
   Exporta o boneco-base do Meme Arena como .glb para modelagem.

   Gera assets/skins/base-boneco.glb com as MESMAS proporções do boneco
   procedural do jogo (altura, cabeça, braços, pernas, pés). Abra no
   Blender, esculpa/vista por cima e exporte de volta como .glb.

   Uso:  npm i && npm run export:base
   ===================================================================== */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as THREE from 'three';

/* O GLTFExporter usa window.FileReader para montar o .glb; no Node basta
   um equivalente mínimo em cima do Blob nativo. */
globalThis.window = globalThis.window || {
  FileReader: class {
    readAsArrayBuffer(blob) {
      blob.arrayBuffer().then(buf => { this.result = buf; if (this.onloadend) this.onloadend(); });
    }
  }
};
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TAU = Math.PI * 2;
const bulk = 1;

/* mesmas funções de src/entities.js ----------------------------------- */
function partyTorsoGeometry(b) {
  const p = [
    [0, -.54], [.38, -.53], [.47, -.47], [.51, -.31],
    [.57, .16], [.63, .38], [.59, .49], [.42, .53], [0, .54]
  ].map(v => new THREE.Vector2(v[0] * b, v[1]));
  const geo = new THREE.LatheGeometry(p, 32);
  geo.computeVertexNormals();
  return geo;
}
function roundedRectShape(w, h, r) {
  const x = -w / 2, y = -h / 2;
  const sh = new THREE.Shape();
  sh.moveTo(x + r, y);
  sh.lineTo(x + w - r, y); sh.quadraticCurveTo(x + w, y, x + w, y + r);
  sh.lineTo(x + w, y + h - r); sh.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  sh.lineTo(x + r, y + h); sh.quadraticCurveTo(x, y + h, x, y + h - r);
  sh.lineTo(x, y + r); sh.quadraticCurveTo(x, y, x + r, y);
  return sh;
}
function partyHeadGeometry(w, h, d, radius) {
  const bevel = .12;
  const geo = new THREE.ExtrudeGeometry(roundedRectShape(w, h, radius), {
    depth: d - bevel * 2, steps: 1, curveSegments: 8,
    bevelEnabled: true, bevelSegments: 5, bevelSize: bevel, bevelThickness: bevel
  });
  geo.translate(0, 0, -d / 2 + bevel);
  geo.computeVertexNormals();
  return geo;
}

/* mesmo polyfill de src/utils.js (three r128 não tem CapsuleGeometry) */
function CapsuleGeometry(radius, length, capSeg, radialSeg) {
    const pts = [], h = length / 2;
    capSeg = Math.max(2, capSeg || 4); radialSeg = Math.max(3, radialSeg || 8);
    for (let i = 0; i <= capSeg; i++) {
      const a = -Math.PI / 2 + (i / capSeg) * (Math.PI / 2);
      pts.push(new THREE.Vector2(Math.cos(a) * radius, -h + Math.sin(a) * radius));
    }
    for (let i = 0; i <= capSeg; i++) {
      const a = (i / capSeg) * (Math.PI / 2);
      pts.push(new THREE.Vector2(Math.cos(a) * radius, h + Math.sin(a) * radius));
    }
  const g = new THREE.LatheGeometry(pts, radialSeg);
  g.computeVertexNormals();
  return g;
}

const mat = (color, name) => new THREE.MeshStandardMaterial({ color, roughness: .36, metalness: .05, name });
const root3d = new THREE.Group();
root3d.name = 'BonecoBase';
const add = (mesh, name, parent) => { mesh.name = name; (parent || root3d).add(mesh); return mesh; };

/* torso + capuz ------------------------------------------------------- */
const torso = add(new THREE.Mesh(partyTorsoGeometry(bulk), mat(0x6273dc, 'Roupa')), 'Torso');
torso.position.y = 1.19; torso.scale.z = .91;

const hood = add(new THREE.Mesh(new THREE.SphereGeometry(.52 * bulk, 24, 16, 0, TAU, 0, 1.5), mat(0x4858b3, 'Capuz')), 'Capuz');
hood.position.set(0, 1.72, .06); hood.scale.set(1.06, .72, 1.02);

/* cabeça -------------------------------------------------------------- */
const headW = .88, headH = .72, headD = .92, headR = .31;
const head = add(new THREE.Mesh(partyHeadGeometry(headW, headH, headD, headR), mat(0xefba88, 'Pele')), 'Cabeca');
head.position.y = 2.13;

/* braços e mãos ------------------------------------------------------- */
[-1, 1].forEach(s => {
  const arm = add(new THREE.Mesh(CapsuleGeometry(.225 * bulk, .43, 9, 22), mat(0x7587e8, 'Manga')),
    s < 0 ? 'BracoEsquerdo' : 'BracoDireito');
  arm.position.set(s * .75 * bulk, 1.29, 0); arm.rotation.z = s * .075;
  const hand = add(new THREE.Mesh(new THREE.SphereGeometry(.245 * bulk, 22, 16), mat(0xefba88, 'Pele')),
    s < 0 ? 'MaoEsquerda' : 'MaoDireita', arm);
  hand.position.y = -.38; hand.scale.set(1.03, .95, 1);
  const shoulder = add(new THREE.Mesh(new THREE.SphereGeometry(.245 * bulk, 22, 16), mat(0x7587e8, 'Manga')),
    s < 0 ? 'OmbroEsquerdo' : 'OmbroDireito');
  shoulder.position.set(s * .62 * bulk, 1.55, 0); shoulder.scale.set(1, .94, .94);
});

/* quadril, pernas e pés ----------------------------------------------- */
const hips = add(new THREE.Mesh(new THREE.SphereGeometry(.49 * bulk, 24, 16), mat(0x393b72, 'Calca')), 'Quadril');
hips.position.y = .74; hips.scale.set(1, .56, .87);

[-1, 1].forEach(s => {
  const leg = add(new THREE.Mesh(CapsuleGeometry(.235 * bulk, .34, 9, 22), mat(0x393b72, 'Calca')),
    s < 0 ? 'PernaEsquerda' : 'PernaDireita');
  leg.position.set(s * .285 * bulk, .40, 0);
  const shoe = add(new THREE.Mesh(new THREE.SphereGeometry(.305 * bulk, 24, 16), mat(0x24264a, 'Tenis')),
    s < 0 ? 'PeEsquerdo' : 'PeDireito', leg);
  shoe.position.set(0, -.35, -.14); shoe.scale.set(.94, .59, 1.38);
});

/* medidas -------------------------------------------------------------- */
root3d.updateMatrixWorld(true);
const box = new THREE.Box3().setFromObject(root3d);
const size = new THREE.Vector3(); box.getSize(size);
console.log('altura total: %s | largura: %s | profundidade: %s',
  size.y.toFixed(3), size.x.toFixed(3), size.z.toFixed(3));
console.log('pés em y = %s (o jogo apoia o modelo no chão automaticamente)', box.min.y.toFixed(3));

/* export --------------------------------------------------------------- */
const out = path.join(root, 'assets/skins/base-boneco.glb');
new GLTFExporter().parse(root3d, result => {
  fs.writeFileSync(out, Buffer.from(result));
  console.log('✓ %s (%s KB)', path.relative(root, out), (fs.statSync(out).size / 1024).toFixed(0));
}, { binary: true, onlyVisible: true });
