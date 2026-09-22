import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaSearch } from 'react-icons/fa';

const SearchBox = () => {
  const navigate = useNavigate();
  const { keyword: urlKeyword } = useParams();
  const [keyword, setKeyword] = useState(urlKeyword || '');

  const submitHandler = (e) => {
    e.preventDefault();
    if (keyword.trim()) {
      navigate(`/search/${keyword}`);
    } else {
      navigate('/');
    }
  };

  return (
    <form onSubmit={submitHandler} className="flex w-full items-center bg-slate-100 rounded-full pl-4 pr-1.5 py-1.5 focus-within:ring-2 focus-within:ring-brand-500 transition-shadow">
      <input
        type="text"
        name="q"
        onChange={(e) => setKeyword(e.target.value)}
        value={keyword}
        placeholder="Search for shoes, jutta, sandals..."
        className="bg-transparent text-sm text-slate-800 placeholder-slate-400 w-full outline-none"
      />
      <button type="submit" className="p-2 bg-brand-600 hover:bg-brand-700 text-white rounded-full flex-shrink-0 transition-colors">
        <FaSearch className="text-xs" />
      </button>
    </form>
  );
};

export default SearchBox;
