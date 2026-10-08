#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS, KHRMeshQuantization } from '@gltf-transform/extensions';
import { dedup, prune, quantize, textureCompress, weld } from '@gltf-transform/functions';
import sharp from 'sharp';

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const sourceRoot = path.resolve(process.env.POLYGONAL_SOURCE || '/tmp/100Avatars');
const outputRoot = path.join(repoRoot, 'assets/skins/polygonal-mind');

// One authoritative build list. Public names, rarity, acquisition and values live
// in src/items.js; source IDs remain here only for a reproducible asset build.
const MODELS = [
  [2, 'little-alien-menace'], [3, 'mouse-misprint'], [7, 'o'],
  [24, 'cool-banana-guy'], [26, 'chaos-baby'], [29, 'skeleton-costume'],
  [51, 'robot'], [66, 'burn-victim'], [73, 'tall-guy'], [78, 'ramon'],
  [84, 'milk'], [87, 'hot-dog'], [88, 'avocado'], [90, 'eggplant'],
  [103, 'pizza'], [104, 'sunflower'], [105, 'goldfish-bag'],
  [109, 'alien-skeleton'], [118, 'cool-fries'], [119, 'captain-lantern'],
  [120, 'shark-person'], [124, 'cosmic-dweller'], [129, 'cosmic-person'],
  [133, 'baguette'], [138, 'cool-ramen'], [152, 'tnt'], [162, 'taco'],
  [168, 'eye-fighter'], [177, 'moon-girl'], [182, 'turtle'],
  [192, 'washing-machine'], [196, 'fridge'], [200, 'cool-polygonal-mind']
];

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);

function quat(axis, angle) {
  const s = Math.sin(angle / 2);
  return [axis[0] * s, axis[1] * s, axis[2] * s, Math.cos(angle / 2)];
}
function mul(a, b) {
  return [
    a[3]*b[0] + a[0]*b[3] + a[1]*b[2] - a[2]*b[1],
    a[3]*b[1] - a[0]*b[2] + a[1]*b[3] + a[2]*b[0],
    a[3]*b[2] + a[0]*b[1] - a[1]*b[0] + a[2]*b[3],
    a[3]*b[3] - a[0]*b[0] - a[1]*b[1] - a[2]*b[2]
  ];
}
function compose(...rotations) {
  return rotations.reduce((result, rotation) => mul(rotation, result), [0,0,0,1]);
}
function addRotationTrack(doc, animation, buffer, node, times, offsets) {
  if (!node) return;
  const rest = node.getRotation();
  const values = offsets.flatMap(offset => mul(offset, rest));
  const input = doc.createAccessor().setType('SCALAR').setArray(new Float32Array(times)).setBuffer(buffer);
  const output = doc.createAccessor().setType('VEC4').setArray(new Float32Array(values)).setBuffer(buffer);
  const sampler = doc.createAnimationSampler().setInput(input).setOutput(output).setInterpolation('LINEAR');
  animation.addSampler(sampler).addChannel(doc.createAnimationChannel()
    .setTargetNode(node).setTargetPath('rotation').setSampler(sampler));
}
function addTranslationTrack(doc, animation, buffer, node, times, yOffsets) {
  if (!node) return;
  const rest = node.getTranslation();
  const values = yOffsets.flatMap(y => [rest[0], rest[1] + y, rest[2]]);
  const input = doc.createAccessor().setType('SCALAR').setArray(new Float32Array(times)).setBuffer(buffer);
  const output = doc.createAccessor().setType('VEC3').setArray(new Float32Array(values)).setBuffer(buffer);
  const sampler = doc.createAnimationSampler().setInput(input).setOutput(output).setInterpolation('LINEAR');
  animation.addSampler(sampler).addChannel(doc.createAnimationChannel()
    .setTargetNode(node).setTargetPath('translation').setSampler(sampler));
}
function addGameplayAnimations(doc) {
  // R1 and R2 use the same Mixamo bone suffixes with different namespace
  // prefixes (for example "mixamorig:Hips" and "AvatarsR2_0052:Hips").
  const nodes = doc.getRoot().listNodes();
  const node = short => nodes.find(candidate => candidate.getName().split(':').pop() === short);
  const buffer = doc.getRoot().listBuffers()[0] || doc.createBuffer('animation-buffer');
  const rx = angle => quat([1,0,0], angle);
  const ry = angle => quat([0,1,0], angle);
  const rz = angle => quat([0,0,1], angle);

  const idle = doc.createAnimation('idle');
  const idleTimes = [0, 1, 2];
  addRotationTrack(doc, idle, buffer, node('LeftArm'), idleTimes, [rz(-.88), rz(-.82), rz(-.88)]);
  addRotationTrack(doc, idle, buffer, node('RightArm'), idleTimes, [rz(.88), rz(.82), rz(.88)]);
  addRotationTrack(doc, idle, buffer, node('Spine2'), idleTimes, [ry(-.025), ry(.025), ry(-.025)]);
  addTranslationTrack(doc, idle, buffer, node('Hips'), idleTimes, [0, .008, 0]);

  const run = doc.createAnimation('run');
  const runTimes = [0, .3, .6];
  addRotationTrack(doc, run, buffer, node('LeftArm'), runTimes,
    [compose(rz(-.72), rx(-.62)), compose(rz(-.72), rx(.62)), compose(rz(-.72), rx(-.62))]);
  addRotationTrack(doc, run, buffer, node('RightArm'), runTimes,
    [compose(rz(.72), rx(.62)), compose(rz(.72), rx(-.62)), compose(rz(.72), rx(.62))]);
  addRotationTrack(doc, run, buffer, node('LeftUpLeg'), runTimes, [rx(.58), rx(-.58), rx(.58)]);
  addRotationTrack(doc, run, buffer, node('RightUpLeg'), runTimes, [rx(-.58), rx(.58), rx(-.58)]);
  addRotationTrack(doc, run, buffer, node('LeftLeg'), runTimes, [rx(-.18), rx(.58), rx(-.18)]);
  addRotationTrack(doc, run, buffer, node('RightLeg'), runTimes, [rx(.58), rx(-.18), rx(.58)]);
  addTranslationTrack(doc, run, buffer, node('Hips'), runTimes, [0, .055, 0]);

  const punch = doc.createAnimation('punch');
  const punchTimes = [0, .14, .3, .55];
  addRotationTrack(doc, punch, buffer, node('LeftArm'), punchTimes,
    [rz(-.86), rz(-.72), rz(-.72), rz(-.86)]);
  addRotationTrack(doc, punch, buffer, node('RightArm'), punchTimes,
    [rz(.86), compose(rz(.35), rx(-1.25)), compose(rz(.3), rx(-1.5)), rz(.86)]);
  addRotationTrack(doc, punch, buffer, node('RightForeArm'), punchTimes,
    [rx(0), rx(-.45), rx(-.1), rx(0)]);
  addRotationTrack(doc, punch, buffer, node('Spine2'), punchTimes,
    [ry(0), ry(-.24), ry(.16), ry(0)]);
}

