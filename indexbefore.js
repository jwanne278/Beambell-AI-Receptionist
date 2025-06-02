// Import required dependencies
require('dotenv').config(); // Load environment variables from .env file
const { createClient, LiveTranscriptionEvents } = require('@deepgram/sdk'); // Deepgram SDK for speech-to-text
const colors = require('colors'); // For colored console output
const Microphone = require('node-microphone'); // For microphone input

/**
 * SpeechToText class handles real-time speech recognition using Deepgram's API
 * This class manages the connection to Deepgram, microphone input, and transcription processing
 */
class SpeechToText {
    constructor() {
        // Initialize Deepgram client with API key from environment variables
        this.deepgram = createClient(process.env.DEEPGRAM_API_KEY);
        this.connection = null; // Will store the live transcription connection
        this.startTime = null; // Used to track processing time for each utterance
        // Configure microphone settings
        this.mic = new Microphone({
            rate: 8000, // Sample rate in Hz
            channels: 1, // Mono audio
            encoding: 'mu-law', // Audio encoding format
            device: 'default', // Use default microphone
            exitOnSilence: 6 // Stop recording after 6 seconds of silence
        });
        this.micStream = null; // Will store the microphone stream
    }

    /**
     * Starts the speech-to-text process by:
     * 1. Establishing connection with Deepgram
     * 2. Setting up microphone input
     * 3. Handling transcription events
     */
    async start() {
        try {
            // Initialize Deepgram live transcription with specific settings
            this.connection = this.deepgram.listen.live({
                encoding: 'mulaw', // Audio encoding format
                sample_rate: '8000', // Sample rate matching microphone
                channels: 1, // Mono audio
                model: 'nova-2', // Deepgram's latest speech recognition model
                smart_format: true, // Enable smart formatting of text
                interim_results: true, // Receive partial results while speaking
                endpointing: 200, // Milliseconds of silence to detect end of utterance
                utterance_end_ms: 1000 // Maximum time for an utterance
            });

            // Handle successful connection to Deepgram
            this.connection.on(LiveTranscriptionEvents.Open, () => {
                console.log('Connection to Deepgram established'.green);
                console.log('Starting microphone...'.yellow);
                
                // Start recording from microphone
                this.micStream = this.mic.startRecording();
                
                // Send microphone data to Deepgram when received
                this.micStream.on('data', (data) => {
                    if (this.connection && this.connection.getReadyState() === 1) {
                        this.connection.send(data);
                    }
                });

                // Handle microphone errors
                this.micStream.on('error', (error) => {
                    console.error('Microphone Error:'.red, error);
                });
            });

            // Handle incoming transcriptions
            this.connection.on(LiveTranscriptionEvents.Transcript, (transcription) => {
                // Start timing for this utterance if not already started
                if (!this.startTime) {
                    this.startTime = Date.now();
                }

                const alternatives = transcription.channel?.alternatives;
                if (alternatives && alternatives[0]?.transcript) {
                    const text = alternatives[0].transcript;
                    const processingTime = Date.now() - this.startTime;

                    // Display interim (in-progress) results
                    if (!transcription.is_final) {
                        process.stdout.write(`\r${colors.cyan('Listening: ')}${text}                    `);
                    } else {
                        // Display final results with processing time
                        process.stdout.write('\r');
                        console.log(`${colors.green('FINAL: ')}${text}`);
                        console.log(`${colors.yellow('Processing Time: ')}${processingTime}ms`);
                        console.log('------------------------');
                        this.startTime = null; // Reset timer for next utterance
                    }
                }
            });

            // Handle Deepgram errors
            this.connection.on(LiveTranscriptionEvents.Error, (error) => {
                console.error('Deepgram Error:'.red, error);
            });

            // Handle connection closure
            this.connection.on(LiveTranscriptionEvents.Close, () => {
                console.log('Connection to Deepgram closed'.yellow);
                this.stop();
            });

        } catch (error) {
            console.error('Error starting speech-to-text:'.red, error);
        }
    }

    /**
     * Stops the speech-to-text process by:
     * 1. Stopping microphone recording
     * 2. Closing Deepgram connection
     */
    stop() {
        if (this.micStream) {
            this.mic.stopRecording();
            this.micStream = null;
        }
        if (this.connection) {
            this.connection.finish();
        }
    }
}

// Create and start a new instance of SpeechToText
const stt = new SpeechToText();
stt.start();

// Handle graceful shutdown on Ctrl+C
process.on('SIGINT', () => {
    stt.stop();
    process.exit();
}); 