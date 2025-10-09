
import ItemButton from './component/itemButton';
import Navbar from './navbar';


export default function Home() {
  return (
    <div className="">

      <Navbar />
      <main className="flex-grow p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">

          <ItemButton name="Drinks" link="/drinks" colour="yellow" />
          <ItemButton name="Lunch" link="/lunch" colour="red" />


        </div>
      </main>
    </div>
  );
}