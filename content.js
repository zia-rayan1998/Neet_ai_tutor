let floatingBtn = null;
let chatPanel = null;
let isOn = false;
let conversation = [];
let pageContent = "";
let apiKey = "";
let currentImageBase64 = null;

// ========== LOAD STATE ==========
chrome.storage.local.get(["isOn", "apiKey", "conversation"], (data) => {
  isOn = data.isOn || false;
  apiKey = data.apiKey || "";
  conversation = data.conversation || [];
  if (isOn) createFloatingUI();
});

// Listen for changes
chrome.storage.onChanged.addListener((changes) => {
  if (changes.isOn) {
    isOn = changes.isOn.newValue;
    if (isOn) createFloatingUI();
    else removeFloatingUI();
  }
  if (changes.apiKey) apiKey = changes.apiKey.newValue;
});

// Hidden file input for OCR
const ocrInput = document.createElement("input");
ocrInput.type = "file";
ocrInput.accept = "image/*";
ocrInput.style.display = "none";
document.body.appendChild(ocrInput);

// ========== CREATE FLOATING UI ==========
function createFloatingUI() {
  if (floatingBtn) return;

  // Floating Button
  floatingBtn = document.createElement("div");
  floatingBtn.innerHTML = "N";
  floatingBtn.title = "NEET AI Tutor";
  floatingBtn.style.cssText = `
    position: fixed;
    bottom: 25px;
    right: 25px;
    width: 54px;
    height: 54px;
    background: #22c55e;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    font-weight: bold;
    cursor: pointer;
    z-index: 2147483647;
    box-shadow: 0 4px 18px rgba(0,0,0,0.35);
    transition: transform 0.2s;
    user-select: none;
  `;
  floatingBtn.onmouseenter = () => floatingBtn.style.transform = "scale(1.1)";
  floatingBtn.onmouseleave = () => floatingBtn.style.transform = "scale(1)";
  floatingBtn.onclick = toggleChatPanel;
  document.body.appendChild(floatingBtn);
}

