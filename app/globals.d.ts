import type { HTMLAttributes } from "react";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elementName: string]: HTMLAttributes<HTMLElement> & Record<string, unknown>;
    }
  }
}

export {};
