export function SimpleProgress({ value = 0, className = '' }) {
  const percentage = Math.min(Math.max(value, 0), 100);

  return (
    <div className={`relative h-4 w-full overflow-hidden rounded-full bg-secondary ${className}`}>
      <div
        className="h-full bg-primary transition-all"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
