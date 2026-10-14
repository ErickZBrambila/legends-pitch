"use client";

import { track } from "@vercel/analytics";
import type { ComponentProps } from "react";

type Props = ComponentProps<"a"> & {
  eventName: string;
  eventProps?: Record<string, string | number | boolean>;
};

export default function TrackedAnchor({ eventName, eventProps, onClick, children, ...props }: Props) {
  return (
    <a
      {...props}
      onClick={(e) => {
        track(eventName, eventProps);
        onClick?.(e);
      }}
    >
      {children}
    </a>
  );
}
