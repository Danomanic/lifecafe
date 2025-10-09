import Link from 'next/link';
import Modal from './modal';

export default function Navbar() {
  return (
    <nav className="bg-red-100">
      <div>
        <div className="grid grid-cols-2">
          <Modal />
          <Link className="px-6 py-4 block w-full text-center text-white bg-blue-900 active:text-violet-500 hover:bg-transparent hover:text-violet-600 focus:outline-none focus:ring text-xl font-bold"
            href="/">
            Home
          </Link>

        </div>
      </div>
    </nav>
  );
}
