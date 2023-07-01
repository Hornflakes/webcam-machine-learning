import './style.scss';
import { KNNClassifier } from '@tensorflow-models/knn-classifier';
import * as tfjs from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';

type Labels = 'left' | 'right';
type State = 'training' | 'thinking' | 'idle';
let trainingLabel: Labels;
let state: State;

const mobileNet = await mobilenet.load();
const knnClassifier = new KNNClassifier();
let kValue = 10;

const res = await fetch('./src/main.html');
const html = await res.text();
document.body.insertAdjacentHTML('beforeend', html);

const video = document.querySelector<HTMLVideoElement>('video');
navigator.mediaDevices.getUserMedia({ video: true, audio: false }).then((stream) => (video.srcObject = stream));

const leftConfidenceDiv = document.querySelector<HTMLDivElement>('#left-confidence');
const leftExamplesDiv = document.querySelector<HTMLDivElement>('#left-examples');
const leftButton = document.querySelector<HTMLButtonElement>('#left');
leftButton.addEventListener('mousedown', () => {
    trainingLabel = 'left';
    state = 'training';
});
leftButton.addEventListener('mouseup', () => {
    state = 'idle';
});

const rightConfidenceDiv = document.querySelector<HTMLDivElement>('#right-confidence');
const rightExamplesDiv = document.querySelector<HTMLDivElement>('#right-examples');
const rightButton = document.querySelector<HTMLButtonElement>('#right');
rightButton.addEventListener('mousedown', () => {
    trainingLabel = 'right';
    state = 'training';
});
rightButton.addEventListener('mouseup', () => {
    state = 'idle';
});

const predictButton = document.querySelector<HTMLButtonElement>('#predict');
predictButton.addEventListener('mousedown', () => {
    state = 'thinking';
});
predictButton.addEventListener('mouseup', () => {
    state = 'idle';
});

const animate = async () => {
    let image;
    let logits;

    if (state === 'training' || state === 'idle') {
        if (leftConfidenceDiv.innerHTML) leftConfidenceDiv.innerHTML = '';
        if (rightConfidenceDiv.innerHTML) rightConfidenceDiv.innerHTML = '';
    }

    if (state === 'training' || state === 'thinking') {
        image = tfjs.browser.fromPixels(video);
        logits = infer(image);

        if (state === 'training') {
            if (predictButton.disabled) predictButton.disabled = false;

            knnClassifier.addExample(logits, trainingLabel);

            const exampleCount = knnClassifier.getClassExampleCount();
            kValue = Math.sqrt(exampleCount.left + exampleCount.right);

            if (trainingLabel === 'left') leftExamplesDiv.innerHTML = `${exampleCount.left} examples`;
            else rightExamplesDiv.innerHTML = `${exampleCount.right} examples`;
        }

        if (state === 'thinking') {
            const res = await knnClassifier.predictClass(logits, kValue);
            leftConfidenceDiv.innerHTML = `${(res.confidences.left * 100).toFixed(2)}% confidence`;
            rightConfidenceDiv.innerHTML = `${(res.confidences.right * 100).toFixed(2)}% confidence`;
        }

        image.dispose();
        logits.dispose();
    }
    requestAnimationFrame(animate);
};

const infer = (image: any) => mobileNet.infer(image, true);

requestAnimationFrame(animate);
