import React, { useState, useEffect } from 'react';
import axios from 'axios';
import update from 'immutability-helper';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import Category from './Category';
import './App.css';

const serverUrl = process.env.REACT_APP_SERVER_URL || '';

const App = () => {
  const [categories, setCategories] = useState([]);
  const [collapsedCategories, setCollapsedCategories] = useState({});
  const [selectedCategories, setSelectedCategories] = useState(new Set());
  const fileInputRef = React.createRef();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const updatedCategoriesResponse = await axios.get(`${serverUrl}/api/categories_updated.json`);
      if (updatedCategoriesResponse.data && updatedCategoriesResponse.data.length > 0) {
        setCategories(updatedCategoriesResponse.data.map(category => ({
          ...category,
          parentId: category.parentId || null
        })));
        console.log('Using categories from categories_updated.json');
      } else {
        throw new Error('Empty or invalid categories_updated.json');
      }
    } catch (error) {
      console.log('Falling back to categories.json:', error.message);
      try {
        const response = await axios.get(`${serverUrl}/api/categories.json`);
        setCategories(response.data.map(category => ({
          ...category,
          parentId: category.parentId || null
        })));
        console.log('Using categories from categories.json');
      } catch (fetchError) {
        console.error('Error fetching data:', fetchError);
      }
    }
  };

  const moveCategory = (id, atIndex, newParentId = null) => {
    const { category, index } = findCategory(id);
    const updatedCategory = { ...category, updated: true };

    if (newParentId) {
      const newParentCategory = categories.find(cat => cat.id === newParentId);
      updatedCategory.depth = newParentCategory.depth + 1;
      updatedCategory.parentId = newParentId;
    }

    const updatedCategories = update(categories, {
      $splice: [
        [index, 1],
        [atIndex, 0, updatedCategory]
      ]
    });

    setCategories(updatedCategories);

    axios.post(`${serverUrl}/api/save_categories`, updatedCategories)
      .then(response => {
        console.log('Categories saved successfully:', response.data);
      })
      .catch(error => {
        console.error('Error saving categories:', error);
      });
  };

  const findCategory = (id) => {
    const category = categories.filter(c => c.id === id)[0];
    return {
      category,
      index: categories.indexOf(category)
    };
  };

  const toggleCollapse = (id) => {
    setCollapsedCategories({
      ...collapsedCategories,
      [id]: !collapsedCategories[id]
    });
  };

  const handleCollapseAll = () => {
    const newCollapsedCategories = {};
    categories.forEach(category => {
      newCollapsedCategories[category.id] = true;
    });
    setCollapsedCategories(newCollapsedCategories);
  };

  const handleExpandAll = () => {
    const newCollapsedCategories = {};
    categories.forEach(category => {
      newCollapsedCategories[category.id] = false;
    });
    setCollapsedCategories(newCollapsedCategories);
  };

  const handleSave = () => {
    axios.post(`${serverUrl}/api/save_categories`, categories)
      .then(response => {
        console.log('Categories saved successfully:', response.data);
      })
      .catch(error => {
        console.error('Error saving categories:', error);
      });
  };

  const handleClearChanges = () => {
    axios.post(`${serverUrl}/api/clear_categories`)
      .then(response => {
        console.log('Categories cleared successfully');
        fetchCategories();
      })
      .catch(error => {
        console.error('Error clearing categories:', error);
      });
  };

  const handleExportTree = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(categories, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "categories_updated.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImportTree = (event) => {
    const fileReader = new FileReader();
    fileReader.onload = (e) => {
      const importedCategories = JSON.parse(e.target.result);
      setCategories(importedCategories);
      axios.post(`${serverUrl}/api/save_categories`, importedCategories)
        .then(response => {
          console.log('Categories imported and saved successfully:', response.data);
        })
        .catch(error => {
          console.error('Error importing and saving categories:', error);
        });
    };
    fileReader.readAsText(event.target.files[0]);
  };

  const hasChildren = (categoryId) => {
    return categories.some(category => category.parentId === categoryId);
  };

  const getChildrenSum = (categoryId) => {
    const category = categories.find(category => category.id === categoryId);
    const childCategories = categories.filter(category => category.parentId === categoryId);
    let sum = category.kiekis;
    childCategories.forEach(child => {
      sum += getChildrenSum(child.id);
    });
    return sum;
  };

  const handleSelectCategory = (id) => {
    const newSelectedCategories = new Set(selectedCategories);
    if (newSelectedCategories.has(id)) {
      newSelectedCategories.delete(id);
    } else {
      newSelectedCategories.add(id);
    }
    setSelectedCategories(newSelectedCategories);
  };

  const handleMarkForDeletion = () => {
    const updatedCategories = categories.map(category => {
      if (selectedCategories.has(category.id)) {
        return { ...category, edit: 'delete', updated: true };
      }
      return category;
    });
    setCategories(updatedCategories);
    axios.post(`${serverUrl}/api/save_categories`, updatedCategories)
      .then(response => {
        console.log('Categories marked for deletion successfully:', response.data);
      })
      .catch(error => {
        console.error('Error marking categories for deletion:', error);
      });
  };

  const handleMarkForMerge = () => {
    const updatedCategories = categories.map(category => {
      if (selectedCategories.has(category.id)) {
        return { ...category, edit: 'merge', updated: true };
      }
      return category;
    });
    setCategories(updatedCategories);
    axios.post(`${serverUrl}/api/save_categories`, updatedCategories)
      .then(response => {
        console.log('Categories marked for merge successfully:', response.data);
      })
      .catch(error => {
        console.error('Error marking categories for merge:', error);
      });
  };

  const renderCategories = (parentId = null) => {
    const filteredCategories = categories.filter(category => category.parentId === parentId);
    console.log(`Rendering categories for parentId: ${parentId}`, filteredCategories);
    return (
      <ul>
        {filteredCategories.map(category => (
          <Category
            key={category.id}
            category={category}
            moveCategory={moveCategory}
            toggleCollapse={toggleCollapse}
            collapsed={collapsedCategories[category.id]}
            hasChildren={hasChildren(category.id)}
            childrenSum={getChildrenSum(category.id)}
            onSelectCategory={handleSelectCategory}
            selected={selectedCategories.has(category.id)}
          >
            {renderCategories(category.id)}
          </Category>
        ))}
      </ul>
    );
  };

  return (
    <div className="App">
      <h1>Kategorijų medis</h1>
      <button onClick={handleCollapseAll}>Suskleisti visas</button>
      <button onClick={handleExpandAll}>Iškleisti visas</button>
      <button onClick={handleSave}>Išsaugoti</button>
      <button onClick={handleClearChanges}>Valyti pakeitimus</button>
      <button onClick={handleExportTree}>Eksportuoti medi (.json)</button>
      <input
        type="file"
        accept=".json"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleImportTree}
      />
      <button onClick={() => fileInputRef.current.click()}>Importuoti medi (.json)</button>
      <button onClick={handleMarkForDeletion}>Pažymėti kad ištrinti</button>
      <button onClick={handleMarkForMerge}>Pažymėti kad jungti su panašia</button>
      <DndProvider backend={HTML5Backend}>
        {renderCategories()}
      </DndProvider>
    </div>
  );
};

export default App;
