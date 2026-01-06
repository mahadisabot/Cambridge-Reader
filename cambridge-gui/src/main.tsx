import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from './components/ThemeContext';

console.log("Mounting React App...");

try {
  const root = createRoot(document.getElementById('root')!);
  root.render(
    <StrictMode>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </StrictMode>,
  );
  console.log("React App Mounted Successfully");
} catch (e) {
  console.error("Failed to mount React App:", e);
  document.body.innerHTML = `<div style="color:red; padding: 20px;">
    <h1>App Crash</h1>
    <pre>${e instanceof Error ? e.message : String(e)}</pre>
  </div>`;
}
