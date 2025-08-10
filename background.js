// Background script for Application Buddy

// When the extension icon is clicked, open the side panel
chrome.action.onClicked.addListener((tab) => {
  // Open the side panel in the current tab
  chrome.sidePanel.open({ tabId: tab.id });
});

// Create context menu item when extension is installed
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'askQuestion',
    title: 'Ask Application Buddy about this text',
    contexts: ['selection'] // Only show when text is selected
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'askQuestion' && info.selectionText) {
    console.log('Context menu clicked with text:', info.selectionText);
    
    // First, try to send a message directly to the sidebar if it's open
    chrome.runtime.sendMessage({
      action: 'processSelectedText',
      text: info.selectionText
    }, response => {
      // Check if we got a response (meaning the sidebar is open and received the message)
      const sidebarResponded = response && response.success;
      console.log('Sidebar responded:', sidebarResponded);
      
      if (!sidebarResponded) {
        // If no response, the sidebar isn't open yet, so store the text and open it
        chrome.storage.local.set({ 
          'selectedText': info.selectionText,
          'pendingQuestion': true,
          'timestamp': Date.now() // Add timestamp to ensure storage change is detected
        }, () => {
          console.log('Selected text saved to storage');
          // Open the side panel (this is a user gesture, so it's allowed)
          chrome.sidePanel.open({ tabId: tab.id });
        });
      }
    });
  }
});
