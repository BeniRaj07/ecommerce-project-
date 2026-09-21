import React, { useState } from 'react';
import { FaTimes, FaSearch } from 'react-icons/fa';
import { countries } from '../data/countries.js';

const LocationModal = ({ setLocation, onClose }) => {

  const [searchTerm, setSearchTerm] = useState('');

  const handleLocationSelect = (country) => {
    setLocation(country);
    onClose();
  };


  const filteredCountries = countries.filter((country) =>
    country.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex justify-center items-start pt-20 px-4">
      <div className="bg-white rounded-2xl shadow-card-hover w-full max-w-md p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors">
          <FaTimes size={18} />
        </button>
        <h2 className="text-lg font-bold text-slate-900 mb-1">Choose your delivery location</h2>
        <p className="text-sm text-slate-500 mb-4">Enter your address and we will specify the offer for your area.</p>
        <div className="relative">
          <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
          <input
            type="text"
            placeholder="Search your area..."
            className="w-full border border-slate-200 rounded-lg p-2.5 pl-9 outline-none focus:ring-2 focus:ring-brand-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <ul className="mt-3 h-64 overflow-y-auto divide-y divide-slate-50">
          {filteredCountries.sort().map((country) => (
            <li
              key={country}
              className="p-2.5 hover:bg-slate-50 cursor-pointer rounded-lg text-sm text-slate-700"
              onClick={() => handleLocationSelect(country)}
            >
              {country}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default LocationModal;
