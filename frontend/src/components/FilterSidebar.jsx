import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  filterSizes,
  filterColors,
  filterMaterials,
  stockTypes,
  makerLocations,
} from '../data/categories';

const toggleInList = (list, value) =>
  list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

const FilterSidebar = ({ subCategories = [], hideLocation = false }) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [makerText, setMakerText] = useState(searchParams.get('maker') || '');

  useEffect(() => {
    setMinPrice(searchParams.get('minPrice') || '');
    setMaxPrice(searchParams.get('maxPrice') || '');
    setMakerText(searchParams.get('maker') || '');
  }, [searchParams]);

  const getList = (key) => (searchParams.get(key) ? searchParams.get(key).split(',') : []);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
      next.delete(key);
    } else {
      next.set(key, Array.isArray(value) ? value.join(',') : value);
    }
    setSearchParams(next);
  };

  const toggleListParam = (key, value) => {
    updateParam(key, toggleInList(getList(key), value));
  };

  const applyPrice = () => {
    const next = new URLSearchParams(searchParams);
    minPrice ? next.set('minPrice', minPrice) : next.delete('minPrice');
    maxPrice ? next.set('maxPrice', maxPrice) : next.delete('maxPrice');
    setSearchParams(next);
  };

  const applyMaker = () => {
    updateParam('maker', makerText.trim());
  };

  const toggleBoolean = (key) => {
    updateParam(key, searchParams.get(key) === 'true' ? null : 'true');
  };

  const setRating = (value) => {
    updateParam('minRating', searchParams.get('minRating') === String(value) ? null : String(value));
  };

  const clearAll = () => {
    const next = new URLSearchParams();
    // keep the "sub" filter cleared too, but preserve nothing else — this
    // is a hard reset of every filter control
    setSearchParams(next);
  };

  const selectedSizes = getList('size').map(Number);
  const selectedColors = getList('color');
  const selectedMaterials = getList('material');
  const selectedLocations = getList('location');
  const selectedStockTypes = getList('stockType');
  const selectedRating = searchParams.get('minRating');

  return (
    <aside className="w-full md:w-64 flex-shrink-0 bg-white border rounded-lg p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-lg">Filters</h3>
        <button onClick={clearAll} className="text-xs text-indigo-600 hover:underline">
          Clear all
        </button>
      </div>

      {subCategories.length > 0 && (
        <div>
          <h4 className="font-semibold mb-2 text-sm uppercase text-gray-500">Sub-Category</h4>
          <ul className="space-y-1">
            {subCategories.map((sub) => (
              <li key={sub}>
                <label className="flex items-center text-sm gap-2">
                  <input
                    type="checkbox"
                    checked={searchParams.get('sub') === sub}
                    onChange={() => updateParam('sub', searchParams.get('sub') === sub ? null : sub)}
                  />
                  {sub}
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <h4 className="font-semibold mb-2 text-sm uppercase text-gray-500">Price (Rs)</h4>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="w-1/2 border rounded p-1 text-sm"
          />
          <input
            type="number"
            min="0"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="w-1/2 border rounded p-1 text-sm"
          />
        </div>
        <button onClick={applyPrice} className="mt-2 text-xs bg-gray-800 text-white px-3 py-1 rounded hover:bg-gray-700">
          Apply
        </button>
      </div>

      <div>
        <h4 className="font-semibold mb-2 text-sm uppercase text-gray-500">Size</h4>
        <div className="flex flex-wrap gap-2">
          {filterSizes.map((s) => (
            <button
              key={s}
              onClick={() => toggleListParam('size', String(s))}
              className={`text-xs w-9 h-9 rounded border ${
                selectedSizes.includes(s) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="font-semibold mb-2 text-sm uppercase text-gray-500">Color</h4>
        <ul className="space-y-1">
          {filterColors.map((c) => (
            <li key={c}>
              <label className="flex items-center text-sm gap-2">
                <input type="checkbox" checked={selectedColors.includes(c)} onChange={() => toggleListParam('color', c)} />
                {c}
              </label>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h4 className="font-semibold mb-2 text-sm uppercase text-gray-500">Material</h4>
        <ul className="space-y-1">
          {filterMaterials.map((m) => (
            <li key={m}>
              <label className="flex items-center text-sm gap-2">
                <input type="checkbox" checked={selectedMaterials.includes(m)} onChange={() => toggleListParam('material', m)} />
                {m}
              </label>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h4 className="font-semibold mb-2 text-sm uppercase text-gray-500">Maker / Seller</h4>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search maker..."
            value={makerText}
            onChange={(e) => setMakerText(e.target.value)}
            className="w-full border rounded p-1 text-sm"
          />
          <button onClick={applyMaker} className="text-xs bg-gray-800 text-white px-3 rounded hover:bg-gray-700">
            Go
          </button>
        </div>
      </div>

      {!hideLocation && (
        <div>
          <h4 className="font-semibold mb-2 text-sm uppercase text-gray-500">Location</h4>
          <ul className="space-y-1">
            {makerLocations.map((l) => (
              <li key={l.value}>
                <label className="flex items-center text-sm gap-2">
                  <input
                    type="checkbox"
                    checked={selectedLocations.includes(l.value)}
                    onChange={() => toggleListParam('location', l.value)}
                  />
                  {l.value}
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <h4 className="font-semibold mb-2 text-sm uppercase text-gray-500">Sourcing</h4>
        <ul className="space-y-1 text-sm">
          <li>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={searchParams.get('handmade') === 'true'} onChange={() => toggleBoolean('handmade')} />
              Handmade
            </label>
          </li>
          <li>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={searchParams.get('madeInNepal') === 'true'} onChange={() => toggleBoolean('madeInNepal')} />
              Made in Nepal
            </label>
          </li>
          {stockTypes.map((t) => (
            <li key={t}>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={selectedStockTypes.includes(t)} onChange={() => toggleListParam('stockType', t)} />
                {t}
              </label>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h4 className="font-semibold mb-2 text-sm uppercase text-gray-500">Rating</h4>
        <ul className="space-y-1 text-sm">
          {[4, 3, 2].map((r) => (
            <li key={r}>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={selectedRating === String(r)} onChange={() => setRating(r)} />
                {r}★ & above
              </label>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
};

export default FilterSidebar;