async function build(sourceId, slug) {
  const sourceDir = path.join(sourceRoot, `100Avatars_${String(sourceId).padStart(3, '0')}`);
  const candidates = (await fs.readdir(sourceDir)).filter(name => name.endsWith('.vrm'));
  if (candidates.length !== 1) throw new Error(`Expected one top-level VRM in ${sourceDir}`);
  const input = path.join(sourceDir, candidates[0]);
  const output = path.join(outputRoot, `${slug}.glb`);
  const doc = await io.readBinary(new Uint8Array(await fs.readFile(input)));

  // Viseme/expression morph targets are not used by the arena. Removing them is
  // the largest payload saving and leaves the rigged visible mesh unchanged.
  for (const mesh of doc.getRoot().listMeshes()) {
    mesh.setWeights([]);
    for (const primitive of mesh.listPrimitives()) {
      for (const target of primitive.listTargets()) target.dispose();
    }
  }
  for (const animation of doc.getRoot().listAnimations()) animation.dispose();

  await doc.transform(
    dedup(),
    weld({ tolerance: 1e-4 }),
    prune({ keepAttributes: false, keepLeaves: false, keepSolidTextures: false }),
    textureCompress({ encoder: sharp, targetFormat: 'png', resize: [512, 512], effort: 9 }),
    quantize({
      quantizePosition: 14, quantizeNormal: 10, quantizeTexcoord: 12,
      quantizeColor: 8, quantizeWeight: 8
    })
  );
  doc.createExtension(KHRMeshQuantization).setRequired(true);
  // Add gameplay clips after optimization so constant pose channels (lowered
  // arms in idle, for example) are not discarded as redundant transforms.
  addGameplayAnimations(doc);
  await fs.writeFile(output, await io.writeBinary(doc));
  const stat = await fs.stat(output);
  console.log(`${String(sourceId).padStart(3, '0')} -> ${path.relative(repoRoot, output)} (${stat.size} bytes)`);
}

await fs.access(path.join(sourceRoot, 'README.md'));
await fs.mkdir(outputRoot, { recursive: true });
for (const [id, slug] of MODELS) await build(id, slug);
await fs.copyFile(path.join(sourceRoot, 'CCLicense.md'), path.join(outputRoot, 'LICENSE.md'));
console.log(`Built ${MODELS.length} Polygonal Mind avatars.`);
