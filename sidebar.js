// Simple file upload and display functionality

// Function to check for selected text from context menu
function checkForSelectedText() {
  chrome.storage.local.get(['selectedText', 'pendingQuestion', 'pendingTimestamp'], function(result) {
    if (result.pendingQuestion && result.selectedText) {
      // Set the question input to the selected text
      const questionInput = document.getElementById('question-input');
      if (questionInput) {
        questionInput.value = result.selectedText;
        
        // Trigger the submit button click
        const submitBtn = document.getElementById('submit-question-btn');
        if (submitBtn) submitBtn.click();
        
        // Clear the selected text and pending flag
        chrome.storage.local.remove(['selectedText', 'pendingQuestion', 'pendingTimestamp']);
      }
    }
  });
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'processSelectedText' && request.text) {
    // Set the question input to the selected text
    document.getElementById('question-input').value = request.text;
    
    // Trigger the submit button click
    document.getElementById('submit-question-btn').click();
    
    // Send success response
    sendResponse({ success: true });
    return true; // Keep the message channel open for the async response
  }
  
  // Check for pending questions when receiving any message
  checkForSelectedText();
});

// Set up a listener for storage changes to detect when text is selected via context menu
chrome.storage.onChanged.addListener(function(changes, namespace) {
  if (namespace === 'local' && (changes.selectedText || changes.pendingQuestion)) {
    checkForSelectedText();
  }
});

