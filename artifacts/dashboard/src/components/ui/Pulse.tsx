interface PulseProps {
  active: boolean;
}

export function Pulse({ active }: PulseProps) {
  return (
    <span className="relative flex h-2 w-2">
      {active && (
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00d4aa] opacity-75" />
      )}
      <span
        className={`relative inline-flex rounded-full h-2 w-2 ${
          active ? "bg-[#00d4aa]" : "bg-[#8b8b9a]"
        }`}
      />
    </span>
  );
}
