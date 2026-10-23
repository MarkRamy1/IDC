// IDC Secure Data Capsule & Identity Vault - Online & Offline Suite
// An independent project called IDC of keeping people's info safe, nothing more nothing less.

// --- SOUND SYNTHESIZER (Pure Web Audio API) ---
class SoundFX {
  constructor() {
    this.ctx = null;
  }
  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) this.ctx = new AudioContext();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }
  playSuccess() {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';
      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5
      osc2.frequency.setValueAtTime(880, now + 0.15);
      osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.35); // D6

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now + 0.15);
      osc1.stop(now + 0.2);
      osc2.stop(now + 0.4);
    } catch (e) {
      console.warn('Audio not available', e);
    }
  }
  playError() {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.setValueAtTime(180, now + 0.12);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.28);
    } catch (e) {
      console.warn('Audio error', e);
    }
  }
  playBeep() {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(750, now);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.08);
    } catch (e) {
      console.warn('Audio error', e);
    }
  }
}

const sfx = new SoundFX();

// --- DEFAULT STATE & PERSISTENCE ---
const DEFAULT_OFFLINE_DATA = {
  fullName: 'أحمد إبراهيم المنشاوي',
  jobTitle: 'مهندس نظم أمن المعلومات وحماية البيانات',
  nationalId: '29509180104829',
  idcUid: 'IDC-SEC-2026-9942',
  bloodType: 'O+',
  allergies: 'حساسية شديدة من البنسلين ومشتقاته (Penicillin Sensitivity)',
  chronicConditions: 'لا توجد أمراض مزمنة حرجة - فحص دوري سليم',
  emergencyContact1Name: 'إبراهيم المنشاوي (جهة طوارئ رئيسية)',
  emergencyContact1Phone: '01012345678',
  emergencyContact2Name: 'م. ندى الألفي (جهة طوارئ بديلة)',
  emergencyContact2Phone: '01187654321',
  emergencyNotes: 'في حالة الحوادث أو الطوارئ: يرجى التواصل فوراً مع جهات الاتصال المسجلة وإبراز هذه البطاقة الرقمية IDC للطواقم الطبية. مسجل كمتبرع أعضاء رسمي.',
  organDonor: true,
  offlinePin: '1234',
  authMethod: 'nfc', // 'nfc' | 'qr'
  lastUpdated: new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
};

const DEFAULT_CERTIFICATES = [
  {
    id: 'cert_national_id',
    title: 'بطاقة الهوية الرقمية الوطنية المعتمدة',
    issuer: 'مصلحة الأحوال المدنية والحكومة الرقمية',
    issuerCode: 'CIVIL-ID-29509180',
    issueDate: '2023-01-15',
    expiryDate: '2030-01-14',
    status: 'valid',
    isPasswordProtected: true,
    password: '123',
    isUnlocked: false,
    sealColor: '#06b6d4',
    details: 'وثيقة إثبات الشخصية الرقمية الرسمية المشفرة والمطابقة لمعايير الهوية الوطنية والأمان البيومتري.'
  },
  {
    id: 'cert_driving',
    title: 'رخصة القيادة المهنية الذكية',
    issuer: 'الإدارة العامة للمرور - وزارة الداخلية',
    issuerCode: 'TRAFFIC-DL-88410',
    issueDate: '2022-05-10',
    expiryDate: '2028-05-09',
    status: 'valid',
    isPasswordProtected: true,
    password: '777',
    isUnlocked: false,
    sealColor: '#f59e0b',
    details: 'رخصة قيادة فئة أولى خاصة سارية ومعتمدة إلكترونياً برقم ترخيص موحد ومسجلة بالسجل المروري الموحد.'
  },
  {
    id: 'cert_data_security',
    title: 'شهادة الاعتماد المهني لحماية وأمان البيانات (ISO 27001)',
    issuer: 'المركز القومي لأمن المعلومات والاستجابة للطوارئ',
    issuerCode: 'INFOSEC-ISO-9901',
    issueDate: '2024-02-01',
    expiryDate: '2027-02-01',
    status: 'valid',
    isPasswordProtected: false,
    password: '',
    isUnlocked: true,
    sealColor: '#10b981',
    details: 'شهادة كفاءة مهنية معتمدة في تطبيق معايير التشفير المتقدمة والحفاظ على أمان وخصوصية البيانات الحساسة.'
  },
  {
    id: 'cert_health',
    title: 'وثيقة التأمين الصحي التكافلي الرقمية',
    issuer: 'الهيئة العامة للتأمين الصحي الشامل',
    issuerCode: 'UHI-GOLD-4421',
    issueDate: '2023-09-20',
    expiryDate: '2026-09-19',
    status: 'valid',
    isPasswordProtected: false,
    password: '',
    isUnlocked: true,
    sealColor: '#0d9488',
    details: 'تغطية تأمينية شاملة للطوارئ والحالات الحرجة بفئة ذهبية والحد الائتماني الكامل معتمد.'
  }
];

const TRUSTED_COMPANIES = [
  {
    name: 'مصلحة الأحوال المدنية والحكومة الرقمية',
    role: 'الجهة الرسمية للتحقق من الهوية الوطنية',
    icon: 'badge',
    verifiedId: 'EGY-CIVIL-AUTH',
    status: 'موثق حكومياً'
  },
  {
    name: 'الجهاز القومي لتنظيم الاتصالات (NTRA)',
    role: 'التوثيق الرقمي والتشفير السيبراني',
    icon: 'verified_user',
    verifiedId: 'NTRA-DIGITAL-TRUST',
    status: 'معتمد رسميًا'
  },
  {
    name: 'الهيئة العامة للتأمين الصحي الشامل',
    role: 'التغطية الصحية والملف الطبي الموحد',
    icon: 'health_and_safety',
    verifiedId: 'UHI-SEC-LEVEL-1',
    status: 'شريك معتمد'
  },
  {
    name: 'المركز القومي لأمن المعلومات (EG-CERT)',
    role: 'مراقبة النزاهة وحماية أمان البيانات',
    icon: 'security',
    verifiedId: 'EG-CERT-VERIFIED',
    status: 'معتمد أمنياً'
  },
  {
    name: 'شبكة التوثيق المستقلة IDC Secure Network',
    role: 'البنية التحتية لحفظ وتشفير البيانات',
    icon: 'lock',
    verifiedId: 'IDC-GLOBAL-NODE-01',
    status: 'نظام تشغيل نشط'
  }
];

