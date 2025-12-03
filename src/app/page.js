
import ItemButton from './component/itemButton';
import Navbar from './navbar';


export default function Home() {
  const categories = [
    { name: "Drinks", link: "/drinks", colour: "blue" },
    { name: "Lunch", link: "/lunch", colour: "green" },
  ];

  const colors = ['blue', 'green', 'red', 'purple', 'orange', 'teal'];

  return (
    <div className="">

      <Navbar />
      <main className="flex-grow p-4">
        <div className="grid grid-cols-2 gap-3">

          {categories.map((category, index) => (
            <ItemButton
              key={category.name}
              name={category.name}
              link={category.link}
              colour={colors[index % colors.length]}
            />
          ))}


        </div>
      </main>
    </div>
  );
}