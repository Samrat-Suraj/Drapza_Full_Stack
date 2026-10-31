"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userApi, productApi, siteConfigApi, heroApi, footerConfigApi } from "@/lib/api";

// Centralized Query Keys
export const queryKeys = {
  user: {
    all: ["user"] as const,
    profile: ["user", "profile"] as const,
  },
  products: {
    all: ["products"] as const,
    list: (params?: any) => ["products", "list", params] as const,
    detail: (id: string) => ["products", "detail", id] as const,
  },
  config: {
    site: ["config", "site"] as const,
    hero: ["config", "hero"] as const,
    footer: ["config", "footer"] as const,
  },
};

// 1. User Profile Query Hook (Deduplicates & caches profile requests across Header, AdminGuard, Profile)
export function useUserProfileQuery(options?: { enabled?: boolean; initialData?: any }) {
  return useQuery({
    queryKey: queryKeys.user.profile,
    queryFn: async () => {
      try {
        const res = await userApi.getProfile();
        if (res && res.success && res.user) {
          if (typeof window !== "undefined") {
            try {
              localStorage.setItem("drapza_user", JSON.stringify(res.user));
              window.dispatchEvent(new CustomEvent("drapza_auth_state_changed", { detail: res.user }));
            } catch (e) {}
          }
          return res.user;
        }

        // If explicit failure or unauthenticated response
        if (typeof window !== "undefined") {
          try {
            localStorage.removeItem("drapza_user");
            window.dispatchEvent(new CustomEvent("drapza_auth_state_changed", { detail: null }));
          } catch (e) {}
        }
        return null;
      } catch (err: any) {
        if (err?.response?.status === 401 || err?.status === 401) {
          if (typeof window !== "undefined") {
            try {
              localStorage.removeItem("drapza_user");
              window.dispatchEvent(new CustomEvent("drapza_auth_state_changed", { detail: null }));
            } catch (e) {}
          }
          return null;
        }
        return null;
      }
    },
    initialData: () => {
      if (options?.initialData !== undefined) return options.initialData;
      return undefined;
    },
    initialDataUpdatedAt: 0, // Immediately stale so background check revalidates with server, but UI has zero flash
    staleTime: 60 * 1000, // 1 minute cache
    gcTime: 10 * 60 * 1000,
    retry: false,
    enabled: options?.enabled !== undefined ? options.enabled : true,
  });
}

// 2. Products Query Hook (Instant memory cached product catalog)
export function useProductsQuery(params: { limit?: number; page?: number } = { limit: 100 }) {
  return useQuery({
    queryKey: queryKeys.products.list(params),
    queryFn: async () => {
      const res = await productApi.getAll(params);
      if (res && res.success && res.products) {
        return res.products;
      }
      return [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes cache for garments
  });
}

// 3. Site Config Query Hook
export function useSiteConfigQuery() {
  return useQuery({
    queryKey: queryKeys.config.site,
    queryFn: async () => {
      const res = await siteConfigApi.getSiteConfig();
      if (res && res.success && res.data) {
        return res.data;
      }
      return null;
    },
    staleTime: 5 * 60 * 1000,
  });
}

// 4. Invalidation & Cache Management Helper
export function useAuthCacheActions() {
  const queryClient = useQueryClient();

  return {
    invalidateProfile: () => queryClient.invalidateQueries({ queryKey: queryKeys.user.profile }),
    setProfileData: (user: any) => {
      if (typeof window !== "undefined") {
        try {
          if (user) {
            localStorage.setItem("drapza_user", JSON.stringify(user));
            window.dispatchEvent(new CustomEvent("drapza_auth_state_changed", { detail: user }));
          } else {
            localStorage.removeItem("drapza_user");
            window.dispatchEvent(new CustomEvent("drapza_auth_state_changed", { detail: null }));
          }
        } catch (e) {}
      }
      queryClient.setQueryData(queryKeys.user.profile, user);
    },
    clearProfile: () => {
      if (typeof window !== "undefined") {
        try {
          localStorage.removeItem("drapza_user");
          window.dispatchEvent(new CustomEvent("drapza_auth_state_changed", { detail: null }));
        } catch (e) {}
      }
      queryClient.setQueryData(queryKeys.user.profile, null);
    },
    invalidateAll: () => queryClient.invalidateQueries(),
  };
}

