import React, {useState} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import {selectSignedIn, selectUserData, setSignedIn, setUserData} from '../features/register/userSlice';
import {auth} from '../firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import '../styling/home.css';

function HomePage() {
    const isSignedIn = useSelector(selectSignedIn);
    const isSelectUserData = useSelector(selectUserData);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loginMessage, setLoginMessage] = useState('');

    console.log(isSelectUserData);

    const handleEmailPasswordLogin = async (e) => {
        e.preventDefault();
        setLoginMessage('');
        if(!email || !password){
            setLoginMessage('plaease enter both email and password');
            return;
        }
        try {
            const {user} = await signInWithEmailAndPassword(auth, email, password);
            console.log(user);
            dispatch(setSignedIn(true));
            dispatch(setUserData(user));
            navigate('/blogs');
        } catch (error) {
            console.error('Firebase Email/Password login error:', error);
            setLoginMessage('Login Failed:' + error.message);
            dispatch(setSignedIn(false));
            dispatch(setUserData(null));
        }
    }
    
  return (
    <div className='homepage-contaienr'>
       {
        !isSignedIn ? (
             <div className='hero-section'>
            <div className='hero-content'>
                <h1 className='hero-title'> Welcome to BlogSpace</h1>
                <p className='hero-subtitle'>Your daily does of insights and stories.</p>
                <p className='hero-description'>
                    Discover captivating articles, share your thoughts, and connect with a community of passionate readers and writers.
                </p>
                <div className='hero-actions'>
                    <Link to={'/blogs'} className='call-to-action-button'>Explore Blogs</Link>
                    <Link to={'/register'} className='secondary-action-button'>Join Now</Link>
                </div>
            </div>  

                <div className='login-registration-section'>
                    <form className='login-form' onSubmit={handleEmailPasswordLogin}>
                        <h2>Login</h2>
                        <input type="email" name="email" id="email" placeholder='Email' required value={email}
                        onChange={e => setEmail(e.target.value)}
                        />

                        <input type="password" name="password" id="password" placeholder='password' frequired 
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        />
                        <button type='submit'>Login</button>
                        {loginMessage && <p className='login-error-message'>{loginMessage}</p>}
                        
                    </form>
                    <p className='register-prompt'>Don't have an account <Link to={'/register'}>Register here</Link></p>
                </div>
        </div>
        ): (
            <div className='signed-in-welcome'> 
                <h1>Welcome back, {auth.currentUser?.displayName || auth.currentUser?.email}!</h1>
                <p>Ready to explore more blogs?</p>
                <Link to={'/blogs'} className='call-to-action-button'>Go to Blogs</Link>
            </div>

        )
       }
    </div>
  )
}

export default HomePage