import React, { useState, useRef, useEffect } from "react";
import { Editor } from "@tinymce/tinymce-react";
import { db, storage, auth } from "../firebaseConfig";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useParams, useNavigate } from "react-router-dom";
import '../styling/admin.css';

function AdminPanel() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const editRef = useRef(null);
  const {blogId} = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if(blogId){
      setIsEditing(true);
      const fetchBlogPost = async () =>{
        setLoading(true);
        try{
          const docRef = doc(db, 'blogs', blogId);
          // console.log(getDoc(docRef));
          const docSnap = await getDoc(docRef);
          // console.log(docSnap);
          if(docSnap.exists()){
            const data = docSnap.data();
            setTitle(data.title || "");
            setContent(data.content || "");
          } else{
            setMessage('Blog post not found');
            navigate('/admin');
          }
        }catch(error){
          console.error("Error fetching blog post:", error);
          setMessage("Error fetching blog post: " + (error.message || error.toString()));
          
        } finally{
          setLoading(false);
        }
      }
      fetchBlogPost();
    } else {
      setIsEditing(false);
      setTitle('');
      setContent('');
      setMessage('');
    }
  }, [blogId, navigate]);
  // console.log(blogId);

  const handleEditorChange = (newContent) => {
    setContent(newContent);
  };

  const makeUniqueFilename = (originalName) => {
    const ext = originalName?.split(".").pop();
    const name = originalName?.replace(/\.[^/.]+$/, "" || "img");
    const ts = Date.now();
    const rnd = Math.floor(Math.random() * 1000000);

    return `${name}_${ts}_${rnd}.${ext}`;
  };

  const imageUploadHandler = async (blobInfo, success, failure) => {
    try {
      const file = blobInfo.blob();
      const uniqueName = makeUniqueFilename(
        file.name || `image_${Date.now()}.png`
      );
      const storageRef = ref(storage, `images/blog_posts/${uniqueName}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      success(downloadURL);
    } catch (error) {
      console.error("image upload error", error);
      failure("image upload failed" + (error.message || error.toString()));
    }
  };

  const filePickerCallback = (cb, value, meta) => {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");

    input.onchange = async function () {
      const file = this.files[0];
      if (!file) return;

      try {
        const uniqueName = makeUniqueFilename(file.name);
        const storageRef = ref(storage, `images/blog_posts/${uniqueName}`);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        cb(downloadURL, { title: file.name });
      } catch (err) {
        console.error("file picker upload error", err);
        alert("image upload failed" + (err.message || err.toString()));
      }
    };
    input.click();
  };

  const handleSubmit = async (e) =>{
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if(!auth.currentUser){
      setMessage('You must be Logged in to post a blog');
      setLoading(false);
      return;
    }
    const tmp = document.createElement('div');
    tmp.innerHTML = content || '';

    const textOnly = (tmp.textContent || tmp.innerText || '').trim();
    // console.log(tmp.textContent);
    if(!title.trim() || !textOnly === '') {
      setMessage('Title and content are required');
      setLoading(false);
      return;
    }
    try{
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = content;
      const firstImage = tempDiv.querySelector('img');
      const featureImage = firstImage ? firstImage.src : '';

      let postIdToRedirect = blogId;
      if(isEditing){
        const docRef = doc(db, 'blogs', blogId);
        await updateDoc(docRef, {
          title: title.trim(),
          content: content,
          featureImage: featureImage,
          updateAt: serverTimestamp(),
        });
        setMessage('Blog post update successfully');
      } else{
        const docRef = await addDoc(collection(db, 'blogs'), {
          title: title.trim(),
          content: content,
          featureImage: featureImage,
          createdAt: serverTimestamp(),
          authorId : auth.currentUser.uid,
          authorName: auth.currentUser.displayName || ''
        });
        postIdToRedirect = docRef.id;
        console.log("docRef id:" , docRef.id);
        setMessage('Blog post created successfully');
      }
      navigate(`/blogs/${postIdToRedirect}`);
      setTitle('');
      setContent('');
      
    } catch(error){
      console.error(isEditing ? 'error updating document' : 'error addign document', error);
      setMessage(`Error ${isEditing ? 'updating' : 'adding'} blog post: ${error.message || error.toString()}`);
    }finally{
      setLoading(false);
    }
  }
  // console.log(auth);

  return (
    <div className="admin-panel-container">
      <h2>{isEditing ? "Edit Blog post" : "create New blog post"}</h2>

      <form className="admin-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Title:</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
            }}
            placeholder="Enter blog title"
            className="form-control"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="content">Content:</label>
          <Editor
            apiKey= {process.env.REACT_APP_TINYMCE_API_KEY}
            onInit={(evt, editor) => (editRef.current = editor)}
            value={content}
            onEditorChange={handleEditorChange}
            init={{
              height: 500,
              menubar: true,
              plugins: [
                "advlist",
                "autolink",
                "lists",
                "link",
                "image",
                "charmap",
                "print",
                "preview",
                "anchor",
                "searchreplace",
                "visualblocks",
                "code",
                "fullscreen",
                "insertdatetime",
                "media",
                "table",
                "paste",
                "code",
                "help",
                "wordcount",
                "textpattern",
              ],

              toolbar:
                "undo redo | formatselect | styleselect | fontselect  " +
                "forecolor backcolor | bold italic underline | alignleft aligncenter alignright alignjustify | " +
                "bullist numlist outdent indent | link image media table | code preview",
              fontsize_formats: "8pt 10pt 12pt 14pt 18pt 24pt 36pt",
              font_formats:
                "Andale Mono=andale mono,times; Arial=arial,helvetica,sans-serif; Arial Black=arial black,avant garde; Book Antiqua=book antiqua,palatino; Comic Sans MS=comic sans ms,sans-serif; Courier New=courier new,courier; Georgia=georgia,palatino; Helvetica=helvetica; Impact=impact,chicago; Symbol=symbol; Tahoma=tahoma,arial,helvetica,sans-serif; Terminal=terminal,monaco; Times New Roman=times new roman,times; Trebuchet MS=trebuchet ms,geneva; Verdana=verdana,geneva; Webdings=webdings; Wingdings=wingdings,zapf dingbats",
              content_style:
                "body { font-family:Helvetica,Arial,sans-serif; font-size:14px }",
              toolbar_sticky: false,
              toolbar_sticky_offset: 60,
              image_advtab: true,
              automatic_uploads: true,
              relative_urls: false,
              remove_script_host: false,
              convert_urls: true,

              file_picker_types: "image",
              images_upload_handler: imageUploadHandler,
              image_title: true,
              file_picker_callback: filePickerCallback,
            }}
          />
        </div>
        <button type="submit" className="submit-button" disabled={loading}>
          {loading ? (isEditing ? "updating..." : "posting...") : isEditing ? "update Blog" : "post Blog"}
        </button>
      </form>
      {message && (<p className={`message ${message.includes('Error') || message.includes('failed') ? 'error' : 'success'}`}>{message}</p>)}
    </div>
  );
}

export default AdminPanel;
