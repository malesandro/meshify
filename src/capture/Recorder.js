export class Recorder {
  constructor(canvas) {
    this._canvas = canvas;
    this._recorder = null;
    this._chunks = [];
    this._recording = false;
  }

  start(fps = 30) {
    const stream = this._canvas.captureStream(fps);
    this._recorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9',
      videoBitsPerSecond: 5_000_000,
    });
    this._chunks = [];
    this._recorder.ondataavailable = (e) => {
      if (e.data.size > 0) this._chunks.push(e.data);
    };
    this._recorder.onstop = () => {
      const blob = new Blob(this._chunks, { type: 'video/webm' });
      const a = document.createElement('a');
      a.download = `meshify_${Date.now()}.webm`;
      a.href = URL.createObjectURL(blob);
      a.click();
    };
    this._recorder.start();
    this._recording = true;
  }

  stop() {
    if (this._recorder && this._recording) {
      this._recorder.stop();
      this._recording = false;
    }
  }

  get isRecording() {
    return this._recording;
  }
}
