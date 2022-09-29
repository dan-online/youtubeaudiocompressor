import { icon } from '../assets/icons/icon';

const sources: {
  source: MediaElementAudioSourceNode;
  compression: DynamicsCompressorNode;
  id: string;
  context: AudioContext;
}[] = [];

function compressVideoNode(node: HTMLVideoElement) {
  const found = sources.find((x) => x.id === node.id);
  if (found) {
    try {
      found.source.disconnect(found.context.destination);
    } catch {
      // ignore this error
    }
    return found.source.connect(found.compression);
  }

  const context = new AudioContext();

  const compressNode = context.createDynamicsCompressor();
  compressNode.threshold.setValueAtTime(-50, context.currentTime);
  compressNode.knee.setValueAtTime(40, context.currentTime);
  compressNode.ratio.setValueAtTime(12, context.currentTime);
  compressNode.attack.setValueAtTime(0, context.currentTime);
  compressNode.release.setValueAtTime(0.25, context.currentTime);

  const source = context.createMediaElementSource(node);
  source.connect(compressNode);
  compressNode.connect(context.destination);

  sources.push({ source, compression: compressNode, id: node.id, context });

  return;
}

function getIfCompress(): Promise<boolean> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['compress'], (result) => {
      resolve(typeof result.compress === 'undefined' ? false : result.compress);
    });
  });
}

function setCompression(value: boolean): Promise<boolean> {
  return new Promise((resolve) => {
    chrome.storage.sync.set({ compress: value }, () => {
      resolve(value);
    });
  });
}

async function updateCompression() {
  const compress = await getIfCompress();
  if (compress) {
    button.setAttribute('aria-pressed', 'true');
    document.querySelectorAll('video').forEach(compressVideoNode);
  } else {
    button.setAttribute('aria-pressed', 'false');
    sources.forEach(({ source, compression, context }) => {
      source.disconnect(compression);
      source.connect(context.destination);
    });
  }
}

const button = document.createElement('button');
button.innerHTML = icon;
button.classList.add('ytp-button');
button.setAttribute('title', 'Compress audio');

document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('.ytp-right-controls')?.prepend(button);
  button.addEventListener('click', async () => {
    const compress = await getIfCompress();
    await setCompression(!compress);
    updateCompression();
  });
  updateCompression();
});
