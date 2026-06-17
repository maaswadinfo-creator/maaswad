export function VegBadge({ type }: { type: string }) {
  const map: Record<string, { c: string; label: string }> = {
    veg: { c: 'text-green-600 border-green-600', label: 'Veg' },
    non_veg: { c: 'text-red-600 border-red-600', label: 'Non-veg' },
    vegan: { c: 'text-emerald-600 border-emerald-600', label: 'Vegan' },
    egg: { c: 'text-amber-600 border-amber-600', label: 'Egg' },
  };
  const m = map[type] || map.veg;
  return (
    <span className={`inline-flex h-4 w-4 items-center justify-center border ${m.c}`} title={m.label}>
      <span className={`h-2 w-2 rounded-full ${m.c.replace('text', 'bg').split(' ')[0]}`} />
    </span>
  );
}
