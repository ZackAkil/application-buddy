# 📝 Application Buddy

A Chrome extension that helps you answer questions using your uploaded documents and context with the power of Google's Gemini AI.

## Features

- **AI-Powered Answers**: Get intelligent responses to your questions using Google's Gemini AI
- **Document Upload**: Upload and use your own documents (resumes, cover letters, etc.) as context for answers
- **Custom Context**: Add additional text context to help tailor responses
- **Conversation History**: Keep track of your Q&A history and refer back to previous answers
- **Context Menu Integration**: Highlight text on any webpage and send it directly to Application Buddy
- **Individual Message Management**: Delete specific messages from your conversation history

## Installation

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the Application Buddy folder
5. The extension is now installed! You'll see the Application Buddy icon in your Chrome toolbar

## Getting Started

### Setting Up Your API Key

1. Get a Gemini API key from [Google AI Studio](https://ai.google.dev/)
2. Click on the Application Buddy icon in your Chrome toolbar
3. In the sidebar, go to the "Settings" section
4. Enter your API key and click "Save Key"

### Adding Context

There are three ways to provide context for your questions:

1. **Upload Files**: In the "Context Sources" section, use the file upload feature to add documents
2. **Add Extra Context**: Type or paste additional information in the "Add Extra Context" text area
3. **Highlight Text**: Right-click on any text on a webpage and select "Ask Application Buddy"

### Asking Questions

1. Type your question in the "Ask a Question" text area at the top of the sidebar
2. Click "Submit Question"
3. View the AI-generated answer based on your provided context and conversation history

## Using the Extension

### Managing Conversation History

- **View History**: All your questions and answers appear in the "Conversation History" section
- **Delete Individual Messages**: Click the "×" button on any message to remove it from the history
- **Clear All History**: Use the "Clear Conversation History" button in the Settings section

### Context Menu Integration

Right-click on any selected text on a webpage and choose "Ask Application Buddy" to:
- Automatically open the sidebar
- Set the selected text as your question
- Get an immediate answer

## Privacy & Data

- All your documents and context are stored locally in your browser
- Your API key is stored securely in Chrome's local storage
- No data is sent to any servers except to Google's Gemini API for processing questions

## For Developers

### Project Structure

- `manifest.json`: Chrome extension configuration
- `background.js`: Handles context menu and sidebar communication
- `sidebar.html`: Main UI for the extension
- `sidebar.js`: Core functionality for file handling and UI interactions
- `gemini-api.js`: Integration with Google's Gemini API

### Key Components

- **Storage**: Uses Chrome's `storage.local` API for persistent data
- **Communication**: Implements message passing between background script and sidebar
- **API Integration**: Modular design for easy API updates or replacements

### Development Notes

- The extension uses Manifest V3
- No build process required - pure HTML, CSS, and JavaScript
- Minimal dependencies for better performance and security

### Extending the Extension

To add new features:
1. For UI changes, modify `sidebar.html` and related styles
2. For new functionality, extend `sidebar.js` or create new modules
3. For API changes, update `gemini-api.js`
4. Update permissions in `manifest.json` if needed

## Troubleshooting

- **API Key Issues**: Ensure your Gemini API key is valid and has been saved correctly
- **Context Menu Not Working**: Make sure you've granted the extension the necessary permissions
- **File Upload Problems**: Check that your files are in supported formats (.txt, .pdf, .doc, .docx)

---

Built with ❤️ to make application processes easier.
