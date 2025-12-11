import UI from './components/User Interface/UI'
import Auth from './components/Authentication/auth'
import { BrowserRouter,Routes, Route} from 'react-router-dom' 
function App() {
  return(
    <BrowserRouter>
        <Routes>
            <Route path='/' element={<Auth/>}/>
            <Route path='/home' element={<UI/>}/>
        </Routes>
    </BrowserRouter>
  )
   
}

export default App
