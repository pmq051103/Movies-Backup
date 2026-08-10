import { apiGet } from "@/api/axiosClient";
import { API_ENDPOINTS } from "@/constants";
import type { ActorInfoResponse } from "@/types";

/**
 * Fetch actor/cast member info by slug.
 * GET /dien-vien/[slug]
 */
export async function getActorInfo(slug: string): Promise<ActorInfoResponse> {
  return apiGet<ActorInfoResponse>(API_ENDPOINTS.ACTOR_DETAIL(slug));
}

export const actorService = {
  getActorInfo,
};

export default actorService;
