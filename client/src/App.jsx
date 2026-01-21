import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Register from './pages/register';
import Login from './pages/login';
import Dashboard from './pages/dashboard';
import Preferences from './pages/preferences';

function App() {
  return (
    <Router>
      <Routes>
        <Route path='/' element={<Register/>} />
        <Route path="/login" element={<Login/>} />
        <Route path="/dashboard" element={<Dashboard/>}/>
        <Route path='/preferences' element={<Preferences/>}/>
      </Routes>
    </Router>
  )
}

export default App