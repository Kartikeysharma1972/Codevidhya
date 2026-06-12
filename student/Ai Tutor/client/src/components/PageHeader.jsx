import { motion } from 'framer-motion';

export default function PageHeader({
  eyebrow,
  title,
  subtitle,
  icon: Icon,
  accentText,
  actions,
  className = '',
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={`flex items-start justify-between gap-4 flex-wrap ${className}`}
    >
      <div className="flex items-start gap-3 min-w-0">
        {Icon && (
          <div className="grid place-items-center w-11 h-11 rounded-2xl bg-gradient-to-br from-primary-100 to-primary-200/70 text-primary-600 flex-shrink-0 shadow-sm border border-primary-100">
            <Icon className="text-xl" />
          </div>
        )}
        <div className="min-w-0">
          {eyebrow && (
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-500 mb-1">
              {eyebrow}
            </p>
          )}
          <h1 className="font-display font-extrabold text-[22px] md:text-2xl text-gray-900 leading-tight">
            {title}
            {accentText && <span className="ml-2 text-primary-500">{accentText}</span>}
          </h1>
          {subtitle && (
            <p className="mt-1 text-[13.5px] text-gray-500 leading-relaxed max-w-2xl">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </motion.div>
  );
}
