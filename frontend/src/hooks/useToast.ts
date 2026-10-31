import { createContext, useContext } from "react";

export interface ToastApi {
  // Shows a short confirmation, such as "Shift added". A new message replaces
  // the one on screen.
  show: (message: string) => void;
}

// Without a provider (in a test of a single page, say) showing a toast does
// nothing, so a component can always call it.
export const ToastContext = createContext<ToastApi>({ show: () => {} });

export function useToast(): ToastApi {
  return useContext(ToastContext);
}
