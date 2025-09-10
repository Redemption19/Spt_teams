Prompt: Build a Cross-Platform Desktop Monitoring Application
1. High-Level Objective
Your primary task is to create a complete, functional, and cross-platform desktop application using Electron. This application will serve as a monitoring agent for our existing workspace management system. It must securely authenticate users against our current Firebase backend, track their work activity, capture their screen periodically, and upload this data to our Firebase project. Additionally, it will integrate Google's Gemini AI to provide intelligent summaries of work sessions based on the captured screenshots.

2. Context & Existing Infrastructure
You have access to the codebase of our primary workspace management system, which is a Next.js web application using Firebase for:

Authentication: Firebase Authentication (Email/Password & Google).

Database: Firestore for all application data.

Storage: Firebase Storage for file uploads.

Storage: Firebase Storage for file uploads.

The desktop application you build must integrate seamlessly with this existing Firebase project. The core challenge we are solving is the inability of a web browser to perform silent, periodic screen captures for monitoring purposes, which necessitates a native desktop solution.

3. Technology Stack Specification
Framework: Electron

Language: JavaScript (ES6+)

Backend Integration: Firebase SDK for Web (v8 or higher)

AI Integration: Google Generative AI SDK (@google/generative-ai)

Local Storage: electron-store for persisting configuration.

Build Tool: electron-forge

4. Detailed File & Feature Breakdown
You are to generate a complete project within a directory named desktop-monitoring-app. The project must contain the following files, each with the specified functionality:

File 1: package.json
Purpose: Define project metadata, dependencies, and scripts.

Dependencies:

electron-store: For local data persistence.

firebase: For backend communication.

@google/generative-ai: For AI-powered summaries.

node-machine-id: To uniquely identify the device.

Dev Dependencies:

electron: The core framework.

@electron-forge/cli and related makers (zip, squirrel).

Scripts:

start: To run the app in development mode (electron .).

make: To build the application into a distributable package.

File 2: main.js (Electron Main Process)
Purpose: The application's entry point and backend.

Responsibilities:

Create and manage the BrowserWindow.

Set up IPC (Inter-Process Communication) handlers using ipcMain.

IPC Handlers:

get-store-value, set-store-value: To interact with electron-store.

get-machine-id: To get a unique device identifier.

start-monitoring, stop-monitoring: To control the setInterval for screen captures.

Implement the captureScreen function using desktopCapturer to take screenshots of the primary display and send the data URL to the renderer process.

File 3: preload.js
Purpose: Securely bridge the gap between the Electron main process and the renderer process.

Responsibilities:

Use contextBridge.exposeInMainWorld to create a secure electronAPI object.

Expose all functions needed by the renderer, such as getStoreValue, setStoreValue, startMonitoring, stopMonitoring, and an event listener for onScreenshotCaptured.

File 4: index.html
Purpose: The main and only UI view for the application.

Structure:

A single-page interface that dynamically shows/hides containers based on auth state.

Login Container (#login-container):

A form (#firebase-config-form) to input and save Firebase configuration details on the first run.

A form (#gemini-config-form) to input and save the Gemini API key.

A login form (#login-form) for user email and password.

Dashboard Container (#dashboard-container):

Displays the logged-in user's email.

Shows the current monitoring status ("Active" or "Idle").

Displays a running timer for the total active work time.

Gemini Summary Section:

A button (#generate-summary-btn) to trigger the AI summary.

A loading indicator (#summary-loading) to show while the summary is being generated.

A display area (#summary-output) to show the generated text from Gemini.

A logout button.

File 5: styles.css
Purpose: Style the UI.

Requirements:

Create a clean, modern, and professional look.

Ensure a clear distinction between different states (e.g., "Active" status in green, "Idle" in orange).

Include styles for a loading spinner for the Gemini summary generation.

File 6: renderer.js (Renderer Process)
Purpose: Handle all UI logic and user interaction.

Responsibilities:

On startup, check electron-store via the preload script for saved Firebase and Gemini configurations. If they don't exist, show the respective setup forms.

Initialize the Firebase SDK using the saved configuration.

Handle user login via Firebase Authentication.

Upon successful login, switch the view from the login container to the dashboard container and initialize the monitoring services.

Handle logout, which should stop monitoring and return to the login view.

Gemini Summary Logic:

When the "Generate Summary" button is clicked, get the array of captured screenshots from the monitoring.js module.

Show the loading indicator.

Call the gemini-service.js module to generate the summary.

Display the returned summary text or any errors in the UI.

Hide the loading indicator.

File 7: monitoring.js
Purpose: Core service for all monitoring activities.

Responsibilities:

Activity Tracking: Add global event listeners for mousemove and keydown. Maintain a lastActivityTime timestamp.

Idle Detection: Run a setInterval to check if the time since lastActivityTime has exceeded an idle threshold (e.g., 5 minutes). Update the UI status accordingly.

Work Timer: Run a setInterval that increments a totalWorkTime counter every second, but only if the user is not idle. Update the timer in the UI.

Screenshot Handling:

Listen for the screenshot-captured event from the main process.

Store the incoming screenshot data URLs in an in-memory array (capturedScreenshots).

Upload the screenshot to Firebase Storage in the screenshots/{userId}/{timestamp}.png path.

Log the screenshot metadata (URL, timestamp, machine ID) to a activityLogs collection in Firestore.

Provide an exported function getCapturedScreenshots() for the renderer to retrieve the screenshots for the AI summary.

File 8: gemini-service.js (New File)
Purpose: Isolate all interactions with the Google Gemini API.

Responsibilities:

initializeGemini(apiKey): A function to initialize the GoogleGenerativeAI SDK with the user-provided key.

generateSummaryFromScreenshots(screenshots):

This function will take an array of screenshot data URLs.

It must convert each data URL into the inlineData format required by the Gemini API.

It will use the gemini-2.5-flash-preview-05-20 model.

It must construct a prompt that instructs the model to analyze the screenshots and provide a concise, bulleted summary of the work performed.

It will handle the API call and return the generated text summary.

It must include robust error handling.

File 9: README.md
Purpose: Provide clear instructions for developers.

Content:

Prerequisites (Node.js).

Step-by-step setup instructions (install dependencies, configure Firebase).

How to run the application in development mode.

How to build a distributable production version.

5. Final Instructions
Ensure all generated code is complete, runnable, and free of placeholders.

The final output should be a single set of files organized within the desktop-monitoring-app/ directory.

Pay close attention to the interaction between the main, preload, and renderer scripts, ensuring secure data flow.