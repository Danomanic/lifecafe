import ItemButton from './ItemButton';
import Navbar from '../navbar';

export default function MenuCategoryPage({ sections, returnPath, colors = ['slate'] }) {
  // Group items by category and sort by position
  const itemsByCategory = {};

  sections.forEach((section) => {
    if (section.items) {
      // Sort items by position (items without position go to the end)
      const sortedItems = [...section.items].sort((a, b) => {
        const posA = a.position ?? 999;
        const posB = b.position ?? 999;
        return posA - posB;
      });
      itemsByCategory[section.title] = sortedItems;
    }
  });

  return (
    <div className="">
      <Navbar />

      <main className="flex-grow">
        {Object.keys(itemsByCategory).map((categoryTitle) => (
          <div key={categoryTitle} className="mb-4">
            <h2 className="text-xl font-bold mb-2 text-black bg-brand-yellow p-2 text-center">
              {categoryTitle}
            </h2>
            <div className="grid grid-cols-2 gap-1 px-1">
              {itemsByCategory[categoryTitle].map((item, index) => (
                <ItemButton
                  key={item.slug}
                  name={item.name}
                  link={`/item/${item.slug}?from=${returnPath}`}
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
