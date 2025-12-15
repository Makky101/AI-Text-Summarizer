import Main_Page from './components/User Interface/Main_Page'
import Auth from './components/Authentication/auth'
import { useState } from 'react'
import { BrowserRouter,Routes, Route} from 'react-router-dom'

// Main App component that manages routing and global state
function App() {
  // Theme state: manages light/dark mode, persists in localStorage
  const [theme, setTheme] = useState(localStorage.getItem("color") || 'light');

  // Authentication state: tracks if user is logged in/registered
  const [registered, setRegistered] = useState(false);

  // User profile state: stores the first letter of the username for avatar display
  const [fLetter, setFLetter] = useState('');

  return(
    // BrowserRouter enables client-side routing
    <BrowserRouter>
        <Routes>
            {/* Authentication route: handles login/signup */}
            <Route path='/' element={<Auth authTheme={theme} setRegistered={setRegistered} setFLetter={setFLetter}/>}/>
            {/* Main application route: text summarization interface */}
            <Route path='/home' element={<Main_Page theme={theme} fLetter={fLetter} setTheme={setTheme} registered={registered}/>}/>
        </Routes>
    </BrowserRouter>
  )

}

export default App
