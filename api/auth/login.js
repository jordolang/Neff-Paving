// Vercel Serverless Function for admin login
import jwt from 'jsonwebtoken';

export default function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    if (req.method !== 'POST') {
        res.status(405).json({ success: false, message: 'Method not allowed' });
        return;
    }
    
    try {
        const { username, password } = req.body;
        
        // Use environment variables for admin credentials
        const adminUsername = process.env.ADMIN_USERNAME || 'admin';
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
        const jwtSecret = process.env.JWT_SECRET || 'your_jwt_secret_here';
        
        if (username === adminUsername && password === adminPassword) {
            const token = jwt.sign(
                { userId: 1, username: adminUsername, role: 'admin' },
                jwtSecret,
                { expiresIn: '24h' }
            );
            
            res.status(200).json({
                success: true,
                token,
                user: {
                    id: 1,
                    username: adminUsername,
                    role: 'admin'
                }
            });
        } else {
            res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}
