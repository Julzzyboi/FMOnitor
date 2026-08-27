function DotGrid({ className = '' }) {
  const dots = Array.from({ length: 15 })

  return (
    <div className={`grid grid-cols-5 gap-2.5 ${className}`} aria-hidden="true">
      {dots.map((_, i) => (
        <span key={i} className="h-1.5 w-1.5 rounded-full bg-amber-400" />
      ))}
    </div>
  )
}

export default DotGrid
