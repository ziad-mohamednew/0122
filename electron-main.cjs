const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
      webSecurity: false // Disable CORS restrictions fully inside packaged desktop client
    },
    // Custom window design
    title: "بوابة السنتر التعليمي الذكية",
    autoHideMenuBar: true,
    show: false, // Don't show the window until it's ready to avoid flash
    icon: path.join(__dirname, 'assets/icon.png') // Fallback icon path if exists
  });

  // Load the built app index.html
  mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.maximize();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Setup basic application menu in Arabic
  const menuTemplate = [
    {
      label: 'التطبيق',
      submenu: [
        { label: 'إعادة تحميل الصفحة', role: 'reload' },
        { label: 'إعادة تحميل قسرية', role: 'forceReload' },
        { type: 'separator' },
        { label: 'تكبير كامل الشاشة', role: 'togglefullscreen' },
        { type: 'separator' },
        { label: 'خروج', click: () => { app.quit(); } }
      ]
    },
    {
      label: 'تعديل',
      submenu: [
        { label: 'تراجع', role: 'undo' },
        { label: 'إعادة', role: 'redo' },
        { type: 'separator' },
        { label: 'قص', role: 'cut' },
        { label: 'نسخ', role: 'copy' },
        { label: 'لصق', role: 'paste' },
        { label: 'تحديد الكل', role: 'selectAll' }
      ]
    },
    {
      label: 'أدوات المطورين',
      submenu: [
        { label: 'فتح أدوات المطور (DevTools)', role: 'toggleDevTools' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
