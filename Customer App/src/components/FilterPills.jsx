const CATEGORIES = ["Pure Veg", "Home Cooked", "Economy", "Premium"];

const FilterPills = ({ activeFilter, onFilterChange }) => {
  return (
    <div className="filter-pills-row">
      {CATEGORIES.map(category => (
        <div
          key={category}
          className={`filter-pill ${activeFilter === category ? 'active' : ''}`}
          onClick={() => onFilterChange(activeFilter === category ? null : category)}
        >
          {category}
        </div>
      ))}
    </div>
  );
};

export default FilterPills;
