import Link from 'next/link';

export default function Navbar() {
  return (
      <nav className="bg-red-100">
        <div>
          <Link className="px-6 py-4 block w-full text-center text-white bg-gray-900 active:text-violet-500 hover:bg-transparent hover:text-violet-600 focus:outline-none focus:ring text-xl font-bold"
            href="/">
            Home
          </Link>
        </div>
      </nav>
  );
}
