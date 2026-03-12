import { Search } from 'lucide-react';

const SearchBar = () => (
  <div className="search-container">
    <Search className="search-icon" size={18} />
    <input
      type="text"
      className="search-input"
      placeholder="Search for dishes or restaurants"
    />
  </div>
);

export default SearchBar;
