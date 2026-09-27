import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createPlayerCharacter } from "../src/player/player-character";
import { createPlayerState } from "../src/player/movement-controller";

test("TDD [Character 3D Named Pivots]: Character exposes named limbs and head group for interactive animation", () => {
  const character = createPlayerCharacter();
  assert.ok(character.group, "Character must have a Three.js group");

  // Check named pivots for animation
  const headGroup = character.group.getObjectByName("headGroup");
  const leftArm = character.group.getObjectByName("leftArmPivot");
  const rightArm = character.group.getObjectByName("rightArmPivot");
  const leftLeg = character.group.getObjectByName("leftLegPivot");
  const rightLeg = character.group.getObjectByName("rightLegPivot");
  const leftKnee = character.group.getObjectByName("leftKneePivot");
  const rightKnee = character.group.getObjectByName("rightKneePivot");

  assert.ok(headGroup, "Must have headGroup named for expression/tilt animations");
  assert.ok(leftArm, "Must have leftArmPivot named for arm swing animations");
  assert.ok(rightArm, "Must have rightArmPivot named for greeting/waving animations");
  assert.ok(leftLeg, "Must have leftLegPivot named for locomotion");
  assert.ok(rightLeg, "Must have rightLegPivot named for locomotion");
  assert.ok(leftKnee, "Must have leftKneePivot named for knee flex");
  assert.ok(rightKnee, "Must have rightKneePivot named for knee flex");

  // Verify scale matches the prominent 3D presence (~2.4x)
  assert.ok(character.group.scale.x >= 2.3 && character.group.scale.x <= 2.6);

  character.dispose();
});

test("TDD [Character Animation Modes]: Character responds to walk and idle updates seamlessly", () => {
  const character = createPlayerCharacter();

  // Walk update
  const walkState = createPlayerState({
    position: { x: 0, y: 0, z: 0 },
    rotation: 0.5,
    isMoving: true,
    speed: 14.11,
  });
  character.update(walkState, 0.016);
  assert.equal(character.group.rotation.y, 0.5, "Rotation must update to state");

  // Idle update
  const idleState = createPlayerState({
    position: { x: 0, y: 0, z: 0 },
    rotation: 0,
    isMoving: false,
    speed: 0,
  });
  character.update(idleState, 0.016);
  assert.equal(character.group.rotation.y, 0, "Rotation must update to idle state");

  character.dispose();
});

test("TDD [Character Avatar Assets]: Avatar image file exists in public directory for role badges", () => {
  const avatarPath = path.join(process.cwd(), "public/character/avatar.png");
  assert.ok(fs.existsSync(avatarPath), "public/character/avatar.png must exist");
  const stats = fs.statSync(avatarPath);
  assert.ok(stats.size > 1000, "Avatar image must be non-empty valid file");
});

test("TDD [Character Showcase Component]: Component exists and is integrated into Onboarding page", () => {
  const showcasePath = path.join(
    process.cwd(),
    "src/components/character/CharacterShowcase.tsx"
  );
  assert.ok(fs.existsSync(showcasePath), "CharacterShowcase.tsx component must exist");
  const showcaseContent = fs.readFileSync(showcasePath, "utf-8");

  // Verify key features in component
  assert.ok(
    showcaseContent.includes("createPlayerCharacter"),
    "Showcase must use createPlayerCharacter for authentic 3D model"
  );
  assert.ok(
    showcaseContent.includes("COUNTRY_GREETINGS"),
    "Showcase must include localized country greetings"
  );
  assert.ok(
    showcaseContent.includes("animMode"),
    "Showcase must support animation modes (idle/walk/wave)"
  );

  // Verify integration in page.tsx
  const pagePath = path.join(process.cwd(), "src/app/page.tsx");
  const pageContent = fs.readFileSync(pagePath, "utf-8");

  assert.ok(
    pageContent.includes("CharacterShowcase"),
    "Onboarding page must import and render CharacterShowcase"
  );
  assert.ok(
    pageContent.includes("mode=\"hero\""),
    "Onboarding page must feature hero CharacterShowcase"
  );
  assert.ok(
    pageContent.includes("YOUR PLAYABLE 3D AVATAR"),
    "Role 01 card must highlight the playable 3D character"
  );
  assert.ok(
    pageContent.includes("Operative Deployed"),
    "Completion screen must show Operative Deployed card"
  );
});
