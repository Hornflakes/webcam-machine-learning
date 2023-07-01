import './style.scss';

const res = await fetch('./src/main.html');
const html = await res.text();
document.body.insertAdjacentHTML('beforeend', html);

const video = document.querySelector<HTMLVideoElement>('video');
navigator.mediaDevices.getUserMedia({ video: true, audio: false }).then((stream) => (video.srcObject = stream));
