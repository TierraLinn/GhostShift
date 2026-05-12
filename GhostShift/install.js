const card = document.getElementById("extensionDetectCard");
const dot = document.getElementById("extensionDetectDot");
const title = document.getElementById("extensionDetectTitle");
const text = document.getElementById("extensionDetectText");

function setDetected(detected) {
  card.classList.toggle("detected", detected);
  dot.classList.toggle("detected", detected);
  title.textContent = detected ? "GhostShift extension detected" : "Extension not detected yet";
  text.textContent = detected
    ? "Good. Now open the demo player and the extension should auto-click the visible Skip Ad button."
    : "Load the unpacked extension folder in Chrome or Edge, then refresh this page.";
}

function checkDetected() {
  setDetected(Boolean(document.getElementById("ghostshift-extension-detected")));
}

checkDetected();
setTimeout(checkDetected, 700);
setTimeout(checkDetected, 1600);
