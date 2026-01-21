import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../App.css';

function Preferences() {
    const map = useNavigate();

    const [selectedCoins, setSelectedCoins] = useState([]);
    const [investorType, setInvestorType] = useState("HODLer");
    const [selectedContent, setSelectedContent] = useState([]);

    const coinOptions = ["BTC", "ETH", "SOL", "ADA", "DOT"];
    const contentOptions = ["Market News", "Charts", "Social", "Fun"];

    const handleCheckboxChange = (list, setList, value) => {
        if (list.includes(value)) {
            setList(list.filter(item => item !== value));
        } else {
            setList([...list, value]);
        }
    };

    const submitPreferences = async () => {
        try {
            const storedUser = JSON.parse(localStorage.getItem("user"));
            if (!storedUser || !storedUser.id) {
                alert("Session expired, please login again");
                return map('/login');
            }

            const payload = {
                user_id: storedUser.id,
                favorite_coins: selectedCoins.join(", "),
                investor_type: investorType,
                content_preferences: selectedContent.join(", ")
            };

            const response = await axios.post("http://localhost:3000/preferences", payload);

            alert(response.data.message);

            storedUser.is_onboarded = true;
            localStorage.setItem("user", JSON.stringify(storedUser));
            
            map('/dashboard');
        } catch (error) {
            const serverMessage = error.response?.data?.message || "Server connection error";
            console.error("Submission Error:", error); 
            alert("Error: " + serverMessage);
        }
    };

    return (
        <div className="preferences-container">
            <div className="preferences-card">
                <h2>Personalize ⚙️</h2>
                <p>Customize your terminal settings</p>
                
                <div className="pref-section">
                    <h3>Favorite Assets</h3>
                    <div className="options-grid">
                        {coinOptions.map(coin => (
                            <label key={coin} className="option-label">
                                <input type="checkbox" onChange={() => handleCheckboxChange(selectedCoins, setSelectedCoins, coin)} />
                                {coin}
                            </label>
                        ))}
                    </div>
                </div>

                <div className="pref-section">
                    <h3>Investor Profile</h3>
                    <select className="pref-select" onChange={(e) => setInvestorType(e.target.value)}>
                        <option value="HODLer">HODLer</option>
                        <option value="Day Trader">Day Trader</option>
                        <option value="NFT Collector">NFT Collector</option>
                    </select>
                </div>

                <div className="pref-section">
                    <h3>Interests</h3>
                    <div className="options-grid">
                        {contentOptions.map(option => (
                            <label key={option} className="option-label">
                                <input type="checkbox" onChange={() => handleCheckboxChange(selectedContent, setSelectedContent, option)} />
                                {option}
                            </label>
                        ))}
                    </div>
                </div>

                <button className="auth-button" onClick={submitPreferences}>
                    Complete Setup
                </button>

                
            </div>
        </div>
    );
}

export default Preferences;