interface ValueCardProps {
  label: string;
  value?: string | number | null;
  unit?: string;
}

export default function ValueCard({ label, value, unit }: ValueCardProps) {
  return (
    <div className="bg-white shadow-md rounded-lg p-6 border-l-4 border-blue-500 hover:shadow-lg transition-shadow">
      <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
        {label}
      </h3>
      <div className="flex items-baseline gap-2 mt-3">
        <p className="text-4xl font-bold text-gray-800">{value ?? "--"}</p>
        {unit && (
          <span className="text-lg text-gray-600 font-medium">{unit}</span>
        )}
      </div>
    </div>
  );
}
