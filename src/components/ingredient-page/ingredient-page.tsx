import { useParams } from 'react-router-dom';
import { useSelector, useDispatch } from '../../services/store';
import { useEffect } from 'react';
import { IngredientDetailsUI } from '../ui/ingredient-details';
import { fetchIngredients } from '../../features/ingredients/ingredientsSlice';
import { Preloader } from '../ui/preloader';

const IngredientPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const ingredients = useSelector((state) => state.ingredients.items);
  const isLoading = useSelector((state) => state.ingredients.isLoading);

  useEffect(() => {
    if (!ingredients.length) {
      dispatch(fetchIngredients());
    }
  }, [dispatch, ingredients.length]);

  const ingredient = ingredients.find((item) => item._id === id);

  if (isLoading || !ingredients.length) {
    return <Preloader />;
  }

  if (!ingredient) {
    return (
      <div className='text text_type_main-medium mt-10 mb-10'>
        Ингредиент не найден
      </div>
    );
  }

  return (
    <div className='pt-30 pb-30'>
      <IngredientDetailsUI ingredientData={ingredient} />
    </div>
  );
};

export default IngredientPage;
