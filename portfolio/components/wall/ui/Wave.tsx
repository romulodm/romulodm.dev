// components/wall/ui/Wave.tsx

/**
 * Wavy divider between the card gradient and the dark footer.
 * The path creates a single organic hill — tall in the centre,
 * sweeping down to the edges — matching the visual style in the design.
 */
export function Wave() {
  return (
    <svg
      viewBox="0 0 600 56"
      preserveAspectRatio="none"
      className="block w-full"
      style={{ height: 36, display: "block", marginBottom: -1 }}
      aria-hidden
    >
      <path
        d="M0 48 L0 28 Q 150 4 300 28 Q 450 4 600 28 L600 48 Z"
        fill="#0b0b10"
      />
    </svg>
  );
}