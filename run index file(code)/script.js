const MAX_SEQ = 15; 
const NR_BUFS = 7; 
let ackExpected = 0;
let nextFrameToSend = 0;
let frameExpected = 0;
let tooFar = NR_BUFS;
let nBuffered = 0;
let arrived = Array(NR_BUFS).fill(false);
let outBuf = Array(NR_BUFS);
let inBuf = Array(NR_BUFS);
let timers = Array(NR_BUFS).fill(null);
let timeoutInterval = 3000; // Timeout duration in milliseconds

function updateStatus(message) {
    document.getElementById('status').innerText = message;
}

function sendFrame(frameNr) {
    const frame = document.createElement('div');
    frame.className = 'frame';
    frame.innerText = `F${frameNr}`;
    document.getElementById('outgoing').appendChild(frame);
    outBuf[frameNr % NR_BUFS] = frameNr; // Store in the buffer
    nBuffered++;

    // Start timer for the frame
    timers[frameNr % NR_BUFS] = setTimeout(() => {
        updateStatus(`Timeout for frame F${frameNr}`);
        console.log(`Timeout for frame F${frameNr}, resending...`);
        sendFrame(frameNr); // Resend frame on timeout
    }, timeoutInterval);

    // Simulate sending the frame
    setTimeout(() => {
        const isCorrupted = Math.random() < 0.2; // Simulate 20% chance of error
        if (isCorrupted) {
            updateStatus(`Frame F${frameNr} corrupted!`);
            console.log(`Frame F${frameNr} is corrupted, sending NAK...`);
            sendNak(frameExpected); // Send NAK for the expected frame
        } else {
            receiveFrame(frameNr); // Frame received successfully
        }
    }, Math.random() * 2000 + 1000);
}

function receiveFrame(frameNr) {
    clearTimeout(timers[frameNr % NR_BUFS]); // Stop the timer for the received frame
    const frame = document.createElement('div');
    frame.className = 'frame';
    frame.innerText = `R${frameNr}`;
    document.getElementById('incoming').appendChild(frame);

    if (frameNr === frameExpected) {
        toNetworkLayer(frameNr);
    } else if (frameNr < frameExpected) {
        // NAK sent for out-of-order frame
        console.log(`NAK sent for frame F${frameExpected}`);
        updateStatus(`NAK sent for frame F${frameExpected}`);
        sendNak(frameExpected); // Resend the expected frame
    } else {
        if (between(frameExpected, frameNr, tooFar) && !arrived[frameNr % NR_BUFS]) {
            arrived[frameNr % NR_BUFS] = true;
            inBuf[frameNr % NR_BUFS] = frameNr;
            processBuffer();
        }
    }
}

function sendNak(frameNr) {
    const nak = document.createElement('div');
    nak.className = 'frame';
    nak.innerText = `NAK for F${frameNr}`;
    document.getElementById('outgoing').appendChild(nak);
    // Logic to handle NAK (e.g., informing sender)
}

function toNetworkLayer(frameNr) {
    console.log(`Frame F${frameNr} passed to network layer.`);
    updateStatus(`Frame F${frameNr} passed to network layer.`);
    arrived[frameNr % NR_BUFS] = false;
    frameExpected = (frameExpected + 1) % (MAX_SEQ + 1); // Wrap around the expected frame
    nBuffered--;
    processBuffer();
}

function processBuffer() {
    while (arrived[frameExpected % NR_BUFS]) {
        toNetworkLayer(frameExpected);
        arrived[frameExpected % NR_BUFS] = false;
    }
}

function between(a, b, c) {
    return ((a <= b) && (b < c)) || ((c < a) && (a <= b)) || ((b < c) && (c < a));
}

document.getElementById('sendButton').addEventListener('click', function() {
    if (nBuffered < NR_BUFS) {
        sendFrame(nextFrameToSend);
        nextFrameToSend = (nextFrameToSend + 1) % (MAX_SEQ + 1); // Loop back to 0 after reaching MAX_SEQ
    } else {
        console.log("Buffer full. Cannot send more frames.");
        updateStatus("Buffer full. Cannot send more frames.");
    }
});

// Reset the simulation
document.getElementById('resetButton').addEventListener('click', function() {
    // Clear all buffers and reset variables
    document.getElementById('outgoing').innerHTML = '<h2>Outgoing Frames</h2>';
    document.getElementById('incoming').innerHTML = '<h2>Incoming Frames</h2>';
    updateStatus('');
    ackExpected = 0;
    nextFrameToSend = 0;
    frameExpected = 0;
    tooFar = NR_BUFS;
    nBuffered = 0;
    arrived.fill(false);
    outBuf.fill(null);
    inBuf.fill(null);
    timers.fill(null);
});