document.addEventListener('DOMContentLoaded', function() {
  // DOM elements
  const fileInput = document.getElementById('file-input');
  const uploadBtn = document.getElementById('upload-btn');
  const extraContextInput = document.getElementById('extra-context');
  const addContextBtn = document.getElementById('add-context-btn');
  const questionInput = document.getElementById('question-input');
  const submitQuestionBtn = document.getElementById('submit-question-btn');
  const answerContainer = document.getElementById('answer-container');
  const answerText = document.getElementById('answer-text');
  const filesContainer = document.getElementById('files-container');
  const noFilesMessage = document.getElementById('no-files-message');
  const geminiApiKeyInput = document.getElementById('gemini-api-key');
  const saveApiKeyBtn = document.getElementById('save-api-key-btn');
  const apiKeyStatus = document.getElementById('api-key-status');
  const clearHistoryBtn = document.getElementById('clear-history-btn');
  const historyStatus = document.getElementById('history-status');
  const conversationHistoryContainer = document.getElementById('conversation-history');
  const noHistoryMessage = document.getElementById('no-history-message');
  
  // Array to store uploaded files
  let uploadedFiles = [];
  
  // Load files from storage when page loads
  loadFiles();
  
  // Check for selected text from context menu
  checkForSelectedText();
  
  // Load API key if available
  loadApiKey();
  
  // Display conversation history if available
  displayConversationHistory();
  
  // Add event listener to upload button
  uploadBtn.addEventListener('click', function() {
    if (fileInput.files.length > 0) {
      const file = fileInput.files[0];
      
      // Read file content
      const reader = new FileReader();
      reader.onload = function(e) {
        // Create file object with metadata and content
        const fileObj = {
          id: Date.now().toString(), // Simple unique ID
          name: file.name,
          type: file.type || 'Unknown',
          size: file.size,
          content: e.target.result,
          date: new Date().toISOString(),
          isFile: true
        };
        
        // Add to array and save
        uploadedFiles.push(fileObj);
        saveFiles();
        
        // Update display
        displayFiles();
        
        // Reset file input
        fileInput.value = '';
      };
      
      // Read as text (for text files) or data URL (for binary files)
      if (file.type.startsWith('text/')) {
        reader.readAsText(file);
      } else {
        reader.readAsDataURL(file);
      }
    }
  });
  
  // Add event listener to add context button
  addContextBtn.addEventListener('click', function() {
    const contextText = extraContextInput.value.trim();
    
    if (contextText) {
      // Create context object
      const contextObj = {
        id: Date.now().toString(), // Simple unique ID
        name: 'Extra Context',
        type: 'text/plain',
        content: contextText,
        date: new Date().toISOString(),
        isFile: false
      };
      
      // Add to array and save
      uploadedFiles.push(contextObj);
      saveFiles();
      
      // Update display
      displayFiles();
      
      // Reset text area
      extraContextInput.value = '';
    }
  });
  
  // Add event listener to submit question button
  submitQuestionBtn.addEventListener('click', async function() {
    const question = questionInput.value.trim();
    
    if (question) {
      // Show the answer container
      answerContainer.style.display = 'block';
      
      // Set loading state
      answerText.textContent = 'Getting answer...';
      
      try {
        // Get the answer from Gemini API
        const answer = await answerQuestion(question);
        
        // Display the answer
        answerText.textContent = answer;
      } catch (error) {
        console.error('Error getting answer:', error);
        answerText.textContent = "Error: Could not get an answer. Please check the console for details.";
      }
      
      // Don't clear the question input in case user wants to refine it
    }
  });
  
  // Function to answer questions using Gemini API
  async function answerQuestion(question) {
    try {
      // Show loading state
      answerText.textContent = 'Getting answer...';
      
      // Get the answer from Gemini API
      const answer = await window.geminiApi.askGemini(question, uploadedFiles);
      
      // Display the answer
      answerText.textContent = answer;
      
      // Update conversation history display
      displayConversationHistory();
      
      return answer;
    } catch (error) {
      console.error('Error getting answer:', error);
      return "Error: Could not get an answer. Please check your API key and try again.";
    }
  }
  
  // Function to check for selected text from context menu
  function checkForSelectedText() {
    chrome.storage.local.get(['selectedText', 'pendingQuestion', 'pendingTimestamp'], function(result) {
      if (result.pendingQuestion && result.selectedText) {
        // Set the question input to the selected text
        questionInput.value = result.selectedText;
        
        // Trigger the submit button click
        submitQuestionBtn.click();
        
        // Clear the selected text and pending flag
        chrome.storage.local.remove(['selectedText', 'pendingQuestion', 'pendingTimestamp']);
      }
    });
  }
  
  // Function to load API key from storage
  function loadApiKey() {
    window.geminiApi.loadGeminiApiKey().then(apiKey => {
      if (apiKey) {
        geminiApiKeyInput.value = apiKey;
      }
    });
  }
  
  // Add event listener to save API key button
  saveApiKeyBtn.addEventListener('click', function() {
    const apiKey = geminiApiKeyInput.value.trim();
    
    if (apiKey) {
      // Save the API key
      window.geminiApi.setGeminiApiKey(apiKey);
      
      // Update status
      apiKeyStatus.textContent = '✓ API key saved';
      apiKeyStatus.style.color = 'green';
    } else {
      apiKeyStatus.textContent = '✗ Please enter an API key';
      apiKeyStatus.style.color = 'red';
    }
  });
  
  // Add event listener to clear conversation history button
  clearHistoryBtn.addEventListener('click', function() {
    // Clear conversation history
    window.geminiApi.clearConversationHistory();
    
    // Update status
    historyStatus.textContent = '✓ Conversation history cleared';
    historyStatus.style.color = 'green';
    
    // Hide after 3 seconds
    setTimeout(() => {
      historyStatus.textContent = '';
    }, 3000);
    
    // Update the conversation history display
    displayConversationHistory();
  });
  
  // Function to save files to Chrome storage
  function saveFiles() {
    chrome.storage.local.set({ 'uploadedFiles': uploadedFiles }, function() {
      console.log('Files saved to storage');
    });
  }
  
  // Function to load files from Chrome storage
  function loadFiles() {
    chrome.storage.local.get(['uploadedFiles'], function(result) {
      if (result.uploadedFiles && result.uploadedFiles.length > 0) {
        uploadedFiles = result.uploadedFiles;
        displayFiles();
      }
    });
  }
  
  // Function to display files in the UI
  function displayFiles() {
    // Clear container except for the no files message
    while (filesContainer.firstChild) {
      filesContainer.removeChild(filesContainer.firstChild);
    }
    
    // Show/hide no files message
    if (uploadedFiles.length === 0) {
      filesContainer.appendChild(noFilesMessage);
      return;
    }
    
    // Add each item to the container
    uploadedFiles.forEach(function(item) {
      const fileItem = document.createElement('div');
      fileItem.className = 'file-item';
      
      // Item name/title
      const itemName = document.createElement('h3');
      itemName.textContent = item.name;
      fileItem.appendChild(itemName);
      
      // Item details
      const itemDetails = document.createElement('div');
      
      if (item.isFile) {
        // File size
        const fileSize = document.createElement('p');
        fileSize.textContent = `Size: ${formatFileSize(item.size)}`;
        itemDetails.appendChild(fileSize);
        
        // File type
        const fileType = document.createElement('p');
        fileType.textContent = `Type: ${item.type || 'Unknown'}`;
        itemDetails.appendChild(fileType);
      } else {
        // Context content
        const contextContent = document.createElement('div');
        contextContent.className = 'context-content';
        contextContent.style.whiteSpace = 'pre-wrap';
        contextContent.textContent = item.content;
        itemDetails.appendChild(contextContent);
      }
      
      // Upload date
      const itemDate = document.createElement('p');
      itemDate.textContent = `Added: ${new Date(item.date).toLocaleString()}`;
      itemDetails.appendChild(itemDate);
      
      // Delete button
      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = 'Delete';
      deleteBtn.addEventListener('click', function() {
        deleteFile(item.id);
      });
      
      // Add all elements to item
      fileItem.appendChild(itemDetails);
      fileItem.appendChild(deleteBtn);
      
      // Add item to container
      filesContainer.appendChild(fileItem);
    });
  }
  
  // Function to delete a file
  function deleteFile(fileId) {
    uploadedFiles = uploadedFiles.filter(file => file.id !== fileId);
    saveFiles();
    displayFiles();
  }
  
  // Helper function to format file size
  function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  // Function to display conversation history
  async function displayConversationHistory() {
    // Load the conversation history
    await window.geminiApi.loadConversationHistory();
    const history = window.geminiApi.getConversationHistory();
    
    // Clear the container
    while (conversationHistoryContainer.firstChild) {
      conversationHistoryContainer.removeChild(conversationHistoryContainer.firstChild);
    }
    
    // Show/hide no history message
    if (!history || history.length === 0) {
      conversationHistoryContainer.appendChild(noHistoryMessage);
      return;
    }
    
    // Add each message to the container
    history.forEach((message, index) => {
      const messageItem = document.createElement('div');
      messageItem.className = 'message-item';
      messageItem.style.marginBottom = '10px';
      messageItem.style.padding = '8px';
      messageItem.style.borderRadius = '5px';
      messageItem.style.position = 'relative'; // For positioning the delete button
      
      // Style based on role
      if (message.role === 'user') {
        messageItem.style.backgroundColor = '#e6f7ff';
        messageItem.style.textAlign = 'right';
        messageItem.style.borderRight = '3px solid #1890ff';
        messageItem.style.paddingRight = '25px'; // Space for delete button
      } else {
        messageItem.style.backgroundColor = '#f0f0f0';
        messageItem.style.textAlign = 'left';
        messageItem.style.borderLeft = '3px solid #52c41a';
        messageItem.style.paddingRight = '25px'; // Space for delete button
      }
      
      // Message role
      const roleLabel = document.createElement('div');
      roleLabel.style.fontWeight = 'bold';
      roleLabel.style.marginBottom = '3px';
      roleLabel.textContent = message.role === 'user' ? 'You:' : 'AI:';
      messageItem.appendChild(roleLabel);
      
      // Message content
      const content = document.createElement('div');
      content.style.whiteSpace = 'pre-wrap';
      content.style.wordBreak = 'break-word';
      content.textContent = message.content;
      messageItem.appendChild(content);
      
      // Delete button
      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = '×'; // × symbol for delete
      deleteBtn.style.position = 'absolute';
      deleteBtn.style.top = '5px';
      deleteBtn.style.right = '5px';
      deleteBtn.style.padding = '0 5px';
      deleteBtn.style.backgroundColor = 'transparent';
      deleteBtn.style.border = 'none';
      deleteBtn.style.fontSize = '16px';
      deleteBtn.style.cursor = 'pointer';
      deleteBtn.style.color = '#999';
      deleteBtn.style.borderRadius = '50%';
      deleteBtn.title = 'Delete this message';
      
      // Hover effect
      deleteBtn.addEventListener('mouseover', function() {
        deleteBtn.style.backgroundColor = '#ff4d4f';
        deleteBtn.style.color = 'white';
      });
      
      deleteBtn.addEventListener('mouseout', function() {
        deleteBtn.style.backgroundColor = 'transparent';
        deleteBtn.style.color = '#999';
      });
      
      // Delete functionality
      deleteBtn.addEventListener('click', function() {
        // Delete the message
        window.geminiApi.deleteConversationMessage(index);
        // Refresh the conversation history display
        displayConversationHistory();
      });
      
      messageItem.appendChild(deleteBtn);
      
      // Add to container
      conversationHistoryContainer.appendChild(messageItem);
    });
    
    // Scroll to the bottom
    conversationHistoryContainer.scrollTop = conversationHistoryContainer.scrollHeight;
  }
});
