# Speech-to-Text Implementation

This is a simplified implementation of speech-to-text using Deepgram's API. The implementation includes processing time measurement to help understand the latency of the transcription service.

## Setup

1. Install dependencies:
```bash
npm install
```

2. If you're on macOS, install required audio tools using Homebrew:
```bash
brew install sox
```

3. Create a `.env` file:
```bash
cp .env.example .env
```

4. Get a Deepgram API key from [Deepgram's Console](https://console.deepgram.com/) and add it to your `.env` file:
```
DEEPGRAM_API_KEY="your-api-key-here"
```

## Usage

Run the application with:
```bash
npm start
```

You should see output in the console as you speak into your microphone:
- Interim results (while speaking): Displayed in cyan as "Listening: [text]"
- Final results (after a pause): Displayed in green as "FINAL: [text]"
- Processing time: Shows how long it took to process the transcription

Press Ctrl+C to stop the application.

## Microphone Testing

If you're having issues with the transcription, you can test your microphone to ensure it's properly configured:

```bash
node mic-test.js
```

This will:
1. Record audio from your microphone for 5 seconds
2. Save the raw audio data to `mic-test.raw`
3. Display how many chunks of audio data were received

A successful test should show multiple chunks of audio data being received. If you see "0 chunks" or errors, there may be an issue with your microphone or permissions.

Note: The `mic-test.raw` file is temporary and can be safely deleted after testing.

## Implementation Details

The implementation provides a `SpeechToText` class that handles the connection to Deepgram and processes audio data. Here's how to use it:

```javascript
const stt = new SpeechToText();
stt.start();

// To stop the connection:
stt.stop();
```

## Features

- Live transcription of audio input
- Processing time measurement for each transcription
- Color-coded console output for better visibility
- Error handling and connection management

## Processing Time Measurement

The implementation measures the time between receiving audio data and getting the transcription result. This is displayed in milliseconds in the console output.

## Notes for Interns

Your task is to:
1. Set up voice isolation for the audio input
2. Test the implementation with different audio sources
3. Analyze the processing times and suggest optimizations

The current implementation uses Deepgram's `nova-2` model with the following settings:
- Encoding: mulaw
- Sample rate: 8000 Hz
- Channels: 1
- Smart formatting: enabled
- Interim results: enabled
- Endpointing: 200ms
- Utterance end: 1000ms

## Troubleshooting

If you're not seeing any transcription output:

1. Check that your microphone is properly connected and has permission to be accessed
2. Run the microphone test (`node mic-test.js`) to verify audio is being captured
3. Check your Deepgram API key is correctly set in the `.env` file
4. Ensure you're speaking loud enough for your microphone to pick up
5. Try adjusting the microphone settings in the `constructor()` method of the `SpeechToText` class
6. Cyan-colored "ULTRA-LOW" prefix


New Implementations:

//indexafter.js
Microphone Settings:
- Sample rate: 11kHz
- Channels: 1 (Mono)
- Encoding: mu-law

Deepgram Settings:
- Model: Nova-3 (newer)
- Sample rate: 11kHz
- Smart format: enabled
- Punctuation: enabled
- Endpointing: 150ms
- Utterance end: 1500ms
- Interim results: enabled

Features:
- Enhanced processing time tracking
- Average time calculation
- Excludes 0ms processing times
- Blue-colored average time display 


//indexhighsamp.js
Microphone Settings:
- Sample rate: 11kHz
- Channels: 1 (Mono)
- Encoding: mu-law

Deepgram Settings:
- Model: Nova-3
- Sample rate: 11kHz
- Smart format: disabled (for speed)
- Punctuation: disabled (for speed)
- Endpointing: 150ms
- Utterance end: 1000ms
- Interim results: enabled

Features:
- Enhanced processing time tracking
- Average time calculation
- Optimized for lowest latency
- Cyan-colored "ULTRA-LOW" prefix
