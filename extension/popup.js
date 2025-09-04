document.getElementById("summarizeBtn").addEventListener("click", async () => {
  const summaryDiv = document.getElementById("summary");
  const loaderDiv = document.getElementById("loader");
  const button = document.getElementById("summarizeBtn");
  
  // Show loader and disable button
  showLoader();
  
  try {
    // Get article text from content.js
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    const results = await new Promise((resolve, reject) => {
      chrome.scripting.executeScript(
        {
          target: { tabId: tab.id },
          function: extractArticleText
        },
        (results) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(results);
          }
        }
      );
    });
    
    if (!results || !results[0].result) {
      throw new Error("Could not extract text from the page.");
    }
    
    const articleText = results[0].result;
    
    if (articleText.length < 50) {
      throw new Error("Extracted text is too short. Please try on a different article page.");
    }
    
    // Call your FastAPI backend
    const response = await fetch("http://127.0.0.1:8000/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: articleText })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: "Unknown server error" }));
      throw new Error(`Server error: ${errorData.detail || response.statusText}`);
    }
    
    const data = await response.json();
    showSuccess(data.summary);
    
  } catch (error) {
    console.error("Error:", error);
    showError(error.message || "An unexpected error occurred.");
  }
  
  function showLoader() {
    summaryDiv.style.display = "none";
    loaderDiv.style.display = "block";
    button.disabled = true;
    button.textContent = "Summarizing...";
  }
  
  function showSuccess(summary) {
    loaderDiv.style.display = "none";
    summaryDiv.style.display = "block";
    summaryDiv.className = "success";
    summaryDiv.textContent = summary;
    button.disabled = false;
    button.textContent = "Summarize Article";
  }
  
  function showError(errorMessage) {
    loaderDiv.style.display = "none";
    summaryDiv.style.display = "block";
    summaryDiv.className = "error";
    summaryDiv.textContent = `Error: ${errorMessage}`;
    button.disabled = false;
    button.textContent = "Summarize Article";
  }
});

// Improved function to extract main article content
function extractArticleText() {
  // Strategy 1: Look for common article selectors
  const articleSelectors = [
    'article',
    '[role="main"]',
    '.article-body',
    '.story-body',
    '.entry-content',
    '.post-content',
    '.article-content',
    '.main-content',
    '.content',
    'main'
  ];
  
  let articleElement = null;
  
  // Try each selector until we find content
  for (const selector of articleSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      const text = element.innerText.trim();
      if (text.length > 200) { // Only consider substantial content
        articleElement = element;
        break;
      }
    }
  }
  
  // Strategy 2: If no article container found, look for the largest text block
  if (!articleElement) {
    const textBlocks = Array.from(document.querySelectorAll('div, section, article'))
      .map(el => ({
        element: el,
        text: el.innerText.trim(),
        paragraphCount: el.querySelectorAll('p').length
      }))
      .filter(block => 
        block.text.length > 300 && 
        block.paragraphCount >= 2 &&
        !block.element.querySelector('nav') && // Avoid navigation
        !block.element.classList.toString().match(/nav|menu|sidebar|footer|header/i)
      )
      .sort((a, b) => b.text.length - a.text.length);
    
    if (textBlocks.length > 0) {
      articleElement = textBlocks[0].element;
    }
  }
  
  // Strategy 3: Fallback - get paragraphs but filter out short ones and likely non-content
  if (!articleElement) {
    const paragraphs = Array.from(document.querySelectorAll('p'))
      .filter(p => {
        const text = p.innerText.trim();
        const parent = p.parentElement;
        
        // Filter out short paragraphs, navigation, ads, etc.
        return (
          text.length > 50 && // Minimum length
          !text.match(/^(Home|About|Contact|Login|Sign up|Subscribe|Follow|Share)/i) &&
          !parent.classList.toString().match(/nav|menu|sidebar|footer|header|ad|promo/i) &&
          !parent.closest('nav, header, footer, aside, [class*="nav"], [class*="menu"]')
        );
      })
      .map(p => p.innerText)
      .join('\n\n');
    
    return paragraphs || "Could not extract meaningful content.";
  }
  
  // Clean up the extracted text
  let text = articleElement.innerText;
  
  // Remove excessive whitespace and clean up
  text = text
    .replace(/\n\s*\n\s*\n/g, '\n\n') // Multiple line breaks to double
    .replace(/\t/g, ' ') // Tabs to spaces
    .replace(/ +/g, ' ') // Multiple spaces to single
    .trim();
  
  // Remove common boilerplate text patterns
  const boilerplatePatterns = [
    /Sign up here\.?/gi,
    /Subscribe.*newsletter/gi,
    /Follow us on/gi,
    /Share this article/gi,
    /Read more:/gi,
    /Related articles?:/gi,
    /Advertisement/gi,
    /© \d{4}.*$/gm // Copyright notices
  ];
  
  boilerplatePatterns.forEach(pattern => {
    text = text.replace(pattern, '');
  });
  
  return text.trim() || "Could not extract meaningful content.";
}