import React from 'react'
import {Link, useNavigate} from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectSignedIn, selectUserData, setSignedIn, setUserData } from '../features/register/userSlice';
import {auth} from '../firebaseConfig';
import {signOut} from 'firebase/auth';
import '../styling/navbar.css';

function Navbar() {
  const isSignedIn = useSelector(selectSignedIn);
  const userData = useSelector(selectUserData);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const hadleLogout = async () => {
    try{
      await signOut(auth);
      dispatch(setSignedIn(false));
      dispatch(setUserData(null));
      navigate('/');
    }catch(error){
      console.error("Error signing out: ", error);
      alert(`Error signing out : ${error.message}`)
    }
  };

  return (
    <div className='navbar'>
        <div className='navbar__left'>
            <Link to={'/'} >
                <h1>BlogSpace</h1>
            </Link>
        </div>
        <div className='navbar__right'>
            <Link to={'/'} className='nav-link'>Home</Link>
            <Link to={'/blogs'} className='nav-link'>Blogs</Link>
            <Link to={'/admin'} className='nav-link'>Admin</Link>
            

            {isSignedIn && (
              <>
              <Link to={'/profile'} className='nav-link'>
                <img src={userData?.imageUrl || "https://via.placeholder.com/30"} alt='user Avatar' className='user-avatar' />
                {userData?.name || "Profile"}
              </Link>
              <button onClick={hadleLogout} className='logout-button'>Logout</button>
              </>
            )}
           
        </div>
    </div>
  )
}

export default Navbar