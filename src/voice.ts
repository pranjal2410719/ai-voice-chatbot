type Progress = (message: string) => void;
type Device = "webgpu" | "wasm";
let asrPromise: Promise<any> | null = null;
let ttsPromise: Promise<any> | null = null;
let activeDevice: Device | null = null;

function preferredDevice(): Device {
  return typeof navigator !== "undefined" && "gpu" in navigator ? "webgpu" : "wasm";
}

function reportProgress(label: string, p: any, onProgress: Progress) {
  if (p?.status === "progress" && p.file) {
    const percent = typeof p.progress === "number" ? ` · ${Math.round(p.progress)}%` : "";
    onProgress(`${label}: ${p.file}${percent}`);
  } else if (p?.status === "ready") onProgress(`${label} initialized`);
  else if (p?.status === "initiate") onProgress(`Starting ${label} download…`);
}

async function loadWhisper(device: Device, onProgress: Progress) {
  if (!asrPromise) {
    asrPromise = (async () => {
      const { pipeline } = await import("@huggingface/transformers");
      return pipeline("automatic-speech-recognition", "onnx-community/whisper-small", {
        device, dtype: "q8",
        progress_callback: (p: any) => reportProgress("Whisper", p, onProgress),
      } as any);
    })().catch((error) => { asrPromise = null; throw error; });
  }
  return asrPromise;
}

async function loadKokoro(device: Device, onProgress: Progress) {
  if (!ttsPromise) {
    ttsPromise = (async () => {
      const { KokoroTTS } = await import("kokoro-js");
      return KokoroTTS.from_pretrained("onnx-community/Kokoro-82M-v1.0-ONNX", {
        dtype: device === "webgpu" ? "fp32" : "q8", device,
        progress_callback: (p: any) => reportProgress("Kokoro", p, onProgress),
      } as any);
    })().catch((error) => { ttsPromise = null; throw error; });
  }
  return ttsPromise;
}

/** Download and initialize both models before the chat UI is made available. */
export async function initializeVoiceModels(onProgress: Progress = () => {}) {
  if (asrPromise && ttsPromise && activeDevice) {
    await Promise.all([asrPromise, ttsPromise]);
    onProgress("Whisper and Kokoro are ready");
    return;
  }

  const firstDevice = activeDevice || preferredDevice();
  try {
    onProgress("Preparing Whisper speech recognition…");
    await loadWhisper(firstDevice, onProgress);
    onProgress("Preparing Kokoro natural voice…");
    await loadKokoro(firstDevice, onProgress);
    activeDevice = firstDevice;
    onProgress("Whisper and Kokoro are ready");
  } catch (firstError) {
    if (firstDevice !== "webgpu") {
      asrPromise = null; ttsPromise = null; activeDevice = null;
      throw firstError;
    }
    // Some browsers expose WebGPU but cannot allocate enough model memory.
    onProgress("Switching to compatibility mode (WASM)…");
    asrPromise = null; ttsPromise = null; activeDevice = null;
    try {
      await loadWhisper("wasm", onProgress);
      await loadKokoro("wasm", onProgress);
      activeDevice = "wasm";
      onProgress("Whisper and Kokoro are ready");
    } catch (fallbackError) {
      asrPromise = null; ttsPromise = null; activeDevice = null;
      throw fallbackError;
    }
  }
}

export async function transcribeRecording(blob: Blob, onProgress: Progress = () => {}) {
  const transcriber = await loadWhisper(activeDevice || preferredDevice(), onProgress);
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  const context = new AudioContextClass();
  try {
    const decoded = await context.decodeAudioData(await blob.arrayBuffer());
    const source = decoded.getChannelData(0);
    const targetRate = 16000;
    const ratio = decoded.sampleRate / targetRate;
    const length = Math.floor(source.length / ratio);
    const samples = new Float32Array(length);
    for (let i = 0; i < length; i++) {
      const position = i * ratio;
      const left = Math.floor(position);
      const right = Math.min(left + 1, source.length - 1);
      const mix = position - left;
      samples[i] = source[left] * (1 - mix) + source[right] * mix;
    }
    onProgress("Transcribing your voice");
    const result = await transcriber(samples, { task: "transcribe" });
    return String(result?.text || "").trim();
  } finally {
    await context.close();
  }
}

export async function synthesizeSpeech(text: string, voice: string, onProgress: Progress = () => {}) {
  const tts = await loadKokoro(activeDevice || preferredDevice(), onProgress);
  onProgress("Generating natural speech");
  return tts.generate(text, { voice });
}
