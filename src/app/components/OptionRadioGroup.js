export default function OptionRadioGroup({
  optionKey,
  options,
  selectedValue,
  onChange
}) {
  const capitalizedLabel = optionKey.charAt(0).toUpperCase() + optionKey.slice(1).replace(/-/g, ' ');

  return (
    <fieldset key={optionKey} id={optionKey} className="mb-6">
      <p className="font-bold mb-2 text-xl text-black">{capitalizedLabel}</p>
      {options.map((option) => {
        const optionValue = typeof option === 'object' ? option.value : option;
        const optionLabel = typeof option === 'object'
          ? option.value.charAt(0).toUpperCase() + option.value.slice(1)
          : option.charAt(0).toUpperCase() + option.slice(1);
        const optionPrice = typeof option === 'object' && option.price && option.price > 0 ? option.price : null;

        return (
          <label
            key={optionValue}
            className="flex items-center justify-between bg-white rounded-lg px-3 py-3 my-2 hover:bg-brand-yellow cursor-pointer border-2 border-black"
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
            {optionPrice && (
              <p className="text-sm font-semibold text-black">£{optionPrice.toFixed(2)}</p>
            )}
          </label>
        );
      })}
    </fieldset>
  );
}
