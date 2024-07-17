import React, { useState, useEffect } from 'react';
import axios from 'axios';
import update from 'immutability-helper';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import Category from './Category';
import './App.css';

//const serverUrl = process.env.REACT_APP_SERVER_URL || '';

const App = () => {
  const [categories, setCategories] = useState([]);
  const [originalCategories, setOriginalCategories] = useState([]);
  const [collapsedCategories, setCollapsedCategories] = useState({});
  const [selectedCategories, setSelectedCategories] = useState(new Set());
  const [newCategoryName, setNewCategoryName] = useState('');
  const [renameInputVisible, setRenameInputVisible] = useState(false);
  const [newCategoryInputVisible, setNewCategoryInputVisible] = useState(false);
  const [newCategoryIdCounter, setNewCategoryIdCounter] = useState(1);
  const fileInputRef = React.createRef();

  useEffect(() => {
    fetchCategories();
  }, []);


  const fetchCategories = async () => {
    try {
      const updatedCategoriesResponse = await axios.get('/categories_updated.json');
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
        const response = await axios.get('/categories.json');
        const originalData = response.data.map(category => ({
          ...category,
          parentId: category.parentId || null
        }));
        setOriginalCategories(originalData);
        setCategories(originalData);
        console.log('Using categories from categories.json');
      } catch (fetchError) {
        console.error('Error fetching data:', fetchError);
      }
    }
  };

  const moveCategory = (id, atIndex, newParentId = null) => {
    const { category, index } = findCategory(id);
    const updatedCategory = { ...category, updated: true };

    if (newParentId && isDescendant(id, newParentId)) {
      console.error('Cannot move a category to one of its descendants.');
      return;
    }

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

    axios.post('/save_categories', updatedCategories)
      .then(response => {
        console.log('Categories saved successfully:', response.data);
      })
      .catch(error => {
        console.error('Error saving categories:', error);
      });
  };

  const isDescendant = (parentId, childId) => {
    const getParent = (id) => categories.find(cat => cat.id === id)?.parentId;
  
    let currentId = getParent(childId);
  
    while (currentId) {
      if (currentId === parentId) {
        return true;
      }
      currentId = getParent(currentId);
    }
  
    return false;
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
    axios.post(`/save_categories`, categories)
      .then(response => {
        console.log('Categories saved successfully:', response.data);
      })
      .catch(error => {
        console.error('Error saving categories:', error);
      });
  };

  const handleClearChanges = () => {
    axios.post('/clear_categories')
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
      axios.post('/save_categories', importedCategories)
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

  const clearSelectedCategories = () => {
    setSelectedCategories(new Set());
  };

  const handleMarkForDeletion = () => {
    const updatedCategories = categories.map(category => {
      if (selectedCategories.has(category.id)) {
        return { ...category, edit: 'delete', updated: true };
      }
      return category;
    });
    setCategories(updatedCategories);
    axios.post('/save_categories', updatedCategories)
      .then(response => {
        console.log('Categories marked for deletion successfully:', response.data);
        clearSelectedCategories();
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
    axios.post('/save_categories', updatedCategories)
      .then(response => {
        console.log('Categories marked for merge successfully:', response.data);
        clearSelectedCategories();
      })
      .catch(error => {
        console.error('Error marking categories for merge:', error);
      });
  };

  const handleRenameCategory = () => {
    if (selectedCategories.size !== 1) {
      alert('Please select exactly one category to rename.');
      return;
    }

    const selectedId = Array.from(selectedCategories)[0];
    const originalCategory = originalCategories.find(category => category.id === selectedId);

    const updatedCategories = categories.map(category => {
      if (category.id === selectedId) {
        return {
          ...category,
          name: `${newCategoryName} (<s>${originalCategory.name}</s>)`,
          renamed: true
        };
      }
      return category;
    });

    setCategories(updatedCategories);
    axios.post('/save_categories', updatedCategories)
      .then(response => {
        console.log('Category renamed successfully:', response.data);
        setRenameInputVisible(false);
        setNewCategoryName('');
        clearSelectedCategories();
      })
      .catch(error => {
        console.error('Error renaming category:', error);
      });
  };

  const handleCreateCategory = () => {
    if (selectedCategories.size !== 1) {
      alert('Reikia pažymėti kategoriją prie kurios kurti naują');
      return;
    }

    const selectedId = Array.from(selectedCategories)[0];
    const newCategory = {
      id: 'new' + newCategoryIdCounter, // Assuming the ID is generated like this. Adjust as needed.
      name: newCategoryName,
      parentId: selectedId,
      kiekis: 0,
      childrenSum: 0,
      new: true // Mark this as a new category
    };

    const updatedCategories = [...categories, newCategory];

    setCategories(updatedCategories);
    setNewCategoryIdCounter(newCategoryIdCounter + 1);

    axios.post('/save_categories', updatedCategories)
      .then(response => {
        console.log('Category created successfully:', response.data);
        setNewCategoryInputVisible(false);
        setNewCategoryName('');
        clearSelectedCategories();
      })
      .catch(error => {
        console.error('Error creating category:', error);
      });
  };


  const renderCategories = (parentId = null) => {
    const filteredCategories = categories.filter(category => category.parentId === parentId);
//    console.log(`Rendering categories for parentId: ${parentId}`, filteredCategories);
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

//pasilieku jei reikes mygtuko
//      <button onClick={handleSave}>Išsaugoti</button>

  return (
    <div className="App">
      <div className="header"> {/* Highlight: Fixed header */}
        <h1>Kategorijų medis</h1>
        <button onClick={handleCollapseAll}>Suskleisti visas</button>
        <button onClick={handleExpandAll}>Iškleisti visas</button>
        <button onClick={handleClearChanges}>Atstatyti pradini medi</button>
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
        <button onClick={() => setRenameInputVisible(true)}>Keisti pavadinimą</button>
        <button onClick={() => setNewCategoryInputVisible(true)}>Sukurti kategoriją</button> {/* New button for creating category */}
        {renameInputVisible && (
          <div>
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Įveskite naują pavadinimą"
            />
            <button onClick={handleRenameCategory}>Patvirtinti</button>
          </div>
        )}
        {newCategoryInputVisible && (
          <div>
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Įveskite naują kategoriją"
            />
            <button onClick={handleCreateCategory}>Patvirtinti</button>
          </div>
        )}
      </div>
      <div className="category-list"> {/* Highlight: Scrollable category list */}
        <DndProvider backend={HTML5Backend}>
          {renderCategories()}
        </DndProvider>
      </div>
    </div>
  );
};

export default App;
