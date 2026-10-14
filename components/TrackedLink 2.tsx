"use client";

import Link from "next/link";
import { track } from "@vercel/analytics";
import type { ComponentProps } from "react";

type Props = ComponentProps<typeof Link> & {
  eventName: string;
  eventProps?: Record<string, string | number | boolean>;
};

export default function TrackedLink({ eventName, eventProps, onClick, children, ...props }: Props) {
  return (
    <Link
      {...props}
      onClick={(e) => {
        track(eventName, eventProps);
        onClick?.(e);
      }}
    >
      {children}
    </Link>
  );
}
