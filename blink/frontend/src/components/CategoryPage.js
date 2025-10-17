// src/components/CategoryPage.js
import React from 'react';
import { useParams } from 'react-router-dom';

function CategoryPage() {
  const { categoryId } = useParams();

  return (
    <div style={{ padding: '20px' }}>
      <h2>{categoryId.replace(/-/g, ' ').toUpperCase()}</h2>
      <p>Display products related to {categoryId} here.</p>
    </div>
  );
}

export default CategoryPage;
