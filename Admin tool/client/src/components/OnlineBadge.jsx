export default function OnlineBadge({ size = 'sm' }) {
  const sizes = {
    xs: 'w-2 h-2',
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
  };

  return (
    <span className="relative inline-flex">
      <span className={`${sizes[size]} bg-green-500 rounded-full`} />
      <span className={`absolute inset-0 ${sizes[size]} bg-green-400 rounded-full animate-ping opacity-75`} />
    </span>
  );
}
