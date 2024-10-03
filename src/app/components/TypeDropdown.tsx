import React, { useState, KeyboardEvent } from 'react';
import { ChevronDown } from 'lucide-react';

export default function TypeDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedType, setSelectedType] = useState('Type');
  const fileTypes = ['Type', 'Folder', 'File'];

  const toggleDropdown = () => setIsOpen(!isOpen);

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleDropdown();
    }
  };

  const selectType = (type: string) => {
    setSelectedType(type);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        className="flex items-center justify-between w-fit h-full px-4 text-sm bg-white border border-gray-300 rounded-md"
        onClick={toggleDropdown}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="mr-2">{selectedType}</span>
        <ChevronDown size={16} />
      </button>
      {isOpen && (
        <ul
          className="absolute z-10 w-48 mt-1 bg-white border border-gray-300 rounded-md shadow-lg"
          role="listbox"
        >
          {fileTypes.map(type => (
            <li
              key={type}
              className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-100"
              onClick={() => selectType(type)}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  selectType(type);
                }
              }}
              role="option"
              aria-selected={type === selectedType}
              tabIndex={0}
            >
              {type}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
