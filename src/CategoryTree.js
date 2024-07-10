import React from 'react';
import Category from './Category';

const CategoryTree = ({ categories, collapsedCategories, setCollapsedCategories, updateCategories }) => {

  const renderCategories = (parentId = null) => {
    const filteredCategories = categories.filter(category => category.parentId === parentId);
    return (
      <ul>
        {filteredCategories.map(category => (
          <Category
            key={category.id}
            category={category}
            categories={categories}
            collapsedCategories={collapsedCategories}
            setCollapsedCategories={setCollapsedCategories}
            updateCategories={updateCategories}
          >
            {renderCategories(category.id)}
          </Category>
        ))}
      </ul>
    );
  };

  return renderCategories();
};

export default CategoryTree;
