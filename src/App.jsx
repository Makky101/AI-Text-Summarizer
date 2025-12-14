import Main_Page from './components/User Interface/Main_Page'
import Auth from './components/Authentication/auth'
import { useState } from 'react'
import { BrowserRouter,Routes, Route} from 'react-router-dom' 
function App() {
  //get the boolean value of the background 
  const [theme, setTheme] = useState(localStorage.getItem("color") || 'light'); //color Light/dark theme toggle
  const [registered, setRegistered] = useState(false) //check if user has been registered
  const [fLetter, setFLetter] = useState('') //get the first letter tht appears on the username
  return(
    <BrowserRouter>
        <Routes>
            <Route path='/' element={<Auth authTheme={theme} setRegistered={setRegistered} setFLetter={setFLetter}/>}/>
            <Route path='/home' element={<Main_Page theme={theme} fLetter={fLetter} setTheme={setTheme} registered={registered}/>}/>
        </Routes>
    </BrowserRouter>
  )
   
}

export default App
