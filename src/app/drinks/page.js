import menuData from '../../menu.json';
import MenuCategoryPage from '../components/MenuCategoryPage';

export default function Drinks() {
  // Extract drink sections from menu data
  const drinkSections = Object.keys(menuData.drinks)
    .filter(key => key !== 'title' && menuData.drinks[key].items)
    .map(key => menuData.drinks[key]);

  return <MenuCategoryPage sections={drinkSections} returnPath="/drinks" />;
}
