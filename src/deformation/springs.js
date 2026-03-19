/**
 * Interpolate a value toward a target using spring physics.
 * @param {number} current
 * @param {number} target
 * @param {number} speed - spring constant (default 0.08)
 * @returns {number}
 */
export function springLerp(current, target, speed) {
  return current + (target - current) * speed;
}
