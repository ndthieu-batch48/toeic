import React, { useState } from 'react';

const SearchBar = ({ onSearch }) => {
  const [query, setQuery] = useState('');

  const handleSearch = (e) => {
    const value = e.target.value;
    setQuery(value); // Cập nhật giá trị query khi người dùng nhập
    onSearch(value);
  };

  return (
    <div className="search-bar">
      <input type="text" placeholder="Find something..." value={query} onChange={handleSearch} />
    </div>
  );
};

export default SearchBar;
