# Vox — AI Voice Chatbot

A voice-first AI chatbot built with React, TypeScript and Vite. Gemini handles conversation; open-weight speech models run locally in the browser.

## Voice stack

- Speech-to-text: Whisper Small (onnx-community/whisper-small) through Transformers.js and ONNX Runtime. Multilingual transcription with automatic language detection.
- Text-to-speech: Kokoro-82M (onnx-community/Kokoro-82M-v1.0-ONNX) through kokoro-js. Natural neural English voices.
- Inference: WebGPU when available, WASM otherwise.
- Privacy: microphone audio is processed in the browser. Only the resulting transcript is sent to Gemini.
- Caching: model files download from Hugging Face on first use and are cached by the browser.

Whisper and Kokoro model weights are free to download. Kokoro-82M is Apache-2.0 licensed. Check the upstream Whisper model card and each dependency for its individual terms.

## Run locally

1. Run npm install.
2. Run npm run dev.
3. Open the Vite URL, allow microphone access, and add your Gemini API key using the key icon.
4. Get a Gemini key at https://aistudio.google.com/app/apikey.

## First-use expectations

The first voice interaction downloads model files (hundreds of MB combined). Keep the tab open until the models are ready. Later sessions should reuse the browser cache. Performance depends on the device and browser. The Kokoro voices in this build are English voices.

## Browser support

Use a modern Chromium browser (Chrome or Edge) with microphone permission. Microphone access requires HTTPS or localhost. WebGPU-capable devices are generally faster; WASM is used when WebGPU is unavailable.

## Deployment

Deploy the repository to Vercel. No speech API key or speech server is needed. Users provide their own Gemini API key in the app.

## Upstream projects

- Transformers.js: https://github.com/huggingface/transformers.js
- Whisper Small ONNX: https://huggingface.co/onnx-community/whisper-small
- Kokoro JavaScript: https://github.com/hexgrad/kokoro
- Kokoro-82M ONNX: https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX
