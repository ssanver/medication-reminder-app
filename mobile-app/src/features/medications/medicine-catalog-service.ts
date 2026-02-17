import { apiRequestJson } from '../network/api-client';

type MedicineCatalogSearchResponse = {
  id: string;
  medicineName: string;
  unit?: string | null;
  manufacturer?: string | null;
  activeIngredient?: string | null;
};

export async function searchMedicineCatalog(query: string, take = 20): Promise<string[]> {
  const normalizedQuery = query.trim();

  const encodedQuery = encodeURIComponent(normalizedQuery);
  const response = await apiRequestJson<MedicineCatalogSearchResponse[]>(
    `/api/medicine-catalog/search?query=${encodedQuery}&take=${take}`,
    {
      method: 'GET',
      correlationPrefix: 'medicine-catalog',
    },
  );

  return response.map((item) => item.medicineName).filter((name, index, list) => list.indexOf(name) === index);
}
