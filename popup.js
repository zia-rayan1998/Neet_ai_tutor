// const toggle = document.getElementById("toggle");
// const status = document.getElementById("status");
// const analyzeBtn = document.getElementById("analyzeBtn");
// const hintBtn = document.getElementById("hintBtn");
// const nextHintBtn = document.getElementById("nextHintBtn");
// const solutionBtn = document.getElementById("solutionBtn");
// const summarizeBtn = document.getElementById("summarizeBtn");
// const mindmapBtn = document.getElementById("mindmapBtn");
// const chat = document.getElementById("chat");
// const userInput = document.getElementById("userInput");
// const sendBtn = document.getElementById("sendBtn");

// // Create Upload Screenshot button
// const uploadBtn = document.createElement("button");
// uploadBtn.textContent = "Upload Screenshot";
// uploadBtn.id = "uploadBtn";
// document.querySelector(".buttons").appendChild(uploadBtn);

// const imageInput = document.createElement("input");
// imageInput.type = "file";
// imageInput.accept = "image/*";
// imageInput.style.display = "none";
// document.body.appendChild(imageInput);

// let isOn = false;
// let conversation = [];
// let pageContent = "";
// let apiKey = "";
// let currentImageBase64 = null;

// // ========== LOAD SAVED DATA ==========
// chrome.storage.local.get(["isOn", "conversation", "apiKey"], (data) => {
//   isOn = data.isOn || false;
//   conversation = data.conversation || [];
//   apiKey = data.apiKey || "";
//   updateUI();
//   renderChat();
// });

// // ========== TOGGLE ==========
// toggle.addEventListener("change", () => {
//   isOn = toggle.checked;
//   chrome.storage.local.set({ isOn });

//   // Notify content script
//   chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
//     if (tabs[0]) {
//       chrome.tabs.sendMessage(tabs[0].id, {
//         action: "toggleUI",
//         isOn: isOn
//       });
//     }
//   });

//   updateUI();
// });
// // ========== CHAT ==========
// function addMessage(role, text) {
//   conversation.push({ role, content: text });
//   chrome.storage.local.set({ conversation });
//   renderChat();
// }

// function renderChat() {
//   chat.innerHTML = "";
//   conversation.forEach(msg => {
//     const div = document.createElement("div");
//     div.className = `message ${msg.role}`;
//     let content = msg.content
//       .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
//       .replace(/\n/g, "<br>");
//     div.innerHTML = content;
//     chat.appendChild(div);
//   });
//   chat.scrollTop = chat.scrollHeight;
// }

// // ========== ANALYZE PAGE (TEXT) ==========
// analyzeBtn.addEventListener("click", async () => {
//   // Clear previous conversation and content
//   conversation = [];
//   pageContent = "";
//   currentImageBase64 = null;
//   chrome.storage.local.set({ conversation: [] });
//   renderChat();

//   addMessage("user", "Analyze the selected question");

//   const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

//   chrome.tabs.sendMessage(tab.id, { action: "getPageContent" }, (response) => {
//     if (chrome.runtime.lastError || !response) {
//       addMessage("assistant", "Error reading page. Please refresh the page and try again.");
//       return;
//     }

//     // Prefer selected text
//     if (response.selectedText && response.selectedText.trim().length > 10) {
//       pageContent = response.selectedText.trim();
//       addMessage("assistant", "Selected question captured successfully!\n\nYou can now ask for Hint or Full Solution.");
//     } else {
//       pageContent = response.fullText || "";
//       addMessage("assistant", "No text selected.\n\nPlease select the specific question on the page first, then click Analyze Page again.");
//     }
//   });
// });
// // ========== UPLOAD SCREENSHOT ==========
// uploadBtn.addEventListener("click", () => {
//   if (!isOn) return;
//   imageInput.click();
// });

// imageInput.addEventListener("change", (e) => {
//   const file = e.target.files[0];
//   if (!file) return;

//   const reader = new FileReader();
//   reader.onload = () => {
//     currentImageBase64 = reader.result;
//     pageContent = "";
//     addMessage("user", "Screenshot uploaded");
//     addMessage("assistant", "Screenshot received.\nNow click Give Hint or Full Solution.");
//   };
//   reader.readAsDataURL(file);
// });

