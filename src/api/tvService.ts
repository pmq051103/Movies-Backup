import { apiGet } from './axiosClient';
import { API_ENDPOINTS } from '@/constants';
import type { APIListResponse, FilterParams, MovieListItem } from '@/types';

export async function getTVShows(
  params?: FilterParams,
): Promise<APIListResponse<MovieListItem>> {
  return apiGet<APIListResponse<MovieListItem>>(API_ENDPOINTS.LIST_BY_SLUG('phim-bo'), {
    params,
  });
}

export async function getAnime(
  params?: FilterParams,
): Promise<APIListResponse<MovieListItem>> {
  return apiGet<APIListResponse<MovieListItem>>(API_ENDPOINTS.LIST_BY_SLUG('hoathinh'), {
    params,
  });
}

export async function getSeries(
  params?: FilterParams,
): Promise<APIListResponse<MovieListItem>> {
  return apiGet<APIListResponse<MovieListItem>>(API_ENDPOINTS.LIST_BY_SLUG('phim-bo'), {
    params,
  });
}

export const tvService = { getTVShows, getAnime, getSeries };
export default tvService;
