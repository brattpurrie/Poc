let paragraphs=[], words=[], complexityData=[], index=0, interval=null;
let touchStartX=0, currentWPM=200;

const pdfUpload = document.getElementById("pdfUpload");
const reader = document.getElementById("reader");
const minimap = document.getElementById("minimap");
const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const wpmOverlay = document.getElementById("wpmOverlay");
const readingTimeLabel = document.getElementById("readingTime");
const textInput = document.getElementById("textInput");

const legalTerms=["obligation","indemnification","subcontractor","shall","must"];

function getWordComplexity(word){
  let c=0;
  if(word.length<=4)c=0.1;
  else if(word.length<=7)c=0.3;
  else if(word.length<=10)c=0.6;
  else c=0.9;
  if(legalTerms.includes(word.toLowerCase()))c=1.0;
  return c;
}

// Handle PDF upload
document.getElementById("uploadLabel").addEventListener("click",()=>pdfUpload.click());
pdfUpload.addEventListener("change", async (e)=>{
  const file = e.target.files[0];
  if(!file) return;
  const fileURL = URL.createObjectURL(file);
  const pdf = await pdfjsLib.getDocument(fileURL).promise;
  let fullText="";
  for(let i=1;i<=pdf.numPages;i++){
    const page = await pdf.getPage(i);
    const txt = await page.getTextContent();
    fullText += txt.items.map(item=>item.str).join(" ") + "\n\n";
  }
  textInput.value = fullText;
  analyzeText();
});

// Parse text into words
function analyzeText(){
  const text = textInput.value.trim();
  if(!text) return alert("No text found.");
  paragraphs = text.split(/\n\s*\n/);
  words = []; complexityData=[];
  paragraphs.forEach(p=>{
    const ws=p.split(/\s+/);
    ws.forEach(w=>{ words.push(w); complexityData.push(getWordComplexity(w)); });
  });
  buildMiniMap();
  index=0;
  updateEstimatedTime();
}

// Mini-map
function buildMiniMap(){
  minimap.innerHTML="";
  let globalWordIndex=0;
  paragraphs.forEach((p, pi)=>{
    const ws=p.split(/\s+/);
    const avgC=ws.reduce((a,b)=>a+getWordComplexity(b),0)/ws.length;
    const paraColor=`rgba(255,0,0,${avgC*0.2})`;
    const div=document.createElement("div"); div.style.backgroundColor=paraColor; div.style.margin="1px 0";
    ws.forEach((w, wi)=>{
      const span=document.createElement("span"); span.id=`p${pi}w${wi}`; span.innerText=w+" "; span.style.userSelect="none";
      span.addEventListener("click", ()=>{ index=globalWordIndex; showWordAdaptive(); });
      div.appendChild(span);
      globalWordIndex++;
    });
    minimap.appendChild(div);
  });
}

// ORP highlight centered
function highlightORPCentered(word){
  if(!word) return '';
  const orpIndex = Math.floor(word.length/3);
  const before = word.slice(0,orpIndex);
  const orpLetter = word[orpIndex];
  const after = word.slice(orpIndex+1);

  const wrapper = document.createElement('div'); wrapper.className='word-wrapper';
  const beforeSpan=document.createElement('span'); beforeSpan.className='word-before'; beforeSpan.innerText=before;
  const orpSpan=document.createElement('span'); orpSpan.className='orp'; orpSpan.innerText=orpLetter;
  const afterSpan=document.createElement('span'); afterSpan.className='word-after'; afterSpan.innerText=after;
  wrapper.appendChild(beforeSpan); wrapper.appendChild(orpSpan); wrapper.appendChild(afterSpan);

  reader.innerHTML=''; reader.appendChild(wrapper);
  const charWidth = 20; 
  wrapper.style.left = '50%';
  wrapper.style.transform = `translateX(-${orpIndex*charWidth}px) translateY(-50%)`;
}

// Mini-map highlighting
function highlightCurrentWord(){
  document.querySelectorAll("#minimap span").forEach(s=>s.style.textDecoration="none");
  const span = document.getElementById(getSpanId(index));
  if(span){ span.style.textDecoration="underline"; span.scrollIntoView({block:"center"});}
}

function getSpanId(idx){
  let counter=0;
  for(let pi=0; pi<paragraphs.length; pi++){
    const ws = paragraphs[pi].split(/\s+/);
    for(let wi=0; wi<ws.length; wi++){
      if(counter===idx) return `p${pi}w${wi}`;
      counter++;
    }
  }
  return null;
}

// Reading time
function updateEstimatedTime(){
  const remaining = words.length - index;
  const estMinutes = Math.ceil(remaining/currentWPM);
  readingTimeLabel.innerText = `Estimated time: ${estMinutes} min`;
}

// Display words adaptively
function showWordAdaptive(){
  if(index>=words.length) return;
  const word=words[index], complexity=complexityData[index];
  highlightORPCentered(word);
  highlightCurrentWord();
  index++;
  updateEstimatedTime();
  const baseMs = 60000/currentWPM;
  const intervalMs = baseMs*(1+complexity);
  if(interval) clearTimeout(interval);
  interval=setTimeout(showWordAdaptive, intervalMs);
}

// Start/pause
startBtn.addEventListener("click", ()=>{ if(!words.length) analyzeText(); showWordAdaptive(); });
pauseBtn.addEventListener("click", ()=>{ if(interval) clearTimeout(interval); interval=null; });

// Swipe gestures WPM
reader.addEventListener("touchstart", e=>{ if(e.touches.length===1) touchStartX=e.touches[0].clientX; });
reader.addEventListener("touchmove", e=>{
  if(e.touches.length===1){
    const deltaX = e.touches[0].clientX - touchStartX;
    if(Math.abs(deltaX)>5){
      const steps = Math.floor(deltaX/5);
      currentWPM = Math.max(50, Math.min(800, currentWPM + steps*10));
      showWPMOverlay();
      touchStartX = e.touches[0].clientX;
    }
  }
});

// WPM overlay
function showWPMOverlay(){
  wpmOverlay.innerText = `${currentWPM} WPM`;
  wpmOverlay.style.display = 'block';
  clearTimeout(wpmOverlay.timeout);
  wpmOverlay.timeout=setTimeout(()=>{ wpmOverlay.style.display='none'; },800);
}
