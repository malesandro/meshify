export class HolisticManager {
  constructor() {
    this._faceLandmarks = null;
    this._leftHandLandmarks = null;
    this._rightHandLandmarks = null;
    this._holistic = null;
    this._camera = null;
  }

  async init(videoElement, onStatus) {
    if (onStatus) onStatus('Loading Holistic model...');

    // MediaPipe globals loaded via CDN script tags
    this._holistic = new window.Holistic({
      locateFile: (f) => `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${f}`,
    });

    this._holistic.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      smoothSegmentation: false,
      refineFaceLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    this._holistic.onResults((results) => {
      this._faceLandmarks = results.faceLandmarks || null;
      this._leftHandLandmarks = results.leftHandLandmarks || null;
      this._rightHandLandmarks = results.rightHandLandmarks || null;
    });

    if (onStatus) onStatus('Starting camera...');

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 1280, height: 720, facingMode: 'user' },
    });
    videoElement.srcObject = stream;
    await videoElement.play();

    this._camera = new window.Camera(videoElement, {
      onFrame: async () => {
        await this._holistic.send({ image: videoElement });
      },
      width: 1280,
      height: 720,
    });
    await this._camera.start();
  }

  get faceLandmarks() {
    return this._faceLandmarks;
  }

  get leftHandLandmarks() {
    return this._leftHandLandmarks;
  }

  get rightHandLandmarks() {
    return this._rightHandLandmarks;
  }

  destroy() {
    if (this._camera) {
      this._camera.stop();
      this._camera = null;
    }
    if (this._holistic) {
      this._holistic.close();
      this._holistic = null;
    }
  }
}
