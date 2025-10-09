import Link from 'next/link';

export default function ItemButton(props) {
  return <Link className={`px-6 py-8 block w-full text-center text-white bg-${props.colour ?? 'stone'}-900 rounded active:text-violet-500 hover:bg-black hover:text-whitefocus:outline-none focus:ring text-xl font-bold`}
    href={props.link}>
    {props.name}
  </Link >;
}
