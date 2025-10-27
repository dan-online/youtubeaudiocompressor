import Waveform from "~icons/ph/waveform-bold";
import WaveformSlash from "~icons/ph/waveform-slash-bold";

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
		chrome.storage.local.get(["compress"], (result) => {
			resolve(result ? result.compress : false);
		});
	});
}

function setCompression(value: boolean): Promise<boolean> {
	return new Promise((resolve) => {
		chrome.storage.local.set({ compress: value }, () => {
			resolve(value);
		});
	});
}

function updateCompression(compress: boolean) {
	if (compress) {
		button.setAttribute("aria-pressed", "true");
		button.style.filter =
			"invert(86%) sepia(87%) saturate(5375%) hue-rotate(2deg) brightness(94%) contrast(125%)";
		document.querySelectorAll("video").forEach(compressVideoNode);
		button.innerHTML = Waveform;
	} else {
		button.innerHTML = WaveformSlash;
		button.setAttribute("aria-pressed", "false");
		button.style.filter = "";
		for (const { source, compression, context } of sources) {
			source.disconnect(compression);
			source.connect(context.destination);
		}
	}

	const innerSvg = button.querySelector("svg");

	if (innerSvg) {
		innerSvg.style.width = "100%";
		innerSvg.style.height = "100%";
		innerSvg.style.filter = "none";
	}
}

function createButton() {
	const button = document.createElement("button");

	button.innerHTML = Waveform;
	button.classList.add("ytp-button");
	button.classList.add("ytp-button--compress");
	button.setAttribute("aria-label", "Compress audio");
	button.setAttribute("title", "Compress audio");
	button.setAttribute("aria-pressed", "false");
	button.setAttribute("aria-keyshortcuts", "v");
	button.setAttribute("data-title-no-tooltip", "Compress audio");
	button.setAttribute("title", "Compress audio (v)");
	button.style.display = "flex";
	button.style.alignItems = "center";
	button.style.justifyContent = "center";

	return button;
}

async function toggleCompression() {
	const compress = await getIfCompress();
	await setCompression(!compress);
	updateCompression(!compress);
}

const button = createButton();

async function run() {
	document.querySelector(".ytp-right-controls")?.prepend(button);

	button.addEventListener("click", () => {
		toggleCompression();
	});

	// New Youtube UI breaks this, they'll probably break it again so
	// leaving it for now

	// let hoverInterval: number | undefined;

	// button.addEventListener("mouseover", () => {
	// 	hoverInterval = setInterval(() => {
	// 		const tooltip = document.querySelector<HTMLElement>(".ytp-tooltip");
	// 		if (tooltip) {
	// 			const tooltipText =
	// 				tooltip.querySelector<HTMLElement>(".ytp-tooltip-text");
	// 			if (tooltipText) {
	// 				tooltip.style.display = "";
	// 				tooltip.querySelector<HTMLElement>(".ytp-tooltip-text");
	// 				tooltipText.innerText = "Compress audio (v)";
	// 				tooltip.style.left = `${
	// 					button.getBoundingClientRect().x -
	// 					tooltip.getBoundingClientRect().width / 2
	// 				}px`;
	// 			}
	// 		}
	// 	}, 100);
	// });
	// button.addEventListener("mouseleave", () => {
	// 	clearInterval(hoverInterval);
	// 	const tooltip = document.querySelector<HTMLElement>(".ytp-tooltip");
	// 	if (tooltip) {
	// 		tooltip.style.display = "none";
	// 	}
	// });

	updateCompression(await getIfCompress());

	window.addEventListener("keydown", (e) => {
		if (
			e.key === "v" &&
			!e.ctrlKey &&
			!e.altKey &&
			!e.shiftKey &&
			!e.metaKey &&
			document.activeElement?.tagName !== "INPUT" &&
			document.activeElement?.id !== "contenteditable-root"
		) {
			e.preventDefault();
			toggleCompression();
		}
	});

	const forceInterval = setInterval(() => {
		if (
			document.querySelector(".ytp-right-controls") &&
			!document.querySelector(".ytp-button--compress")
		) {
			run();
		}
	}, 1000);

	window.addEventListener("unload", () => {
		clearInterval(forceInterval);
		// clearInterval(hoverInterval);
	});
}

document.addEventListener("DOMContentLoaded", () => {
	run();
});
