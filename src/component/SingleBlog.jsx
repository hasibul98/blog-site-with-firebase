import React, {useState, useEffect} from 'react';
import {useParams, Link} from "react-router-dom";
import {doc, getDoc, collection, query, where, addDoc, serverTimestamp, orderBy, getDocs} from 'firebase/firestore';
import {db, auth} from '../firebaseConfig';
import { useSelector } from 'react-redux';
import { selectUserData } from '../features/register/userSlice';
import DOMPurify from "dompurify";
import parse from "html-react-parser";
import '../styling/singleBlog.css';

function SingleBlog() {
  const {blogId} = useParams();
  const [blog, setBlog] = useState(null);
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('');
  const [loadingBlog, setLoadingBlog] = useState(true);
  const [loadingComments, setLoadingComments] = useState(true);
  const [error, setError] = useState('');
  const userData = useSelector(selectUserData);
  const isAuthor = userData?.uid === blog?.authorId;

  useEffect(() =>{
    const fetchBlog = async () => {
      setLoadingBlog(true);
      setError('');
      try{
        console.log("blogid", blogId);
        const docRef =  doc(db, 'blogs', blogId)
        console.log(docRef);
        const docSnap = await getDoc(docRef);
        console.log('docSnap',docSnap);

        if(docSnap.exists()){
          setBlog({id: docSnap.id, ...docSnap.data()});
        } else{
          setError('Blog not found');
        }
      } catch(error){
        console.error('Error fetching blog:', error);
        setError('Failed to load blog' + error.message);
      }finally{
        setLoadingBlog(false);
      }
    }
    if(blogId){
      fetchBlog();
    }
  }, [blogId]);
  const fetchComments = async () => {
    setLoadingComments(true);
    try {
      const commentsQuery = query(
        collection(db, 'comments'),
        where('blogId', '==', blogId),
        orderBy('createdAt', 'desc')
      );
      const commentsSnapshot = await getDocs(commentsQuery);
      const commentsData = commentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setComments(commentsData);
    } catch (err) {
      console.error("Error fetching comments: ", err);
      // setError(`Failed to load comments: ${err.message}`); // Don't block blog load if comments fail
    } finally {
      setLoadingComments(false);
    }
  };

  useEffect(() => {
    if (blogId) {
      fetchComments();
    }
  }, [blogId]);

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if(!newComment.trim()){
      alert('comment connot be empty');
      return;
    }
    if(!auth.currentUser){
      alert('You must be logged in to post a comment!');
      return;
    }
    try{
      await addDoc(collection(db, 'comments'), {
        blogId: blogId,
        text: newComment,
        createdAt: serverTimestamp(),
        authorId: auth.currentUser.uid,
        authorName: auth.currentUser.displayName || auth.currentUser.email,

      });
      setNewComment('');
      fetchComments();
    }catch(error){
      console.error('Error adding comment:', error);
      setError('Failed to add comment' + error.message);
    }
  };
  if(loadingBlog){
    return <div className='single-blog-contaienr'>Loading Blog post....</div>
  }
  if (error) {
    return <div className="single-blog-container error-message">Error: {error}</div>;
  }

  if (!blog) {
    return <div className="single-blog-container">Blog post not found.</div>;
  }

  return (
    <div className='single-blog-container'>
      <div className='blog-header'>
        <h1>{blog.title}</h1>
        {blog.authorName && blog.authorId && (
          <p className='blog-author-info'>
            By: <Link to={`/author/${blog.authorId}`} className='blog-author-link' >{blog.authorName}</Link>
            {blog.createdAt?.toDate && `on ${blog.createdAt.toDate().toLocaleDateString()}`}
          </p>
        )}
        {
          isAuthor && (
            <div>
              <Link to={`/edit-blog/${blog.id}`} className='edit-blog-button'>Edit post</Link>
              <div className="blog-content-full">
                {blog.content && parse(DOMPurify.sanitize(blog.content))}
            </div>
            </div>
          
          )
        }

      </div>
       <div className="comments-section-full">
        <h3>Comments ({comments.length})</h3>
        <form onSubmit={handleCommentSubmit} className="comment-form-full">
          <textarea
            rows="3"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write your comment here..."
            required
          ></textarea>
          <button type="submit">Post Comment</button>
        </form>
        {loadingComments ? (
          <p>Loading comments...</p>
        ) : (
          <div className="comments-list-full">
            {comments.length === 0 ? (
              <p>No comments yet. Be the first to comment!</p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="comment-item-full">
                  <p className="comment-text-full">{comment.text}</p>
                  <span className="comment-meta-full">
                    By: <Link to={`/author/${comment.authorId}`} className="comment-author-link">{comment.authorName || comment.authorId}</Link> at {comment.createdAt?.toDate().toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
        
    </div>
  )
}

export default SingleBlog
