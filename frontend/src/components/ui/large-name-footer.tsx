import * as React from "react";

interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

interface FooterColumn {
  title: string;
  links: FooterLink[];
}

interface FooterProps {
  brandName?: string;
  tagline?: string;
  largeText?: string;
  columns?: FooterColumn[];
  copyright?: string;
}

const Link = ({
  href,
  children,
  className,
  style,
  onMouseEnter,
  onMouseLeave,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => {
  const isExternal = href.startsWith("http://") || href.startsWith("https://");
  return (
    <a
      href={href}
      className={className}
      style={style}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      {...props}
    >
      {children}
    </a>
  );
};

const EarthIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
    <path
      d="M12 3C12 3 8.5 7.5 8.5 12C8.5 15.5 10 19 12 21"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
    <path
      d="M12 3C12 3 15.5 7.5 15.5 12C15.5 15.5 14 19 12 21"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
    <path
      d="M3.5 12H20.5"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
    <path
      d="M5 7.5H19"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      opacity="0.4"
    />
    <path
      d="M5 16.5H19"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      opacity="0.4"
    />
  </svg>
);

const defaultColumns: FooterColumn[] = [
  {
    title: "Platform",
    links: [
      { label: "Dashboard", href: "/" },
      { label: "Projects", href: "/" },
      { label: "Analytics", href: "/" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Documentation", href: "#" },
      {
        label: "API Reference",
        href: "http://127.0.0.1:8000/docs",
        external: true,
      },
    ],
  },
  {
    title: "Community",
    links: [
      { label: "GitHub", href: "https://github.com", external: true },
      { label: "X / Twitter", href: "https://x.com", external: true },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "#" },
      { label: "Terms of Service", href: "#" },
    ],
  },
];

function Footer({
  brandName = "Darukaa.Earth",
  tagline = "Geospatial carbon & biodiversity intelligence for conservation projects.",
  largeText = "Darukaa.Earth",
  columns = defaultColumns,
  copyright,
}: FooterProps) {
  const year = new Date().getFullYear();
  const copyrightText =
    copyright ?? `© ${year} Darukaa.Earth. All rights reserved.`;
  const activeColumns = columns.filter(
    (col) => col.links && col.links.length > 0,
  );

  return (
    <footer
      style={{
        width: "100%",
        padding: "64px 32px 0",
        borderTop: "1px solid rgba(255, 255, 255, 0.08)",
        background: "#09090b",
        color: "#f4f4f6",
        fontFamily: "inherit",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* ─── Top row ─── */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            gap: "48px",
            marginBottom: "52px",
          }}
        >
          {/* Brand block */}
          <div
            style={{
              maxWidth: "300px",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            <Link
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "9px",
                textDecoration: "none",
              }}
            >
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "28px",
                  height: "28px",
                  borderRadius: "7px",
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "#141418",
                  color: "#10b981",
                  flexShrink: 0,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.5)",
                }}
              >
                <EarthIcon />
              </span>
              <span
                style={{
                  fontSize: "15px",
                  fontWeight: 600,
                  letterSpacing: "-0.01em",
                  color: "#ffffff",
                }}
              >
                {brandName}
              </span>
            </Link>

            <p
              style={{
                fontSize: "13px",
                lineHeight: "1.7",
                color: "#94949e",
                margin: 0,
              }}
            >
              {tagline}
            </p>

            <p
              style={{
                fontSize: "12px",
                color: "#61616c",
                margin: 0,
              }}
            >
              {copyrightText}
            </p>
          </div>

          {/* Navigation columns */}
          {activeColumns.length > 0 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${Math.min(activeColumns.length, 4)}, minmax(100px, 1fr))`,
                gap: "40px",
              }}
            >
              {activeColumns.map((col, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "#61616c",
                    }}
                  >
                    {col.title}
                  </span>
                  <ul
                    style={{
                      listStyle: "none",
                      padding: 0,
                      margin: 0,
                      display: "flex",
                      flexDirection: "column",
                      gap: "9px",
                    }}
                  >
                    {col.links.map((link, lIdx) => (
                      <li key={lIdx}>
                        <Link
                          href={link.href}
                          style={{
                            fontSize: "13px",
                            color: "#94949e",
                            textDecoration: "none",
                            transition: "color 150ms ease",
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLAnchorElement).style.color =
                              "#ffffff";
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLAnchorElement).style.color =
                              "#94949e";
                          }}
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ─── Large brand text — Auto-fitting dynamic SVG (never clips or breaks) ─── */}
        <div
          style={{
            width: "100%",
            overflow: "hidden",
            borderTop: "1px solid rgba(255, 255, 255, 0.06)",
            paddingTop: "24px",
            paddingBottom: "8px",
            userSelect: "none",
            pointerEvents: "none",
          }}
        >
          <svg
            viewBox="0 0 1150 180"
            width="100%"
            height="auto"
            style={{
              display: "block",
              width: "100%",
              height: "auto",
              maxHeight: "180px",
            }}
          >
            <text
              x="50%"
              y="55%"
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#10b981"
              fontSize="160"
              fontWeight="900"
              letterSpacing="-0.035em"
              fontFamily="Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
            >
              {largeText}
            </text>
          </svg>
        </div>
      </div>
    </footer>
  );
}

export { Footer };
