import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for production
app.set('trust proxy', 1);

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// More specific route handling to avoid path-to-regexp issues
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Handle client-side routing - send all requests to index.html
// Use a more specific pattern to avoid path-to-regexp parsing issues
app.get('*', (req, res, next) => {
  // Skip if it's an API call or static asset
  if (req.path.startsWith('/api/') || 
      req.path.includes('.')) {
    return next();
  }
  
  res.sendFile(path.join(__dirname, 'dist', 'index.html'), (err) => {
    if (err) {
      console.error('Error serving index.html:', err);
      res.status(500).send('Error loading page');
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).send('Internal Server Error');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});