// --- APP STATE ---
let AppState = {
  mode: 'online', // 'online' | 'offline'
  onlineTab: 'public', // 'public' | 'private' | 'certificates' | 'validity'
  isRegistered: false, // controlled by localStorage 'idc_is_registered'
  isAppLocked: true,   // prompts fingerprint every time app is opened if registered
  activeAuthMethod: 'nfc', // 'nfc' | 'qr'
  nfcScanned: false,
  qrScanned: false,
  offlineUnlocked: false,
  privateVaultUnlocked: false,
  offlineData: { ...DEFAULT_OFFLINE_DATA },
  certificates: [...DEFAULT_CERTIFICATES],
  activeCertForLockModal: null,
  activeCertForViewModal: null,
  isPhoneFrame: false,
  language: 'ar'
};

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
  loadStoredData();
  renderAll();
  setupEventListeners();
  drawOfflineQrCode();
  checkAppAccessState();
});

function loadStoredData() {
  const isReg = localStorage.getItem('idc_is_registered');
  AppState.isRegistered = (isReg === 'true');

  const savedAuthMethod = localStorage.getItem('idc_auth_method');
  if (savedAuthMethod) AppState.activeAuthMethod = savedAuthMethod;

  const savedOffline = localStorage.getItem('idc_offline_data');
  if (savedOffline) {
    try {
      AppState.offlineData = { ...DEFAULT_OFFLINE_DATA, ...JSON.parse(savedOffline) };
    } catch (e) {
      console.warn('Failed to parse offline data', e);
    }
  }

  const savedCerts = localStorage.getItem('idc_certs_data');
  if (savedCerts) {
    try {
      const parsed = JSON.parse(savedCerts);
      AppState.certificates = parsed;
    } catch (e) {
      console.warn('Failed to parse certs data', e);
    }
  }
}

function saveOfflineData() {
  localStorage.setItem('idc_offline_data', JSON.stringify(AppState.offlineData));
}

function saveCertsData() {
  localStorage.setItem('idc_certs_data', JSON.stringify(AppState.certificates));
}

// --- GATEKEEPER & ACCESS STATE (الواجهة الترحيبية + شاشة القفل بالبصمة عند كل فتح) ---
function checkAppAccessState() {
  const landingPortal = document.getElementById('landingPortal');
  const lockGate = document.getElementById('appLockGate');
  const appContainer = document.getElementById('appContainer');

  if (!AppState.isRegistered) {
    // الحالة 1: غير مسجل -> واجهة الدخول النظيفة (نمط GitHub)
    if (landingPortal) landingPortal.classList.remove('hidden');
    if (lockGate) lockGate.classList.add('hidden');
    if (appContainer) appContainer.classList.add('hidden');
  } else if (AppState.isAppLocked) {
    // الحالة 2: مسجل ومقفل -> يطلب البصمة كل مرة يفتح التطبيق
    if (landingPortal) landingPortal.classList.add('hidden');
    if (lockGate) lockGate.classList.remove('hidden');
    if (appContainer) appContainer.classList.add('hidden');
  } else {
    // الحالة 3: مفتوح بنجاح -> عرض لوحة التحكم والأقسام الثلاثة
    if (landingPortal) landingPortal.classList.add('hidden');
    if (lockGate) lockGate.classList.add('hidden');
    if (appContainer) appContainer.classList.remove('hidden');
  }
}

// --- EGYPT DIGITAL IDENTITY CARD HERO CONTROLLER (مطابق للديمو والصورة) ---
AppState.egyptCardSubtab = 'card';
AppState.isMaskedNumberRevealed = false;

function switchEgyptCardTab(tabKey) {
  sfx.playBeep();
  AppState.egyptCardSubtab = tabKey;

  const tabs = ['qr', 'card', 'wallet'];
  tabs.forEach(t => {
    const btn = document.getElementById(`egyptTabBtn-${t}`);
    const view = document.getElementById(`egyptCardView-${t}`);
    if (t === tabKey) {
      if (btn) btn.classList.add('active-subtab');
      if (view) view.classList.remove('hidden');
    } else {
      if (btn) btn.classList.remove('active-subtab');
      if (view) view.classList.add('hidden');
    }
  });

  if (tabKey === 'qr') {
    drawEgyptHeroQr();
  }
}

