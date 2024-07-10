const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors()); // Enable CORS for all routes
app.use(express.json({ limit: '50mb' })); // Middleware to parse JSON bodies with increased size limit
app.use(express.static(path.join(__dirname, 'public')));

app.get('/categories.json', (req, res) => {
  fs.readFile(path.join(__dirname, 'public', 'categories.json'), 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading categories.json:', err);
      res.status(500).send('Internal Server Error');
      return;
    }
    res.json(JSON.parse(data));
  });
});

app.get('/categories_updated.json', (req, res) => {
  fs.readFile(path.join(__dirname, 'public', 'categories_updated.json'), 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading categories_updated.json:', err);
      res.status(500).send('Internal Server Error');
      return;
    }
    res.json(JSON.parse(data));
  });
});

app.post('/save_categories', (req, res) => {
  const categories = req.body;
  fs.writeFile(path.join(__dirname, 'public', 'categories_updated.json'), JSON.stringify(categories, null, 2), (err) => {
    if (err) {
      console.error('Error writing categories_updated.json:', err);
      res.status(500).send('Internal Server Error');
      return;
    }
    console.log('Categories saved:', categories);
    res.status(200).send({ message: 'Categories saved successfully' });
  });
});

app.post('/clear_categories', (req, res) => {
  fs.writeFile(path.join(__dirname, 'public', 'categories_updated.json'), JSON.stringify([], null, 2), (err) => {
    if (err) {
      console.error('Error clearing categories_updated.json:', err);
      res.status(500).send('Internal Server Error');
      return;
    }
    console.log('Categories cleared');
    res.status(200).send({ message: 'Categories cleared successfully' });
  });
});

// The "catchall" handler: for any request that doesn't match the above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
