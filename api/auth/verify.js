// Vercel Serverless Function for token verification
import jwt from 'jsonwebtoken';

export default function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    if (req.method !== 'GET') {
        res.status(405).json({ success: false, message: 'Method not allowed' });
        return;
    }
    
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
        
        if (!token) {
            return res.status(401).json({ success: false, message: 'No token provided' });
        }
        
        const jwtSecret = process.env.JWT_SECRET || 'your_jwt_secret_here';
        const decoded = jwt.verify(token, jwtSecret);
        
        res.status(200).json({ 
            success: true, 
            user: decoded 
        });
    } catch (error) {
        console.error('Token verification error:', error);
        res.status(401).json({ success: false, message: 'Invalid token' });
    }
}
