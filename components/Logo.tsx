export default function Logo() {
  return (
    <svg
      width="44"
      height="30"
      viewBox="0 0 88 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id="mGrad"
          x1="0"
          y1="0"
          x2="88"
          y2="0"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#18160f" stopOpacity="1" />
          <stop offset="48%" stopColor="#18160f" stopOpacity="1" />
          <stop offset="62%" stopColor="#18160f" stopOpacity="0.45" />
          <stop offset="78%" stopColor="#18160f" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#18160f" stopOpacity="0.07" />
        </linearGradient>
      </defs>
      <path
        d="M 10 54 C 6 44 2 26 6 6 C 14 -4 32 0 38 16 C 42 28 42 36 44 38 C 46 36 46 28 52 16 C 58 0 76 -4 82 6 C 86 26 82 44 78 54"
        stroke="url(#mGrad)"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="44" cy="38" r="6" fill="#f5f1ea" />
      <circle cx="44" cy="38" r="4.5" fill="#c4a35a" />
    </svg>
  );
}
