import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import {
  createSunlightSystem,
  createSunCoronaTexture,
  createSunRayTexture,
  createSunMoteTexture,
  DEFAULT_SUN_POSITION,
  DEFAULT_SUN_COLOR,
} from "../src/map/sunlight-system";

test("TDD [Sunlight Textures]: Generates pure DataTextures for sun corona, god rays, and motes in headless Node", () => {
  const coronaTex = createSunCoronaTexture(64);
  assert.ok(coronaTex instanceof THREE.DataTexture, "Corona must be a DataTexture");
  assert.equal(coronaTex.image.width, 64);
  assert.equal(coronaTex.image.height, 64);

  const rayTex = createSunRayTexture(32, 128);
  assert.ok(rayTex instanceof THREE.DataTexture, "God ray must be a DataTexture");
  assert.equal(rayTex.image.width, 32);
  assert.equal(rayTex.image.height, 128);

  const moteTex = createSunMoteTexture(32);
  assert.ok(moteTex instanceof THREE.DataTexture, "Mote must be a DataTexture");
  assert.equal(moteTex.image.width, 32);

  coronaTex.dispose();
  rayTex.dispose();
  moteTex.dispose();
});

test("TDD [Sunlight System Creation]: createSunlightSystem returns complete system with visual sun, rays, and motes", () => {
  const sunlight = createSunlightSystem();

  assert.ok(sunlight.group instanceof THREE.Group, "Must have root group");
  assert.equal(sunlight.group.name, "SunlightSystem");
  assert.ok(sunlight.sunMesh, "Must include sun core mesh");
  assert.ok(sunlight.coronaMesh, "Must include sun corona halo mesh");
  assert.ok(sunlight.godRaysGroup instanceof THREE.Group, "Must include god rays group");
  assert.ok(sunlight.motesParticles instanceof THREE.Points, "Must include floating sun motes particles");

  // Check sun position matches sun direction in the sky
  assert.equal(sunlight.sunPosition.x, DEFAULT_SUN_POSITION.x);
  assert.equal(sunlight.sunPosition.y, DEFAULT_SUN_POSITION.y);
  assert.equal(sunlight.sunPosition.z, DEFAULT_SUN_POSITION.z);
  assert.equal(DEFAULT_SUN_COLOR, 0xfffaed, "Sunlight color should be warm golden-white");
  assert.ok(sunlight.sunPosition.y > 150, "Sun must be elevated high in the sky");
  assert.equal(sunlight.sunMesh.position.x, sunlight.sunPosition.x);
  assert.equal(sunlight.sunMesh.position.y, sunlight.sunPosition.y);
  assert.equal(sunlight.sunMesh.position.z, sunlight.sunPosition.z);

  sunlight.dispose();
});

test("TDD [Sun Appearance & Corona]: Sun has bright radiant core and layered additive corona", () => {
  const sunlight = createSunlightSystem();

  // Core mesh has bright unshaded basic material
  const coreMat = sunlight.sunMesh.material as THREE.MeshBasicMaterial;
  assert.ok(coreMat, "Sun core must have material");
  assert.equal(coreMat.color.getHex(), 0xffffff, "Sun core should be brilliant white/golden");

  // Corona has additive blending and transparency
  const coronaMat = sunlight.coronaMesh.material as THREE.MeshBasicMaterial;
  assert.ok(coronaMat, "Corona must have material");
  assert.equal(coronaMat.transparent, true, "Corona must be transparent");
  assert.equal(coronaMat.blending, THREE.AdditiveBlending, "Corona must use additive blending for glow");

  sunlight.dispose();
});

test("TDD [Volumetric God Rays]: Light shafts are angled along sunlight vector and have additive blending", () => {
  const sunlight = createSunlightSystem();

  const shafts = sunlight.godRaysGroup.children;
  assert.ok(shafts.length >= 3, `Must have multiple volumetric light shafts, found ${shafts.length}`);

  for (const shaft of shafts) {
    assert.ok(shaft instanceof THREE.Mesh, "Shaft must be a mesh");
    const mat = shaft.material as THREE.MeshBasicMaterial;
    assert.equal(mat.transparent, true, "God ray shaft must be transparent");
    assert.equal(mat.blending, THREE.AdditiveBlending, "God ray shaft must use additive blending");
    assert.equal(mat.depthWrite, false, "God ray must not write to depth buffer");
  }

  sunlight.dispose();
});

test("TDD [Sun Motes Particles]: Floating sunlight sparkles drift around park and streets", () => {
  const sunlight = createSunlightSystem();

  const particles = sunlight.motesParticles;
  const geometry = particles.geometry as THREE.BufferGeometry;
  const posAttr = geometry.getAttribute("position");

  assert.ok(posAttr.count >= 100, `Must have at least 100 sun motes, found ${posAttr.count}`);

  const initialY = posAttr.getY(0);

  // Advance time by 0.5s
  const dummyCamera = new THREE.PerspectiveCamera();
  dummyCamera.position.set(0, 5, 20);
  dummyCamera.lookAt(0, 0, 0);

  sunlight.update(0.5, dummyCamera);

  const updatedY = posAttr.getY(0);
  assert.notEqual(initialY, updatedY, "Sun motes must drift and animate over time");

  sunlight.dispose();
});

test("TDD [Dynamic Sun Glare]: Looking towards the sun increases corona glare scale and brightness", () => {
  const sunlight = createSunlightSystem();

  const camera = new THREE.PerspectiveCamera();
  camera.position.set(0, 2, 0);

  // 1. Look away from the sun (-sunPosition direction)
  const awayTarget = new THREE.Vector3().copy(sunlight.sunPosition).negate();
  camera.lookAt(awayTarget);
  camera.updateMatrixWorld();

  sunlight.update(0.016, camera);
  const awayCoronaScale = sunlight.coronaMesh.scale.x;

  // 2. Look directly at the sun
  camera.lookAt(sunlight.sunPosition);
  camera.updateMatrixWorld();

  sunlight.update(0.016, camera);
  const atSunCoronaScale = sunlight.coronaMesh.scale.x;

  assert.ok(
    atSunCoronaScale > awayCoronaScale,
    `Looking at sun should increase corona flare scale: at=${atSunCoronaScale.toFixed(2)}, away=${awayCoronaScale.toFixed(2)}`
  );

  sunlight.dispose();
});

test("TDD [Sunlight Disposal]: Cleans up all geometries, textures, and materials cleanly", () => {
  const sunlight = createSunlightSystem();

  assert.doesNotThrow(() => {
    sunlight.dispose();
  }, "Disposal must execute cleanly without errors");
});