function drawEgyptHeroQr() {
  const canvas = document.getElementById('egyptHeroQrCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const size = 160;
  canvas.width = size;
  canvas.height = size;

  ctx.fillStyle = '#202124';
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = '#3c4043';
  ctx.lineWidth = 2;
  ctx.strokeRect(4, 4, size - 8, size - 8);

  function drawFinder(x, y) {
    ctx.fillStyle = '#8ab4f8';
    ctx.fillRect(x, y, 36, 36);
    ctx.fillStyle = '#202124';
    ctx.fillRect(x + 6, y + 6, 24, 24);
    ctx.fillStyle = '#8ab4f8';
    ctx.fillRect(x + 12, y + 12, 12, 12);
  }
  drawFinder(12, 12);
  drawFinder(size - 48, 12);
  drawFinder(12, size - 48);

  ctx.fillStyle = '#81c995';
  for (let r = 0; r < 12; r++) {
    for (let c = 0; c < 12; c++) {
      if ((r * 3 + c * 7 + (r ^ c)) % 3 === 0) {
        ctx.fillRect(56 + c * 4, 56 + r * 4, 3, 3);
      }
    }
  }

  // Golden EG Center emblem
  ctx.fillStyle = '#007a48';
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fdd663';
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('EG', size / 2, size / 2);
}

function toggleMaskedCardNumber() {
  sfx.playBeep();
  AppState.isMaskedNumberRevealed = !AppState.isMaskedNumberRevealed;
  const display = document.getElementById('maskedCardNumberDisplay');
  const icon = document.getElementById('maskedNumberEyeIcon');
  if (!display || !icon) return;

  if (AppState.isMaskedNumberRevealed) {
    const nid = AppState.offlineData.nationalId || '29509180104829';
    display.innerText = `${nid.slice(0, 4)} ${nid.slice(4, 8)} ${nid.slice(8, 12)} ${nid.slice(12, 14)}00`;
    display.classList.add('text-emerald-300');
    display.classList.remove('text-cyan-200');
    icon.innerText = 'visibility_off';
    showToast('تم كشف رقم الهوية الوطنية الرقمية');
  } else {
    display.innerText = '5678 •••• •••• 2980';
    display.classList.remove('text-emerald-300');
    display.classList.add('text-cyan-200');
    icon.innerText = 'visibility';
    showToast('تم إخفاء وتشفير رقم الهوية');
  }
}

// --- MULTI-STEP AUTH CONTROLLER (كونسبت الديمو الأول) ---
let currentAuthStep = 1;

function goToAuthStep(stepNum) {
  sfx.playBeep();
  currentAuthStep = stepNum;

  const s1 = document.getElementById('authStep1');
  const s2 = document.getElementById('authStep2');
  const s3 = document.getElementById('authStep3');

  if (s1) s1.classList.toggle('hidden', stepNum !== 1);
  if (s2) s2.classList.toggle('hidden', stepNum !== 2);
  if (s3) s3.classList.toggle('hidden', stepNum !== 3);

  // Sync inputs across steps
  const nameInput = document.getElementById('authFullName');
  const nidInput = document.getElementById('authNationalId');
  const jobInput = document.getElementById('authJobTitle');
  if (nameInput && nameInput.value.trim()) AppState.offlineData.fullName = nameInput.value.trim();
  if (nidInput && nidInput.value.trim()) AppState.offlineData.nationalId = nidInput.value.trim();
  if (jobInput && jobInput.value.trim()) AppState.offlineData.jobTitle = jobInput.value.trim();

  if (stepNum === 2) {
    if (AppState.activeAuthMethod === 'qr') {
      drawAuthQrPreview();
    }
  }
}

function openAuthModal(method = 'nfc') {
  sfx.playBeep();
  AppState.activeAuthMethod = method;
  AppState.nfcScanned = false;
  AppState.qrScanned = false;

  const modal = document.getElementById('authRegisterModal');
  const nfcSection = document.getElementById('authNfcSection');
  const qrSection = document.getElementById('authQrSection');
  const btnNfc = document.getElementById('authBtnTabNfc');
  const btnQr = document.getElementById('authBtnTabQr');

  if (btnNfc && btnQr) {
    if (method === 'nfc') {
      btnNfc.className = 'py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all text-white bg-cyan-600/30 border border-cyan-500/40';
      btnQr.className = 'py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all text-slate-300 hover:text-white';
    } else {
      btnQr.className = 'py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all text-white bg-cyan-600/30 border border-cyan-500/40';
      btnNfc.className = 'py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all text-slate-300 hover:text-white';
    }
  }

  if (nfcSection && qrSection) {
    if (method === 'nfc') {
      nfcSection.classList.remove('hidden');
      qrSection.classList.add('hidden');
    } else {
      nfcSection.classList.add('hidden');
      qrSection.classList.remove('hidden');
      drawAuthQrPreview();
    }
  }

  // Pre-fill existing data if available
  const d = AppState.offlineData;
  const nameEl = document.getElementById('authFullName');
  const jobEl = document.getElementById('authJobTitle');
  const nidEl = document.getElementById('authNationalId');
  const passEl = document.getElementById('authPassword');
  if (nameEl) nameEl.value = d.fullName || '';
  if (jobEl) jobEl.value = d.jobTitle || '';
  if (nidEl) nidEl.value = d.nationalId || '';
  if (passEl) passEl.value = d.offlinePin || '1234';

  goToAuthStep(1);
  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

// محاكاة لمس شريحة NFC أثناء التسجيل
function simulateAuthNfcScan() {
  sfx.playBeep();
  const status = document.getElementById('authNfcStatusTxt');
  const icon = document.getElementById('authNfcIcon');
  if (status) status.innerText = 'جاري استشعار الشريحة الذكية NTAG216...';

  setTimeout(() => {
    AppState.nfcScanned = true;
    if (icon) icon.style.color = '#10b981';
    if (status) {
      status.innerText = 'تم ربط الشريحة بنجاح! UID: IDC-NFC-9942';
      status.className = 'text-xs text-emerald-400 font-bold mt-1';
    }
    sfx.playSuccess();
  }, 1000);
}

// رسم كود QR للمستخدمين بدون NFC
function drawAuthQrPreview() {
  const canvas = document.getElementById('authQrCanvasPreview');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const size = 120;
  canvas.width = size;
  canvas.height = size;

  ctx.fillStyle = '#001e38';
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = '#06b6d4';
  ctx.lineWidth = 2;
  ctx.strokeRect(3, 3, size - 6, size - 6);

  ctx.fillStyle = '#22d3ee';
  ctx.fillRect(8, 8, 26, 26);
  ctx.fillRect(size - 34, 8, 26, 26);
  ctx.fillRect(8, size - 34, 26, 26);

  ctx.fillStyle = '#38bdf8';
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if ((r * c + r) % 2 === 0) {
        ctx.fillRect(44 + c * 4, 44 + r * 4, 3, 3);
      }
    }
  }

  AppState.qrScanned = true;
}

// المتابعة الفورية بحساب تجريبي
function quickDemoLogin() {
  sfx.playSuccess();
  localStorage.setItem('idc_is_registered', 'true');
  localStorage.setItem('idc_auth_method', 'nfc');
  AppState.isRegistered = true;
  AppState.isAppLocked = false;
  AppState.activeAuthMethod = 'nfc';
  saveOfflineData();
  updateDataInViews();
  drawOfflineQrCode();
  drawEgyptHeroQr();
  closeModal('authRegisterModal');
  checkAppAccessState();
  showToast('مرحباً بك! تم الدخول السريع في وضع المعاينة المعتمد لمنظومة IDC');
}

// إنهاء التسجيل والدخول بعد مراجعة الأقسام الثلاثة
function finishAuthAndEnter() {
  const nameEl = document.getElementById('authFullName');
  const jobEl = document.getElementById('authJobTitle');
  const nidEl = document.getElementById('authNationalId');
  const passEl = document.getElementById('authPassword');

  if (nameEl && nameEl.value.trim()) AppState.offlineData.fullName = nameEl.value.trim();
  if (jobEl && jobEl.value.trim()) AppState.offlineData.jobTitle = jobEl.value.trim();
  if (nidEl && nidEl.value.trim()) AppState.offlineData.nationalId = nidEl.value.trim();
  if (passEl && passEl.value.trim()) AppState.offlineData.offlinePin = passEl.value.trim();
  AppState.offlineData.authMethod = AppState.activeAuthMethod;
  AppState.offlineData.lastUpdated = new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  localStorage.setItem('idc_is_registered', 'true');
  localStorage.setItem('idc_auth_method', AppState.activeAuthMethod);
  AppState.isRegistered = true;
  AppState.isAppLocked = false;

  saveOfflineData();
  updateDataInViews();
  drawOfflineQrCode();
  drawEgyptHeroQr();

  closeModal('authRegisterModal');
  checkAppAccessState();

  sfx.playSuccess();
  showToast(`تم الدخول بنجاح عبر (${AppState.activeAuthMethod === 'nfc' ? 'Password + NFC' : 'Password + QR'})!`);
}

// فتح التطبيق بالبصمة عند الفتح
function unlockAppWithBiometric(method = 'fingerprint') {
  sfx.init();

  if (method === 'fingerprint') {
    const btn = document.getElementById('gateFingerprintBtn');
    if (btn) {
      btn.style.transform = 'scale(0.92)';
      btn.style.borderColor = '#10b981';
      btn.style.boxShadow = '0 0 50px rgba(16, 185, 129, 0.7)';
    }
    sfx.playBeep();

    setTimeout(() => {
      if (btn) {
        btn.style.transform = '';
        btn.style.borderColor = '';
        btn.style.boxShadow = '';
      }
      sfx.playSuccess();
      AppState.isAppLocked = false;
      checkAppAccessState();
      showToast('تم تأكيد بصمة الإصبع وفتح المنظومة بنجاح!');
    }, 700);
  } else if (method === 'face') {
    triggerFaceIdScan('app_gate');
  } else if (method === 'pin') {
    triggerPasswordPrompt('app_gate');
  }
}

