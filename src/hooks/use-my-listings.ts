// Svoi — TanStack Query hooks for my listings
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMyListings,
  changeListingStatus,
  deleteListing,
  getMyStats,
} from "@/actions/my-listings";
import type { ListingStatus } from "@/lib/supabase/database.types";

export function useMyListings() {
  return useQuery({
    queryKey: ["my-listings"],
    queryFn:  getMyListings,
    staleTime: 30_000,
  });
}

export function useMyStats() {
  return useQuery({
    queryKey: ["my-stats"],
    queryFn:  getMyStats,
    staleTime: 60_000,
  });
}

export function useChangeListingStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ListingStatus }) =>
      changeListingStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-listings"] });
      queryClient.invalidateQueries({ queryKey: ["my-stats"] });
    },
  });
}

export function useDeleteListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteListing(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-listings"] });
      queryClient.invalidateQueries({ queryKey: ["my-stats"] });
    },
  });
}
