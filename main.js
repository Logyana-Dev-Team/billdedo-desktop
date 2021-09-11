const { BrowserWindow, app, ipcMain } = require("electron");
require("./app.js");
const SecureElectronLicenseKeys = require("secure-electron-license-keys");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
process.env["ELECTRON_DISABLE_SECURITY_WARNINGS"] = "true";
let mainWindow;

async function main() {
  mainWindow = new BrowserWindow({
    icon: __dirname + "/public/img/BillWaleLogoOnly.ico",
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
      contextIsolation: false,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  SecureElectronLicenseKeys.mainBindings(ipcMain, mainWindow, fs, crypto, {
    root: process.cwd(),
    version: app.getVersion(),
  });

  mainWindow.maximize();
  mainWindow.loadURL(`http://localhost:3000/`);
  mainWindow.on("close", () => {
    mainWindow = null;
  });
}

app.on("ready", main);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  } else {
    SecureElectronLicenseKeys.clearMainBindings(ipcMain);
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
