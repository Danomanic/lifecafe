import menuData from '../../menu.json';
import ItemButton from '../component/itemButton';
import Navbar from '../navbar';

export default function Drinks() {
  const drinks = menuData.drinks;

  // Group drinks by category
  const drinksByCategory = {};
  Object.keys(drinks).forEach((key) => {
    if (key !== 'title' && drinks[key].items) {
      drinksByCategory[drinks[key].title] = drinks[key].items;
    }
  });

  const colors = [ 'slate'];

  return (
    <div className="">
      <Navbar />

      <main className="flex-grow p-4">
        {/* Display drinks grouped by category */}
        {Object.keys(drinksByCategory).map((categoryTitle) => (
          <div key={categoryTitle} className="mb-6">
            <h2 className="text-xl font-bold mb-3 text-gray-900 bg-amber-100 p-2 rounded-lg">{categoryTitle}</h2>
            <div className="grid grid-cols-2 gap-3">
              {drinksByCategory[categoryTitle].map((item, index) => (
                <ItemButton
                  key={item.slug}
                  name={item.name}
                  link={`/item/${item.slug}`}
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
