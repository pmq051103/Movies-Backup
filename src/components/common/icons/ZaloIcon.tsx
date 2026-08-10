import type { SVGProps } from "react";

/**
 * Zalo brand icon — a chat bubble containing the letter "Z", drawn as one
 * path with `evenodd` fill-rule so the Z is punched out of the bubble.
 * Uses `currentColor`, so the whole mark takes on whatever text color the
 * parent gives it (matches Facebook/TikTok icons in the footer set).
 */
export default function ZaloIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      fill="currentColor"
      fillRule="evenodd"
      clipRule="evenodd"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M16 3C8.27 3 2 8.03 2 14.24c0 3.62 2.13 6.83 5.42 8.87v3.66c0 .77.86 1.22 1.5.79l3.34-2.24c1.19.24 2.44.37 3.74.37 7.73 0 14-5.03 14-11.24S23.73 3 16 3ZM11.1 10.6h9.8c.86 0 1.35 1 .82 1.66l-6.65 8.1h5.83c.83 0 1.5.66 1.5 1.48 0 .82-.67 1.48-1.5 1.48h-9.7c-.87 0-1.35-1-.83-1.66l6.65-8.1h-5.92c-.83 0-1.5-.66-1.5-1.48s.67-1.48 1.5-1.48Z"
      />
    </svg>
  );
}
