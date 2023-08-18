import { app } from 'electron';

// getBrowserWindowRuntime().webContents.openDevTools();

app.on('browser-window-focus', (e) => {
  e.preventDefault();

  console.log('bwf1');
});

console.log(require.resolve);
