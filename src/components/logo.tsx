export function Logo({ size = 36 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="20" r="18" fill="#2D3033" stroke="#F7931E" strokeWidth="2.5" />
        <text
          x="20"
          y="27"
          textAnchor="middle"
          fontFamily="var(--font-sora), sans-serif"
          fontWeight="700"
          fontSize="17"
          fill="#FFFFFF"
        >
          M
        </text>
      </svg>
      <div className="flex flex-col leading-tight">
        <span className="font-display font-bold text-[13.5px] text-white">MERCADÃO</span>
        <span className="font-display font-bold text-[9px] text-orange tracking-[0.14em]">
          ATACADISTA
        </span>
      </div>
    </div>
  );
}
