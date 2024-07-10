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
  } else if (category.updated) {
    backgroundColor = 'yellow';
  }

  return (
    <li ref={node => drag(drop(node))} style={{ opacity: isDragging ? 0.5 : 1 }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onSelectCategory(category.id)}
        />
        <div
          onClick={() => hasChildren && toggleCollapse(category.id)}
          style={{ backgroundColor, flex: 1 }}
        >
          {hasChildren ? (collapsed ? '[+]' : '[-]') : ''} {category.name} (<span style={{ fontSize: '12px' }}>ID: {category.id}</span>, <span style={{ fontSize: '14px' }}>Priskirta det.: <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{category.kiekis}</span>, Kartu su subkategorijom: <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{childrenSum}</span></span>)
        </div>
      </div>
      {!collapsed && children}
    </li>
  );
};

export default Category;
