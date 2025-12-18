
class SoundManager {
  private ctx: AudioContext | null = null;
  private engineOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private bgmInterval: any = null;

  async init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }
      return;
    }
    const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
    this.ctx = new AudioCtx();
    this.setupEngine();
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  private setupEngine() {
    if (!this.ctx) return;
    this.engineOsc = this.ctx.createOscillator();
    this.engineGain = this.ctx.createGain();
    
    this.engineOsc.type = 'sawtooth';
    this.engineOsc.frequency.setValueAtTime(40, this.ctx.currentTime);
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200, this.ctx.currentTime);

    this.engineOsc.connect(filter);
    filter.connect(this.engineGain);
    this.engineGain.connect(this.ctx.destination);
    
    this.engineGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.engineOsc.start();
  }

  setEngineSpeed(speed: number, active: boolean) {
    if (!this.ctx || !this.engineOsc || !this.engineGain) return;
    const targetFreq = 40 + (speed * 15);
    const targetGain = active ? 0.05 : 0;
    
    this.engineOsc.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.1);
    this.engineGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.2);
  }

  playStar() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.2);
    
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }

  playCrash() {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 0.3;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start();
  }

  playLevelClear() {
    this.playMelody([440, 554, 659, 880], 0.1);
  }

  playGameOver() {
    this.playMelody([330, 293, 261, 246], 0.2, 'sawtooth');
  }

  playWin() {
    this.playMelody([523, 659, 783, 1046, 1318], 0.15, 'square');
  }

  private playMelody(freqs: number[], duration: number, type: OscillatorType = 'triangle') {
    if (!this.ctx) return;
    freqs.forEach((f, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(f, this.ctx!.currentTime + i * duration);
      gain.gain.setValueAtTime(0.1, this.ctx!.currentTime + i * duration);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx!.currentTime + (i + 1) * duration);
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(this.ctx!.currentTime + i * duration);
      osc.stop(this.ctx!.currentTime + (i + 1) * duration);
    });
  }

  startBGM(level: number) {
    if (!this.ctx) return;
    this.stopBGM();
    
    const loop = () => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(60 + (level * 10), this.ctx.currentTime);
      g.gain.setValueAtTime(0.04, this.ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);
      osc.connect(g);
      g.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.5);
    };

    this.bgmInterval = setInterval(loop, 400 - (level * 20));
  }

  stopBGM() {
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }
}

export const soundManager = new SoundManager();
