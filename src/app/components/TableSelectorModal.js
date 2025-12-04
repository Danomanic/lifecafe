'use client';

export default function TableSelectorModal({ isOpen, onSelect, onClose, title = "Select Table" }) {
  if (!isOpen) return null;

  return (
    <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-75 flex justify-center items-center p-4 z-50">
      <div className="w-full max-w-md bg-white shadow-lg py-2 rounded-lg">
        <div className="border-b border-gray-300 p-3">
          <h2 className="text-xl font-bold text-center text-black">{title}</h2>
        </div>
        <div className="grid grid-cols-3 gap-2 p-3">
          {[...Array(12)].map((_, i) => (
            <button
              key={i}
              className="bg-brand-teal text-white py-5 px-4 rounded-lg hover:opacity-90 font-bold text-xl"
              onClick={() => onSelect(String(i + 1))}
            >
              {i + 1}
            </button>
          ))}
        </div>
        {onClose && (
          <div className="p-3 pt-0">
            <button
              onClick={onClose}
              className="w-full bg-white border-2 border-black text-black font-bold py-2 px-4 rounded-lg hover:bg-brand-yellow transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
