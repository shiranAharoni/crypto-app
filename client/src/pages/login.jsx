import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../App.css'; 
import { Link } from 'react-router-dom';


function Login(){
    
    const map = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleLogin = async() => {

        try{
            const result = await axios.post("http://localhost:3000/login",{
            email: email,
            password: password
            });

            const user = result.data.user;

            localStorage.setItem("user", JSON.stringify(result.data.user));

            if(user.is_onboarded === false) {
                map('/preferences');
            } else {
                map('/dashboard');
            }
            
        } catch(error){
            console.error("Error:", error.response?.data);
            alert("error: " + (error.response?.data?.message || "try again"));
        }
    };

    return(
        <div className="auth-container">
            <div className="auth-card">
                <h1>Login</h1>
                <p>Welcome back! Please login to your account</p>
                <div className="auth-input-group">
                    <input
                    type='email'
                    placeholder='Enter your email'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
                <div className="auth-input-group">
                    <input
                    type='password'
                    placeholder='Enter your password'
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    />
                </div>

                <button className="auth-button" onClick={handleLogin}>Login</button>

                <div className="auth-footer">
                    Do not have an account? <Link to="/">Sign Up</Link>
                </div>
           
            </div>
        
        </div>
    );
}

export default Login;