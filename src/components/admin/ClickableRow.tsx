"use client";

import { useRouter } from "next/navigation";

export default function ClickableRow({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  return (
    <tr
      onClick={() => router.push(href)}
      onKeyDown={(e) => {
        if (e.key === "Enter") router.push(href);
      }}
      tabIndex={0}
      className="cursor-pointer outline-none focus:bg-indigo-50/60"
    >
      {children}
    </tr>
  );
}
