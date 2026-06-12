import React from 'react';
import './SearchInput.css';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = 'Cerca...',
  id = 'search-input',
}) => {
  return (
    <div className="search-input">
      <span className="search-input__icon" aria-hidden="true">🔍</span>
      <input
        id={id}
        type="search"
        className="search-input__field"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
      />
      {value && (
        <button
          className="search-input__clear"
          onClick={() => onChange('')}
          aria-label="Cancella ricerca"
          type="button"
        >
          ✕
        </button>
      )}
    </div>
  );
};
