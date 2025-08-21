import { configureStore } from "@reduxjs/toolkit";
import userReducer from "../features/register/userSlice";


export default configureStore({
    reducer: {
        user: userReducer,
    }
})