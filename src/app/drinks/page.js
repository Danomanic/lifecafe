import menuData from '../../menu.json';
import ItemButton from '../component/itemButton';
import Navbar from '../navbar';

export default function Drinks() {
  const drinks = menuData.drinks;

  // Group drinks by category and sort by position
  const drinksByCategory = {};
  Object.keys(drinks).forEach((key) => {
    if (key !== 'title' && drinks[key].items) {
      // Sort items by position (items without position go to the end)
      const sortedItems = [...drinks[key].items].sort((a, b) => {
        const posA = a.position ?? 999;
        const posB = b.position ?? 999;
        return posA - posB;
      });
      drinksByCategory[drinks[key].title] = sortedItems;
    }
  });

  const colors = [ 'slate'];

  return (
    <div className="">
      <Navbar />

      <main className="flex-grow">
        {/* Display drinks grouped by category */}
        {Object.keys(drinksByCategory).map((categoryTitle) => (
          <div key={categoryTitle} className="mb-4">
            <h2 className="text-xl font-bold mb-2 text-gray-900 bg-amber-100 p-2 text-center">{categoryTitle}</h2>
            <div className="grid grid-cols-2 gap-3 px-4">
              {drinksByCategory[categoryTitle].map((item, index) => (
                <ItemButton
                  key={item.slug}
                  name={item.name}
                  link={`/item/${item.slug}?from=/drinks`}
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
