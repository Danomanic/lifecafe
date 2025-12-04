import menuData from '../../menu.json';
import ItemButton from '../component/itemButton';
import Navbar from '../navbar';

export default function Cakes() {
  // Combine cakes and gluten-free cakes sections
  const cakes = {
    cakesAndSnacks: menuData.cakesAndSnacks,
    glutenFreeCakes: menuData.glutenFreeCakes
  };

  // Group cakes by category and sort by position
  const cakesByCategory = {};
  Object.keys(cakes).forEach((key) => {
    if (cakes[key].items) {
      // Sort items by position (items without position go to the end)
      const sortedItems = [...cakes[key].items].sort((a, b) => {
        const posA = a.position ?? 999;
        const posB = b.position ?? 999;
        return posA - posB;
      });
      cakesByCategory[cakes[key].title] = sortedItems;
    }
  });

  const colors = ['slate'];

  return (
    <div className="">
      <Navbar />

      <main className="flex-grow">
        {/* Display cakes grouped by category */}
        {Object.keys(cakesByCategory).map((categoryTitle) => (
          <div key={categoryTitle} className="mb-4">
            <h2 className="text-xl font-bold mb-2 text-black bg-brand-yellow p-2 text-center">{categoryTitle}</h2>
            <div className="grid grid-cols-2 gap-1 px-1">
              {cakesByCategory[categoryTitle].map((item, index) => (
                <ItemButton
                  key={item.slug}
                  name={item.name}
                  link={`/item/${item.slug}?from=/cakes`}
                  colour={colors[index % colors.length]}
                />
              ))}
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}
