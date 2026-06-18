import confetti from 'canvas-confetti';

export function celebrate() {
  const colors = ['#f97316', '#ea580c', '#fbbf24', '#16a34a', '#ffffff'];
  confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 }, colors });
  setTimeout(() => confetti({ particleCount: 50, angle: 60, spread: 60, origin: { x: 0 }, colors }), 150);
  setTimeout(() => confetti({ particleCount: 50, angle: 120, spread: 60, origin: { x: 1 }, colors }), 300);
}
