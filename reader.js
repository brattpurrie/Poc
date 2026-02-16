let paragraphs = [], words = [], complexityData = [], index = 0, interval = null;
let touchStartX = 0, currentWPM = 200;

const pdfUpload = document.getElementById("pdfUpload");
const reader = document.getElementById("reader");
const minimap = document.getElementById("minimap");
const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const wpmOverlay = document.getElementById("wpmOverlay");
const readingTimeLabel = document.getElementById("readingTime");
const textInput = document.getElementById("textInput");

const legalTerms = ["obligation", "indemnification", "subcontractor", "shall", "must"];

function getWordComplexity(word){
  let c = 0;
  if(word.length <= 4) c = 0.1;
  else if(word.length <= 7) c = 0.3;
  else if(word.length <= 10) c = 0.6;
  else c = 0.9;
  if(legalTerms.includes(word.toLowerCase())) c = 1.0;
  return c;
}

// ---------------- PDF Upload ----------------
pdfUpload.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if(!file) return;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({data: arrayBuffer}).promise;

  let fullText = "";
  for(let i=1; i<=pdf.numPages; i++){
    const page = await pdf.getPage(i);
