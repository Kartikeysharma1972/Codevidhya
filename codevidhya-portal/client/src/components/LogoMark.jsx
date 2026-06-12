import { Link } from 'react-router-dom';

export default function LogoMark({ size = 'md', linkTo = '/' }) {
  const wrap = size === 'lg' ? 'w-12 h-12' : 'w-10 h-10';
  const title = size === 'lg' ? 'text-[20px]' : 'text-[17px]';

  const content = (
    <span className="flex items-center gap-2.5">
      <span className={`grid place-items-center ${wrap} rounded-2xl overflow-hidden bg-white ring-1 ring-primary-100 shadow-sm`}>
        <img src="/codevidhya_logo.jfif" alt="Codevidhya" className="w-full h-full object-cover" />
      </span>
      <span className="leading-tight">
        <span className={`block font-display font-extrabold ${title} text-gray-900 tracking-tight`}>
          Codevidhya
        </span>
        <span className="block text-[10.5px] text-gray-400 -mt-0.5">
          One platform · Students · Teachers · Schools
        </span>
      </span>
    </span>
  );

  if (!linkTo) return content;
  return <Link to={linkTo} className="inline-flex items-center group">{content}</Link>;
}
