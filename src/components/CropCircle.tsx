/** つかまえた ところ（囲んだ切り抜き）を、黄色いふちの丸で見せる（見本 07・08）。星と点の飾りつき */
export function CropCircle({ src, alt, size = 260 }: { src: string; alt: string; size?: number }) {
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div className="size-full overflow-hidden rounded-full border-4 border-ink bg-yellow p-[7px]">
        <div className="size-full overflow-hidden rounded-full border-[5px] border-navi bg-photo">
          {/* eslint-disable-next-line @next/next/no-img-element -- 囲んだ部分の切り抜き（data URL） */}
          <img src={src} alt={alt} className="size-full object-contain" />
        </div>
      </div>
      {size >= 200 && (
        <svg aria-hidden="true" viewBox="0 0 260 260" className="pointer-events-none absolute inset-0 size-full overflow-visible">
          <path d="M236 18l6 12 13 2-10 9 3 13-12-7-12 7 3-13-10-9 13-2z" fill="#FFC83D" stroke="#22223A" strokeWidth="2.5" strokeLinejoin="round" />
          <circle cx="20" cy="230" r="9" fill="#FF6F9C" stroke="#22223A" strokeWidth="2.5" />
        </svg>
      )}
    </div>
  );
}
