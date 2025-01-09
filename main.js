var audioElement = new Audio();
audioElement.src = 'Sounds/Police.mp3';

function UpdateVolume(volume) {
    audioElement.volume = volume / 100;
    document.getElementById('volumeLevel').textContent = volume;
}

let compteursleep = 0;

function PlaySound() {
    if (compteursleep >= 50) {
        audioElement.play();
        compteursleep = 0;
        stopCamera();
        OpenAlert();
    }
}

function ChangeSound(type) {
    if (audioElement !== null) {
        audioElement.currentTime = 0;
        audioElement.pause();
    }
    audioElement.src = 'Sounds/' + type + '.mp3';
    audioElement.play();
}

const popup = document.getElementById('popup');
const quitButton = document.getElementById('quitButton');

const popup2 = document.getElementById('popup2');
const quitButton2 = document.getElementById('quitButton2');

function OpenParameters() {
    popup.style.display = 'block';
    quitButton.style.display = 'block';
}

function CloseParameters() {
    if (audioElement !== null) {
        audioElement.currentTime = 0;
        audioElement.pause();
    }
    popup.style.display = 'none';
    quitButton.style.display = 'none';
}

function OpenAlert() {
    popup2.style.display = 'block';
    quitButton2.style.display = 'block';
}

function CloseAlert() {
    if (audioElement !== null) {
        audioElement.currentTime = 0;
        audioElement.pause();
    }
    popup2.style.display = 'none';
    quitButton2.style.display = 'none';
}

const camera = document.getElementById('camera');
const cameraContainer = document.getElementById('cameraContainer');
const recordButton = document.getElementById('recordButton');
let isRecording = false;
let analyzingStream = false;
let firsttime = true;

recordButton.addEventListener('click', toggleRecording);

function toggleRecording() {
    compteursleep = 0;
    if (!isRecording) {
        startCamera();
    } else {
        stopCamera();
    }
}

function startCamera() {
    compteursleep = 0;
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(async (stream) => {
            camera.srcObject = stream;
            isRecording = true;
            cameraContainer.classList.add('camera-on');
            document.getElementById('recordIcon').innerHTML = '<i class="fas fa-stop"></i>';
            recordButton.classList.add('recording');

            if (firsttime){
                await loadModels();
                firsttime = false;
            }

            analyzingStream = true;
            analyzeCameraStream();
        })
        .catch(error => {
            if (error.name === 'NotAllowedError') {
                alert('You have denied access to the camera. Please enable it in your settings.');
            } else {
                console.error('Camera error:', error);
            }
        });
}

function stopCamera() {
    const stream = camera.srcObject;
    const tracks = stream.getTracks();

    tracks.forEach(track => {
        track.stop();
    });

    camera.srcObject = null;
    isRecording = false;
    analyzingStream = false;
    cameraContainer.classList.remove('camera-on');
    document.getElementById('recordIcon').innerHTML = '<i class="fas fa-circle"></i>';
    recordButton.classList.remove('recording');
}


async function loadModels() {
    await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
    await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
    console.log('Models loaded');
}


function calculateEyeClosure(landmarks) {
    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();

    const leftEAR = calculateEAR(leftEye);
    const rightEAR = calculateEAR(rightEye);

    const ear = (leftEAR + rightEAR) / 2;
    return ear < 0.30;
}

function calculateEAR(eye) {
    const A = distance(eye[1], eye[5]);
    const B = distance(eye[2], eye[4]);
    const C = distance(eye[0], eye[3]);
    return (A + B) / (2.0 * C);
}

function distance(point1, point2) {
    return Math.sqrt(Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2));
}

async function analyzeCameraStream() {
    try {
        const detection = await faceapi.detectSingleFace(camera, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks();

        if (detection) {
            const landmarks = detection.landmarks;
            const eyesClosed = calculateEyeClosure(landmarks);

            if (eyesClosed) {
                compteursleep++;
                console.log("Yeux fermés");
                PlaySound();
            } else {
                console.log("Yeux ouverts");
            }
        } else {
            console.log("Pas de visage détecté");
        }
    } catch (error) {
        console.error("Erreur de détection:", error);
    }
    requestAnimationFrame(analyzeCameraStream);
}