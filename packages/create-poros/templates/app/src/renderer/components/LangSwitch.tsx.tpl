import { useCallback, useState } from 'react';
import { clsx } from 'metis-ui';
import { getLocale, setLocale } from 'poros';

const LangSwitch = ({ className }: { className?: string }) => {
  const [selectedLang, setSelectedLang] = useState(() => getLocale());

  const isZhCN = selectedLang === 'zh-CN';

  const onLangChange = useCallback(() => {
    setLocale(isZhCN ? 'en-US' : 'zh-CN');
    setSelectedLang(getLocale());
  }, []);

  return (
    <button
      key="lang-button"
      className={clsx('group relative size-6', className)}
      onClick={onLangChange}
    >
      <span
        className={clsx(
          'border-border-secondary absolute flex size-5 items-center justify-center rounded-[1px] text-base',
          {
            'group-hover:bg-text top-1 z-1 origin-[0_0] scale-70 bg-black/60 text-white dark:bg-gray-400 dark:text-gray-950':
              isZhCN,
            'group-hover:border-text bottom-0.5 z-0 origin-[100%_100%] scale-55 border border-black/60 dark:border-gray-400':
              !isZhCN,
          },
        )}
      >
        中
      </span>
      <span
        className={clsx(
          'border-border-secondary absolute flex size-5 items-center justify-center rounded-[1px] text-base',
          {
            'group-hover:bg-text top-1 z-1 origin-[0_0] scale-70 bg-black/60 text-white dark:bg-gray-400 dark:text-gray-950':
              !isZhCN,
            'group-hover:border-text bottom-0.5 z-0 origin-[100%_100%] scale-55 border border-black/60 dark:border-gray-400':
              isZhCN,
          },
        )}
      >
        En
      </span>
    </button>
  );
};

export default LangSwitch;
