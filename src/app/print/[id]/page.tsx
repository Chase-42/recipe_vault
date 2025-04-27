import PrintRecipeClient from './PrintRecipeClient';

export default function PrintRecipePage({
  params,
}: { params: { id: string } }) {
  const idAsNumber = Number(params.id);

  return <PrintRecipeClient id={idAsNumber} />;
}
