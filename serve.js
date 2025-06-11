import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 8080;

// Serve static files
app.use(express.static(__dirname));

// Handle client-side routing - send index.html for all non-API routes
app.get('*', (req, res) => {
    // Skip if requesting actual files
    if (req.path.includes('.') && !req.path.includes('.html')) {
        return res.status(404).send('File not found');
    }
    
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log('All routes will fallback to index.html for client-side routing');
}); 