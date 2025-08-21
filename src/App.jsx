import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AdminPanel from './component/AdminPanel';
import Register from './component/Register';
import Navbar from './component/Navbar';
import HomePage from './component/HomePage';
import Profile from './component/Profile';
import Blogs from './component/Blogs';
import SingleBlog from './component/SingleBlog';

function App() {
  return (
    <BrowserRouter>
    <Navbar />
      <Routes>
        <Route path='/' element={<HomePage />} exact />
        <Route path={'/blogs'} element={<Blogs />} exact />
        <Route path={'/blogs/:blogId'} element={<SingleBlog />} />
        <Route path='/admin' element={<AdminPanel />} exact />
        <Route path='/edit-blog/:blogId' element={<AdminPanel />} />
        <Route path= {'/profile'} element={<Profile />} />
        <Route path='/register' element={<Register />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
