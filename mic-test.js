const Microphone = require('node-microphone');
const fs = require('fs');

console.log('Starting microphone test...');

// Create a microphone instance
const mic = new Microphone();

// Create a write stream to save audio to a file
const outputFile = fs.createWriteStream('mic-test.raw');

console.log('Starting recording...');
const micStream = mic.startRecording();

// Set up data events
let dataCount = 0;
micStream.on('data', (data) => {
    dataCount++;
    if (dataCount % 10 === 0) {
        console.log(`Received ${dataCount} chunks of audio data`);
    }
    outputFile.write(data);
});

// Set up error events
micStream.on('error', (error) => {
    console.error('Microphone Error:', error);
});

// Record for 5 seconds then stop
console.log('Recording for 5 seconds...');
setTimeout(() => {
    console.log(`Test complete. Received ${dataCount} chunks of audio data`);
    mic.stopRecording();
    outputFile.end();
    console.log('Microphone test complete. Check mic-test.raw for recorded audio.');
}, 5000); 