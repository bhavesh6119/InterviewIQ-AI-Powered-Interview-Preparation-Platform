import axios from "axios";

/**
 * @name api
 * @description to create a resusable code containing base address and withcredentials
 * @access private
 */
const api =axios.create({
    baseURL:"http://localhost:3000",
    withCredentials : true
})

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error?.response?.status

        if (status === 401 && window.location.pathname !== '/login' && window.location.pathname !== '/register') {
            window.location.href = '/login'
        }

        return Promise.reject(error)
    }
)

export async function register({ username,email,password }){

    try{
        const response = await api.post('/api/auth/register',{
            username,email,password
        })

        return response.data;
    }catch(err){
        console.error('Register error:', err)
        throw err
    }

}

export async function login({ email,password }){

    try{
        const response = await api.post('/api/auth/login',{
            email,password
        })

        return response.data;
    }catch(err){
        console.error('Login error:', err)
        throw err
    }

}

export async function logout(){
    try{
        const response = await api.get('/api/auth/logout')
        return response.data;
    }catch(err){
        console.error('Logout error:', err)
        throw err
    }
}

export async function getMe(){
    try{
        const response = await api.get('/api/auth/get-me')

        return response.data
    }catch(err){
        console.error('GetMe error:', err)
        return null;
    }
}