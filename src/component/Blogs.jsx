import React,{useState, useEffect} from 'react';
import {Link} from 'react-router-dom';
import {collection, getDocs, query, orderBy} from 'firebase/firestore';
import {db} from '../firebaseConfig'; 
import '../styling/blog.css';

function Blogs() {
    const [blogs, setBlogs] = useState([]);
    
    
    useEffect(() =>{
        const fetchBlogs = async () => {
            const blogsCollection = await getDocs(query(collection(db, 'blogs'), orderBy('createdAt', 'desc')));
            const blogsData = blogsCollection.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }))
            setBlogs(blogsData);
            console.log(blogsData);
            
        }
        fetchBlogs();
    },[])

     const getExcerpt = (htmlContent, maxLength) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    const fullText = doc.body.textContent || '';
    return fullText.length <= maxLength ? fullText : fullText.substring(0, maxLength) + '...';
  };


  return (
    <div className='blogs-container'>
        {blogs.map(blog => (
            <div key={blog.id} className='blog-post'>
                <div className='blog-content'>
                <div className="feature-image-container">
                {blog?.featureImage && (
                  <img src={blog.featureImage} alt={blog.title} className="feature-image" />
                )}
              </div>
              <div className='bontainer-body'>
                <h2>{blog.title}</h2>
                <div>
                  {getExcerpt(blog.content, 200)}
                  <Link to={`/blogs/${blog.id}`}>  Read more</Link>
                </div>
               
              </div>
                </div>

            </div>
        ))}
        
    </div>
  )
}

export default Blogs;