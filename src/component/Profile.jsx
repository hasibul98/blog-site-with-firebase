import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { selectUserData, setSignedIn, setUserData } from '../features/register/userSlice';
import { auth, db, storage } from '../firebaseConfig';
import { signOut } from 'firebase/auth';
import { collection, query, where, getDocs, deleteDoc, doc as firestoreDoc, setDoc, getDoc } from 'firebase/firestore';
import { ref, deleteObject, uploadBytes, getDownloadURL } from 'firebase/storage';
import "../styling/profile.css";


function Profile() {
  const userData = useSelector(selectUserData);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [userPosts, setUserPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [errorPosts, setErrorPosts] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadMessage, setUploadMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [profileImage, setProfileImage] = useState(null);

  const getExcerpt = (htmlContent, maxLength) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    const fullText = doc.body.textContent || '';
    return fullText.length <= maxLength ? fullText : fullText.substring(0, maxLength) + '...';
  };

  useEffect(() => {
    const fetchUserData = async () => {
      if (!userData?.uid) {
        console.log('User not logged in or userData is missing.');
        setUserPosts([]);
        setLoadingPosts(false);
        setErrorPosts('');
        return;
      }

      console.log('Fetching data for user:', userData.uid);
      setLoadingPosts(true);
      setErrorPosts('');

      try {
        const userDocRef = firestoreDoc(db, 'users', userData.uid);
        const userDocSnapshot = await getDoc(userDocRef);
        if (userDocSnapshot.exists()) {
          const userDataFromFirestore = userDocSnapshot.data();
          console.log('Firestore user data:', userDataFromFirestore); // Debug log
          if (userDataFromFirestore?.imageUrl) {
            setProfileImage(userDataFromFirestore.imageUrl);
            dispatch(setUserData({ ...userData, imageUrl: userDataFromFirestore.imageUrl }));
          } else {
            console.log('No imageUrl found in Firestore for user:', userData.uid);
          }
        } else {
          console.log('No user document found, creating new one with initial data');
          await setDoc(userDocRef, { email: userData.email, role: 'user' }, { merge: true });
        }

        const postQuery = query(collection(db, 'blogs'), where('authorId', '==', userData.uid));
        const postsSnapshot = await getDocs(postQuery);
        const postsData = postsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUserPosts(postsData);
        console.log('User posts:', postsData);
        if (postsData.length === 0) {
          console.log('No posts found for this user.');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setErrorPosts('Failed to load your posts: ' + error.message);
      } finally {
        setLoadingPosts(false);
      }
    };

    fetchUserData();
  }, [userData, dispatch]);

  useEffect(() => {
    if (uploadMessage) {
      const timer = setTimeout(() => {
        setUploadMessage('');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [uploadMessage]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      dispatch(setSignedIn(false));
      dispatch(setUserData(null));
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
      alert(`Error signing out: ${error.message}`);
    }
  };

  const handleDeletePost = async (postId, postContent) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(postContent, 'text/html');
        const images = doc.querySelectorAll('img');

        for (const img of images) {
          const imageUrl = img.src;
          if (imageUrl.startsWith('https://firebasestorage.googleapis.com/')) {
            const imagePath = imageUrl.split('/o/')[1].split('?alt=media')[0];
            const decodedImagePath = decodeURIComponent(imagePath);
            const imageRef = ref(storage, decodedImagePath);
            await deleteObject(imageRef);
            console.log(`Deleted image: ${decodedImagePath}`);
          }
        }
        await deleteDoc(firestoreDoc(db, 'blogs', postId));
        setUserPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId));
        alert('Blog post deleted successfully');
      } catch (error) {
        console.error('Error deleting post:', error);
        alert(`Error deleting post: ${error.message}`);
      }
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 500 * 1024) {
        setUploadMessage('File size exceeds 500 kB. Please choose a smaller image.');
        setSelectedFile(null);
      } else {
        setSelectedFile(file);
        setUploadMessage('');
      }
    }
  };

  const handleImageUpload = async () => {
    if (!selectedFile) {
      setUploadMessage('Please select an image first');
      return;
    }
    if (!auth.currentUser) {
      setUploadMessage('You must be logged in to upload a profile picture');
      return;
    }
    setUploading(true);
    setUploadMessage('');

    try {
      console.log('Uploading image for user:', userData.uid);
      const imageRef = ref(storage, `users/${userData.uid}/profile_${Date.now()}`);
      const uploadResult = await uploadBytes(imageRef, selectedFile);
      console.log('Upload result:', uploadResult.ref.fullPath); // Debug log
      const downloadURL = await getDownloadURL(imageRef);
      console.log('Download URL:', downloadURL);

      const userDocRef = firestoreDoc(db, 'users', userData.uid);
      const updateResult = await setDoc(userDocRef, { imageUrl: downloadURL }, { merge: true });
      console.log('Firestore update result:', updateResult); // Debug log
      console.log('Firestore updated with imageUrl:', downloadURL);

      dispatch(setUserData({ ...userData, imageUrl: downloadURL }));
      setProfileImage(downloadURL);
      setUploadMessage('Profile picture updated successfully');
      setSelectedFile(null);
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      setUploadMessage(`Failed to upload picture: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  if (!userData) {
    return (
      <div className="profile-container">
        <p className="profile-message">Please log in to view your profile.</p>
        <button onClick={() => navigate('/')} className="login-redirect-button">
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <h2 className="profile-title">User Profile</h2>
      <div className="profile-info">
        <img
          src={profileImage || userData?.imageUrl || 'https://i.pinimg.com/736x/31/bd/48/31bd48a91a0d5aad5b15cc969df9f445.jpg'}
          alt="profile-avatar"
          className="profile-avatar"
          onError={(e) => console.log('Image failed to load:', e)}
        />
        <p className="profile-detail">
          <strong>Name: {userData.name}</strong>
        </p>
        <p className="profile-detail">
          <strong>Email: {userData.email}</strong>
        </p>
        <div className="profile-picture-upload-section">
          <input type="file" accept="image/*" onChange={handleFileChange} />
          <button onClick={handleImageUpload} disabled={!selectedFile || uploading}>
            {uploading ? 'Processing' : 'Change Profile Picture'}
          </button>
          {uploadMessage && (
            <p className={`upload-message ${uploadMessage.includes('Failed') ? 'error' : 'success'}`}>
              {uploadMessage}
            </p>
          )}
        </div>
      </div>
      <button onClick={handleLogout} className="logout-button-profile">
        Logout
      </button>
      <h3 className="user-posts-title">Your Blog Posts</h3>
      {loadingPosts ? (
        <p>Loading your posts...</p>
      ) : userPosts.length === 0 ? (
        <p>You haven't posted any blogs yet.</p>
      ) : (
        <div className="user-posts-list">
          {userPosts.map((post) => (
            <div key={post.id} className="user-post-item">
              <div className="feature-image-container">
                {post?.featureImage && (
                  <img src={post.featureImage} alt={post.title} className="feature-image" />
                )}
              </div>
              <h4>{post.title}</h4>
              <div className="post-excerpt">{getExcerpt(post.content, 150)}</div>
              <Link to={`/edit-blog/${post.id}`} className='edit-button'>edit</Link>
              <button className='delete-button' onClick={() => handleDeletePost(post.id, post.content)}>Delete Post</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Profile;