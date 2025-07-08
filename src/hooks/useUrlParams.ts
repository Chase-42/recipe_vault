import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export function useUrlParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(name, value);
      return params.toString();
    },
    [searchParams]
  );

  const updateParam = useCallback(
    (name: string, value: string) => {
      const query = createQueryString(name, value);
      router.push(`${pathname}?${query}`);
    },
    [createQueryString, pathname, router]
  );

  const updateMultipleParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === "" || value === "undefined" || value === "null") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [searchParams, pathname, router]
  );

  const getParam = useCallback(
    (name: string, defaultValue?: string) => {
      return searchParams.get(name) ?? defaultValue;
    },
    [searchParams]
  );

  const removeParam = useCallback(
    (name: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete(name);
      router.push(`${pathname}?${params.toString()}`);
    },
    [searchParams, pathname, router]
  );

  return {
    updateParam,
    updateMultipleParams,
    getParam,
    removeParam,
    createQueryString,
  };
}