function toggleChatPanel() {
  if (chatPanel && chatPanel.style.display !== "none") {
    chatPanel.style.display = "none";
  } else {
    openChatPanel();
  }
}
function loadTesseract() {
  return new Promise((resolve, reject) => {
    if (window.Tesseract) {
      resolve(window.Tesseract);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";
    script.onload = () => resolve(window.Tesseract);
    script.onerror = reject;
    document.head.appendChild(script);
  });
}
async function handleOCRUpload(file) {
  if (!file) return;

  addMessage("assistant", "Extracting text from image... Please wait a few seconds.");

  try {
    const Tesseract = await loadTesseract();

    const result = await Tesseract.recognize(file, "eng", {
      logger: (m) => {
        if (m.status === "recognizing text") {
          console.log("OCR Progress:", Math.round(m.progress * 100) + "%");
        }
      }
    });

    const extractedText = result.data.text.trim();

    if (!extractedText || extractedText.length < 10) {
      addMessage("assistant", "Could not extract clear text.\n\nTry a clearer or cropped screenshot.");
      return;
    }

    // Save extracted text so existing AI functions can use it
    pageContent = extractedText;
    currentImageBase64 = null;

    addMessage("user", "Image uploaded for OCR");
    addMessage("assistant", 
      `Text extracted successfully:\n\n${extractedText.substring(0, 700)}${extractedText.length > 700 ? "\n\n...(truncated)" : ""}\n\nNow click Give Hint or Full Solution.`
    );

  } catch (err) {
    console.error(err);
    addMessage("assistant", "OCR failed. Please try another image.");
  }
}
// Load Tesseract.js dynamically


function openChatPanel() {
  if (chatPanel) {
    chatPanel.style.display = "flex";
    return;
  }
  

  chatPanel = document.createElement("div");
  chatPanel.style.cssText = `
    position: fixed;
    bottom: 95px;
    right: 25px;
    width: 380px;
    height: 560px;
    background: #0f172a;
    color: #e2e8f0;
    border-radius: 14px;
    box-shadow: 0 12px 40px rgba(0,0,0,0.45);
    z-index: 2147483647;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    font-family: system-ui, -apple-system, sans-serif;
  `;

  chatPanel.innerHTML = `
  <div style="padding: 12px 16px; background: #1e293b; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #334155;">
    <strong style="font-size: 15px;">NEET AI Tutor</strong>
    <span id="neet-close" style="cursor:pointer; font-size:22px; line-height:1;">×</span>
  </div>

  <div id="neet-messages" style="flex:1; overflow-y:auto; padding:14px; font-size:13.5px; line-height:1.55;"></div>

  <div style="padding:10px; border-top:1px solid #334155; display:grid; grid-template-columns:1fr 1fr; gap:8px;">
    <button id="neet-analyze" style="padding:9px; background:#1e40af; color:white; border:none; border-radius:7px; cursor:pointer; font-size:13px;">Analyze Selected</button>
    <button id="neet-hint" style="padding:9px; background:#334155; color:white; border:none; border-radius:7px; cursor:pointer; font-size:13px;">Give Hint</button>
    <button id="neet-next" style="padding:9px; background:#334155; color:white; border:none; border-radius:7px; cursor:pointer; font-size:13px;">Next Hint</button>
    <button id="neet-solution" style="padding:9px; background:#334155; color:white; border:none; border-radius:7px; cursor:pointer; font-size:13px;">Full Solution</button>
    <button id="neet-summary" style="padding:9px; background:#334155; color:white; border:none; border-radius:7px; cursor:pointer; font-size:13px;">Summarize</button>
    <button id="neet-mindmap" style="padding:9px; background:#334155; color:white; border:none; border-radius:7px; cursor:pointer; font-size:13px;">Mind Map</button>
    <button id="neet-clear" style="padding:9px; background:#7f1d1d; color:white; border:none; border-radius:7px; cursor:pointer; font-size:13px; grid-column: span 2;">Clear Chat</button>
    <button id="neet-ocr" style="padding:9px; background:#7c3aed; color:white; border:none; border-radius:7px; cursor:pointer; font-size:13px;">
  Upload Image (OCR)
</button>
  </div>

  <div style="padding: 10px; border-top: 1px solid #334155; display: flex; gap: 8px;">
    <input id="neet-input" type="text" placeholder="Ask anything about the question..." 
      style="flex:1; padding:10px 12px; border-radius:8px; border:1px solid #475569; background:#1e293b; color:white; font-size:13.5px; outline:none;">
    <button id="neet-send" style="padding:10px 16px; background:#22c55e; color:white; border:none; border-radius:8px; cursor:pointer; font-weight:600;">Send</button>
  </div>
`;
  document.body.appendChild(chatPanel);

  // Event listeners
 document.getElementById("neet-close").onclick = () => chatPanel.style.display = "none";

document.getElementById("neet-analyze").onclick = analyzeSelected;
document.getElementById("neet-hint").onclick = () => sendToAI("Give me only a gentle first hint. Do not reveal the answer yet.");
document.getElementById("neet-next").onclick = () => sendToAI("Give me the next level of hint. Still do not give the full answer.");
document.getElementById("neet-solution").onclick = () => sendToAI("Now give the complete step-by-step solution with explanation, final answer, and common mistakes.");
document.getElementById("neet-summary").onclick = () => sendToAI("Summarize the content clearly for NEET preparation. Make it concise.");
document.getElementById("neet-mindmap").onclick = () => sendToAI("Create a clear hierarchical mind map of the content using simple bullet points.");
document.getElementById("neet-clear").onclick = clearChat;
// OCR Button
document.getElementById("neet-ocr").onclick = () => {
  ocrInput.click();
};

ocrInput.onchange = (e) => {
  const file = e.target.files[0];
  if (file) {
    handleOCRUpload(file);
  }
  ocrInput.value = ""; // reset so same file can be selected again
};

// Chat input
const input = document.getElementById("neet-input");
const sendBtn = document.getElementById("neet-send");

sendBtn.onclick = () => {
  const text = input.value.trim();
  if (!text) return;
  input.value = "";
  sendToAI(text);
};

input.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    sendBtn.click();
  }
});

  // Load previous messages
  renderMessages();
}

