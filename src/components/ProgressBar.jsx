export default function ProgressBar({ value, color = '#d7a846', label }) {
  return (
    <div>
      {label && (
        <div className="mb-2 flex items-center justify-between text-xs text-amberline/70">
          <span>{label}</span>
          <span>{value}%</span>
        </div>
      )}
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.min(value, 100)}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
