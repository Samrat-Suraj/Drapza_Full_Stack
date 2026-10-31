// Web Audio API Synthesizer for subtle tactical UI feedback
class AudioSystem {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  constructor() {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("drapza_audio_enabled");
        if (saved !== null) {
          this.enabled = saved === "true";
        }
      } catch (e) {}
    }
  }

  private init() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
  }

  public toggle(): boolean {
    this.init();
    this.enabled = !this.enabled;
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("drapza_audio_enabled", String(this.enabled));
        window.dispatchEvent(new CustomEvent("drapza:audio-toggle", { detail: { enabled: this.enabled } }));
      }
    } catch (e) {}

    if (this.enabled && this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    if (this.enabled) {
      this.playClick(1000, 0.04);
    }
    return this.enabled;
  }

  public setEnabled(val: boolean) {
    this.enabled = val;
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("drapza_audio_enabled", String(this.enabled));
        window.dispatchEvent(new CustomEvent("drapza:audio-toggle", { detail: { enabled: this.enabled } }));
      }
    } catch (e) {}
  }

  public playClick(freq = 800, duration = 0.03) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      if (this.ctx.state === "suspended") {
        this.ctx.resume();
      }
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + duration);
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch {
      // Audio playback safety catch
    }
  }

  public playHover() {
    this.playClick(1200, 0.015);
  }

  public playOpen() {
    this.playClick(600, 0.05);
  }

  public playSuccess() {
    this.playClick(900, 0.04);
    setTimeout(() => this.playClick(1200, 0.06), 60);
  }

  public playError() {
    this.playClick(300, 0.08);
    setTimeout(() => this.playClick(200, 0.1), 80);
  }
}

export const audioSystem = new AudioSystem();

