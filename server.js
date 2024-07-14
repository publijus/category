const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const apiRoutes = require('./api/routes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: true, // This allows all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(express.json({ limit: '50mb' }));

app.use('/api', apiRoutes);

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../public')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

const publicDir = path.join(__dirname, '../public');
const defaultPath = path.join(publicDir, 'categories.json');
const updatedPath = path.join(publicDir, 'categories_updated.json');



app.get('/categories.json', (req, res) => {
  const updatedPath = path.join(__dirname, '../public', 'categories_updated.json');
  const defaultPath = path.join(__dirname, '../public', 'categories.json');

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

app.get('/categories_updated.json', (req, res) => {
  fs.readFile(path.join(__dirname, '../public', 'categories_updated.json'), 'utf8', (err, data) => {
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
  
  const filePath = path.join(__dirname, '../public', 'categories_updated.json');

  console.log(`Bandoma išsaugoti categories_updated.json į: ${filePath}`);
  console.log(`Gauta kategorijų: ${Object.keys(categories).length}`);
  
  fs.writeFile(filePath, JSON.stringify(categories, null, 2), (err) => {
    if (err) {
      console.error('Error writing categories_updated.json:', err);
      res.status(500).send('Internal Server Error');
      return;
    }
    console.log('Categories saved successfully');
    res.status(200).send({ message: 'Categories saved successfully' });
  });
});

app.post('/api/clear_categories', (req, res) => {
  fs.writeFile(path.join(__dirname, '../public', 'categories_updated.json'), JSON.stringify([], null, 2), (err) => {
    if (err) {
      console.error('Error clearing categories_updated.json:', err);
      res.status(500).send('Internal Server Error');
      return;
    }
    console.log('Categories cleared');
    res.status(200).send({ message: 'Categories cleared successfully' });
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
