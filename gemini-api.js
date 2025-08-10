// Gemini API integration for Application Buddy

/**
 * Configuration object for Gemini API
 */
const geminiConfig = {
  apiKey: '', // Will be set by user later
  apiEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
  model: 'gemini-2.0-flash'
};

// Store conversation history
let conversationHistory = [];

/**
 * Set the API key for Gemini
 * @param {string} apiKey - The API key to use for Gemini requests
 */
function setGeminiApiKey(apiKey) {
  geminiConfig.apiKey = apiKey;
  // Save to storage for persistence
  chrome.storage.local.set({ 'geminiApiKey': apiKey });
}

/**
 * Load the API key from storage if available
 * @returns {Promise} Promise that resolves when the API key is loaded
 */
function loadGeminiApiKey() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['geminiApiKey'], function(result) {
      if (result.geminiApiKey) {
        geminiConfig.apiKey = result.geminiApiKey;
      }
      resolve(geminiConfig.apiKey);
    });
  });
}

/**
 * Load conversation history from storage
 * @returns {Promise<Array>} Promise that resolves with the conversation history
 */
function loadConversationHistory() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['conversationHistory'], function(result) {
      if (result.conversationHistory) {
        conversationHistory = result.conversationHistory;
      }
      resolve(conversationHistory);
    });
  });
}

/**
 * Save conversation history to storage
 */
function saveConversationHistory() {
  chrome.storage.local.set({ 'conversationHistory': conversationHistory });
}

/**
 * Add a message to the conversation history
 * @param {string} role - The role of the message sender ('user' or 'model')
 * @param {string} content - The message content
 */
function addToConversationHistory(role, content) {
  // Limit history to last 10 exchanges to avoid token limits
  if (conversationHistory.length > 20) {
    conversationHistory = conversationHistory.slice(-20);
  }
  
  conversationHistory.push({
    role: role,
    content: content
  });
  
  // Save to storage
  saveConversationHistory();
}

/**
 * Clear conversation history
 */
function clearConversationHistory() {
  conversationHistory = [];
  saveConversationHistory();
}

/**
 * Delete a specific message from conversation history by index
 * @param {number} index - The index of the message to delete
 */
function deleteConversationMessage(index) {
  if (index >= 0 && index < conversationHistory.length) {
    // Remove the message at the specified index
    conversationHistory.splice(index, 1);
    saveConversationHistory();
    return true;
  }
  return false;
}

/**
 * Ask a question to Gemini API
 * @param {string} question - The question to ask
 * @param {Array} context - Optional array of context items (files and extra context)
 * @returns {Promise<string>} Promise that resolves with the answer
 */
async function askGemini(question, context = []) {
  // Make sure we have an API key
  const apiKey = await loadGeminiApiKey();
  if (!apiKey) {
    return "Please set your Gemini API key in the extension settings.";
  }

  try {
    // Load conversation history
    await loadConversationHistory();
    
    // Prepare context from uploaded files and extra context
    let contextText = '';
    if (context && context.length > 0) {
      contextText = "Here is some context that might help answer the question:\n\n";
      
      context.forEach(item => {
        if (item.isFile) {
          contextText += `File: ${item.name}\n${item.content}\n\n`;
        } else {
          contextText += `Extra Context:\n${item.content}\n\n`;
        }
      });
      
      contextText += "Based on the above context and our conversation history, please answer the following question:\n\n";
    }

    // Add the current question to history
    addToConversationHistory('user', question);
    
    // Prepare the conversation for the API
    const messages = [];
    
    // Add system message with context if available
    if (contextText) {
      messages.push({
        role: 'user',
        parts: [{ text: contextText }]
      });
      
      messages.push({
        role: 'model',
        parts: [{ text: "I'll help you answer based on this context." }]
      });
    }
    
    // Add conversation history
    for (let i = 0; i < conversationHistory.length - 1; i++) { // Exclude the last one we just added
      messages.push({
        role: conversationHistory[i].role,
        parts: [{ text: conversationHistory[i].content }]
      });
    }
    
    // Add the current question
    messages.push({
      role: 'user',
      parts: [{ text: question }]
    });

    // Prepare the request payload
    const payload = {
      contents: messages.length > 0 ? messages : [
        {
          parts: [
            {
              text: contextText + question
            }
          ]
        }
      ]
    };

    // Make the API request
    const response = await fetch(geminiConfig.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': apiKey
      },
      body: JSON.stringify(payload)
    });

    // Parse the response
    const data = await response.json();
    
    // Check for errors
    if (!response.ok) {
      console.error('Gemini API error:', data);
      return `Error from Gemini API: ${data.error?.message || 'Unknown error'}`;
    }

    // Extract the answer text
    if (data.candidates && data.candidates.length > 0 && 
        data.candidates[0].content && 
        data.candidates[0].content.parts && 
        data.candidates[0].content.parts.length > 0) {
      const answer = data.candidates[0].content.parts[0].text;
      
      // Add the answer to conversation history
      addToConversationHistory('model', answer);
      
      return answer;
    } else {
      return "Sorry, I couldn't generate an answer.";
    }
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    return `Error: ${error.message}`;
  }
}

/**
 * Get the current conversation history
 * @returns {Array} The conversation history
 */
function getConversationHistory() {
  return conversationHistory;
}

// Export functions for use in other files
window.geminiApi = {
  askGemini,
  setGeminiApiKey,
  loadGeminiApiKey,
  clearConversationHistory,
  deleteConversationMessage,
  getConversationHistory,
  loadConversationHistory
};