// // ========== BUTTON ACTIONS ==========
// hintBtn.addEventListener("click", () => sendToAI("Give me only a gentle first hint. Do not reveal the answer yet."));
// nextHintBtn.addEventListener("click", () => sendToAI("Give me the next level of hint. Still do not give the full answer."));
// solutionBtn.addEventListener("click", () => sendToAI("Now give the complete step-by-step solution with explanation, final answer, and common mistakes."));
// summarizeBtn.addEventListener("click", () => sendToAI("Summarize the content clearly for NEET preparation."));
// mindmapBtn.addEventListener("click", () => sendToAI("Create a clear hierarchical mind map using bullet points."));

// sendBtn.addEventListener("click", () => {
//   const text = userInput.value.trim();
//   if (!text) return;
//   userInput.value = "";
//   sendToAI(text);
// });

// userInput.addEventListener("keypress", (e) => {
//   if (e.key === "Enter") sendBtn.click();
// });

// // ========== AI CALL ==========
// async function sendToAI(userMessage) {
//   if (!apiKey) {
//     const key = prompt("Enter your Groq API Key:");
//     if (!key) {
//       addMessage("assistant", "API key is required.");
//       return;
//     }
//     apiKey = key.trim();
//     chrome.storage.local.set({ apiKey });
//   }

//   addMessage("user", userMessage);

//   const systemPrompt = `You are a friendly and clear NEET tutor for Class 11 & 12 students.

// Your job is to explain concepts in the simplest possible way.

// STRICT FORMATTING RULES (must follow):

// 1. Write everything in short lines.
// 2. Put a blank line between every important point.
// 3. Never write long paragraphs.
// 4. Never use complicated math symbols like \( \), \\, or LaTeX.
// 5. Write all formulas in simple readable form like this:

//    Force = mass × acceleration
//    F = m × a
//    Friction = μ × Normal force
//    Normal force = m × g × cosθ

// 6. Use this exact structure:

// **Hint:**
// - Point 1
// - Point 2

// **Step-by-step Solution:**

// 1. First simple step

// 2. Second simple step

// 3. Third simple step

// **Final Answer:**
// **The mass should be less than 2.23 kg**

// **Common Mistakes:**
// - Mistake 1
// - Mistake 2

// Extra Rules:
// - Speak like you are teaching a student sitting next to you.
// - Avoid difficult English words.
// - Keep every line short and easy to understand.
// - If the question has options, clearly mention the correct option.

// Current content:
// ${pageContent.slice(0, 8000)}`;

//   try {
//     // Choose model based on whether image is present
//     const hasImage = !!currentImageBase64;
//     const model = hasImage ? "qwen/qwen3.8-27b" : "openai/gpt-oss-20b";

//     let messages = [
//       { role: "system", content: systemPrompt },
//       ...conversation.slice(-6).map(m => ({ role: m.role, content: m.content })),
//     ];

//     if (hasImage) {
//       messages.push({
//         role: "user",
//         content: [
//           { type: "text", text: userMessage + "\n\nPlease solve / explain the question shown in the image." },
//           { type: "image_url", image_url: { url: currentImageBase64 } }
//         ]
//       });
//     } else {
//       messages.push({ role: "user", content: userMessage });
//     }

//     const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
//       method: "POST",
//       headers: {
//         "Authorization": `Bearer ${apiKey}`,
//         "Content-Type": "application/json"
//       },
//       body: JSON.stringify({
//         model: model,
//         messages: messages,
//         temperature: 0.25,
//         max_tokens: 1800
//       })
//     });

//     const data = await response.json();

//     if (data.error) {
//       addMessage("assistant", "Error: " + data.error.message);
//       return;
//     }

//     const reply = data.choices[0].message.content;
//     addMessage("assistant", reply);

//   } catch (err) {
//     addMessage("assistant", "Network error. Please check your internet.");
//     console.error(err);
//   }
// }



const toggle = document.getElementById("toggle");
const status = document.getElementById("status");

chrome.storage.local.get(["isOn"], (data) => {
  const isOn = data.isOn || false;
  toggle.checked = isOn;
  status.textContent = isOn ? "ON" : "OFF";
  status.style.color = isOn ? "#4ade80" : "#f87171";
});

toggle.addEventListener("change", () => {
  const isOn = toggle.checked;
  chrome.storage.local.set({ isOn });

  status.textContent = isOn ? "ON" : "OFF";
  status.style.color = isOn ? "#4ade80" : "#f87171";

  // Notify the current tab
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: "toggleUI",
        isOn: isOn
      }).catch(() => {});
    }
  });
});