import { pipeline } from "@huggingface/transformers";
import { KokoroTTS } from "kokoro-js";

type Progress = (message: string) => void;
let asrPromise: Promise<any> | null = null;
let ttsPromise: Promise<any> | null = null;

function bestDevice(): "webgpu" | "wasm" {
  return typeof navigator !== "undefined" && "gpu" in navigator ? "webgpu" : "wasm";
}

export async function transcribeRecording(blob: Blob, onProgress: Progress = () => {}) {
  if (!asrPromise) {
    const device = bestDevice();
    asrPromise = pipeline(
      "automatic-speech-recognition",
      "onnx-community/whisper-small",
      {
        device,
        dtype: "q8",
        progress_callback: (p: any) => {
          if (p.status === "progress" && p.file) onProgress("Downloading Whisper · " + p.file);
          else if (p.status === "ready") onProgress("Whisper is ready");
          else if (p.status === "initiate") onProgress("Preparing Whisper speech recognition");
        },
      } as any,
    );
  }

  const transcriber = await asrPromise;
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
  if (!ttsPromise) {
    const device = bestDevice();
    ttsPromise = KokoroTTS.from_pretrained("onnx-community/Kokoro-82M-v1.0-ONNX", {
      dtype: device === "webgpu" ? "fp32" : "q8",
      device,
      progress_callback: (p: any) => {
        if (p.status === "progress" && p.file) onProgress("Downloading Kokoro · " + p.file);
        else if (p.status === "ready") onProgress("Kokoro voice is ready");
        else if (p.status === "initiate") onProgress("Preparing natural voice");
      },
    } as any);
  }
  const tts = await ttsPromise;
  onProgress("Generating natural speech");
  return tts.generate(text, { voice });
}
