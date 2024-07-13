const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type'],
}));
app.use(express.json({ limit: '50mb' }));

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'build')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const publicDir = path.join(__dirname, 'public');
const defaultPath = path.join(publicDir, 'categories.json');
const updatedPath = path.join(publicDir, 'categories_updated.json');


app.get('/api/categories.json', (req, res) => {
  const updatedPath = path.join(__dirname, 'public', 'categories_updated.json');
  const defaultPath = path.join(__dirname, 'public', 'categories.json');

  fs.readFile(updatedPath, 'utf8', (err, data) => {
    if (!err && data && data.length > 0 && JSON.parse(data).length > 0) {
      res.json(JSON.parse(data));
    } else {
      fs.readFile(defaultPath, 'utf8', (err, data) => {
        if (err) {
          console.error('Error reading categories.json:', err);
          res.status(500).send('Internal Server Error');
          return;
        }
        res.json(JSON.parse(data));
      });
    }
  });
});

app.get('/api/categories_updated.json', (req, res) => {
  fs.readFile(path.join(__dirname, 'public', 'categories_updated.json'), 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading categories_updated.json:', err);
      res.status(500).send('Internal Server Error');
      return;
    }
    res.json(JSON.parse(data));
  });
});

app.post('/api/save_categories', (req, res) => {
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

app.post('/api/clear_categories', (req, res) => {
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

// This is a catch-all route for handling unknown paths
app.get('*', (req, res) => {
  res.status(404).send('Not Found');
});



app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
