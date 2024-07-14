const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

router.post('/save_categories', (req, res) => {
  const categories = req.body;
  const filePath = path.join(__dirname, '../public', 'categories_updated.json');
  
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

module.exports = router;