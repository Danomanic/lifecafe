export default function QuantitySelector({ quantity, onQuantityChange }) {
  return (
    <div className="mb-4 bg-white border-2 border-black rounded-lg p-4">
      <div className="flex items-center justify-between">
        <label className="text-base font-bold text-black">Quantity:</label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onQuantityChange(quantity - 1)}
            className="bg-white border-2 border-black hover:bg-brand-yellow text-black font-bold px-3 py-1 rounded text-lg"
          >
            −
          </button>
          <span className="text-xl font-bold text-black min-w-[3rem] text-center">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => onQuantityChange(quantity + 1)}
            className="bg-white border-2 border-black hover:bg-brand-yellow text-black font-bold px-3 py-1 rounded text-lg"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}
