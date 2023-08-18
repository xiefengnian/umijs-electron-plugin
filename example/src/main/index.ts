import { app } from 'electron';

getBrowserWindowRuntime().webContents.openDevTools();

app.on('browser-window-focus', () => {
  console.log('browser-window-focus');
});
