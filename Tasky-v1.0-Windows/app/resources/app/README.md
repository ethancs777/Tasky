# ToDo GUI App

A beautiful desktop to-do application built with Electron, featuring local file storage and a modern interface.

## Features

- ✨ Modern, responsive UI with gradient backgrounds and animations
- 📝 Add, complete, and delete tasks
- 🔍 Filter tasks (All, Active, Completed)
- 💾 Automatic saving to `tasks.txt` file
- 📊 Task statistics (total and completed count)
- ⌨️ Keyboard shortcuts (Ctrl+N for new task, Enter to add)
- 🎨 Beautiful hover effects and smooth transitions
- 📱 Responsive design that works on different screen sizes

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm (comes with Node.js)

### Installation

1. Open a terminal in the project directory
2. Install dependencies:
   ```
   npm install
   ```

### Running the App

To run the app in development mode:
```
npm start
```

### Building the App

To create a distributable version:
```
npm run dist
```

This will create executable files in the `dist` folder for your operating system.

## File Structure

- `main.js` - Main Electron process (handles app lifecycle and file operations)
- `index.html` - App's HTML structure
- `styles.css` - Beautiful CSS styling with gradients and animations
- `renderer.js` - Frontend JavaScript (handles UI interactions)
- `tasks.txt` - Where your tasks are saved (created automatically)
- `package.json` - Project configuration and dependencies

## How Tasks Are Stored

Tasks are saved in a simple text file (`tasks.txt`) in the app directory:
- Regular tasks: `Buy groceries`
- Completed tasks: `[DONE] Buy groceries`

This makes your data portable and easy to backup or edit manually if needed.

## Keyboard Shortcuts

- **Ctrl+N** (Cmd+N on Mac): Focus the task input field
- **Enter**: Add a new task when typing in the input field

## Customization

You can easily customize the app by editing:
- `styles.css` - Change colors, fonts, or layout
- `index.html` - Modify the UI structure
- `renderer.js` - Add new features or change behavior

## Troubleshooting

If the app doesn't start:
1. Make sure Node.js is installed
2. Run `npm install` to ensure all dependencies are installed
3. Check that no antivirus software is blocking the app

## License

MIT License - feel free to modify and distribute!