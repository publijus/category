import React from 'react';
import { useDrag, useDrop } from 'react-dnd';

const Category = ({ category, moveCategory, toggleCollapse, collapsed, hasChildren, childrenSum, children, onSelectCategory, selected }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'CATEGORY',
    item: { id: category.id },
    collect: monitor => ({
      isDragging: monitor.isDragging()
    })
  });

  const [, drop] = useDrop({
    accept: 'CATEGORY',
    drop: (item, monitor) => {
      if (!monitor.didDrop()) {
        moveCategory(item.id, null, category.id);
      }
    }
  });

  let backgroundColor = 'transparent';
  if (category.edit === 'delete') {
    backgroundColor = 'red';
  } else if (category.edit === 'merge') {
    backgroundColor = 'lightblue';
  } else if (category.edit === 'moved') {
    backgroundColor = 'yellow';
  } else if (category.new) {
    backgroundColor = 'lightgreen';
  } else if (category.renamed) {
    backgroundColor = 'lightgrey';
  }

  const ikelimasStyle = {};
  if (category.ikelimas) {
    const ikelimasYear = new Date(category.ikelimas).getFullYear();
    if (ikelimasYear <= 2022) {
      ikelimasStyle.backgroundColor = 'red';
      ikelimasStyle.color = 'white';
    }
  } 
  
  return (
    <li ref={node => drag(drop(node))} style={{ opacity: isDragging ? 0.5 : 1 }}>
      <div className="category-container" style={{ backgroundColor, flex: 1 }}>
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onSelectCategory(category.id)}
        />
        {hasChildren && (
          <span className="expand-icon" onClick={() => toggleCollapse(category.id)}>
            {collapsed ? '[+]' : '[-]'}
          </span>
        )}
        <span className="category-name" dangerouslySetInnerHTML={{ __html: category.name }}></span>
        <span className="category-details">
          (<span style={{ fontSize: '12px', color: 'gray' }}>ID: {category.id}</span>, 
          <span style={{ fontSize: '14px', color: 'gray' }}>Priskirta detaliu, kurios yra sandelyje: 
          <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{category.kiekis}</span>,
          Paskutinis ikelimas: <span style={{ ...ikelimasStyle, fontWeight: 'bold', fontSize: '14px' }}>{category.ikelimas}</span>,  
          Kartu su subkategorijom: 
          <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{childrenSum}</span></span>)
        </span>
        {category.tooltip && (
          <div className="category-comment" style={{ marginLeft: '20px', fontStyle: 'italic' }}>
            [ {category.tooltip} ]
          </div>
        )}
      </div>
      {!collapsed && children}
    </li>
  );
};

export default Category;
