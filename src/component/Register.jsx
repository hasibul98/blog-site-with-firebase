import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { auth, db } from '../firebaseConfig';
import { createUserWithEmailAndPassword, fetchSignInMethodsForEmail } from 'firebase/auth';
import { doc, setDoc } from "firebase/firestore";
import { setSignedIn, setUserData } from '../features/register/userSlice';
import '../styling/register.css';

function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();


  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    if (password !== confirmPassword) {
      setMessage('Passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      // Check if email already exists
      const signInMethods = await fetchSignInMethodsForEmail(auth, email);
      if (signInMethods && signInMethods.length > 0) {
        setMessage("This email is already registered. Please use a different email or log in.");
        setLoading(false);
        return;
      }

      
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, "users", user.uid), {
      displayName: name,  
      email: user.email,
      createdAt: new Date(),
      role: "user"
  });

      
      await auth.signOut();

      setEmail('');
      setPassword('');
      setConfirmPassword('');

      
      dispatch(setSignedIn(false));
      dispatch(setUserData(null));

      
      navigate('/');

    } catch (error) {
      console.error("Firebase Registration Error:", error);
      if (error.code === 'auth/email-already-in-use') {
        setMessage("This email is already in use. Please use a different email or log in.");
      } else {
        setMessage("Registration Failed: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='register-container'>
      <h2>Create Your Account</h2>
      <form onSubmit={handleRegister} className='register-form'>
        <div className='form-group'>
          <label htmlFor="name">Name:</label>
          <input
            type="text"
            name="name"
            id="name"
            placeholder='Enter your name'
            className='form-control'
            required
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>
        <div className='form-group'>
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            name="email"
            id="email"
            placeholder='Enter your email'
            className='form-control'
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </div>

        <div className='form-group'>
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            name="password"
            id="password"
            placeholder='Enter your password'
            className='form-control'
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        </div>

        <div className='form-group'>
          <label htmlFor="confirmPassword">Confirm Password:</label>
          <input
            type="password"
            name="confirmPassword"
            id="confirmPassword"
            className='form-control'
            placeholder='Confirm your password'
            required
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
          />
        </div>

        <button type='submit' className='submit-button' disabled={loading}>
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>

      {message && (
        <p className={`message ${message.includes('Failed') ? 'error' : 'success'}`}>
          {message}
        </p>
      )}

      <p className='login-link'>Already have an account? <Link to="/">Log in</Link></p>
    </div>
  );
}

export default Register;
