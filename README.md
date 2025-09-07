# HLP Broadcaster Suite 🎵

A modern, real-time audio broadcasting control interface that connects to the HLP API to manage and monitor sound events in real-time.

## ✨ Features

### 🎛️ Audio Controls

- **Volume Control**: Smooth slider with real-time percentage display
- **Mute Toggle**: Quick mute/unmute with visual feedback
- **Real-time Audio**: Plays sounds broadcast by the API instantly

### 📊 Live Statistics

- **Uptime Tracking**: Real-time connection uptime display
- **Event Counter**: Total events received since connection
- **Sound Counter**: Number of sounds successfully played

### 📜 Event History

- **Real-time Event Log**: Shows all events with timestamps
- **Event Types**: Different colors for system, connection, sound, and error events
- **Scrollable History**: Maintains last 100 events with smooth scrolling
- **Clear History**: Button to reset event history and counters

### 🎨 Modern UI/UX

- **Glassmorphism Design**: Beautiful frosted glass effects with blur
- **Gradient Background**: Stunning purple-blue gradient background
- **Responsive Layout**: Works perfectly on desktop, tablet, and mobile
- **Status Indicators**: Visual connection status with animated icons
- **Smooth Animations**: Hover effects and micro-interactions

### 🔗 Real-time Connection

- **Server-Sent Events**: Uses EventSource for real-time communication
- **Auto-reconnection**: Automatically reconnects on connection loss
- **Connection Status**: Live status indicator with color coding

## 🚀 Getting Started

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Start the development server:**

   ```bash
   npm run dev
   ```

3. **Make sure the HLP API is running** on `http://localhost:8787`

## 🛠️ Built With

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from "eslint-plugin-react-x";
import reactDom from "eslint-plugin-react-dom";

export default tseslint.config([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs["recommended-typescript"],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```
