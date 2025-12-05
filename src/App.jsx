import UI from './components/User Interface/UI'
import Auth from './components/Authentication/auth'
import { BrowserRouter,Routes, Route} from 'react-router-dom' 
function App() {
  return(
    <BrowserRouter>
        <Routes>
            <Route path='/' element={<UI/>}/>
            <Route path='/signUp' element={<Auth/>}/>
        </Routes>
    </BrowserRouter>
  )
   
}

export default App
