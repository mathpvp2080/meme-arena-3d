#!/usr/bin/env node
/* =====================================================================
   Exporta acessórios de cabeça do Meme Arena como .glb avulsos.

   Gera em assets/skins/:
     acessorio-bone.glb      boné (casco + aba)
     acessorio-coroa.glb     coroa de 7 pontas
     acessorio-chifres.glb   par de chifres

   Use de dois jeitos:
     1) importe no Blender e encaixe na cabeça do seu boneco; ou
     2) registre direto no jogo como peça (mode:'part', anchor:'hat').

   Uso:  npm i && npm run export:acessorios
   ===================================================================== */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

globalThis.window = globalThis.window || {
  FileReader: class {
    readAsArrayBuffer(blob) {
      blob.arrayBuffer().then(buf => { this.result = buf; if (this.onloadend) this.onloadend(); });
    }
  }
};

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TAU = Math.PI * 2;
const mat = (color, name, metal) => new THREE.MeshStandardMaterial({
  color, name, roughness: metal ? .16 : .28, metalness: metal ? .85 : .05
});

/* ------------------------------------------------------------- boné ---- */
function bone() {
  const g = new THREE.Group(); g.name = 'Bone';
  const casco = new THREE.Mesh(new THREE.SphereGeometry(.63, 32, 16, 0, TAU, 0, 1.04), mat(0xff5bbf, 'BoneTecido'));
  casco.name = 'Casco'; casco.scale.z = .92; g.add(casco);
  const aba = new THREE.Mesh(new THREE.SphereGeometry(.51, 26, 14), mat(0xff5bbf, 'BoneAba'));
  aba.name = 'Aba'; aba.position.set(0, .43, -.53); aba.scale.set(1, .13, .68); g.add(aba);
  const botao = new THREE.Mesh(new THREE.SphereGeometry(.07, 14, 10), mat(0xffffff, 'BoneBotao'));
  botao.name = 'Botao'; botao.position.y = .60; g.add(botao);
  return g;
}

/* ------------------------------------------------------------ coroa ---- */
function coroa() {
  const g = new THREE.Group(); g.name = 'Coroa';
  const m = mat(0xffd84a, 'Ouro', true);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(.61, .61, .18, 28), m);
  base.name = 'Aro'; g.add(base);
  for (let i = 0; i < 7; i++) {
    const p = new THREE.Mesh(new THREE.ConeGeometry(.11, .36, 10), m);
    const a = i / 7 * TAU;
    p.name = 'Ponta' + (i + 1);
    p.position.set(Math.cos(a) * .52, .23, Math.sin(a) * .52);
    g.add(p);
  }
  return g;
}

/* ---------------------------------------------------------- chifres ---- */
function chifres() {
  const g = new THREE.Group(); g.name = 'Chifres';
  const m = mat(0xff3b6b, 'Chifre');
  [-1, 1].forEach(s => {
    const c = new THREE.Mesh(new THREE.ConeGeometry(.14, .54, 12), m);
    c.name = s < 0 ? 'ChifreEsquerdo' : 'ChifreDireito';
    c.position.set(s * .39, 0, -.04);
    c.rotation.z = s * .30;
    g.add(c);
  });
  return g;
}

const alvos = [['acessorio-bone.glb', bone()], ['acessorio-coroa.glb', coroa()], ['acessorio-chifres.glb', chifres()]];
for (const [nome, obj] of alvos) {
  obj.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(obj);
  const size = new THREE.Vector3(); box.getSize(size);
  const out = path.join(root, 'assets/skins', nome);
  new GLTFExporter().parse(obj, result => {
    fs.writeFileSync(out, Buffer.from(result));
    console.log('✓ %s (%s KB) — %s x %s x %s',
      nome, (fs.statSync(out).size / 1024).toFixed(0),
      size.x.toFixed(2), size.y.toFixed(2), size.z.toFixed(2));
  }, { binary: true });
}
