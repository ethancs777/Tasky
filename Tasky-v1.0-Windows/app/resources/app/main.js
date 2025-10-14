const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

const tasksFilePath = path.join(__dirname, 'tasks.txt');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 600,
    minHeight: 500,
    center: true,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    },
    icon: path.join(__dirname, 'icon.png'),
    show: false,
    titleBarStyle: 'default'
  });

  mainWindow.loadFile('index.html');

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
  if (mainWindow === null) createWindow();
});

ipcMain.handle('load-tasks', async () => {
  try {
    if (fs.existsSync(tasksFilePath)) {
      const data = fs.readFileSync(tasksFilePath, 'utf8');
      return data.split('\n').filter(line => line.trim() !== '');
    }
    return [];
  } catch (error) {
    console.error('Error loading tasks:', error);
    return [];
  }
});

ipcMain.handle('save-tasks', async (event, tasks) => {
  try {
    const tasksText = tasks.join('\n');
    fs.writeFileSync(tasksFilePath, tasksText, 'utf8');
    return { success: true };
  } catch (error) {
    console.error('Error saving tasks:', error);
    return { success: false, error: error.message };
  }
});