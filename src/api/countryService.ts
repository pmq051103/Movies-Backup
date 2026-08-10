import { apiGet } from "@/api/axiosClient";
import { API_ENDPOINTS } from "@/constants";
import type {
  APIListResponse,
  Country,
  CountryListResponse,
  MovieListItem,
} from "@/types";

/**
 * Raw shape returned by the `/quoc-gia` endpoint. The country list is nested
 * under `data.items`; we defensively also accept a flat `items` array.
 */
interface RawCountryListResponse {
  status?: boolean | string;
  message?: string;
  data?: { items?: Country[] };
  items?: Country[];
}

/**
 * Fetch the full list of countries. Supports every known upstream shape.
 */
export async function getAllCountries(): Promise<CountryListResponse> {
  const res = await apiGet<Country[] | RawCountryListResponse>(API_ENDPOINTS.COUNTRIES);
  if (Array.isArray(res)) return { status: true, items: res };
  return { status: true, items: res.data?.items ?? res.items ?? [] };
}

/**
 * Fetch movies belonging to a given country.
 * GET /quoc-gia/[slug]?page=
 */
export async function getMoviesByCountry(
  slug: string,
  page = 1,
): Promise<APIListResponse<MovieListItem>> {
  return apiGet<APIListResponse<MovieListItem>>(
    API_ENDPOINTS.MOVIES_BY_COUNTRY(slug),
    { params: { page } },
  );
}

export const countryService = {
  getAllCountries,
  getMoviesByCountry,
};

export default countryService;
