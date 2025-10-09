
import ItemButton from '../component/itemButton';
import Navbar from '../navbar';

export default function Drinks() {
  return (
    <div className="">

      <Navbar />

      <main className="flex-grow p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <ItemButton name="Flat White" link="/item/flat-white"></ItemButton>
          <ItemButton name="Latte" link="/item/latte"></ItemButton>
          <ItemButton name="Americano" link="/item/americano"></ItemButton>
          <ItemButton name="Cappuccino" link="/item/cappuccino"></ItemButton>
        </div>
      </main>
    </div>
  );
}
