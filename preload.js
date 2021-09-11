const { contextBridge, ipcRenderer } = require("electron");
const SecureElectronLicenseKeys = require("secure-electron-license-keys");

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("api", {
  licenseKeys: SecureElectronLicenseKeys.preloadBindings(ipcRenderer),
});
