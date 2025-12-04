import menuData from '../../menu.json';
import MenuCategoryPage from '../components/MenuCategoryPage';

export default function Cakes() {
  // Combine cakes and gluten-free cakes sections
  const cakeSections = [
    menuData.cakesAndSnacks,
    menuData.glutenFreeCakes
  ];

  return <MenuCategoryPage sections={cakeSections} returnPath="/cakes" />;
}
