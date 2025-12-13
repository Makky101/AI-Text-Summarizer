import Main_Page from './components/User Interface/Main_Page'
import Auth from './components/Authentication/auth'
import { useState } from 'react'
import { BrowserRouter,Routes, Route} from 'react-router-dom' 
function App() {
  //get the boolean value of the background 
  const [theme, setTheme] = useState(localStorage.getItem("color") || 'light'); //color Light/dark theme toggle
  return(
    <BrowserRouter>
        <Routes>
            <Route path='/' element={<Auth authTheme={theme}/>}/>
            <Route path='/home' element={<Main_Page theme={theme} setTheme={setTheme}/>}/>
        </Routes>
    </BrowserRouter>
  )
   
}

export default App
