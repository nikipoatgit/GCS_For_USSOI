const logStack = document.getElementById('log-stack');
const maxItems = 10; // The number of visible items
let logCounter = 0;
const videoElement = document.getElementById("stream_video");
var loc = window.location;// holds refs to urls , its win object
var endpoint = 'ws://' + loc.host + loc.pathname + 'streaming/api/data';
var webSocket;
 addLogEntry("endpoint :"+ endpoint);

const config = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
    ]
};
const pc = new RTCPeerConnection(config);
webSocket = new WebSocket(endpoint);


//  ICE and signaling state changes
pc.oniceconnectionstatechange = () => addLogEntry("ICE state:" + pc.iceConnectionState);
pc.onsignalingstatechange = () => addLogEntry("Signaling state:"+ pc.signalingState);
pc.onconnectionstatechange = () =>  addLogEntry("RTC Connection state:"+ pc.connectionState);

webSocket.addEventListener('open', (e) => {  addLogEntry('connection open') });
webSocket.addEventListener('message', webSocketOnMessage);
webSocket.addEventListener('close', (e) => {  addLogEntry('connection closed') });
webSocket.addEventListener('error', (e) => {  addLogEntry('ERROr') });

function webSocketOnMessage(event) {
    const parseData = JSON.parse(event.data);
    if (parseData.type === "ice-candidate") {
        const candidate = new RTCIceCandidate({
            candidate: parseData.candidate,
            sdpMid: parseData.sdpMid,
            sdpMLineIndex: parseData.sdpMLineIndex
        });
        pc.addIceCandidate(candidate).catch(e =>  addLogEntry("ICE add error:"+ e));
        addLogEntry("ICE RECEIVED");
    }
    else if (parseData.type == 'getStatus') {
         addLogEntry("Status :"+ parseData.status);
    }
    else if (parseData.type == 'offer') {
        handleOffer(parseData.sdp);
        addLogEntry("SDP RECEIVED");
    }
    else {
        updateStatusDisplay(parseData['nameValuePairs']);
    }
}




pc.ontrack = (event) => {
    const track = event.track;
    if (track.kind === "video") {
        const videoEl = document.getElementById("remoteVideo");
        if (!videoEl.srcObject) videoEl.srcObject = new MediaStream();
        videoEl.srcObject.addTrack(track);
        videoEl.play().catch(e => console.error(e));
    } else if (track.kind === "audio") {

        const audioEl = document.getElementById("remoteAudio");
        if (!audioEl.srcObject) audioEl.srcObject = new MediaStream();
        audioEl.srcObject.addTrack(track);
        audioEl.play().catch(e => console.error(e));
    }
};


async function handleOffer(offerSdp) {
    const remoteDesc = new RTCSessionDescription({
        type: "offer",
        sdp: offerSdp
    });

    await pc.setRemoteDescription(remoteDesc);
    const answer = await pc.createAnswer({ offerToReceiveVideo: true, offerToReceiveAudio: true });
    await pc.setLocalDescription(answer);

    webSocket.send(JSON.stringify({
        type: "answer",
        sdp: answer.sdp
    }));
    addLogEntry("Answer sent");
}


pc.onicecandidate = (event) => {
    if (event.candidate) {
        webSocket.send(JSON.stringify({
            type: "ice-candidate",
            candidate: event.candidate.candidate,
            sdpMid: event.candidate.sdpMid,
            sdpMLineIndex: event.candidate.sdpMLineIndex
        }));
    }
};

// video config 
const output = document.getElementById('output');
const rotateVideoButton = document.getElementById('rotateVideo');
const mirrorVideoButton = document.getElementById('mirrorVideo');


let isVideoOn = true;
let isAudioOn = false;
let currentRotation = 0;
let isMirrored = false;

