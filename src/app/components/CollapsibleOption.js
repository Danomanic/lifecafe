export default function CollapsibleOption({
  optionKey,
  options,
  selectedValue,
  isExpanded,
  onToggle,
  onChange
}) {
  const capitalizedLabel = optionKey.charAt(0).toUpperCase() + optionKey.slice(1).replace(/-/g, ' ');
  const currentLabel = typeof selectedValue === 'string'
    ? selectedValue.charAt(0).toUpperCase() + selectedValue.slice(1)
    : '';

  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between bg-white rounded-lg px-4 py-3 border-2 border-black hover:bg-brand-yellow transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="font-semibold text-base text-black">{capitalizedLabel}:</span>
          <span className="font-bold text-lg text-black">{currentLabel}</span>
        </div>
        <span className="text-2xl text-black">{isExpanded ? '−' : '+'}</span>
      </button>

      {isExpanded && (
        <div className="mt-2 border-2 border-black rounded-lg p-3 bg-white">
          {options.map((option) => {
            const optionValue = typeof option === 'object' ? option.value : option;
            const optionLabel = typeof option === 'object'
              ? option.value.charAt(0).toUpperCase() + option.value.slice(1)
              : option.charAt(0).toUpperCase() + option.slice(1);
            const optionPrice = typeof option === 'object' && option.price ? option.price : null;

            return (
              <label
                key={optionValue}
                className="flex items-center justify-between bg-white rounded-lg px-3 py-2 my-1.5 hover:bg-brand-yellow cursor-pointer border border-black"
              >
                <div className="flex items-center">
                  <input
                    type="radio"
                    name={optionKey}
                    value={optionValue}
                    checked={selectedValue === optionValue}
                    onChange={(e) => onChange(optionKey, e.target.value)}
                    className="w-5 h-5"
                  />
                  <p className="pl-3 text-base font-semibold text-black">{optionLabel}</p>
                </div>
                {optionPrice && optionPrice > 0 && (
                  <p className="text-sm font-semibold text-black">+£{optionPrice.toFixed(2)}</p>
                )}
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