// قفل المنظومة
function lockApplication() {
  sfx.playBeep();
  AppState.isAppLocked = true;
  closeSettingsDrawer();
  closeAccountModal();
  checkAppAccessState();
  showToast('تم قفل منظومة IDC بنجاح');
}

// تسجيل الخروج والعودة للواجهة الرئيسية
function signOutToLanding() {
  if (confirm('هل ترغب في تسجيل الخروج والعودة إلى شاشة البداية؟')) {
    sfx.playBeep();
    AppState.isAppLocked = true;
    closeSettingsDrawer();
    closeAccountModal();
    const landing = document.getElementById('landingPortal');
    const lockGate = document.getElementById('appLockGate');
    const appContainer = document.getElementById('appContainer');

    if (landing) landing.classList.remove('hidden');
    if (lockGate) lockGate.classList.add('hidden');
    if (appContainer) appContainer.classList.add('hidden');
  }
}

// إعادة ضبط المنظومة وتسجيل هوية جديدة
function restartRegistration() {
  if (confirm('هل ترغب في إعادة ضبط المنظومة وتسجيل هوية جديدة؟')) {
    sfx.playBeep();
    localStorage.removeItem('idc_is_registered');
    AppState.isRegistered = false;
    AppState.isAppLocked = true;
    closeSettingsDrawer();
    closeAccountModal();
    checkAppAccessState();
    showToast('تمت إعادة ضبط المنظومة بنجاح. يرجى تسجيل الهوية للبدء.');
  }
}

// --- GOOGLE-STYLE SETTINGS DRAWER & ACCOUNT SHEET ---
function openSettingsDrawer() {
  sfx.playBeep();
  const drawer = document.getElementById('settingsDrawerModal');
  drawer.classList.remove('hidden');
  drawer.classList.add('flex');
}

function closeSettingsDrawer() {
  const drawer = document.getElementById('settingsDrawerModal');
  if (drawer) {
    drawer.classList.add('hidden');
    drawer.classList.remove('flex');
  }
}

