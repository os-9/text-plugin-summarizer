document.getElementById("summarizeBtn").addEventListener("click", async () => {
    // Get article text from content.js
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.scripting.executeScript(
      {
        target: { tabId: tab.id },
        function: extractArticleText
      },
      async (results) => {
        if (!results || !results[0].result) {
          document.getElementById("summary").innerText = "Could not extract text.";
          return;
        }
  
        const articleText = results[0].result;
  
        // Call your FastAPI backend
        try {
          const response = await fetch("http://127.0.0.1:8000/summarize", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: articleText })
          });
  
          const data = await response.json();
          document.getElementById("summary").innerText = data.summary;
        } catch (error) {
          document.getElementById("summary").innerText = "Error contacting API.";
        }
      }
    );
  });
  
  // Function injected into page to grab article text
  function extractArticleText() {
    // Naive version: grab all <p> text
    return Array.from(document.querySelectorAll("p"))
      .map(p => p.innerText)
      .join("\n");
  }
  