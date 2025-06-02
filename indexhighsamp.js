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
        
        // Processing time tracking
        this.processingTimes = []; // Array to store all processing times
        this.totalProcessingTime = 0; // Sum of all processing times
        this.utteranceCount = 0; // Count of completed utterances
        
        // Configure microphone settings for ultra-low latency
        this.mic = new Microphone({
            rate: 11000, // Match sample rate with indexafter.js
            channels: 1, // Mono audio
            encoding: 'mu-law', // Keep mu-law encoding
            device: 'default', // Use default microphone
            exitOnSilence: 6 // Stop recording after 6 seconds of silence
        });
        this.micStream = null; // Will store the microphone stream
    }

    /**
     * Calculate and format the average processing time
     * @returns {string} Formatted average processing time
     */
    getAverageProcessingTime() {
        if (this.utteranceCount === 0) return '0ms';
        const average = this.totalProcessingTime / this.utteranceCount;
        return `${average.toFixed(2)}ms`;
    }

    /**
     * Update processing time statistics
     * @param {number} processingTime - The processing time to add
     */
    updateProcessingStats(processingTime) {
        // Only count valid processing times
        if (processingTime > 0) {
            this.processingTimes.push(processingTime);
            this.totalProcessingTime += processingTime;
            this.utteranceCount++;
        }
    }

    /**
     * Starts the speech-to-text process optimized for ultra-low latency
     */
    async start() {
        try {
            // Initialize Deepgram live transcription with ultra-low latency settings
            this.connection = this.deepgram.listen.live({
                encoding: 'mulaw',
                sample_rate: 11000,
                channels: 1,
                model: 'nova-3',
                smart_format: false, // Disable smart formatting for speed
                punctuate: false, // Disable punctuation for speed
                interim_results: true,
                endpointing: 150,
                utterance_end_ms: 1000
            });

            // Handle successful connection to Deepgram
            this.connection.on(LiveTranscriptionEvents.Open, () => {
                console.log('Connection to Deepgram established'.green);
                console.log('Starting microphone (Ultra-Low Latency Mode: 11kHz with Nova-3)...'.yellow);
                
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
                        // Only update stats if processing time is greater than 0
                        if (processingTime > 0) {
                            this.updateProcessingStats(processingTime);
                        }
                        
                        // Display final results with processing times
                        process.stdout.write('\r');
                        console.log(`${colors.cyan('ULTRA-LOW: ')}${text}`);
                        if (processingTime > 0) {
                            console.log(`${colors.yellow('Processing Time: ')}${processingTime}ms`);
                            console.log(`${colors.blue('Average Processing Time: ')}${this.getAverageProcessingTime()}`);
                        }
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
                if (this.utteranceCount > 0) {
                    console.log(`${colors.magenta('Final Average Processing Time: ')}${this.getAverageProcessingTime()}`);
                }
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
        // Display final statistics
        if (this.utteranceCount > 0) {
            console.log(`${colors.magenta('Final Average Processing Time: ')}${this.getAverageProcessingTime()}`);
        }
    }
}

// Create and start a new instance of SpeechToText
const stt = new SpeechToText();
stt.start();

// Handle graceful shutdown on Ctrl+C
process.on('SIGINT', () => {
    console.log('\nStopping transcription...');
    stt.stop();
    process.exit();
}); 