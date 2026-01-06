import { useState, useEffect } from "react";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import TitleBar from "./components/TitleBar";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { CoverCacheProvider } from "./components/CoverCacheContext";

function App() {
  // Optimistic Auth: Init from localStorage immediately
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem('session_active');
  });

  useEffect(() => {
    const checkSession = async () => {
      try {
        console.log("Background: Verifying Session...");
        await invoke("restore_session");
        // Success: Session valid, localStorage is correct.
        if (!isAuthenticated) setIsAuthenticated(true);
      } catch (e) {
        console.log("Background: Session invalid/expired", e);
        // Failure: Clear flag and force logout
        localStorage.removeItem('session_active');
        setIsAuthenticated(false);
      }
    };
    // Delay logic slightly to allow UI First Paint
    const timer = setTimeout(() => {
      checkSession();
      getCurrentWindow().show();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <CoverCacheProvider>
      <TitleBar />
      <div className="h-screen w-screen overflow-hidden bg-background text-foreground transition-colors duration-300">
        {isAuthenticated ? (
          <Dashboard onLogout={() => {
            localStorage.removeItem('session_active');
            setIsAuthenticated(false);
          }} />
        ) : (
          <Login onLogin={() => {
            localStorage.setItem('session_active', 'true');
            setIsAuthenticated(true);
          }} />
        )}
      </div>
    </CoverCacheProvider>
  );
}

export default App;
