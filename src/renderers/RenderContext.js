/**
 * @typedef {Object} AudioState
 * @property {number} bass
 * @property {number} mid
 * @property {number} high
 * @property {number} vol
 * @property {number} energy
 * @property {boolean} beat
 */

/**
 * @typedef {Object} DeformState
 * @property {number} expand
 * @property {number} wobble
 * @property {number} jitter
 * @property {number} pulse
 * @property {number} handSplay
 * @property {number} handWave
 */

/**
 * @typedef {Object} RenderContext
 * @property {CanvasRenderingContext2D} ctx
 * @property {Array<{x:number,y:number,z:number}>} facePts
 * @property {Array<{x:number,y:number,z:number}>|null} leftHandPts
 * @property {Array<{x:number,y:number,z:number}>|null} rightHandPts
 * @property {AudioState} audio
 * @property {DeformState} deform
 * @property {Object} config
 * @property {Object} contours
 * @property {Object} handTopology
 * @property {HTMLCanvasElement} canvas
 * @property {number} time
 * @property {number} W
 * @property {number} H
 */
