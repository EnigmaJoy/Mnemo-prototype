// MediaRecorder wrapper. Single-instance lifecycle: start → stop → cleanup.
// Cancel discards both the in-flight recording and the mic stream.

export class AudioRecorder {
  private mr: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private stream: MediaStream | null = null;

  async start(): Promise<void> {
    this.cleanup();
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.mr = new MediaRecorder(this.stream);
    this.chunks = [];
    this.mr.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) this.chunks.push(e.data);
    };
    this.mr.start();
  }

  stop(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const mr = this.mr;
      if (!mr) {
        reject(new Error('Recorder not started'));
        return;
      }
      mr.onstop = () => {
        const type = mr.mimeType || 'audio/webm';
        const blob = new Blob(this.chunks, { type });
        this.cleanup();
        resolve(blob);
      };
      try {
        mr.stop();
      } catch (err) {
        this.cleanup();
        reject(err);
      }
    });
  }

  cancel(): void {
    if (this.mr && this.mr.state !== 'inactive') {
      this.mr.onstop = null;
      try {
        this.mr.stop();
      } catch {
        // ignore - cleanup() releases the stream regardless
      }
    }
    this.cleanup();
  }

  isRecording(): boolean {
    return this.mr !== null && this.mr.state === 'recording';
  }

  getStream(): MediaStream | null {
    return this.stream;
  }

  private cleanup(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
    }
    this.stream = null;
    this.mr = null;
    this.chunks = [];
  }
}

export function isAudioRecordingSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    typeof navigator.mediaDevices?.getUserMedia === 'function' &&
    typeof window.MediaRecorder !== 'undefined'
  );
}
