export interface AvatarKinematics {
  leftLegRotX: number;
  rightLegRotX: number;
  leftArmRotX: number;
  rightArmRotX: number;
  bounceY: number;
}

/**
 * Computes procedural sinusoidal limb rotations and vertical bounce
 * for the player avatar during walking and idle states.
 */
export function computeAvatarKinematics(
  isWalking: boolean,
  time: number,
  speed: number = 4.0
): AvatarKinematics {
  if (!isWalking || speed <= 0.01) {
    return {
      leftLegRotX: 0,
      rightLegRotX: 0,
      leftArmRotX: 0,
      rightArmRotX: 0,
      bounceY: 0,
    };
  }

  // Cadence frequency in rad/s
  const freq = 10.0;
  const legSwing = Math.sin(time * freq) * 0.55;

  return {
    leftLegRotX: legSwing,
    rightLegRotX: -legSwing,
    // Arms naturally swing in opposition to legs (left arm swings with right leg)
    leftArmRotX: -legSwing * 0.75,
    rightArmRotX: legSwing * 0.75,
    // Subtle bounce at twice the frequency (each step lifts the torso)
    bounceY: Math.abs(Math.sin(time * freq)) * 0.06,
  };
}

/**
 * Computes procedural kinematics for city pedestrians with human-scale
 * walking speed (1.2 - 1.5 m/s), authentic step cadence, and arm swing opposition.
 */
export function computePedestrianKinematics(
  isWalking: boolean,
  time: number,
  speed: number = 1.35
): AvatarKinematics {
  if (!isWalking || speed <= 0.01) {
    return {
      leftLegRotX: 0,
      rightLegRotX: 0,
      leftArmRotX: 0,
      rightArmRotX: 0,
      bounceY: 0,
    };
  }

  // Human walking cadence frequency in rad/s (approx 1.8 - 2.0 steps/sec)
  const freq = 7.5 * Math.max(0.7, speed / 1.35);
  const legSwing = Math.sin(time * freq) * 0.48;

  return {
    leftLegRotX: legSwing,
    rightLegRotX: -legSwing,
    leftArmRotX: -legSwing * 0.65,
    rightArmRotX: legSwing * 0.65,
    bounceY: Math.abs(Math.sin(time * freq)) * 0.035,
  };
}