const generatePayload = (data) => {
    const payload = {
        type: "config",
        ...data
    }
    webSocket.send(JSON.stringify(payload))
    output.textContent = JSON.stringify(payload, null, 2); // for debuging
};
const generatePayloadServiceManager = (data) => {
    const payload = {
        type: "client",
        ...data
    }
    webSocket.send(JSON.stringify(payload))
    output.textContent = JSON.stringify(payload, null, 2); // for debuging
};
const message = JSON.stringify({
    type: "client",
    sub_type: "client"
});
rotateVideoButton.addEventListener('click', () => {
    currentRotation = (currentRotation + 90) % 360;
    updateTransform();
});
mirrorVideoButton.addEventListener('click', () => {
    isMirrored = !isMirrored;
    updateTransform();
});
document.getElementById('toggleVideo').addEventListener('click', () => {
    isVideoOn = !isVideoOn;
    generatePayload({ video: isVideoOn, sub_type: "client" });
});
document.getElementById('toggleAudio').addEventListener('click', () => {
    isAudioOn = !isAudioOn;
    generatePayload({ audio: isAudioOn, sub_type: "client" });
});
document.getElementById('switchCamera').addEventListener('click', () => {
    generatePayload({ switchCamera: "toggle", sub_type: "client" });
});
document.getElementById('stopMavlink').addEventListener('click', () => {
    generatePayloadServiceManager({ sub_type: "mavlink", control: "stop" });
});
document.getElementById('restartMavlink').addEventListener('click', () => {
    generatePayloadServiceManager({ sub_type: "mavlink", control: "restart" });
});
document.getElementById('stopStream').addEventListener('click', () => {
    generatePayloadServiceManager({ sub_type: "stream", control: "stop" });
});
document.getElementById('restartStream').addEventListener('click', () => {
    generatePayloadServiceManager({ sub_type: "stream", control: "restart" });
});

function updateTransform() {
    // Build the transform string based on the current state
    const rotation = `rotate(${currentRotation}deg)`;
    const scale = isMirrored ? 'scaleX(-1)' : 'scaleX(1)'; // Horizontal flip

    // Combine and apply the transformations
    videoElement.style.transform = `${rotation} ${scale}`;
}


intervalID = setInterval(() => {
    // Double-check that the connection is still open before sending
    if (webSocket.readyState === WebSocket.OPEN) {
        webSocket.send(message);
    }
}, 5000);


function addLogEntry(message) {
    // If no message is provided, create a default one for testing.
    if (!message) {
        logCounter++;
        message = `Default Event #${logCounter} at ${new Date().toLocaleTimeString()}`;
    }

    // The rest of the function is the same as before...
    if (logStack.children.length < maxItems) {
        const newItem = document.createElement('li');
        newItem.className = 'log-item';
        newItem.textContent = message;
        logStack.appendChild(newItem);
        return;
    }

    const newItem = document.createElement('li');
    newItem.className = 'log-item';
    newItem.textContent = message;

    logStack.classList.add('is-sliding');

    logStack.addEventListener('animationend', () => {
        logStack.firstChild.remove();
        logStack.appendChild(newItem);
        logStack.classList.remove('is-sliding');
    }, { once: true });
}

// Add this function to your main.js file
function updateStatusDisplay(data) {
    // Function to convert network type codes to names
    const getNetworkTypeName = (netId) => {
        switch (netId) {
            case 1: return "GPRS";
            case 2: return "EDGE";
            case 4: return "CDMA";
            case 7: return "1xRTT";
            case 13: return "LTE";
            case 16: return "GSM";
            case 20: return "5G NR";
            default: return "Unknown";
        }
    };

    // Update Battery and Temperature
    document.getElementById('status-battery').textContent = data['bat%'] || '--';
    document.getElementById('status-temp').textContent = data.batTemp ? data.batTemp.toFixed(1) : '--';
    document.getElementById('status-current').textContent = data.batAmp || '--';

    // Update Network Info
    document.getElementById('status-signal').textContent = data.signalDbm || '--';
    document.getElementById('status-sim').textContent = data.sim || '--';
    document.getElementById('status-net-type').textContent = getNetworkTypeName(data.netTyp);
    
    // Update Data Speeds (and format to 2 decimal places)
    document.getElementById('status-upload').textContent = data.upMBps ? data.upMBps.toFixed(2) : '--';
    document.getElementById('status-download').textContent = data.dwnMBps ? data.dwnMBps.toFixed(2) : '--';
    document.getElementById('status-data-total').textContent = data.totalMb ? data.totalMb.toFixed(1) : '--';

    // Update GPS Info (and format to 6 decimal places for precision)
    const lat = data.latitude ? data.latitude.toFixed(6) : 'N/A';
    const lon = data.longitude ? data.longitude.toFixed(6) : 'N/A';
    document.getElementById('status-gps').textContent = `${lat}, ${lon}`;
    document.getElementById('status-altitude').textContent = data.altitude ? data.altitude.toFixed(1) : '--';
    document.getElementById('status-accuracy').textContent = data.accuracy ? data.accuracy.toFixed(1) : '--';
    document.getElementById('status-speed').textContent = data.speed ? data.speed.toFixed(1) : '--';
}