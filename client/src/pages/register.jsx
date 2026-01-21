import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../App.css'; 
import { Link } from 'react-router-dom';


function Register(){
    
    const map = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");

    const handleRegister = async() => {

        try{
            const result = await axios.post("http://localhost:3000/register",{
            name: name,
            email: email,
            password: password
            });

            map('/preferences');
        } catch(error){
            console.error("Error:", error.response?.data);
            alert("error: " + (error.response?.data?.message || "try again"));
        }
    };

    return (
    <div className="auth-container">
        <div className="auth-card">
            <h1>Create Account 🚀</h1>
            <p>Join the future of crypto investing</p>
            
            <div className="auth-input-group">
                <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div className="auth-input-group">
                <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>

            <div className="auth-input-group">
                <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>

            <button className="auth-button" onClick={handleRegister}>Start Journey</button>
            
            <div className="auth-footer">
                Already have an account? <Link to="/login">Login here</Link>
            </div>
        </div>
    </div>
);
}


export default Register;