import { useContext,useEffect } from "react";
import { AuthContext } from "../auth.context";
import { login,logout,getMe,register } from "../services/auth.api";

export const useAuth = () =>{

    const context = useContext(AuthContext)
    const { user,setUser,loading,setLoading } = context

    const handleLogin = async ({ email,password })=>{
        setLoading(true)
        try{
            const data = await login({ email,password })
            if(!data || !data.user){
                return false;
            }
            setUser(data.user)
            return true;
        }catch(err){
            return false;
        }finally{
            setLoading(false)
        }
    }

    const handleRegister = async ({ username,email,password })=>{
        setLoading(true)
        try{
            const data = await register({ username,email,password })
            setUser(data.user)
        }catch(err){
            return false
        }finally{
            setLoading(false)
        }
    }

    const handleLogout = async ()=>{
        setLoading(true)
        try{
            const data = await logout()
            setUser(null)
        }catch(err){
            return false
        }finally{
            setLoading(false)
        }
    }

    useEffect(() => {
        const getAndsetUser = async ()=>{
            const data = await getMe()

            if (!data || !data.user) {
                setUser(null)
                setLoading(false)
                return
            }

            setUser(data.user)
            setLoading(false)
        }

        getAndsetUser()
    }, [setUser, setLoading])

    return { user,loading,handleLogin,handleLogout,handleRegister}
}
