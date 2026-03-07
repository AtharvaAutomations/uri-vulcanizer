import { createContext } from "react";

export type PageContextType = { setPage?: (p: string) => void };

export const PageContext = createContext<PageContextType | undefined>(
  undefined
);
