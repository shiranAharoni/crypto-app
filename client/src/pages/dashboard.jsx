import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; 
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';
import "../Dashboard.css";
import axios from "axios";

function Dashboard() {
    const [user, setUser] = useState(null);
    const [preferences, setPreferences] = useState(null);
    const [data, setData] = useState({ coins: [], news: [], insight: "", meme: null });
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const loadDashboard = async () => {
            try {
                const storedUser = localStorage.getItem("user");
                if (!storedUser) return navigate("/login");
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);

                const [prefRes, cryptoRes, newsRes, insightRes, memeRes] = await Promise.allSettled([
                    axios.get(`https://crypto-app-q9rg.onrender.com/preferences/${parsedUser.id}`),
                    axios.get("https://crypto-app-q9rg.onrender.com/crypto"),
                    axios.get("https://crypto-app-q9rg.onrender.com/news"),
                    axios.get("https://crypto-app-q9rg.onrender.com/insight"),
                    axios.get("https://crypto-app-q9rg.onrender.com/meme")
                ]);

                const allCoins = cryptoRes.status === 'fulfilled' ? cryptoRes.value.data : [];
                const prefData = prefRes.status === 'fulfilled' ? prefRes.value.data : null;
                setPreferences(prefData);

                let filteredCoins = allCoins;
                if (prefData && prefData.favorite_coins) {
                    const favs = prefData.favorite_coins.toLowerCase().split(',').map(s => s.trim());
                    const matched = allCoins.filter(c => favs.includes(c.symbol.toLowerCase()));
                    if (matched.length > 0) filteredCoins = matched;
                }

                setData(prev => ({
                    coins: allCoins.length > 0 ? filteredCoins.slice(0, 5) : prev.coins,
                    news: newsRes.status === 'fulfilled' ? (newsRes.value.data.results || []) : prev.news,
                    insight: insightRes.status === 'fulfilled' ? insightRes.value.data.insight : prev.insight,
                    meme: memeRes.status === 'fulfilled' ? memeRes.value.data : prev.meme
                }));
                setLoading(false);
            } catch (err) {
                console.error("Dashboard error:", err);
                setLoading(false);
            }
        };
        loadDashboard();
    }, [navigate]);

    const handleVote = async (category, itemName, voteType) => {
        try {
            await axios.post("https://crypto-app-q9rg.onrender.com/vote", {
                user_id: user.id,
                category,
                item_name: itemName,
                vote_type: voteType
            });
            alert(`You voted ${voteType === 'up' ? '👍' : '👎'} for ${itemName}`);
        } catch (err) {
            console.error("Vote failed", err);
        }
    };

    const VoteButtons = ({ cat, name, mini = false }) => (
        <div className={mini ? "mini-vote-buttons" : "vote-buttons"}>
            <button className="vote-btn up" onClick={() => handleVote(cat, name, 'up')}>👍</button>
            <button className="vote-btn down" onClick={() => handleVote(cat, name, 'down')}>👎</button>
        </div>
    );

    const handleLogout = () => {
        localStorage.clear();
        navigate("/login");
    };

    

    if (loading && data.coins.length === 0) return <div className="loading-screen"><h1>Loading Terminal...</h1></div>;

    const showCharts = preferences?.content_preferences?.includes("Charts");

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <h1>CryptoTerminal ⚡</h1>
                <div className="header-right">
                    {user && <span className="user-welcome">Member: {user.name}</span>}
                    <button className="logout-button" onClick={handleLogout}>Log out</button>
                </div>
            </header>

            <div className="dashboard-grid">
                <div className="card">
                    <h2>Latest News</h2>
                    <div className="card-content">
                        {data.coins.map(coin => (
                            <div key={coin.id} className="coin-row">
                                <div className="coin-info">
                                    <span className="coin-symbol">{coin.symbol.toUpperCase()}</span>
                                    <span className="coin-price">${coin.current_price?.toLocaleString()}</span>
                                </div>
                                {showCharts && coin.sparkline_in_7d && (
                                    <div className="mini-chart">
                                        <ResponsiveContainer width={80} height={30}>
                                            <LineChart data={coin.sparkline_in_7d.price.map(p => ({ v: p }))}>
                                                <Line type="monotone" dataKey="v" stroke="#7551ff" strokeWidth={2} dot={false} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}
                                <VoteButtons cat="Crypto" name={coin.name} mini />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card">
                    <h2>Market Prices & Trends</h2>
                    <div className="card-content">
                        {data.news.slice(0, 3).map((item, idx) => (
                            <div key={idx} className="news-item">
                                <a href={item.url} target="_blank" rel="noreferrer">{item.title}</a>
                                <VoteButtons cat="News" name={item.title} mini />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card">
                    <h2>AI Market Insight</h2>
                    <div className="card-content">
                        <p className="insight-text">"{data.insight}"</p>
                        <VoteButtons cat="AI" name="Daily Insight" />
                    </div>
                </div>

                <div className="card">
                    <h2>Daily Meme</h2>
                    <div className="card-content">
                        {data.meme && (
                            <>
                                <img src={data.meme.url} alt="meme" className="meme-img" />
                                <VoteButtons cat="Meme" name={data.meme.title || "Daily Meme"} />
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;