function openAccountModal() {
  sfx.playBeep();
  const modal = document.getElementById('accountQuickModal');
  const authTag = document.getElementById('accountAuthMethodTag');
  if (authTag) {
    authTag.innerText = AppState.activeAuthMethod === 'nfc' ? 'موثق عبر NFC + Password' : 'موثق عبر QR + Password';
  }
  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function closeAccountModal() {
  const modal = document.getElementById('accountQuickModal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

// --- CUSTOMER SERVICE & SUPPORT MODAL ---
function openCustomerServiceModal() {
  sfx.playBeep();
  closeSettingsDrawer();
  const modal = document.getElementById('customerServiceModal');
  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function sendCustomerServiceMessage(event) {
  if (event) event.preventDefault();
  const input = document.getElementById('supportMsgInput');
  const text = input ? input.value.trim() : '';
  if (!text) return;

  sfx.playSuccess();
  const chatBox = document.getElementById('supportChatBox');
  if (chatBox) {
    const userMsg = document.createElement('div');
    userMsg.className = 'p-3 rounded-2xl bg-cyan-600/30 border border-cyan-500/30 text-white text-xs max-w-[85%] self-end';
    userMsg.innerText = text;
    chatBox.appendChild(userMsg);

    input.value = '';

    setTimeout(() => {
      sfx.playBeep();
      const botMsg = document.createElement('div');
      botMsg.className = 'p-3 rounded-2xl bg-slate-900 border border-white/10 text-slate-200 text-xs max-w-[85%] self-start';
      botMsg.innerText = 'مرحباً بك في خدمة عملاء IDC. تم تسجيل طلبك تحت رقم تذكرة (#IDC-9921) وسيتواصل معك الدعم الفني فوراً.';
      chatBox.appendChild(botMsg);
      chatBox.scrollTop = chatBox.scrollHeight;
    }, 800);
  }
  showToast('تم إرسال رسالتك إلى خدمة عملاء IDC بنجاح!');
}

// --- RENDER ENGINE ---
function renderAll() {
  renderModeStatus();
  renderCertificatesList();
  renderTrustedCompanies();
  updateDataInViews();
  drawEgyptHeroQr();
}

function setAppMode(newMode) {
  sfx.playBeep();
  AppState.mode = newMode;

  const btnOnline = document.getElementById('modeBtnOnline');
  const btnOffline = document.getElementById('modeBtnOffline');
  const sectionOnline = document.getElementById('sectionOnline');
  const sectionOffline = document.getElementById('sectionOffline');
  const connectionStatusBar = document.getElementById('connectionStatusBar');
  const offlineQuickBadge = document.getElementById('offlineQuickBadge');
  const egyptCardStatusPill = document.getElementById('egyptCardStatusPill');

  if (newMode === 'online') {
    if (btnOnline) btnOnline.classList.add('active-online');
    if (btnOffline) btnOffline.classList.remove('active-offline');
    if (sectionOnline) sectionOnline.classList.remove('hidden');
    if (sectionOffline) sectionOffline.classList.add('hidden');

    if (connectionStatusBar) {
      connectionStatusBar.className = 'py-2 px-4 rounded-2xl bg-[#292a2d] border border-[#3c4043] backdrop-blur-md flex items-center justify-between transition-all';
      connectionStatusBar.innerHTML = `
        <div class="flex items-center gap-2">
          <span class="relative flex h-3 w-3">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#81c995] opacity-75"></span>
            <span class="relative inline-flex rounded-full h-3 w-3 bg-[#188038]"></span>
          </span>
          <span class="text-xs sm:text-sm font-bold text-[#8ab4f8]">السحابة المركزية لـ IDC متصلة وموثقة (Online Synchronized)</span>
        </div>
        <div class="flex items-center gap-2 text-xs text-[#9aa0a6]">
          <span class="hidden sm:inline bg-[#202124] px-2 py-0.5 rounded border border-[#3c4043] font-mono text-[#e8eaed]">TLS 1.3 / E2EE</span>
          <span class="px-2 py-0.5 rounded bg-[#81c995]/20 text-[#81c995] font-bold border border-[#81c995]/30">ساري وصالح</span>
        </div>
      `;
    }
    if (egyptCardStatusPill) {
      egyptCardStatusPill.className = 'flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/25 backdrop-blur-sm border border-white/20 text-xs font-bold text-white';
      egyptCardStatusPill.innerHTML = `
        <span class="material-symbols-outlined text-sm text-[#81c995] animate-pulse">lock</span>
        <span id="egyptCardStatusTxt">متصل</span>
        <span class="material-symbols-outlined text-sm">wifi</span>
      `;
    }
    if (offlineQuickBadge) offlineQuickBadge.classList.add('hidden');
  } else {
    if (btnOffline) btnOffline.classList.add('active-offline');
    if (btnOnline) btnOnline.classList.remove('active-online');
    if (sectionOffline) sectionOffline.classList.remove('hidden');
    if (sectionOnline) sectionOnline.classList.add('hidden');

    if (connectionStatusBar) {
      connectionStatusBar.className = 'py-2 px-4 rounded-2xl bg-[#292a2d] border border-[#f9ab00]/40 backdrop-blur-md flex items-center justify-between transition-all';
      connectionStatusBar.innerHTML = `
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-[#fdd663] text-lg">cloud_off</span>
          <span class="text-xs sm:text-sm font-bold text-[#fdd663]">الوضع غير المتصل (Offline Mode) - حفظ محلي فوري وآمن بدون إنترنت</span>
        </div>
        <div class="flex items-center gap-2 text-xs text-[#fdd663]">
          <span class="bg-[#202124] px-2 py-0.5 rounded border border-[#f9ab00]/30 font-bold">ذاكرة محلية 100%</span>
        </div>
      `;
    }
    if (egyptCardStatusPill) {
      egyptCardStatusPill.className = 'flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f9ab00]/20 border border-[#f9ab00]/40 text-xs font-bold text-[#fdd663]';
      egyptCardStatusPill.innerHTML = `
        <span class="material-symbols-outlined text-sm text-[#fdd663]">cloud_off</span>
        <span id="egyptCardStatusTxt">أوفلاين محلي</span>
      `;
    }
    if (offlineQuickBadge) offlineQuickBadge.classList.remove('hidden');
  }
}

function renderModeStatus() {
  setAppMode(AppState.mode);
}

// --- ONLINE SUB-TABS (الأقسام الثلاثة) ---
function switchOnlineTab(tabKey) {
  sfx.playBeep();
  AppState.onlineTab = tabKey;

  const tabs = ['public', 'private', 'certificates', 'validity'];
  tabs.forEach(t => {
    const btn = document.getElementById(`tabBtn-${t}`);
    const content = document.getElementById(`onlineTab-${t}`);
    if (t === tabKey) {
      if (btn) btn.className = 'flex-1 min-w-[120px] py-3 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all bg-[#1a73e8] text-white shadow-md shadow-[#1a73e8]/30';
      if (content) {
        content.classList.remove('hidden');
        content.classList.add('flex');
      }
    } else {
      if (btn) btn.className = 'flex-1 min-w-[120px] py-3 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all text-[#9aa0a6] hover:text-[#e8eaed] hover:bg-[#35393d]';
      if (content) {
        content.classList.add('hidden');
        content.classList.remove('flex');
      }
    }
  });

  if (tabKey === 'private') {
    checkPrivateVaultState();
  }
}

// --- PRIVATE VAULT SECURITY ---
function checkPrivateVaultState() {
  const lockScreen = document.getElementById('vaultLockScreen');
  const unlockedContent = document.getElementById('vaultUnlockedContent');

  if (AppState.privateVaultUnlocked) {
    if (lockScreen) lockScreen.classList.add('hidden');
    if (unlockedContent) unlockedContent.classList.remove('hidden');
  } else {
    if (lockScreen) lockScreen.classList.remove('hidden');
    if (unlockedContent) unlockedContent.classList.add('hidden');
  }
}

function lockPrivateVault() {
  sfx.playBeep();
  AppState.privateVaultUnlocked = false;
  checkPrivateVaultState();
}

function unlockPrivateVaultDirect() {
  sfx.playSuccess();
  AppState.privateVaultUnlocked = true;
  checkPrivateVaultState();
}

// --- BIOMETRIC MODAL TRIGGERS ---
function triggerFaceIdScan(context = 'private_vault') {
  sfx.init();
  sfx.playBeep();

  const modal = document.getElementById('faceIdModal');
  const statusTxt = document.getElementById('faceScanStatus');
  const checkIcon = document.getElementById('faceSuccessIcon');
  const laser = document.getElementById('faceLaser');

  modal.classList.remove('hidden');
  modal.classList.add('flex');
  checkIcon.classList.add('hidden');
  laser.classList.remove('hidden');
  statusTxt.innerText = 'جاري مسح بصمة الوجه 3D واستشعار العمق...';
  statusTxt.className = 'text-cyan-300 font-bold text-sm animate-pulse';

  setTimeout(() => {
    statusTxt.innerText = 'مطابقة التشفير البيومتري مع مخزن IDC الآمن...';
    sfx.playBeep();
  }, 1000);

  setTimeout(() => {
    laser.classList.add('hidden');
    checkIcon.classList.remove('hidden');
    statusTxt.innerText = 'تم التعرف على الوجه بنجاح! Verified ✔';
    statusTxt.className = 'text-emerald-400 font-extrabold text-base';
    sfx.playSuccess();

    setTimeout(() => {
      closeModal('faceIdModal');
      if (context === 'app_gate') {
        AppState.isAppLocked = false;
        checkAppAccessState();
        showToast('تم تأكيد بصمة الوجه وفتح المنظومة بنجاح!');
      } else if (context === 'private_vault') {
        AppState.privateVaultUnlocked = true;
        checkPrivateVaultState();
      } else if (context === 'offline_vault') {
        AppState.offlineUnlocked = true;
        checkOfflineLockState();
      }
    }, 900);
  }, 2200);
}

function triggerFingerprintAuth(context = 'private_vault') {
  sfx.init();
  sfx.playBeep();

  const modal = document.getElementById('fingerprintModal');
  const statusTxt = document.getElementById('fpStatusTxt');
  const fpIcon = document.getElementById('fpTouchIcon');

  modal.classList.remove('hidden');
  modal.classList.add('flex');
  statusTxt.innerText = 'ضع إصبعك على مستشعر البصمة الذكي';
  statusTxt.className = 'text-cyan-300 text-sm font-semibold';
  fpIcon.style.color = '#06b6d4';

  const touchHandler = () => {
    sfx.playBeep();
    statusTxt.innerText = 'جاري التحقق من البصمة الرقمية...';
    fpIcon.style.transform = 'scale(0.9)';

    setTimeout(() => {
      fpIcon.style.color = '#10b981';
      fpIcon.style.transform = 'scale(1.1)';
      statusTxt.innerText = 'تم تأكيد البصمة بنجاح! Fingerprint Accepted';
      statusTxt.className = 'text-emerald-400 font-bold text-sm';
      sfx.playSuccess();

      setTimeout(() => {
        closeModal('fingerprintModal');
        if (context === 'app_gate') {
          AppState.isAppLocked = false;
          checkAppAccessState();
          showToast('تم تأكيد البصمة وفتح المنظومة بنجاح!');
        } else if (context === 'private_vault') {
          AppState.privateVaultUnlocked = true;
          checkPrivateVaultState();
        } else if (context === 'offline_vault') {
          AppState.offlineUnlocked = true;
          checkOfflineLockState();
        }
      }, 700);
    }, 1100);
  };

  const zone = document.getElementById('fpInteractiveZone');
  zone.onclick = touchHandler;
}

function triggerPasswordPrompt(context = 'private_vault') {
  sfx.playBeep();
  const modal = document.getElementById('passwordPromptModal');
  const pinInput = document.getElementById('globalPinInput');
  const errorMsg = document.getElementById('pinErrorMsg');

  pinInput.value = '';
  errorMsg.classList.add('hidden');
  modal.classList.remove('hidden');
  modal.classList.add('flex');

  document.getElementById('confirmGlobalPinBtn').onclick = () => {
    const val = pinInput.value.trim();
    if (val === '1234' || val === AppState.offlineData.offlinePin) {
      sfx.playSuccess();
      closeModal('passwordPromptModal');
      if (context === 'app_gate') {
        AppState.isAppLocked = false;
        checkAppAccessState();
        showToast('تم تأكيد الرمز وفتح المنظومة بنجاح!');
      } else if (context === 'private_vault') {
        AppState.privateVaultUnlocked = true;
        checkPrivateVaultState();
      } else if (context === 'offline_vault') {
        AppState.offlineUnlocked = true;
        checkOfflineLockState();
      }
    } else {
      sfx.playError();
      errorMsg.classList.remove('hidden');
      errorMsg.innerText = 'رمز المرور غير صحيح! (جرب الرمز الافتراضي: 1234)';
    }
  };
}

// --- OFFLINE LOCK STATE ---
function checkOfflineLockState() {
  const offlineLock = document.getElementById('offlineLockScreen');
  const offlineDataView = document.getElementById('offlineDataView');

  if (AppState.offlineUnlocked) {
    if (offlineLock) offlineLock.classList.add('hidden');
    if (offlineDataView) offlineDataView.classList.remove('hidden');
  } else {
    if (offlineLock) offlineLock.classList.remove('hidden');
    if (offlineDataView) offlineDataView.classList.add('hidden');
  }
}

function lockOfflineVault() {
  sfx.playBeep();
  AppState.offlineUnlocked = false;
  checkOfflineLockState();
}

function unlockOfflineVaultDirect() {
  sfx.playSuccess();
  AppState.offlineUnlocked = true;
  checkOfflineLockState();
}

// --- CERTIFICATE PASSWORDS ENGINE ("باسورد علي كل شهاده لو اليوزر يحب") ---
function renderCertificatesList() {
  const container = document.getElementById('certificatesContainer');
  if (!container) return;

  container.innerHTML = AppState.certificates.map(cert => {
    const isLocked = cert.isPasswordProtected && !cert.isUnlocked;
    const lockBadge = cert.isPasswordProtected
      ? (isLocked
          ? `<span class="cert-locked-badge text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
               <span class="material-symbols-outlined text-xs">lock</span>
               <span>محمية برمز خاص</span>
             </span>`
          : `<span class="cert-unlocked-badge text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
               <span class="material-symbols-outlined text-xs">lock_open</span>
               <span>تم فك القفل</span>
             </span>`)
      : `<span class="bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
           <span class="material-symbols-outlined text-xs">public</span>
           <span>مفتوحة للعامة</span>
         </span>`;

    const statusBadge = cert.status === 'valid'
      ? `<span class="px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1">
           <span class="material-symbols-outlined text-xs">verified</span>
           <span>سارية وموثقة</span>
         </span>`
      : `<span class="px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold flex items-center gap-1">
           <span class="material-symbols-outlined text-xs">warning</span>
           <span>تستوجب التجديد قريباً</span>
         </span>`;

    return `
      <div class="glass-card rounded-2xl p-5 border border-white/10 hover:border-cyan-500/40 transition-all flex flex-col justify-between group">
        <div>
          <!-- Header info -->
          <div class="flex items-start justify-between gap-3 mb-3">
            <div class="flex items-center gap-3">
              <div class="w-11 h-11 rounded-xl bg-slate-900/80 border border-white/10 flex items-center justify-center shrink-0" style="color: ${cert.sealColor}">
                <span class="material-symbols-outlined text-2xl">workspace_premium</span>
              </div>
              <div>
                <h4 class="text-sm sm:text-base font-bold text-white group-hover:text-cyan-300 transition-colors">${cert.title}</h4>
                <p class="text-xs text-slate-300 flex items-center gap-1 mt-0.5">
                  <span class="material-symbols-outlined text-xs text-cyan-400">verified_user</span>
                  <span>${cert.issuer}</span>
                </p>
              </div>
            </div>
            <div>${lockBadge}</div>
          </div>

          <!-- Metadata -->
          <div class="space-y-1.5 text-xs text-slate-300 bg-slate-900/50 p-3 rounded-xl border border-white/5 my-3">
            <div class="flex justify-between">
              <span class="text-slate-400">كود الاعتماد:</span>
              <span class="font-mono text-cyan-300 font-semibold">${cert.issuerCode}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">تاريخ الإصدار:</span>
              <span class="font-mono">${cert.issueDate}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">تاريخ الصلاحية والانتهاء:</span>
              <span class="font-mono text-emerald-300 font-bold">${cert.expiryDate}</span>
            </div>
            <div class="flex justify-between items-center pt-1 border-t border-white/5">
              <span class="text-slate-400">حالة الصلاحية:</span>
              ${statusBadge}
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="pt-3 border-t border-white/10 flex items-center gap-2">
          <button onclick="handleViewCertificate('${cert.id}')" class="flex-1 py-2.5 px-3 rounded-xl ${isLocked ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40' : 'bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40'} text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95">
            <span class="material-symbols-outlined text-base">${isLocked ? 'lock' : 'visibility'}</span>
            <span>${isLocked ? 'فتح بالرمز السري' : 'عرض الوثيقة الموثقة'}</span>
          </button>

          <button onclick="openCertSecuritySettings('${cert.id}')" class="py-2.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-white/10 text-slate-300 text-xs font-bold flex items-center gap-1 transition-all" title="إعدادات حماية الوثيقة وكلمة المرور">
            <span class="material-symbols-outlined text-base">security</span>
            <span class="hidden sm:inline">أمان الوثيقة</span>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function handleViewCertificate(certId) {
  sfx.playBeep();
  const cert = AppState.certificates.find(c => c.id === certId);
  if (!cert) return;

  if (cert.isPasswordProtected && !cert.isUnlocked) {
    openCertPasswordModal(cert);
  } else {
    showCertificateViewer(cert);
  }
}

function openCertPasswordModal(cert) {
  AppState.activeCertForLockModal = cert;
  const modal = document.getElementById('certPasswordModal');
  const titleEl = document.getElementById('certLockModalTitle');
  const inputEl = document.getElementById('certSinglePinInput');
  const errorEl = document.getElementById('certPinError');
  const hintEl = document.getElementById('certPinHint');

  titleEl.innerText = `هذه الوثيقة محمية برمز مرور خاص (${cert.title})`;
  inputEl.value = '';
  errorEl.classList.add('hidden');
  hintEl.innerText = `تلميح: الرمز الحالي المحدد هو [${cert.password || '123'}]`;

  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function verifyCertificateSinglePin() {
  const cert = AppState.activeCertForLockModal;
  if (!cert) return;

  const inputEl = document.getElementById('certSinglePinInput');
  const errorEl = document.getElementById('certPinError');
  const entered = inputEl.value.trim();

  if (entered === cert.password) {
    sfx.playSuccess();
    cert.isUnlocked = true;
    closeModal('certPasswordModal');
    renderCertificatesList();
    showCertificateViewer(cert);
  } else {
    sfx.playError();
    errorEl.classList.remove('hidden');
    errorEl.innerText = 'كلمة مرور الوثيقة غير صحيحة!';
  }
}

function showCertificateViewer(cert) {
  AppState.activeCertForViewModal = cert;
  const modal = document.getElementById('certViewerModal');
  const title = document.getElementById('viewCertTitle');
  const issuer = document.getElementById('viewCertIssuer');
  const code = document.getElementById('viewCertCode');
  const exp = document.getElementById('viewCertExp');
  const desc = document.getElementById('viewCertDesc');
  const seal = document.getElementById('viewCertSeal');
  const relockBtn = document.getElementById('viewCertRelockBtn');

  title.innerText = cert.title;
  issuer.innerText = cert.issuer;
  code.innerText = cert.issuerCode;
  exp.innerText = cert.expiryDate;
  desc.innerText = cert.details;
  seal.style.borderColor = cert.sealColor;

  if (cert.isPasswordProtected) {
    relockBtn.classList.remove('hidden');
  } else {
    relockBtn.classList.add('hidden');
  }

  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function relockActiveCertificate() {
  if (AppState.activeCertForViewModal) {
    AppState.activeCertForViewModal.isUnlocked = false;
    sfx.playBeep();
    closeModal('certViewerModal');
    renderCertificatesList();
  }
}

function openCertSecuritySettings(certId) {
  sfx.playBeep();
  const cert = AppState.certificates.find(c => c.id === certId);
  if (!cert) return;

  AppState.activeCertForLockModal = cert;
  const modal = document.getElementById('certSecurityConfigModal');
  const title = document.getElementById('certConfigTitle');
  const toggle = document.getElementById('certProtectToggle');
  const passContainer = document.getElementById('certPassInputWrapper');
  const passInput = document.getElementById('certCustomPasswordInput');

  title.innerText = `إدارة حماية: ${cert.title}`;
  toggle.checked = cert.isPasswordProtected;
  passInput.value = cert.password || '';

  if (cert.isPasswordProtected) {
    passContainer.classList.remove('hidden');
  } else {
    passContainer.classList.add('hidden');
  }

  toggle.onchange = () => {
    if (toggle.checked) {
      passContainer.classList.remove('hidden');
    } else {
      passContainer.classList.add('hidden');
    }
  };

  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function saveCertSecuritySettings() {
  const cert = AppState.activeCertForLockModal;
  if (!cert) return;

  const toggle = document.getElementById('certProtectToggle');
  const passInput = document.getElementById('certCustomPasswordInput');

  cert.isPasswordProtected = toggle.checked;
  if (cert.isPasswordProtected) {
    cert.password = passInput.value.trim() || '123';
    cert.isUnlocked = false;
  } else {
    cert.isUnlocked = true;
  }

  saveCertsData();
  renderCertificatesList();
  sfx.playSuccess();
  closeModal('certSecurityConfigModal');
}

// --- TRUSTED COMPANIES RENDER ---
function renderTrustedCompanies() {
  const container = document.getElementById('trustedCompaniesContainer');
  if (!container) return;

  container.innerHTML = TRUSTED_COMPANIES.map(company => `
    <div class="p-4 rounded-2xl bg-slate-900/60 border border-white/10 hover:border-emerald-500/40 transition-all flex items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
          <span class="material-symbols-outlined text-2xl">${company.icon}</span>
        </div>
        <div>
          <h4 class="text-sm font-bold text-white flex items-center gap-1.5">
            <span>${company.name}</span>
            <span class="material-symbols-outlined text-emerald-400 text-sm" title="جهة معتمدة">verified</span>
          </h4>
          <p class="text-xs text-slate-400 mt-0.5">${company.role}</p>
        </div>
      </div>
      <div class="text-end shrink-0">
        <span class="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/30 block mb-1">
          ${company.status}
        </span>
        <span class="text-[10px] text-slate-400 font-mono">${company.verifiedId}</span>
      </div>
    </div>
  `).join('');
}

// --- OFFLINE DATA MANAGER ("والداتا الي اليوزر يحطها") ---
function updateDataInViews() {
  const d = AppState.offlineData;

  const names = document.querySelectorAll('.bind-full-name');
  names.forEach(el => el.innerText = d.fullName);

  const titles = document.querySelectorAll('.bind-job-title');
  titles.forEach(el => el.innerText = d.jobTitle);

  const bloods = document.querySelectorAll('.bind-blood-type');
  bloods.forEach(el => el.innerText = d.bloodType);

  const allergies = document.querySelectorAll('.bind-allergies');
  allergies.forEach(el => el.innerText = d.allergies);

  const chronics = document.querySelectorAll('.bind-chronic');
  chronics.forEach(el => el.innerText = d.chronicConditions);

  const c1Names = document.querySelectorAll('.bind-c1-name');
  c1Names.forEach(el => el.innerText = d.emergencyContact1Name);

  const c1Phones = document.querySelectorAll('.bind-c1-phone');
  c1Phones.forEach(el => {
    el.innerText = d.emergencyContact1Phone;
    if (el.tagName === 'A') el.href = `tel:${d.emergencyContact1Phone}`;
  });

  const c2Names = document.querySelectorAll('.bind-c2-name');
  c2Names.forEach(el => el.innerText = d.emergencyContact2Name);

  const c2Phones = document.querySelectorAll('.bind-c2-phone');
  c2Phones.forEach(el => {
    el.innerText = d.emergencyContact2Phone;
    if (el.tagName === 'A') el.href = `tel:${d.emergencyContact2Phone}`;
  });

  const notes = document.querySelectorAll('.bind-notes');
  notes.forEach(el => el.innerText = d.emergencyNotes);

  const nids = document.querySelectorAll('.bind-national-id');
  nids.forEach(el => el.innerText = d.nationalId);

  const lastUpdated = document.querySelectorAll('.bind-last-updated');
  lastUpdated.forEach(el => el.innerText = d.lastUpdated);
}

function openOfflineDataEditor() {
  sfx.playBeep();
  closeSettingsDrawer();
  closeAccountModal();
  const d = AppState.offlineData;

  document.getElementById('editFullName').value = d.fullName;
  document.getElementById('editJobTitle').value = d.jobTitle;
  document.getElementById('editNationalId').value = d.nationalId;
  document.getElementById('editBloodType').value = d.bloodType;
  document.getElementById('editAllergies').value = d.allergies;
  document.getElementById('editChronic').value = d.chronicConditions;
  document.getElementById('editC1Name').value = d.emergencyContact1Name;
  document.getElementById('editC1Phone').value = d.emergencyContact1Phone;
  document.getElementById('editC2Name').value = d.emergencyContact2Name;
  document.getElementById('editC2Phone').value = d.emergencyContact2Phone;
  document.getElementById('editNotes').value = d.emergencyNotes;
  document.getElementById('editOfflinePin').value = d.offlinePin;

  const modal = document.getElementById('offlineDataEditorModal');
  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function saveOfflineDataFromEditor(event) {
  if (event) event.preventDefault();

  AppState.offlineData.fullName = document.getElementById('editFullName').value.trim();
  AppState.offlineData.jobTitle = document.getElementById('editJobTitle').value.trim();
  AppState.offlineData.nationalId = document.getElementById('editNationalId').value.trim();
  AppState.offlineData.bloodType = document.getElementById('editBloodType').value.trim();
  AppState.offlineData.allergies = document.getElementById('editAllergies').value.trim();
  AppState.offlineData.chronicConditions = document.getElementById('editChronic').value.trim();
  AppState.offlineData.emergencyContact1Name = document.getElementById('editC1Name').value.trim();
  AppState.offlineData.emergencyContact1Phone = document.getElementById('editC1Phone').value.trim();
  AppState.offlineData.emergencyContact2Name = document.getElementById('editC2Name').value.trim();
  AppState.offlineData.emergencyContact2Phone = document.getElementById('editC2Phone').value.trim();
  AppState.offlineData.emergencyNotes = document.getElementById('editNotes').value.trim();
  AppState.offlineData.offlinePin = document.getElementById('editOfflinePin').value.trim() || '1234';
  AppState.offlineData.lastUpdated = new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  saveOfflineData();
  updateDataInViews();
  drawOfflineQrCode();
  sfx.playSuccess();
  closeModal('offlineDataEditorModal');
  showToast('تم حفظ وتحديث بياناتك بنجاح في مخزن IDC المحلي (Offline Cache)!');
}

// --- OFFLINE QR CODE GENERATOR (Pure HTML5 Canvas - Zero internet required) ---
function drawOfflineQrCode() {
  const canvas = document.getElementById('offlineQrCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const size = 180;
  canvas.width = size;
  canvas.height = size;

  // Background
  ctx.fillStyle = '#001e38';
  ctx.fillRect(0, 0, size, size);

  // Decorative border
  ctx.strokeStyle = '#06b6d4';
  ctx.lineWidth = 2;
  ctx.strokeRect(4, 4, size - 8, size - 8);

  // Draw simulated QR matrix pattern with finder patterns
  ctx.fillStyle = '#22d3ee';

  // 3 Finder patterns
  function drawFinder(x, y) {
    ctx.fillRect(x, y, 40, 40);
    ctx.fillStyle = '#001e38';
    ctx.fillRect(x + 6, y + 6, 28, 28);
    ctx.fillStyle = '#22d3ee';
    ctx.fillRect(x + 12, y + 12, 16, 16);
  }

  drawFinder(14, 14);
  drawFinder(size - 54, 14);
  drawFinder(14, size - 54);

  // Random consistent pseudo-data dots
  const seed = AppState.offlineData.nationalId || '2950918';
  let num = 0;
  for (let i = 0; i < seed.length; i++) num += seed.charCodeAt(i);

  ctx.fillStyle = '#38bdf8';
  for (let r = 0; r < 14; r++) {
    for (let c = 0; c < 14; c++) {
      const px = 60 + c * 5;
      const py = 60 + r * 5;
      if (((r * c + num + c) % 3) === 0) {
        ctx.fillRect(px, py, 4, 4);
      }
    }
  }

  // IDC center emblem
  ctx.fillStyle = '#06b6d4';
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#001224';
  ctx.font = 'bold 9px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('IDC', size / 2, size / 2);
}

// --- MODALS & HELPERS ---
function closeModal(modalId) {
  sfx.playBeep();
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

function showToast(message) {
  const toast = document.getElementById('globalToast');
  const txt = document.getElementById('toastMessage');
  if (!toast || !txt) return;

  txt.innerText = message;
  toast.classList.remove('opacity-0', 'translate-y-10', 'pointer-events-none');
  toast.classList.add('opacity-100', 'translate-y-0');

  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-10', 'pointer-events-none');
    toast.classList.remove('opacity-100', 'translate-y-0');
  }, 3500);
}

function toggleMobileFrame() {
  sfx.playBeep();
  AppState.isPhoneFrame = !AppState.isPhoneFrame;
  const appContainer = document.getElementById('appContainer');
  const notch = document.getElementById('phoneTopNotch');
  const frameBtnText = document.getElementById('frameToggleText');

  if (AppState.isPhoneFrame) {
    appContainer.classList.add('phone-mode-wrapper');
    notch.classList.remove('hidden');
    if (frameBtnText) frameBtnText.innerText = 'عرض سطح المكتب';
  } else {
    appContainer.classList.remove('phone-mode-wrapper');
    notch.classList.add('hidden');
    if (frameBtnText) frameBtnText.innerText = 'وضع الهاتف';
  }
}

function triggerNfcTapSimulation() {
  sfx.init();
  sfx.playBeep();

  const modal = document.getElementById('nfcTapModal');
  modal.classList.remove('hidden');
  modal.classList.add('flex');

  setTimeout(() => {
    sfx.playSuccess();
    showToast('تم لمس شريحة IDC الذكية وتوثيق بيانات الهوية المشفرة!');
    setTimeout(() => {
      closeModal('nfcTapModal');
    }, 1200);
  }, 1400);
}

function toggleLanguage() {
  sfx.playBeep();
  AppState.language = AppState.language === 'ar' ? 'en' : 'ar';
  document.documentElement.lang = AppState.language;
  document.documentElement.dir = AppState.language === 'ar' ? 'rtl' : 'ltr';
  const label = document.getElementById('langToggleLabel');
  if (label) label.innerText = AppState.language === 'ar' ? 'English' : 'العربية';
  showToast(AppState.language === 'ar' ? 'تم تحويل الواجهة إلى العربية' : 'Switched interface to English');
}

function setupEventListeners() {
  document.querySelectorAll('.modal-backdrop, .drawer-backdrop').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal(modal.id);
        if (modal.id === 'settingsDrawerModal') closeSettingsDrawer();
      }
    });
  });
}
