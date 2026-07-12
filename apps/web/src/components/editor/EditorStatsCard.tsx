interface EditorStatsCardProps {
  label: string;
  value: string | number;
  icon: string;
  subtitle?: string;
  color: 'blue' | 'green' | 'red' | 'purple' | 'teal' | 'orange' | 'yellow' | 'indigo' | 'pink' | 'gray';
  /**
   * Compact mode: tighter padding + smaller type so several cards fit in a
   * 2-column grid on mobile instead of stacking as full-height tiles.
   */
  compact?: boolean;
}

export function EditorStatsCard({ label, value, icon, subtitle, color, compact = false }: EditorStatsCardProps) {
  const colorClasses = {
    blue: 'from-blue-50 to-blue-100 border-blue-200 text-blue-700 text-blue-900',
    green: 'from-green-50 to-green-100 border-green-200 text-green-700 text-green-900',
    red: 'from-red-50 to-red-100 border-red-200 text-red-700 text-red-900',
    purple: 'from-purple-50 to-purple-100 border-purple-200 text-purple-700 text-purple-900',
    teal: 'from-teal-50 to-teal-100 border-teal-200 text-teal-700 text-teal-900',
    orange: 'from-orange-50 to-orange-100 border-orange-200 text-orange-700 text-orange-900',
    yellow: 'from-yellow-50 to-yellow-100 border-yellow-200 text-yellow-700 text-yellow-900',
    indigo: 'from-indigo-50 to-indigo-100 border-indigo-200 text-indigo-700 text-indigo-900',
    pink: 'from-pink-50 to-pink-100 border-pink-200 text-pink-700 text-pink-900',
    gray: 'from-gray-50 to-gray-100 border-gray-200 text-gray-700 text-gray-900',
  };

  const colors = colorClasses[color].split(' ');
  const bgGradient = `${colors[0]} ${colors[1]}`;
  const border = colors[2];
  const labelColor = colors[3];
  const valueColor = colors[4];

  const padding = compact ? 'p-3 sm:p-4' : 'p-6';
  const valueSize = compact ? 'text-xl sm:text-2xl' : 'text-3xl';
  const iconSize = compact ? 'text-2xl sm:text-3xl' : 'text-4xl';
  const labelSize = compact ? 'text-xs' : 'text-sm';

  return (
    <div className={`bg-gradient-to-br ${bgGradient} border-2 ${border} rounded-xl ${padding}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className={`${labelSize} font-medium ${labelColor} mb-1 truncate`}>{label}</div>
          <div className={`${valueSize} font-bold ${valueColor} truncate`}>{value}</div>
          {subtitle && <div className={`text-xs ${labelColor} mt-1 truncate`}>{subtitle}</div>}
        </div>
        <div className={`${iconSize} flex-shrink-0`}>{icon}</div>
      </div>
    </div>
  );
}
