import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function Base({ children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function HomeIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M3.5 10.5 12 3.8l8.5 6.7" />
      <path d="M5.5 9.2v10.1h13V9.2" />
      <path d="M9.7 19.3v-5.6h4.6v5.6" />
    </Base>
  );
}

export function TranslateIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4 5.5h7.5M7.7 5.5v2.1c0 3-1.5 5.6-3.7 7.2" />
      <path d="M5 8.6c.8 2.5 2.6 4.4 5 5.4" />
      <path d="M13.4 19.5 16.7 11l3.3 8.5" />
      <path d="M14.4 17h4.6" />
    </Base>
  );
}

export function CardsIcon(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="6.5" y="3.5" width="12.8" height="15.5" rx="2.5" />
      <path d="M4.7 7.2v11.1a2.3 2.3 0 0 0 2.3 2.3h8.7" />
      <path d="M10.4 8.5h5.1M10.4 11.6h3.6" />
    </Base>
  );
}

export function CompassIcon(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="8.7" />
      <path d="m14.8 9.2-1.5 4.1-4.1 1.5 1.5-4.1z" />
    </Base>
  );
}

export function ChartIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4 19.5h16" />
      <path d="M6.5 16V11M11 16V6.5M15.5 16v-3.4M20 16V8.5" />
    </Base>
  );
}

export function SettingsIcon(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="3.1" />
      <path d="M19.1 12a7 7 0 0 0-.1-1.1l2-1.5-2-3.4-2.3.9a7 7 0 0 0-1.9-1.1L14.5 3h-5l-.3 2.8a7 7 0 0 0-1.9 1.1l-2.3-.9-2 3.4 2 1.5a7 7 0 0 0 0 2.2l-2 1.5 2 3.4 2.3-.9a7 7 0 0 0 1.9 1.1l.3 2.8h5l.3-2.8a7 7 0 0 0 1.9-1.1l2.3.9 2-3.4-2-1.5c.1-.4.1-.8.1-1.1Z" />
    </Base>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4.5 12h15M13.5 6l6 6-6 6" />
    </Base>
  );
}

export function ArrowUpRightIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M7 17 17 7M8.5 7H17v8.5" />
    </Base>
  );
}

export function BookmarkIcon({ filled, ...props }: IconProps & { filled?: boolean }) {
  return (
    <Base {...props} fill={filled ? "currentColor" : "none"}>
      <path d="M6.5 4.5h11v15.2L12 15.8l-5.5 3.9z" />
    </Base>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="m5 12.5 4.4 4.3L19 6.8" />
    </Base>
  );
}

export function RotateIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M19.5 8.7A8.2 8.2 0 0 0 5.2 6.4L3.5 8.2" />
      <path d="M3.5 4.5v3.7h3.7" />
      <path d="M4.5 15.3a8.2 8.2 0 0 0 14.3 2.3l1.7-1.8" />
      <path d="M20.5 19.5v-3.7h-3.7" />
    </Base>
  );
}

export function SparkIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 3.5c.5 4.3 3.2 7 7.5 7.5-4.3.5-7 3.2-7.5 7.5-.5-4.3-3.2-7-7.5-7.5 4.3-.5 7-3.2 7.5-7.5Z" />
      <path d="M18.5 16.5c.2 1.6 1.2 2.6 2.8 2.8-1.6.2-2.6 1.2-2.8 2.8-.2-1.6-1.2-2.6-2.8-2.8 1.6-.2 2.6-1.2 2.8-2.8Z" />
    </Base>
  );
}

export function FlameIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M13.2 3.5c.5 3.1-.7 4.8-2.2 6.1-1 .9-1.6 1.8-1.6 3 0 .9.4 1.6 1.1 2.1-.1-1.5.6-2.6 1.8-3.5 1.7-1.3 3.7-2.5 3.7-5.2 0-.9-.1-1.7-.4-2.5 2.9 1.7 4.7 4.6 4.7 7.9 0 4.3-3.4 7.3-7.3 7.3S5.5 16 5.5 11.7c0-3.6 2.2-6.5 5.6-8.2" />
    </Base>
  );
}

export function TargetIcon(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.6" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </Base>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.2V12l3.2 2" />
    </Base>
  );
}

export function BookOpenIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4 5.2c2.8-.4 5.4.2 8 1.8 2.6-1.6 5.2-2.2 8-1.8v13c-2.8-.4-5.4.2-8 1.8-2.6-1.6-5.2-2.2-8-1.8z" />
      <path d="M12 7v13" />
    </Base>
  );
}

export function LayersIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="m12 3.8 8.5 4.4L12 12.6 3.5 8.2z" />
      <path d="m4.2 12.4 7.8 4.1 7.8-4.1" />
      <path d="m4.2 16.4 7.8 4.1 7.8-4.1" />
    </Base>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="m6 9.5 6 6 6-6" />
    </Base>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="m9.5 6 6 6-6 6" />
    </Base>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="m6 6 12 12M18 6 6 18" />
    </Base>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 5v14M5 12h14" />
    </Base>
  );
}

export function FilterIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4 6.5h16M7 12h10M10 17.5h4" />
    </Base>
  );
}

export function QuoteIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M9.5 6.5c-3 1.2-4.5 3.4-4.5 6.5v4.5h5v-5H7.3c0-2 .8-3.4 2.7-4.2zM19 6.5c-3 1.2-4.5 3.4-4.5 6.5v4.5h5v-5h-2.7c0-2 .8-3.4 2.7-4.2z" />
    </Base>
  );
}

export function GlobeIcon(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.8 12h16.4M12 3.5c2.2 2.3 3.3 5.2 3.3 8.5S14.2 18.2 12 20.5c-2.2-2.3-3.3-5.2-3.3-8.5S9.8 5.8 12 3.5Z" />
    </Base>
  );
}

export function CheckCircleIcon(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m8.2 12.2 2.6 2.5 5-5.1" />
    </Base>
  );
}

export function AlertIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 4 2.9 19.5h18.2z" />
      <path d="M12 9.3v4.2M12 16.6v.1" />
    </Base>
  );
}

export function PenIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="m4.5 19.5 4.2-1 9.9-9.9a2.1 2.1 0 0 0-3-3l-9.9 9.9z" />
      <path d="m13.4 7.4 3 3" />
    </Base>
  );
}

export function EarIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M7 9.5a5 5 0 1 1 9.6 2c-.6 1.2-1.8 1.8-2.6 2.7-.7.8-1 1.5-1 2.7a2.4 2.4 0 0 1-4.7.7" />
      <path d="M9.2 9.7a2.8 2.8 0 0 1 5.4 1c0 .8-.4 1.3-.9 1.8" />
    </Base>
  );
}

export function SpeakerIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4.5 9.5h3l4-3.2v11.4l-4-3.2h-3z" />
      <path d="M15.2 9a4.2 4.2 0 0 1 0 6M17.8 6.5a7.7 7.7 0 0 1 0 11" />
    </Base>
  );
}
