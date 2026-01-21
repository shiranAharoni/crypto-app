import express, { response } from "express";
import pg from "pg";
import dotenv from "dotenv";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import axios from "axios";

dotenv.config();
 
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const db = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

app.post("/register", async (req,res) =>{
    const {name, email, password} = req.body;

    try{
        const userCheck = await db.query("SELECT * FROM users WHERE email = $1", [email]);
        if (userCheck.rows.length > 0){
            return res.status(400).json({message : "User already exists"});
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await db.query("INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email",[name, email, hashedPassword]);

        res.json({ message: "Register successfully", user: newUser.rows[0]});
    } catch (err) {
        console.error(err);
        res.status(500).json({message : "Server error"});
    }
});

app.post("/login", async(req,res) =>{
    const {email, password} = req.body;

    try{
        const userResult = await db.query("SELECT * FROM users WHERE email = $1" , [email]);
        if (userResult.rows.length === 0){
            return res.status(400).json({message: "Email not found"});
        }

        const user = userResult.rows[0];

        const isMatch = await bcrypt.compare(password,user.password);
        if (!isMatch) {
            return res.status(400).json({message: "Wrong password"});
        }

        const token = jwt.sign(
            {id: user.id, email: user.email},
            process.env.JWT_SECRET,
            {expiresIn: "2h"}
        );

        res.json({message:"login successful", token: token, user:{id: user.id, name: user.name, is_onboarded: user.is_onboarded}});

    } catch(err){
        console.log("error:", err);
        res.status(500).json({message: "server error"});
    }
});

app.post("/preferences", async (req,res) =>{
    const {user_id, favorite_coins, investor_type, content_preferences} = req.body;

    try{
        const userResult = await db.query("SELECT is_onboarded FROM users WHERE id = $1 ", [user_id]);

        if (userResult.rows.length === 0){
            return res.status(400).json({message:"user not found"});
        }

        const isUserOnboarding = userResult.rows[0].is_onboarded;
    
        if (!isUserOnboarding){
            await db.query("INSERT INTO user_preferences (user_id, favorite_coins, investor_type, content_preferences) VALUES ($1,$2,$3,$4)", [user_id, favorite_coins, investor_type, content_preferences]);

            await db.query("UPDATE users SET is_onboarded = $1 WHERE id = $2", [true, user_id]);

            res.json({message: "Preferences updated!"});
        } else {
            res.status(400).json({message:"User already completed onboarding"});
        }
    } catch (err){
        console.log("error: ", err);
        res.status(500).json({message: "server error"});
    }
});

app.get("/news" , async (req,res) =>{
    try{
        const response = await axios.get("https://cryptopanic.com/api/developer/v2/posts/", {
           params: {
            auth_token : process.env.CRYPTO_PANIC_KEY,
            kind: "news",
            filter: "hot"
           }
        });
        console.log("News from API:", response.data);

        res.json(response.data);
    } catch(err) {
        console.error("Error fetching news data:", err.message);
        res.status(500).json({ message: "Error fetching news data" });
    }
});

app.get("/crypto", async(req,res) => {
    try {
        const response = await axios.get("https://api.coingecko.com/api/v3/coins/markets", {
            params: {
                vs_currency: "usd",
                order: "market_cap_desc",
                per_page: 20, 
                page: 1,
                sparkline: true 
            }
        });
        res.json(response.data);
    } catch (err) {
        console.error("Error fetching crypto data:", err.message);
        res.status(500).json([]);
    }
});

app.get("/insight", async(req,res) =>{
    const fallbacks = [
        "Market psychology is driven by fear and greed. Stay balanced.",
        "Risk comes from not knowing what you're doing.",
        "The trend is your friend, but don't overstay your welcome.",
        "In trading, patience is just as important as the trade itself."
    ];

    try{
        if (!process.env.OPENROUTER_API_KEY) {
            console.error("Missing API Key in .env file!");
            return res.status(500).json({ message: "Server configuration error" });
        }

        const response = await axios.post(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                model: "google/gemini-2.0-flash-exp:free",
                messages: [{role: "user", content: "Give me one short, profound insight about market psychology or risk management. Keep it under 30 words."}],
                temperature: 0.9
            },
           
            {
                headers: {
                    "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://crypto-app-q9rg.onrender.com", 
                    "X-Title": "Crypto Dashboard",
                }
            }
        );
        res.json({ insight: response.data.choices[0].message.content });
        

    } catch (err) { 
        console.log("Using fallback insight due to API limit or error.");
        const randomFallback = fallbacks[Math.floor(Math.random() * fallbacks.length)];
        res.json({ insight: randomFallback });
    }
});

// temp code to check the server
/*app.get("/insight", async (req, res) => {
    try {
        console.log("Insight endpoint hit!");
        res.json({ insight: "This is a manual test insight to check connection." });
    } catch (err) {
        res.status(500).json({ message: "Test failed" });
    }
});*/

app.get("/meme", async (req, res) => {
    try {
        const response = await axios.get("https://meme-api.com/gimme/cryptocurrency");

        res.json({ 
            url: response.data.url, 
            title: response.data.title 
        });

    } catch (err) {
        console.error("Meme Error:", err.message);
        res.status(500).json({ message: "Error fetching meme" });
    }
});

app.get("/preferences/:userId", async (req, res) =>{
    try {
        const { userId } = req.params;

        const result = await db.query(
            "SELECT favorite_coins, investor_type, content_preferences FROM user_preferences WHERE user_id = $1",
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "No preferences found" });
        }

        res.json(result.rows[0]); 
    } catch (err) {
        console.error("Error fetching preferences:", err);
        res.status(500).json({ message: "Server error" });
    }
});

app.post("/vote", async (req, res) => {
    const { user_id, category, item_name, vote_type } = req.body;
    try {
        await db.query(
            "INSERT INTO votes (user_id, category, item_name, vote_type) VALUES ($1, $2, $3, $4)",
            [user_id, category, item_name, vote_type]
        );
        res.json({ message: "Vote recorded!" });
    } catch (err) {
        console.error("Error saving vote:", err);
        res.status(500).json({ message: "Database error" });
    }
});

async function startServer() {
    try {
        await db.connect();
        console.log("Connected to PostgreSQL DB!");

        const createTablesQuery = `
            CREATE TABLE IF NOT EXISTS public.users (
                id SERIAL PRIMARY KEY,
                name CHARACTER VARYING(100),
                email CHARACTER VARYING(100) UNIQUE,
                password CHARACTER VARYING(255),
                is_onboarded BOOLEAN DEFAULT FALSE
            );

            CREATE TABLE IF NOT EXISTS public.user_preferences (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES public.users(id) ON DELETE CASCADE,
                favorite_coins TEXT,
                investor_type CHARACTER VARYING(50),
                content_preferences TEXT
            );

            CREATE TABLE IF NOT EXISTS public.votes (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES public.users(id) ON DELETE CASCADE,
                category TEXT,
                item_name TEXT,
                vote_type TEXT
            );
        `;

        await db.query(createTablesQuery);
        console.log("Database tables are ready!");
        
        app.listen(port, () => {
            console.log(`Server running on port ${port}`);
        });
    } catch (err) {
        console.error("Failed to connect:", err);
    }
}

startServer();

