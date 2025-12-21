
class SoundManager {
  private ctx: AudioContext | null = null;
  private engineOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private bgmInterval: any = null;
  private sirenOsc: OscillatorNode | null = null;
  private sirenGain: GainNode | null = null;

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
    this.engineOsc.frequency.setValueAtTime(45, context.currentTime);
    
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(250, context.currentTime);

    this.engineOsc.connect(filter);
    filter.connect(this.engineGain);
    this.engineGain.connect(context.destination);
    
    this.engineGain.gain.setValueAtTime(0, context.currentTime);
    this.engineOsc.start();
  }

  setEngineSpeed(speed: number, active: boolean) {
    const context = this.ctx;
    if (!context || !this.engineOsc || !this.engineGain) return;
    
    const targetFreq = 50 + (speed * 35);
    const targetGain = active ? 0.45 : 0;
    
    this.engineOsc.frequency.setTargetAtTime(targetFreq, context.currentTime, 0.1);
    this.engineGain.gain.setTargetAtTime(targetGain, context.currentTime, 0.15);
  }

  playStar() {
    const context = this.ctx;
    if (!context) return;
    
    const osc = context.createOscillator();
    const gain = context.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, context.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, context.currentTime + 0.2);
    
    gain.gain.setValueAtTime(0.001, context.currentTime);
    gain.gain.linearRampToValueAtTime(0.5, context.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.3);
    
    osc.connect(gain);
    gain.connect(context.destination);
    osc.start();
    osc.stop(context.currentTime + 0.35);
  }

  playNearMiss() {
    const context = this.ctx;
    if (!context) return;
    
    const osc = context.createOscillator();
    const gain = context.createGain();
    
    osc.type = 'sine';
    // High-pitched "shing" whistle
    osc.frequency.setValueAtTime(1200, context.currentTime);
    osc.frequency.exponentialRampToValueAtTime(2400, context.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0.001, context.currentTime);
    gain.gain.linearRampToValueAtTime(0.3, context.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.15);
    
    osc.connect(gain);
    gain.connect(context.destination);
    osc.start();
    osc.stop(context.currentTime + 0.2);
  }

  playSkid() {
    const context = this.ctx;
    if (!context) return;

    const duration = 0.8;
    const now = context.currentTime;

    // --- LAYER 1: The Screeching Tone ---
    const screech = context.createOscillator();
    const screechGain = context.createGain();
    screech.type = 'square';
    
    // Start high and drop slightly as the car loses speed/energy
    screech.frequency.setValueAtTime(1000, now);
    screech.frequency.exponentialRampToValueAtTime(800, now + duration);

    // Apply a bandpass filter to get that "rubbery" friction resonance
    const filter = context.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.Q.setValueAtTime(2, now);

    screechGain.gain.setValueAtTime(0, now);
    screechGain.gain.linearRampToValueAtTime(0.15, now + 0.05);
    screechGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    // --- LAYER 2: The Friction Noise ---
    const bufferSize = context.sampleRate * duration;
    const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noise = context.createBufferSource();
    noise.buffer = buffer;
    
    const noiseFilter = context.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.setValueAtTime(1500, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(600, now + duration);

    const noiseGain = context.createGain();
    noiseGain.gain.setValueAtTime(0.2, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    // Connect Layers
    screech.connect(filter);
    filter.connect(screechGain);
    screechGain.connect(context.destination);
    
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(context.destination);

    screech.start();
    screech.stop(now + duration);
    noise.start();
  }

  playPoliceNotification() {
    const context = this.ctx;
    if (!context) return;

    [660, 880].forEach((freq, i) => {
      const startTime = context.currentTime + (i * 0.15);
      const osc = context.createOscillator();
      const gain = context.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, startTime);
      
      gain.gain.setValueAtTime(0.1, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.1);
      
      osc.connect(gain);
      gain.connect(context.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.15);
    });
  }

  setSirenActive(active: boolean) {
    const context = this.ctx;
    if (!context) return;

    if (active && !this.sirenOsc) {
      this.sirenOsc = context.createOscillator();
      this.sirenGain = context.createGain();
      this.sirenOsc.type = 'triangle';
      
      const now = context.currentTime;
      this.sirenOsc.frequency.setValueAtTime(440, now);
      
      this.sirenGain.gain.setValueAtTime(0, now);
      this.sirenGain.gain.linearRampToValueAtTime(0.1, now + 0.5);

      this.sirenOsc.connect(this.sirenGain);
      this.sirenGain.connect(context.destination);
      this.sirenOsc.start();

      const lfo = () => {
        if (!this.sirenOsc || !this.ctx) return;
        const time = this.ctx.currentTime;
        const freq = 440 + Math.sin(time * 6) * 150;
        this.sirenOsc.frequency.setTargetAtTime(freq, time, 0.05);
        requestAnimationFrame(lfo);
      };
      lfo();
    } else if (!active && this.sirenOsc) {
      const stopTime = context.currentTime + 0.5;
      this.sirenGain?.gain.exponentialRampToValueAtTime(0.001, stopTime);
      this.sirenOsc.stop(stopTime);
      this.sirenOsc = null;
      this.sirenGain = null;
    }
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
    gain.gain.setValueAtTime(0.001, context.currentTime);
    gain.gain.linearRampToValueAtTime(0.8, context.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.3);

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
      const startTime = context.currentTime + i * duration;
      const osc = context.createOscillator();
      const gain = context.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(f, startTime);
      
      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(0.4, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      
      osc.connect(gain);
      gain.connect(context.destination);
      osc.start(startTime);
      osc.stop(startTime + duration + 0.05);
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
      
      g.gain.setValueAtTime(0.001, this.ctx.currentTime);
      g.gain.linearRampToValueAtTime(0.12, this.ctx.currentTime + 0.05);
      g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);
      
      osc.connect(g);
      g.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.45);
    };

    this.bgmInterval = setInterval(loop, 400 - (level * 20));
  }

  stopBGM() {
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
    this.setSirenActive(false);
  }
}

export const soundManager = new SoundManager();
