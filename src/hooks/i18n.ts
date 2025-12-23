export const useI18nStore = () => {
  const language = window.argv[3].application.language;
  const localString = {
    en: {
      'Action Settings': 'Gold Price Settings'
    },
    zh_CN: {
      'Action Settings': '金价设置'
    }
  };
  return localString[language] || localString['en'];
};
