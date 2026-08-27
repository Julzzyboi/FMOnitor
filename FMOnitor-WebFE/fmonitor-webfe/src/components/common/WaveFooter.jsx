function WaveFooter() {
  return (
    <svg
      viewBox="0 0 1536 200"
      preserveAspectRatio="none"
      className="absolute bottom-0 left-0 h-20 w-full animate-[fade-in_1s_ease-out_forwards] opacity-0 sm:h-32"
      aria-hidden="true"
    >
      <path
        d="M0 30 C 420 170, 780 170, 1040 90 C 1240 30, 1400 10, 1536 20 L1536 200 L0 200 Z"
        fill="#111112"
      />
      <path
        d="M0 30 C 420 170, 780 170, 1040 90 C 1240 30, 1400 10, 1536 20"
        fill="none"
        stroke="#f7a823"
        strokeWidth="12"
        strokeLinecap="round"
      />
    </svg>
  )
}

export default WaveFooter
