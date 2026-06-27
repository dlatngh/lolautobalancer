interface ProgressBarProps {
  percent: number;
  label?: string;
}

export default function ProgressBar({ percent, label }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));

  return (
    <div className="flex flex-col items-center w-96 max-w-full space-y-3 m-auto py-10">
      {label && (
        <p className="font-beaufort uppercase text-[#A09B8C] text-sm tracking-widest">
          {label}
        </p>
      )}
      <div className="w-full h-4 border-2 border-[#785A28] bg-[#010A13]">
        <div
          className="h-full bg-gradient-to-r from-[#785A28] to-[#C89B3C] transition-[width] duration-300 ease-out"
          style={{ width: `${clamped}%` }}
        />
      </div>
      <p className="font-beaufort text-[#C89B3C] text-lg">{clamped}%</p>
    </div>
  );
}
