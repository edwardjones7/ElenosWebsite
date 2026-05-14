export function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="stat">
      <div className="label">{label}</div>
      <div className="value">{typeof value === "number" ? value.toLocaleString() : value}</div>
    </div>
  );
}
