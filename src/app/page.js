
import ItemButton from './components/ItemButton';
import Navbar from './navbar';
import Link from 'next/link';


export default function Home() {
  const categories = [
    { name: "Drinks", link: "/drinks", colour: "blue" },
    { name: "Cakes", link: "/cakes", colour: "red" },
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

      {/* Floating Scan Button */}
      <Link
        href="/scan-order"
        className="fixed bottom-6 left-6 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-all hover:scale-110 z-50"
        title="Scan Paper Order"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
        </svg>
      </Link>
    </div>
  );
}