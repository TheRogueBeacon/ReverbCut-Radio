const audioEl = document.getElementById('audio');
const btn = document.getElementById('imaginationBtn');
const eqCanvas = document.getElementById('eqCanvas');
const eqShell = document.getElementById('eqShell');
const progressBar = document.getElementById('progressBar');
const signalInterrupt = document.getElementById('signalInterrupt');
const signalTrace = document.getElementById('signalTrace');
const listenerGhost = document.getElementById('listenerGhost');
const frame = document.getElementById('frame');
const heroEQ = document.getElementById('eq-visualizer');


let audioCtx, sourceNode, analyser, filterNode;
let dataArray, bufferLength;
let started = false;
let eqActive = false;

function resizeCanvas() {
  eqCanvas.width = eqShell.clientWidth;
  eqCanvas.height = eqShell.clientHeight;

  heroEQ.width = heroEQ.clientWidth;
  heroEQ.height = heroEQ.clientHeight;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function initAudioGraph() {
  if (audioCtx) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  sourceNode = audioCtx.createMediaElementSource(audioEl);
  analyser = audioCtx.createAnalyser();
  analyser.fftSize = 256;
  bufferLength = analyser.frequencyBinCount;
  dataArray = new Uint8Array(bufferLength);
  filterNode = audioCtx.createBiquadFilter();
  filterNode.type = 'lowpass';
  filterNode.frequency.setValueAtTime(400, audioCtx.currentTime);
  sourceNode.connect(filterNode);
  filterNode.connect(analyser);
  analyser.connect(audioCtx.destination);
}

function lowPassEntranceSweep() {
  if (!filterNode || !audioCtx) return;
  const now = audioCtx.currentTime;
  filterNode.frequency.cancelScheduledValues(now);
  filterNode.frequency.setValueAtTime(400, now);
  filterNode.frequency.linearRampToValueAtTime(18000, now + 0.5);
}

function drawBars(ctx, width, height) {
  const barCount = 64;
  const step = Math.floor(bufferLength / barCount);
  const barWidth = width / barCount;

  for (let i = 0; i < barCount; i++) {
    const value = dataArray[i * step] || 0;
    const norm = value / 255;
    const barHeight = norm * height * 0.6;

    const x = i * barWidth;
    const y = height / 2;

    const gradient = ctx.createLinearGradient(x, y - barHeight, x, y + barHeight);
    gradient.addColorStop(0, 'rgba(168, 85, 255, 0)');
    gradient.addColorStop(0.5, 'rgba(168, 85, 255, 0.8)');
    gradient.addColorStop(1, 'rgba(168, 85, 255, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(x, y - barHeight, barWidth * 0.8, barHeight * 2);
  }
}

function drawEQ() {
  if (!analyser) return;

  const ctx1 = eqCanvas.getContext('2d');
  const ctx2 = heroEQ.getContext('2d');

  function render() {
    requestAnimationFrame(render);

    if (!eqActive) {
      ctx1.clearRect(0, 0, eqCanvas.width, eqCanvas.height);
      ctx2.clearRect(0, 0, heroEQ.width, heroEQ.height);
      return;
    }

    analyser.getByteFrequencyData(dataArray);
    console.log(dataArray[10]);

    ctx1.clearRect(0, 0, eqCanvas.width, eqCanvas.height);
    ctx2.clearRect(0, 0, heroEQ.width, heroEQ.height);

    drawBars(ctx1, eqCanvas.width, eqCanvas.height);
    drawBars(ctx2, heroEQ.width, heroEQ.height);
  }

  render();
}


function updateProgress() {
  if (!audioEl.duration || !isFinite(audioEl.duration)) {
    progressBar.style.width = '0%';
  } else {
    const pct = (audioEl.currentTime / audioEl.duration) * 100;
    progressBar.style.width = pct + '%';
  }
  requestAnimationFrame(updateProgress);
}

function updateSignalTrace() {
  const t = Date.now();
  const hex = (t % 65535).toString(16).padStart(4, '0');
  signalTrace.textContent = `SIG // 0x${hex}`;
}
setInterval(updateSignalTrace, 1200);

// Placeholder listener ghost
let ghostCount = 1;
setInterval(() => {
  const delta = Math.random() > 0.7 ? (Math.random() > 0.5 ? 1 : -1) : 0;
  ghostCount = Math.max(1, ghostCount + delta);
  listenerGhost.textContent = ghostCount;
}, 5000);

audioEl.addEventListener('error', () => {
  signalInterrupt.classList.add('visible');
  eqActive = false;
});

audioEl.addEventListener('playing', () => {
  signalInterrupt.classList.remove('visible');
  eqActive = true;
  document.title = 'ReverbCut Radio // Live';
});

btn.addEventListener('click', async () => {
  try {
    initAudioGraph();
    if (!started) {
      await audioEl.play();
      started = true;
    } else if (audioEl.paused) {
      await audioEl.play();
    }

    lowPassEntranceSweep();
    frame.classList.add('eq-active');
    btn.classList.add('cta-pulse');
    setTimeout(() => btn.classList.remove('cta-pulse'), 700);
  } catch (e) {
    console.warn('Playback blocked:', e);
  }
});


drawEQ();
updateProgress();
