# Site Watch Time Tracker - Chrome Extension

## Features

- **Real-time tracking**: Automatically tracks your time spent on websites
- **Detailed statistics**: View watch time, sites visited, and more
- **Auto-pause**: Pauses tracking when inactive
- **Clear data**: Easily clear all tracking data

### Method 1: Load Unpacked Extension (Development)

1. **Clone or download this repository**
   ```bash
   git clone <repository-url>
   cd site-watch-time-tracker
   ```

2. **Open Chrome Extensions Page**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top right corner

3. **Load the Extension**
   - Click "Load unpacked"
   - Select the folder containing the extension files
   - The extension should now appear in your extensions list

4. **Pin the Extension**
   - Click the puzzle piece icon in Chrome's toolbar
   - Find "Site Watch Time Tracker" and click the pin icon

### Method 2: Chrome Web Store (Future)
*This extension will be available on the Chrome Web Store once published.*

## Usage

### Getting Started

1. **Click the extension icon** in your Chrome toolbar
2. **Click "Start Tracking"** to begin monitoring your browsing
3. **Browse normally** - the extension will track your time automatically
4. **View your stats** in the popup or detailed view

### Features Overview

#### Popup Interface
- **Status Indicator**: Shows if tracking is active (green) or paused (red)
- **Today's Summary**: Total time and sites visited today
- **Top Sites**: Quick view of your most visited sites
- **Settings**: Configure auto-pause and other preferences

#### Detailed Statistics
- **Summary Cards**: Total watch time, sites tracked, visits, and average session
- **Charts**: Time distribution pie chart and daily activity line chart
- **Sites Table**: Complete list of all tracked sites with detailed metrics

#### Settings
- **Auto-pause**: Automatically pause tracking after inactivity
- **Pause Threshold**: Set how many minutes of inactivity before pausing
- **Data Management**: Clear all tracking data if needed

## Technical Details

### Architecture

The extension follows a modular architecture with clear separation of concerns:

```
├── manifest.json          # Extension configuration
├── background.js          # Service worker for tab management
├── content.js            # Content script for activity detection
├── popup.html/js         # Popup interface
├── detailed.html/js      # Detailed statistics view
├── src/
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility classes (Storage, TimeTracker)
│   └── components/      # React components (if applicable)
└── icons/               # Extension icons
```

### Key Components

#### TimeTracker Class
- Manages active tab tracking
- Handles time calculations and updates
- Implements auto-pause functionality

#### StorageManager Class
- Handles Chrome storage operations
- Manages watch time statistics
- Implements data cleanup and maintenance

#### Background Service Worker
- Listens for tab events (activation, updates, removal)
- Manages window focus changes
- Handles communication with popup and content scripts

### Data Storage

All data is stored locally using Chrome's storage API:
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
- Basic knowledge of JavaScript/TypeScript
- Understanding of Chrome Extension APIs

