# Site Watch Time Tracker - Chrome Extension

## Features

- **Real-time tracking**: Automatically tracks your time spent on websites
- **Detailed statistics**: View watch time, sites visited, and more
- **Auto-pause**: Pauses tracking when inactive
- **Clear data**: Easily clear all tracking data

## Installation & Build

### 1. Clone the Repository
```bash
git clone https://github.com/luciansurdu66/FD-2025
```

### 2. Install Dependencies
If your extension uses any build tools or dependencies (e.g., TypeScript, bundlers), install them:
```bash
npm install
```

### 3. Build the Extension (if needed)
If you have a build step (e.g., TypeScript compilation, bundling), run:
```bash
npm run build
```
- This should output all necessary files (HTML, JS, manifest, icons, etc.) into a `dist/` or the project root.
- **If you do not have a build step, skip this.**

### 4. Prepare the Extension Folder
- Make sure the following files/folders are present in the folder you will load into Chrome:
  - `manifest.json`
  - `background.js`
  - `content.js`
  - `popup.html`, `popup.js`
  - `detailed.html`, `detailed.js`
  - `libs/chart.min.js`
  - `icons/` (with icon images)
  - `styles/` (with CSS files)
  - Any other files referenced in your manifest or HTML
- If you have a `dist/` folder, use that as the folder to load in Chrome. Otherwise, use the project root.

## Load the Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in the top right)
3. Click **Load unpacked**
4. Select the folder containing your extension files (see above)
5. The extension should now appear in your extensions list
6. (Optional) Pin the extension for easy access

## Usage

1. Click the extension icon in your Chrome toolbar
2. Click **Start Tracking** to begin monitoring your browsing
3. Browse normally – the extension will track your time automatically
4. View your stats in the popup or detailed view

## Features Overview

### Popup Interface
- **Status Indicator**: Shows if tracking is active (green) or paused (red)
- **Today's Summary**: Total time and sites visited today
- **Top Sites**: Quick view of your most visited sites
- **Settings**: Configure auto-pause and other preferences

### Detailed Statistics
- **Summary Cards**: Total watch time, sites tracked, visits, and average session
- **Charts**: Time distribution pie chart and daily activity line chart
- **Sites Table**: Complete list of all tracked sites with detailed metrics

### Settings
- **Auto-pause**: Automatically pause tracking after inactivity
- **Pause Threshold**: Set how many minutes of inactivity before pausing
- **Data Management**: Clear all tracking data if needed

## Technical Details

### Architecture

The extension follows a modular architecture with clear separation of concerns:

```
├── manifest.json          # Extension configuration
├── background.js          # Service worker for tab management
├── content.js             # Content script for activity detection
├── popup.html/js          # Popup interface
├── detailed.html/js       # Detailed statistics view
├── libs/                  # Third-party libraries (e.g., chart.min.js)
├── icons/                 # Extension icons
├── styles/                # CSS files
├── src/
│   ├── types/             # TypeScript type definitions
│   └── utils/             # Utility classes (Storage, TimeTracker)
└── README.md
```

### Data Storage
- **Local Storage**: Watch time statistics and daily data
- **Sync Storage**: User settings and preferences

### Privacy
- **No data collection**: All data stays on your device
- **No external servers**: No data is sent to external services
- **Local processing**: All analytics are computed locally
- **User control**: You can clear all data at any time

## Development

### Prerequisites
- Chrome browser
- Node.js and npm (if using build tools)
- Basic knowledge of JavaScript/TypeScript
- Understanding of Chrome Extension APIs

---

**For questions or contributions, open an issue or pull request on GitHub!**

