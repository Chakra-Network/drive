import classNames from 'classnames';
import { Search, X } from 'lucide-react';

function SearchInput(props: { searchInput: string; onChange: (input: string) => void }) {
  const { searchInput, onChange } = props;

  const handleClear = () => {
    onChange('');
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="relative flex items-center">
        <Search
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#142A1D]"
          size={20}
        />
        <input
          type="text"
          placeholder="Search Files"
          className={classNames(
            'w-full pl-10 pr-10 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2',
            'focus:ring-gray-200 focus:border-transparent placeholder-[#707D75] text-black'
          )}
          spellCheck="false"
          onChange={e => onChange(e.target.value)}
          value={searchInput}
        />
        {searchInput && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#707D75] hover:text-[#142A1D] focus:outline-none"
            aria-label="Clear search"
          >
            <X size={20} />
          </button>
        )}
      </div>
    </div>
  );
}

export default SearchInput;
