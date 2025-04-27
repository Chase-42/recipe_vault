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

  const getParam = useCallback(
    (name: string, defaultValue?: string) => {
      return searchParams.get(name) ?? defaultValue;
    },
    [searchParams]
  );

  return {
    updateParam,
    getParam,
    createQueryString,
  };
}
