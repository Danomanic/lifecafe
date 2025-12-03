import Link from 'next/link';

export default function ItemButton(props) {
  return <Link className={`px-4 py-5 block w-full text-center text-white bg-${props.colour ?? 'stone'}-800 rounded active:text-violet-500 hover:bg-black hover:text-white focus:outline-none focus:ring text-xl font-bold`}
    href={props.link}>
    {props.name}
  </Link >;
}
