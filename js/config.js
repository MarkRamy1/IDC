// إعدادات بيئة العمل المرنة (محليًا وسحابيًا)
const basePath = window.location.pathname.replace(/\/(index\.html|u\.html)?$/, '').replace(/\/$/, '');
export const CFG = {
  API_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? '/idc/api' : (basePath + '/api'),
  SITE_URL: window.location.origin + basePath,
  SUPPORT_PHONE: '19000'
};
