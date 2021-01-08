const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

let mainWindow = {};
let configWindow;
const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 600,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'windows/main/preload.js'),
    },
  });

  mainWindow.setResizable(false);

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'windows/main/index.html'));

  // Open the DevTools.
  //mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.


//Cargamos dependencias
const ExpressInit = require('./express-init.js');
const TwitchInit = require('./twitch-init.js');
const UserPointsInit = require('./userpoints-init.js');

let express, twitch, userPoints, logger, storage, config, configLib;
async function init(){
  //Inicializamos dependencias o librerías internas globales
  storage = require('node-persist');
  await storage.init();
  const Config = require('./libs/config.js');
  configLib = new Config(storage);
  config = await configLib.getConfig();
}

init();



//Evento al pulsar start
ipcMain.on('start', ()=>{

  const Logger = require('./libs/logger.js');
  logger = new Logger(mainWindow);

  express = new ExpressInit(logger);
  twitch = new TwitchInit(express, storage, config, logger);
  userPoints = new UserPointsInit(storage, config, logger);

});

ipcMain.on('stop', ()=>{
  twitch.close();
  express.close();
  userPoints.close();
});


ipcMain.on('open-config',()=>{
  if (configWindow === undefined){
    configWindow = new BrowserWindow({
      width: 600,
      height: 700,
      webPreferences: {
        preload: path.join(__dirname, 'windows/config/preload.js'),
      },
    });
  
    configWindow.setResizable(false);
  
    // and load the index.html of the app.
    configWindow.loadFile(path.join(__dirname, 'windows/config/index.html'));

    configWindow.on('close', ()=>{
      configWindow = undefined;
    });

    
    return;
  }
  configWindow.focus();
  
});

ipcMain.on('request-config', ()=>{
  configWindow.webContents.send('load-config', config);
});

ipcMain.on('save-config', (event, newConfig)=>{
  for (let i in newConfig){
    config[i] = newConfig[i];
  }
  configWindow.close();

  configLib.setConfig(config);
});

