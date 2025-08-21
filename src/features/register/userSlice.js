import { createSlice } from "@reduxjs/toolkit";

const loadState = () =>{
    try{
        const serializedSignedIn = localStorage.getItem('isSignedIn');
        const serializedUserData = localStorage.getItem('userData');
        if(serializedSignedIn === null || serializedUserData === null){
            return undefined;
        }
        return{
            isSignedIn : JSON.parse(serializedSignedIn),
            userData : JSON.parse(serializedUserData),
        };
    } catch(err){
        console.error('Error loading state from localStorage', err);
        return undefined;
    }
}

const saveState = (isSignedIn, userData) =>{
    try{
        const serializedSignedIn = JSON.stringify(isSignedIn);
        const serializedUserData = JSON.stringify(userData);
        localStorage.setItem('isSignedIn', serializedSignedIn);
        localStorage.setItem('userData', serializedUserData);
    }catch(err){
        console.error('Error saving state to localStoragae ', err);
    }
}

const peristedState = loadState();

const userSlice = createSlice({
    name: 'user',
    initialState: {
        isSignedIn: peristedState ? peristedState.isSignedIn : false,
        userData: peristedState ? peristedState.userData : null,
        searchInput: 'tech',
        blogData: null,
    },
   reducers: {
     setSignedIn : (state, action) =>{
        state.isSignedIn = action.payload;
        saveState(state.isSignedIn, state.userData);
    },
    setUserData  : (state, action) =>{
        state.userData = action.payload ? {
            uid: action.payload.uid,
            email: action.payload.email,
            name: action.payload.displayName || null,
            imageUrl: action.payload.imageUrl || action.payload.photoURL,
            featureImage: action.payload.featureImage || null,
        } : null;
        saveState(state.isSignedIn, state.userData);
    },
    setInput: (state, action) =>{
        state.searchInput = action.payload;

    },
    setBlogData: (state, action) =>{
        state.blogData = action.payload;
    },
   },
});

export const {setSignedIn, setUserData, setInput, setBlogData } = userSlice.actions;

export const selectSignedIn = (state) => state.user.isSignedIn;
export const selectUserData = (state) => state.user.userData;
export const selectUserInput = (state) => state.user.searchInput;
export const selectBlogData = (state) => state.user.blogData;

export default userSlice.reducer;