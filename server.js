const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/categories.json', (req, res) => {
  const updatedPath = path.join(__dirname, 'public', 'categories_updated.json');
  const defaultPath = path.join(__dirname, 'public', 'categories.json');

  fs.readFile(updatedPath, 'utf8', (err, data) => {
    if (!err && data && data.length > 0) {
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

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
