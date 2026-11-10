# Vox — AI Voice Chatbot

A voice-first AI chatbot built with React, TypeScript and Vite. Speech-to-text uses the browser Web Speech API, responses use Google Gemini, and text-to-speech uses the browser Speech Synthesis API.

## Features
- Speech recognition with live listening state
- Text-to-speech playback with pause and stop
- Gemini-powered conversational responses
- Responsive dark interface
- Bring your own Gemini API key; it stays in this browser local storage and is sent directly to Google

## Run locally
```bash
npm install
npm run dev
```
Open the URL printed by Vite and add a key using the key icon. Get one at https://aistudio.google.com/app/apikey.

## Browser support
Speech recognition requires a browser implementing SpeechRecognition or webkitSpeechRecognition (commonly Chrome/Edge). Microphone access requires HTTPS or localhost. Speech synthesis is supported by most modern browsers.

## Deployment
Import this repository into Vercel. No server environment variable is required; users supply their own Gemini key in the app.

Security note: this BYOK browser architecture is suitable for a personal/demo app. For a multi-user product, use an authenticated server endpoint with rate limits and server-side secrets.