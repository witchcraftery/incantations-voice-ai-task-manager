import { VoiceTaskManager } from './components/VoiceTaskManager'
import { ThemeProvider } from './components/ThemeProvider'
import './App.css'

function App() {
  return (
    <ThemeProvider>
      <VoiceTaskManager />
    </ThemeProvider>
  )
}

export default App
