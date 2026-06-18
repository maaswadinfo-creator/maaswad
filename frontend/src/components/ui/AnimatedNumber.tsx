import { useEffect, useRef, useState } from 'react';
import { animate } from 'framer-motion';

export function AnimatedNumber({ value, format = (n) => Math.round(n).toLocaleString('en-IN'), className }: {
  value: number; format?: (n: number) => string; className?: string;
}) {
  const [display, setDisplay] = useState('0');
  const prev = useRef(0);
  useEffect(() => {
    const controls = animate(prev.current, value, {
      duration: 0.9, ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(format(v)),
    });
    prev.current = value;
    return () => controls.stop();
  }, [value]);
  return <span className={className}>{display}</span>;
}
