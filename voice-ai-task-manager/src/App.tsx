import { VoiceTaskManager } from './components/VoiceTaskManager';
import { ThemeProvider } from './components/ThemeProvider';
import { AuthProvider } from './contexts/AuthContext';
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <VoiceTaskManager />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
