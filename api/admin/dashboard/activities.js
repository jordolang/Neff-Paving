// Vercel Serverless Function for dashboard activities
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
        const activities = [
            {
                id: 1,
                type: 'estimate_request',
                message: 'New estimate request from John Doe',
                status: 'pending',
                timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
            },
            {
                id: 2,
                type: 'job_completion',
                message: 'Driveway paving completed for Smith residence',
                status: 'completed',
                timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
            },
            {
                id: 3,
                type: 'estimate_request',
                message: 'Commercial parking lot estimate - ABC Corp',
                status: 'in_progress',
                timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString()
            },
            {
                id: 4,
                type: 'job_start',
                message: 'Started residential paving project - 123 Main St',
                status: 'in_progress',
                timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
            }
        ];
        
        res.status(200).json({
            success: true,
            data: activities
        });
    } catch (error) {
        console.error('Dashboard activities error:', error);
        res.status(401).json({ success: false, message: 'Unauthorized' });
    }
}
