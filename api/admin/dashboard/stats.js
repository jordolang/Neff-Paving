// Vercel Serverless Function for dashboard statistics
import jwt from 'jsonwebtoken';

function verifyToken(req) {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        throw new Error('No token provided');
    }
    
    const jwtSecret = process.env.JWT_SECRET || 'your_jwt_secret_here';
    return jwt.verify(token, jwtSecret);
}

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
        verifyToken(req);
        
        // Mock data for demo purposes
        // In production, this would fetch from a database
        const stats = {
            pendingEstimates: 12,
            activeProjects: 8,
            revenue: 127500,
            totalProjects: 156
        };
        
        res.status(200).json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(401).json({ success: false, message: 'Unauthorized' });
    }
}
