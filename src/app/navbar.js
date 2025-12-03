import Link from 'next/link';
import Modal from './modal';

export default function Navbar() {
  return (
    <nav className="bg-red-100">
      <div>
        <div className="grid grid-cols-3">
          <Modal />
          <Link className="px-4 py-3 block w-full text-center text-white bg-green-900 active:text-violet-500 hover:bg-green-800 focus:outline-none focus:ring text-xl font-bold"
            href="/orders">
            Orders
          </Link>
          <Link className="px-4 py-3 block w-full text-center text-white bg-blue-900 active:text-violet-500 hover:bg-blue-800 focus:outline-none focus:ring text-xl font-bold"
            href="/">
            Home
          </Link>
        </div>
      </div>
    </nav>
  );
}
