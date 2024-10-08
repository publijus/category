const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const moment = require('moment-timezone');

const app = express();
const PORT = process.env.PORT || 5000;

const logAction = (action, details) => {
  const logFilePath = path.join(__dirname, 'public', 'actions.log');
  const timestamp = moment().tz('Europe/Vilnius').format('YYYY-MM-DD HH:mm:ss');
  const logMessage = `${timestamp} - Action: ${action}, Details: ${JSON.stringify(details)}\n`;

  fs.appendFile(logFilePath, logMessage, (err) => {
    if (err) {
      console.error('Error writing to log file:', err);
    }
  });
};

app.use(cors({
  origin: true, // This allows all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(express.json({ limit: '50mb' }));

app.get('/download_log', (req, res) => {
  const logFilePath = path.join(__dirname, 'public', 'actions.log');
  res.download(logFilePath, 'actions.log', (err) => {
    if (err) {
      console.error('Error downloading the log file:', err);
      res.status(500).send('Could not download the log file');
    }
  });
});

app.get('/view_log', (req, res) => {
  const logFilePath = path.join(__dirname, 'public', 'actions.log');
  fs.readFile(logFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading the log file:', err);
      return res.status(500).send('Could not read the log file');
    }
    res.type('text/plain').send(data);
  });
});

app.post('/log_action', (req, res) => {
  try {
    const { action, details } = req.body;
    if (!action) {
      console.error('Action is missing in request body');
      return res.status(400).send({ message: 'Action is required' });
    }
    logAction(action, details);
    res.status(200).send({ message: 'Action logged' });
  } catch (error) {
    console.error('Error in /log_action route:', error);
    res.status(500).send({ message: 'Internal Server Error', error: error.message });
  }
});

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'build')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const buildDir = path.join(__dirname, 'build');
const defaultPath = path.join(buildDir, 'categories.json');
const updatedPath = path.join(buildDir, 'categories_updated.json');



app.get('/categories.json', (req, res) => {
  const updatedPath = path.join(__dirname, 'build', 'categories_updated.json');
  const defaultPath = path.join(__dirname, 'build', 'categories.json');

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
  fs.readFile(path.join(__dirname, 'build', 'categories_updated.json'), 'utf8', (err, data) => {
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
  
  const filePath = path.join(__dirname, 'build', 'categories_updated.json');

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

app.post('/clear_categories', (req, res) => {
  fs.writeFile(path.join(__dirname, 'build', 'categories_updated.json'), JSON.stringify([], null, 2), (err) => {
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
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
