// src/app/components/DetailItem.jsx
"use client"; // Marking as a Client Component

import { ExternalLink as ExternalLinkIcon } from "lucide-react"; // Used for the link badge

const DetailItem = ({
  icon,
  label,
  value,
  valueClassName = "text-muted-foreground",
  isLink = false,
}) => {
  // The 'icon' prop will now receive pre-rendered JSX, e.g., <Film size={16} className="..." />

  // Return null if the value is not meaningful to display
  if (
    value === null ||
    typeof value === "undefined" ||
    String(value).trim() === ""
  ) {
    if (typeof value !== "number" && typeof value !== "boolean") return null; // Allow 0 or false to be displayed
  }

  let displayValueNode;

  if (isLink && typeof value === "string" && value.trim().startsWith("http")) {
    try {
      const url = new URL(value);
      const linkHostname = url.hostname.replace(/^www\./, ""); // Remove 'www.'
      displayValueNode = (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className={`ml-1.5 inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors
                      bg-primary/10 hover:bg-primary/20 text-primary 
                      dark:bg-primary/20 dark:hover:bg-primary/30 dark:text-primary-foreground/80 
                      focus:outline-none focus-visible:ring-1 focus-visible:ring-ring 
                      ring-offset-1 dark:ring-offset-background`} // Ensure focus ring respects theme
          title={value} // Show full URL on hover for accessibility and information
        >
          {linkHostname}
          <ExternalLinkIcon
            size={10}
            className="ml-0.5 opacity-70 flex-shrink-0"
          />
        </a>
      );
    } catch (e) {
      console.warn("DetailItem: Invalid URL provided for link:", value);
      // Fallback to displaying the value as plain text if URL parsing fails
      displayValueNode = (
        <span className={`ml-1 ${valueClassName} break-words`}>
          {String(value)}
        </span>
      );
    }
  } else {
    displayValueNode = (
      <span className={`ml-1 ${valueClassName} break-words`}>
        {String(value)}
      </span>
    );
  }

  return (
    <div className="flex items-start space-x-2 py-1 group">
      {icon}{" "}
      {/* Render the icon JSX directly, as it's passed from the Server Component parent */}
      <div className="min-w-0 flex-grow">
        <span className="font-semibold text-card-foreground">{label}:</span>
        {displayValueNode}
      </div>
    </div>
  );
};

export default DetailItem;
