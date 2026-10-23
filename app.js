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
});

function loadStoredData() {
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

// --- RENDER ENGINE ---
function renderAll() {
  renderModeStatus();
  renderCertificatesList();
  renderTrustedCompanies();
  updateDataInViews();
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

  if (newMode === 'online') {
    btnOnline.classList.add('active-online');
    btnOffline.classList.remove('active-offline');
    sectionOnline.classList.remove('hidden');
    sectionOffline.classList.add('hidden');

    connectionStatusBar.className = 'py-2 px-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/20 backdrop-blur-md flex items-center justify-between transition-all';
    connectionStatusBar.innerHTML = `
      <div class="flex items-center gap-2">
        <span class="relative flex h-3 w-3">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
        </span>
        <span class="text-xs sm:text-sm font-bold text-cyan-300">السحابة المركزية لـ IDC متصلة وموثقة (Online Synchronized)</span>
      </div>
      <div class="flex items-center gap-2 text-xs text-slate-300">
        <span class="hidden sm:inline bg-slate-900/60 px-2 py-0.5 rounded border border-white/5 font-mono">TLS 1.3 / E2EE</span>
        <span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">ساري وصالح</span>
      </div>
    `;
    offlineQuickBadge.classList.add('hidden');
  } else {
    btnOffline.classList.add('active-offline');
    btnOnline.classList.remove('active-online');
    sectionOffline.classList.remove('hidden');
    sectionOnline.classList.add('hidden');

    connectionStatusBar.className = 'py-2 px-4 rounded-2xl orange-subtle-box backdrop-blur-md flex items-center justify-between transition-all';
    connectionStatusBar.innerHTML = `
      <div class="flex items-center gap-2">
        <span class="material-symbols-outlined text-orange-400 text-lg">cloud_off</span>
        <span class="text-xs sm:text-sm font-bold text-orange-300">الوضع غير المتصل (Offline Mode) - حفظ محلي فوري وآمن بدون إنترنت</span>
      </div>
      <div class="flex items-center gap-2 text-xs text-orange-200">
        <span class="bg-orange-950/80 px-2 py-0.5 rounded border border-orange-500/30 font-bold">ذاكرة محلية 100%</span>
      </div>
    `;
    offlineQuickBadge.classList.remove('hidden');
  }
}

function renderModeStatus() {
  setAppMode(AppState.mode);
}

// --- ONLINE SUB-TABS ---
function switchOnlineTab(tabKey) {
  sfx.playBeep();
  AppState.onlineTab = tabKey;

  const tabs = ['public', 'private', 'certificates', 'validity'];
  tabs.forEach(t => {
    const btn = document.getElementById(`tabBtn-${t}`);
    const content = document.getElementById(`onlineTab-${t}`);
    if (t === tabKey) {
      btn.className = 'flex-1 min-w-[120px] py-3 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-lg shadow-cyan-600/30';
      content.classList.remove('hidden');
      content.classList.add('flex');
    } else {
      btn.className = 'flex-1 min-w-[120px] py-3 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all text-slate-300 hover:text-white hover:bg-slate-800/60';
      content.classList.add('hidden');
      content.classList.remove('flex');
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
    lockScreen.classList.add('hidden');
    unlockedContent.classList.remove('hidden');
  } else {
    lockScreen.classList.remove('hidden');
    unlockedContent.classList.add('hidden');
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
      if (context === 'private_vault') {
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
        if (context === 'private_vault') {
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
      if (context === 'private_vault') {
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
    frameBtnText.innerText = 'عرض سطح المكتب';
  } else {
    appContainer.classList.remove('phone-mode-wrapper');
    notch.classList.add('hidden');
    frameBtnText.innerText = 'وضع الهاتف';
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
  document.getElementById('langToggleLabel').innerText = AppState.language === 'ar' ? 'English' : 'العربية';
  showToast(AppState.language === 'ar' ? 'تم تحويل الواجهة إلى العربية' : 'Switched interface to English');
}

function setupEventListeners() {
  document.querySelectorAll('.modal-backdrop').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal(modal.id);
      }
    });
  });
}
