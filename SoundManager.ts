
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
    if (!AudioCtx) return;
    
    const context = new AudioCtx() as AudioContext;
    this.ctx = context;
    
    this.setupEngine();
    
    if (context.state === 'suspended') {
      await context.resume();
    }
  }

  private setupEngine() {
    const context = this.ctx;
    if (!context) return;

    this.engineOsc = context.createOscillator();
    this.engineGain = context.createGain();
    
    this.engineOsc.type = 'sawtooth';
    this.engineOsc.frequency.setValueAtTime(40, context.currentTime);
    
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200, context.currentTime);

    this.engineOsc.connect(filter);
    filter.connect(this.engineGain);
    this.engineGain.connect(context.destination);
    
    this.engineGain.gain.setValueAtTime(0, context.currentTime);
    this.engineOsc.start();
  }

  setEngineSpeed(speed: number, active: boolean) {
    const context = this.ctx;
    if (!context || !this.engineOsc || !this.engineGain) return;
    
    const targetFreq = 40 + (speed * 15);
    // Increased engine gain from 0.05 to 0.12
    const targetGain = active ? 0.12 : 0;
    
    this.engineOsc.frequency.setTargetAtTime(targetFreq, context.currentTime, 0.1);
    this.engineGain.gain.setTargetAtTime(targetGain, context.currentTime, 0.2);
  }

  playStar() {
    const context = this.ctx;
    if (!context) return;
    
    const osc = context.createOscillator();
    const gain = context.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, context.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, context.currentTime + 0.2);
    
    // Increased gain from 0.2 to 0.45
    gain.gain.setValueAtTime(0.45, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.3);
    
    osc.connect(gain);
    gain.connect(context.destination);
    osc.start();
    osc.stop(context.currentTime + 0.3);
  }

  playCrash() {
    const context = this.ctx;
    if (!context) return;
    
    const bufferSize = context.sampleRate * 0.3;
    const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noise = context.createBufferSource();
    noise.buffer = buffer;
    
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, context.currentTime);

    const gain = context.createGain();
    // Increased gain from 0.3 to 0.6
    gain.gain.setValueAtTime(0.6, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.3);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(context.destination);
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
    const context = this.ctx;
    if (!context) return;
    
    freqs.forEach((f, i) => {
      const osc = context.createOscillator();
      const gain = context.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(f, context.currentTime + i * duration);
      // Increased gain from 0.1 to 0.25
      gain.gain.setValueAtTime(0.25, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + (i + 1) * duration);
      osc.connect(gain);
      gain.connect(context.destination);
      osc.start(context.currentTime + i * duration);
      osc.stop(context.currentTime + (i + 1) * duration);
    });
  }

  startBGM(level: number) {
    const context = this.ctx;
    if (!context) return;
    this.stopBGM();
    
    const loop = () => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(60 + (level * 10), this.ctx.currentTime);
      // Increased bgm loop gain from 0.04 to 0.08
      g.gain.setValueAtTime(0.08, this.ctx.currentTime);
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
