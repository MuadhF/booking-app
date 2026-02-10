import React, { useState } from 'react';
import { ChevronDown, X, Sliders, ArrowUpDown } from 'lucide-react';

export interface FilterOptions {
  locations: string[];
  minCapacity: number;
  maxCapacity: number;
  minPrice: number;
  maxPrice: number;
  hasToilets: boolean;
  hasChangingRooms: boolean;
  sortBy: 'none' | 'price-low' | 'price-high' | 'capacity-low' | 'capacity-high';
}

interface PitchFiltersProps {
  allLocations: string[];
  maxCapacityInData: number;
  maxPriceInData: number;
  onFiltersChange: (filters: FilterOptions) => void;
}

export default function PitchFilters({
  allLocations,
  maxCapacityInData,
  maxPriceInData,
  onFiltersChange
}: PitchFiltersProps) {
  const [filters, setFilters] = useState<FilterOptions>({
    locations: [],
    minCapacity: 0,
    maxCapacity: maxCapacityInData,
    minPrice: 0,
    maxPrice: maxPriceInData,
    hasToilets: false,
    hasChangingRooms: false,
    sortBy: 'none'
  });

  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);
  const [isSortExpanded, setIsSortExpanded] = useState(false);

  const handleLocationToggle = (location: string) => {
    const newLocations = filters.locations.includes(location)
      ? filters.locations.filter(l => l !== location)
      : [...filters.locations, location];

    const newFilters = { ...filters, locations: newLocations };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleCapacityChange = (min: number, max: number) => {
    const newFilters = { ...filters, minCapacity: min, maxCapacity: max };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleCapacityRangeChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'min' | 'max') => {
    const value = Number(e.target.value);
    if (type === 'min' && value <= filters.maxCapacity) {
      handleCapacityChange(value, filters.maxCapacity);
    } else if (type === 'max' && value >= filters.minCapacity) {
      handleCapacityChange(filters.minCapacity, value);
    }
  };

  const handlePriceChange = (min: number, max: number) => {
    const newFilters = { ...filters, minPrice: min, maxPrice: max };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handlePriceRangeChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'min' | 'max') => {
    const value = Number(e.target.value);
    if (type === 'min' && value <= filters.maxPrice) {
      handlePriceChange(value, filters.maxPrice);
    } else if (type === 'max' && value >= filters.minPrice) {
      handlePriceChange(filters.minPrice, value);
    }
  };

  const handleAmenityToggle = (amenity: 'toilet' | 'changing') => {
    const newFilters = {
      ...filters,
      ...(amenity === 'toilet' && { hasToilets: !filters.hasToilets }),
      ...(amenity === 'changing' && { hasChangingRooms: !filters.hasChangingRooms })
    };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleSortChange = (sortBy: FilterOptions['sortBy']) => {
    const newFilters = { ...filters, sortBy };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleReset = () => {
    const defaultFilters: FilterOptions = {
      locations: [],
      minCapacity: 0,
      maxCapacity: maxCapacityInData,
      minPrice: 0,
      maxPrice: maxPriceInData,
      hasToilets: false,
      hasChangingRooms: false,
      sortBy: 'none'
    };
    setFilters(defaultFilters);
    onFiltersChange(defaultFilters);
  };

  const isFiltered =
    filters.locations.length > 0 ||
    filters.minCapacity > 0 ||
    filters.maxCapacity < maxCapacityInData ||
    filters.minPrice > 0 ||
    filters.maxPrice < maxPriceInData ||
    filters.hasToilets ||
    filters.hasChangingRooms ||
    filters.sortBy !== 'none';

  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            isFiltersExpanded
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Sliders className="w-4 h-4" />
          Filters
          {isFiltered && <span className="w-2 h-2 bg-white rounded-full"></span>}
        </button>

        <div className="relative">
          <button
            onClick={() => setIsSortExpanded(!isSortExpanded)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              isSortExpanded
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <ArrowUpDown className="w-4 h-4" />
            Sort
          </button>

          {isSortExpanded && (
            <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 z-50 min-w-[220px] overflow-hidden">
              <div className="py-1">
                {[
                  { value: 'none', label: 'Default' },
                  { value: 'price-low', label: 'Price: Low to High' },
                  { value: 'price-high', label: 'Price: High to Low' },
                  { value: 'capacity-low', label: 'Capacity: Low to High' },
                  { value: 'capacity-high', label: 'Capacity: High to Low' }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      handleSortChange(option.value as FilterOptions['sortBy']);
                      setIsSortExpanded(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 transition-colors ${
                      filters.sortBy === option.value
                        ? 'bg-primary-50 text-primary-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{option.label}</span>
                      {filters.sortBy === option.value && (
                        <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {isFiltered && (
          <button
            onClick={handleReset}
            className="ml-auto flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all"
          >
            <X className="w-4 h-4" />
            Clear
          </button>
        )}
      </div>

      {isFiltersExpanded && (
        <div className="bg-white rounded-xl shadow-lg p-6 space-y-6 mb-6">
          {/* Location Filter */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Location</h3>
            <div className="space-y-2">
              {allLocations.map((location) => (
                <label key={location} className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.locations.includes(location)}
                    onChange={() => handleLocationToggle(location)}
                    className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                  />
                  <span className="ml-3 text-sm text-gray-600">{location}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Capacity Filter */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">Player Capacity</h3>
              <span className="text-xs font-medium text-gray-600">{filters.minCapacity} - {filters.maxCapacity}</span>
            </div>
            <div className="relative pt-2">
              <input
                type="range"
                min={0}
                max={maxCapacityInData}
                value={filters.minCapacity}
                onChange={(e) => handleCapacityRangeChange(e, 'min')}
                className="absolute w-full h-2 bg-transparent rounded-lg appearance-none cursor-pointer pointer-events-none z-5"
                style={{
                  WebkitAppearance: 'slider-horizontal',
                  WebkitSliderThumb: 'appearance-none'
                }}
              />
              <input
                type="range"
                min={0}
                max={maxCapacityInData}
                value={filters.maxCapacity}
                onChange={(e) => handleCapacityRangeChange(e, 'max')}
                className="absolute w-full h-2 bg-transparent rounded-lg appearance-none cursor-pointer pointer-events-none z-4"
                style={{
                  WebkitAppearance: 'slider-horizontal',
                  WebkitSliderThumb: 'appearance-none'
                }}
              />
              <div className="relative w-full h-2 bg-gray-200 rounded-lg">
                <div
                  className="absolute h-2 bg-primary-600 rounded-lg"
                  style={{
                    left: `${(filters.minCapacity / maxCapacityInData) * 100}%`,
                    right: `${100 - (filters.maxCapacity / maxCapacityInData) * 100}%`
                  }}
                ></div>
              </div>
            </div>
            <style>{`
              input[type="range"]::-webkit-slider-thumb {
                appearance: none;
                width: 16px;
                height: 16px;
                border-radius: 50%;
                background: #16a34a;
                cursor: pointer;
                border: 2px solid white;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
              }
              input[type="range"]::-moz-range-thumb {
                width: 16px;
                height: 16px;
                border-radius: 50%;
                background: #16a34a;
                cursor: pointer;
                border: 2px solid white;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
              }
            `}</style>
          </div>

          {/* Price Filter */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">Price per Hour (LKR)</h3>
              <span className="text-xs font-medium text-gray-600">{filters.minPrice} - {filters.maxPrice}</span>
            </div>
            <div className="relative pt-2">
              <input
                type="range"
                min={0}
                max={maxPriceInData}
                value={filters.minPrice}
                onChange={(e) => handlePriceRangeChange(e, 'min')}
                className="absolute w-full h-2 bg-transparent rounded-lg appearance-none cursor-pointer pointer-events-none z-5"
                style={{
                  WebkitAppearance: 'slider-horizontal',
                  WebkitSliderThumb: 'appearance-none'
                }}
              />
              <input
                type="range"
                min={0}
                max={maxPriceInData}
                value={filters.maxPrice}
                onChange={(e) => handlePriceRangeChange(e, 'max')}
                className="absolute w-full h-2 bg-transparent rounded-lg appearance-none cursor-pointer pointer-events-none z-4"
                style={{
                  WebkitAppearance: 'slider-horizontal',
                  WebkitSliderThumb: 'appearance-none'
                }}
              />
              <div className="relative w-full h-2 bg-gray-200 rounded-lg">
                <div
                  className="absolute h-2 bg-primary-600 rounded-lg"
                  style={{
                    left: `${(filters.minPrice / maxPriceInData) * 100}%`,
                    right: `${100 - (filters.maxPrice / maxPriceInData) * 100}%`
                  }}
                ></div>
              </div>
            </div>
          </div>

          {/* Amenities Filter */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Amenities</h3>
            <div className="space-y-2">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.hasToilets}
                  onChange={() => handleAmenityToggle('toilet')}
                  className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                />
                <span className="ml-3 text-sm text-gray-600">Toilets</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.hasChangingRooms}
                  onChange={() => handleAmenityToggle('changing')}
                  className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                />
                <span className="ml-3 text-sm text-gray-600">Changing Rooms</span>
              </label>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
