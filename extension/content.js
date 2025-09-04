// content.js - Floating summary icon for news sites
(function() {
  'use strict';

  // News site domains and patterns
  const newsSitePatterns = [
    // Major news outlets
    'reuters.com', 'bbc.com', 'cnn.com', 'nytimes.com', 'washingtonpost.com',
    'theguardian.com', 'wsj.com', 'bloomberg.com', 'ap.org', 'npr.org',
    'reuters.co.uk', 'news.google.com', 'abcnews.go.com', 'cbsnews.com',
    'nbcnews.com', 'foxnews.com', 'usatoday.com', 'latimes.com',
    'chicagotribune.com', 'nydailynews.com', 'nypost.com',
    // Tech news
    'techcrunch.com', 'theverge.com', 'wired.com', 'arstechnica.com',
    'engadget.com', 'gizmodo.com', 'mashable.com',
    // Business news
    'cnbc.com', 'marketwatch.com', 'fortune.com', 'businessinsider.com',
    'forbes.com', 'economist.com', 'ft.com',
    // International
    'aljazeera.com', 'dw.com', 'euronews.com', 'france24.com'
  ];

  // Article content indicators
  const articleIndicators = [
    'article', '.article', '[role="article"]', '.story', '.post',
    '.entry', '.content article', 'main article'
  ];

  // Check if current site is a news site
  function isNewsSite() {
    const hostname = window.location.hostname.toLowerCase();
    return newsSitePatterns.some(pattern => 
      hostname.includes(pattern) || hostname.endsWith(pattern)
    );
  }

  // Check if page has article content
  function hasArticleContent() {
    // Look for article elements
    for (const selector of articleIndicators) {
      const element = document.querySelector(selector);
      if (element && element.innerText.trim().length > 500) {
        return true;
      }
    }

    // Check for multiple paragraphs (likely article)
    const paragraphs = document.querySelectorAll('p');
    const longParagraphs = Array.from(paragraphs).filter(p => 
      p.innerText.trim().length > 100
    );
    
    return longParagraphs.length >= 3;
  }

  // Create floating summary icon
  function createSummaryIcon() {
    const icon = document.createElement('div');
    icon.id = 'ai-summary-icon';
    icon.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" stroke-width="2"/>
        <path d="M8 8h8M8 12h6M8 16h4" stroke="currentColor" stroke-width="1.5"/>
        <circle cx="18" cy="6" r="3" fill="#4285f4"/>
      </svg>
    `;

    // Styles for the floating icon
    Object.assign(icon.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      width: '50px',
      height: '50px',
      backgroundColor: '#ffffff',
      borderRadius: '50%',
      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      cursor: 'pointer',
      zIndex: '10000',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#333',
      border: '2px solid #e0e0e0',
      transition: 'all 0.3s ease',
      opacity: '0.9'
    });

    // Hover effects
    icon.addEventListener('mouseenter', () => {
      icon.style.transform = 'scale(1.1)';
      icon.style.boxShadow = '0 6px 25px rgba(0,0,0,0.2)';
    });

    icon.addEventListener('mouseleave', () => {
      icon.style.transform = 'scale(1)';
      icon.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)';
    });

    return icon;
  }

  // Create summary modal
  function createSummaryModal() {
    const modal = document.createElement('div');
    modal.id = 'ai-summary-modal';
    modal.innerHTML = `
      <div class="modal-backdrop" style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        z-index: 10001;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div class="modal-content" style="
          background: white;
          border-radius: 12px;
          padding: 24px;
          max-width: 500px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
          position: relative;
          box-shadow: 0 20px 40px rgba(0,0,0,0.3);
        ">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h3 style="margin: 0; color: #333; font-size: 18px;">Article Summary</h3>
            <button id="close-modal" style="
              background: none;
              border: none;
              font-size: 24px;
              cursor: pointer;
              color: #666;
              padding: 0;
              width: 30px;
              height: 30px;
              display: flex;
              align-items: center;
              justify-content: center;
            ">&times;</button>
          </div>
          <div id="summary-content" style="
            min-height: 100px;
            line-height: 1.6;
            color: #444;
            font-size: 14px;
          ">
            <div id="summary-loader" style="
              display: flex;
              flex-direction: column;
              align-items: center;
              padding: 30px;
              color: #666;
            ">
              <div style="
                border: 3px solid #f3f3f3;
                border-top: 3px solid #4285f4;
                border-radius: 50%;
                width: 30px;
                height: 30px;
                animation: spin 1s linear infinite;
                margin-bottom: 15px;
              "></div>
              <div>Analyzing article and generating summary...</div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Add spinner animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);

    return modal;
  }

  // Extract article text (same function as popup)
  function extractArticleText() {
    const articleSelectors = [
      'article', '[role="main"]', '.article-body', '.story-body',
      '.entry-content', '.post-content', '.article-content',
      '.main-content', '.content', 'main'
    ];
    
    let articleElement = null;
    
    for (const selector of articleSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        const text = element.innerText.trim();
        if (text.length > 200) {
          articleElement = element;
          break;
        }
      }
    }
    
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
          !block.element.querySelector('nav') &&
          !block.element.classList.toString().match(/nav|menu|sidebar|footer|header/i)
        )
        .sort((a, b) => b.text.length - a.text.length);
      
      if (textBlocks.length > 0) {
        articleElement = textBlocks[0].element;
      }
    }
    
    if (!articleElement) {
      const paragraphs = Array.from(document.querySelectorAll('p'))
        .filter(p => {
          const text = p.innerText.trim();
          const parent = p.parentElement;
          return (
            text.length > 50 &&
            !text.match(/^(Home|About|Contact|Login|Sign up|Subscribe|Follow|Share)/i) &&
            !parent.classList.toString().match(/nav|menu|sidebar|footer|header|ad|promo/i) &&
            !parent.closest('nav, header, footer, aside, [class*="nav"], [class*="menu"]')
          );
        })
        .map(p => p.innerText)
        .join('\n\n');
      
      return paragraphs || "Could not extract meaningful content.";
    }
    
    let text = articleElement.innerText;
    text = text
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .replace(/\t/g, ' ')
      .replace(/ +/g, ' ')
      .trim();
    
    const boilerplatePatterns = [
      /Sign up here\.?/gi, /Subscribe.*newsletter/gi, /Follow us on/gi,
      /Share this article/gi, /Read more:/gi, /Related articles?:/gi,
      /Advertisement/gi, /© \d{4}.*$/gm
    ];
    
    boilerplatePatterns.forEach(pattern => {
      text = text.replace(pattern, '');
    });
    
    return text.trim() || "Could not extract meaningful content.";
  }

  // Summarize article
  async function summarizeArticle() {
    try {
      const articleText = extractArticleText();
      
      if (articleText.length < 50) {
        throw new Error("Could not extract enough text from this article.");
      }

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
      return data.summary;
    } catch (error) {
      throw error;
    }
  }

  // Initialize the floating icon
  function init() {
    // Only show on news sites with article content
    if (!isNewsSite() || !hasArticleContent()) {
      return;
    }

    // Don't add multiple icons
    if (document.getElementById('ai-summary-icon')) {
      return;
    }

    const icon = createSummaryIcon();
    
    icon.addEventListener('click', async () => {
      // Remove existing modal if any
      const existingModal = document.getElementById('ai-summary-modal');
      if (existingModal) {
        existingModal.remove();
      }

      const modal = createSummaryModal();
      document.body.appendChild(modal);

      // Close modal handlers
      const closeModal = () => modal.remove();
      modal.querySelector('#close-modal').addEventListener('click', closeModal);
      modal.querySelector('.modal-backdrop').addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-backdrop')) closeModal();
      });

      // Summarize article
      try {
        const summary = await summarizeArticle();
        modal.querySelector('#summary-loader').style.display = 'none';
        modal.querySelector('#summary-content').innerHTML = `
          <div style="background: #f8f9fa; padding: 16px; border-radius: 8px; border-left: 4px solid #4285f4;">
            ${summary}
          </div>
        `;
      } catch (error) {
        modal.querySelector('#summary-loader').style.display = 'none';
        modal.querySelector('#summary-content').innerHTML = `
          <div style="background: #fce8e6; padding: 16px; border-radius: 8px; border-left: 4px solid #d93025; color: #d93025;">
            <strong>Error:</strong> ${error.message}
          </div>
        `;
      }
    });

    document.body.appendChild(icon);
  }

  // Run when page loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Re-run on navigation (for SPAs)
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      setTimeout(init, 1000); // Delay for content to load
    }
  }).observe(document, { subtree: true, childList: true });

})();