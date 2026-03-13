import { createContext, useContext, useState, type ReactNode } from "react";

export interface BeeChatPageContext {
  /** Current page type for agent awareness */
  page: "dashboard" | "property" | "booking" | "other";
  /** Property ID if on a property or booking page */
  propertyId?: string;
  /** Property name for natural language */
  propertyName?: string;
  /** Booking ID if on a booking page */
  bookingId?: string;
  /** Guest name if on a booking page */
  guestName?: string;
  /** Guest email for memory lookups */
  guestEmail?: string;
  /** Check-in date */
  checkIn?: string;
  /** Check-out date */
  checkOut?: string;
}

interface BeeChatContextValue {
  pageContext: BeeChatPageContext;
  setPageContext: (ctx: BeeChatPageContext) => void;
}

const BeeChatCtx = createContext<BeeChatContextValue>({
  pageContext: { page: "dashboard" },
  setPageContext: () => {},
});

export const useBeeChatContext = () => useContext(BeeChatCtx);

export function BeeChatProvider({ children }: { children: ReactNode }) {
  const [pageContext, setPageContext] = useState<BeeChatPageContext>({
    page: "dashboard",
  });

  return (
    <BeeChatCtx.Provider value={{ pageContext, setPageContext }}>
      {children}
    </BeeChatCtx.Provider>
  );
}
