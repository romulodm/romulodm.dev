import * as React from "react";

type LogoProps = React.SVGProps<SVGSVGElement> & {
    size?: number;
};

/**
 * Brand mark: rounded diamond with an upward triangle cut out.
 * The same geometry lives in LayardCardTemplate.tsx (ICON_PATH_D) and in the
 * logo/favicon files under public/, so they must change together.
 */
export const MARK_D =
    "M330.25 32.25L479.75 181.75A105 105 0 0 1 479.75 330.25L330.25 479.75A105 105 0 0 1 181.75 479.75L32.25 330.25A105 105 0 0 1 32.25 181.75L181.75 32.25A105 105 0 0 1 330.25 32.25ZM237.62 147.38L151.88 233.12A26 26 0 0 0 170.27 277.50L341.73 277.50A26 26 0 0 0 360.12 233.12L274.38 147.38A26 26 0 0 0 237.62 147.38Z";

/** Filled with currentColor: every call site sets the color via text-*. */
export const Logo: React.FC<LogoProps> = ({ size = 15, className, ...props }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 512 512"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid meet"
        className={className}
        {...props}
    >
        <path d={MARK_D} fill="currentColor" fillRule="evenodd" />
    </svg>
);