function analyzeSelected() {
  const selection = window.getSelection().toString().trim();

  if (selection.length < 15) {
    addMessage("assistant", "Please select the question text first, then click Analyze Selected.");
    return;
  }

  pageContent = selection;
  currentImageBase64 = null;
  addMessage("user", "Question selected");
  addMessage("assistant", "Question captured successfully!\n\nNow click Give Hint or Full Solution.");
}

function clearChat() {
  conversation = [];
  pageContent = "";
  currentImageBase64 = null;
  chrome.storage.local.set({ conversation: [] });
  renderMessages();
}

function addMessage(role, text) {
  conversation.push({ role, content: text });
  chrome.storage.local.set({ conversation });
  renderMessages();
}

function renderMessages() {
  const container = document.getElementById("neet-messages");
  if (!container) return;

  container.innerHTML = "";
  conversation.forEach(msg => {
    const div = document.createElement("div");
    div.style.cssText = `
      margin-bottom: 12px;
      padding: 10px 12px;
      border-radius: 8px;
      background: ${msg.role === "user" ? "#1e40af" : "#334155"};
      white-space: pre-wrap;
    `;
    div.textContent = msg.content;
    container.appendChild(div);
  });
  container.scrollTop = container.scrollHeight;
}

function askForApiKey() {
  const key = window.prompt("Enter your Groq API Key:");
  if (!key) return null;

  const trimmedKey = key.trim();
  if (!trimmedKey) return null;

  apiKey = trimmedKey;
  chrome.storage.local.set({ apiKey });
  return apiKey;
}

// ========== AI FUNCTION ==========
async function sendToAI(userMessage) {
  if (!apiKey) {
    const key = askForApiKey();
    if (!key) {
      addMessage("assistant", "API key is required.");
      return;
    }
  }

  if (!pageContent) {
    addMessage("assistant", "Please select a question and click Analyze Selected first.");
    return;
  }

  addMessage("user", userMessage);

  const systemPrompt = `You are a friendly and clear NEET tutor for Class 11 & 12 students.

Your job is to explain concepts in the simplest possible way.

STRICT FORMATTING RULES:
1. Write everything in short lines.
2. Put a blank line between every important point.
3. Never write long paragraphs.
4. Never use complicated math symbols like \\( \\) or LaTeX.
5. Write all formulas in simple readable form like:
   Force = mass × acceleration
   F = m × a
   Friction = μ × Normal force

Use this structure:

**Hint:**
- Point 1
- Point 2

**Step-by-step Solution:**

1. First simple step

2. Second simple step

3. Third simple step

**Final Answer:**
**The mass should be less than 2.23 kg**

**Common Mistakes:**
- Mistake 1
- Mistake 2

Speak simply like teaching a student.
Current question:
${pageContent.slice(0, 8000)}`;

  const messages = [
    { role: "system", content: systemPrompt },
    ...conversation.slice(-10)
  ];

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b",
        messages,
        temperature: 0.25,
        max_tokens: 1600
      })
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      const message = data?.error?.message || "Unknown API error.";
      addMessage("assistant", `API error: ${message}`);
      return;
    }

    const assistantReply = data?.choices?.[0]?.message?.content;
    if (!assistantReply) {
      addMessage("assistant", "The AI returned an empty response. Please try again.");
      return;
    }

    addMessage("assistant", assistantReply);
  } catch (err) {
    console.error(err);
    addMessage("assistant", "Network error. Please try again.");
  }
}

function removeFloatingUI() {
  if (floatingBtn) {
    floatingBtn.remove();
    floatingBtn = null;
  }
  if (chatPanel) {
    chatPanel.remove();
    chatPanel = null;
  }
}

// Also support message from popup (for toggle)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getPageContent") {
    const selection = window.getSelection().toString().trim();
    sendResponse({
      selectedText: selection,
      fullText: document.body.innerText.slice(0, 12000)
    });
  }
  if (request.action === "toggleUI") {
    if (request.isOn) createFloatingUI();
    else removeFloatingUI();
  }
  return true;
});