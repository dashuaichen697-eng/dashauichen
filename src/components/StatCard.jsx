export default function StatCard({ label, value, sub }) {
  return (
    <div className="rounded-lg border border-gold/15 bg-black/24 p-3">
      <div className="text-xs text-amberline/60">{label}</div>
      <div className="mt-1 text-2xl font-black tracking-normal text-white">{value}</div>
      {sub && <div className="mt-1 text-xs text-white/45">{sub}</div>}
    </div>
  );
}
