let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

function playPattern(ctx: AudioContext, volume: number): void {
  const toneDuration = 0.18;
  const gap = 0.12;
  const t = ctx.currentTime;

  for (let i = 0; i < 3; i++) {
    const start = t + i * (toneDuration + gap);
    const freq = i === 2 ? 1100 : 880;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(volume, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, start + toneDuration);
    oscillator.start(start);
    oscillator.stop(start + toneDuration);
  }
}

// Beeps in a repeating pattern until the returned stop function is called.
export function startBeeping(volume = 0.5): () => void {
  const ctx = getAudioContext();
  if (!ctx) return () => undefined;

  const play = () => {
    if (ctx.state === "suspended") {
      void ctx.resume().then(() => playPattern(ctx, volume));
    } else {
      playPattern(ctx, volume);
    }
  };

  play();
  const interval = setInterval(play, 2500);

  return () => clearInterval(interval);
}
