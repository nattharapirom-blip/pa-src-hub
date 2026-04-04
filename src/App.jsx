import React, { useState, useEffect } from 'react';
import { 
  Users, CheckSquare, FileText, User, Settings, LogOut, 
  Menu, X, Upload, Save, FileSpreadsheet, Briefcase, BarChart, 
  CheckCircle, AlertCircle, Edit, ClipboardList, Loader2, Info, ChevronRight,
  Plus, Trash2, Settings2, UserPlus, Filter, KeyRound
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, 
  onAuthStateChanged, signOut 
} from 'firebase/auth';
// ลบ getFirestore ออก และใช้ initializeFirestore แทนเพื่อแก้ปัญหาเน็ตโรงเรียน
import { 
  collection, doc, setDoc, getDoc, initializeFirestore,
  onSnapshot, query, getDocs, deleteDoc
} from 'firebase/firestore';

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyC9Y8-4_6SJgPrCrZn7J9Emw4psaNl_GNk",
  authDomain: "pa-hub-src.firebaseapp.com",
  projectId: "pa-hub-src",
  storageBucket: "pa-hub-src.firebasestorage.app",
  messagingSenderId: "1080948104443",
  appId: "1:1080948104443:web:b005dabeda16fc727f245e",
  measurementId: "G-DQK3BYS2BN"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// 🚀 กุญแจสำคัญในการแก้ปัญหา "หมดเวลาการเชื่อมต่อ" (ทะลุ Firewall โรงเรียน)
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true 
});

const APP_ID = 'src-pa-hub-v1';

const getColl = (collName) => collection(db, 'artifacts', APP_ID, 'public', 'data', collName);
const getDocRef = (collName, docId) => doc(db, 'artifacts', APP_ID, 'public', 'data', collName, docId);

// ฟังก์ชันแปลงรูปภาพ
const compressImageToBase64 = (file, maxWidth = 400) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let newWidth = img.width > maxWidth ? maxWidth : img.width;
        let newHeight = img.height * (newWidth / img.width);
        canvas.width = newWidth;
        canvas.height = newHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.7)); 
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

// --- Constants & Data ---
const TASK_LIST = [
  { id: 't1', name: '1. หลักสูตรกลุ่มสาระฯ' },
  { id: 't2', name: '2. รายงานการใช้หลักสูตร' },
  { id: 't3', name: '3. แผนการสอนภาคเรียนที่ 1' },
  { id: 't4', name: '4. บันทึกหลังสอนภาคเรียนที่ 1' },
  { id: 't5', name: '5. รายงานการใช้และพัฒนาสื่อฯ ภาคเรียนที่ 1' },
  { id: 't6', name: '6. รายงานการนิเทศการสอน ภาคเรียนที่ 1' },
  { id: 't7', name: '7. แผนการสอนภาคเรียนที่ 2' },
  { id: 't8', name: '8. บันทึกหลังสอนภาคเรียนที่ 2' },
  { id: 't9', name: '9. รายงานการใช้และพัฒนาสื่อฯ ภาคเรียนที่ 2' },
  { id: 't10', name: '10. รายงานการนิเทศการสอน ภาคเรียนที่ 2' },
  { id: 't11', name: '11. วิจัยในชั้นเรียน' },
  { id: 't12', name: '12. PLC' },
  { id: 't13', name: '13. รายงานการเยี่ยมบ้านนักเรียน' },
  { id: 't14', name: '14. SDQ' },
  { id: 't15', name: '15. Hero OBEC Care' },
  { id: 't16', name: '16. ID PLAN' },
  { id: 't17', name: '17. SAR' },
  { id: 't18', name: '18. เครือข่ายผู้ปกครองนักเรียน' }
];

const STANDINGS_DESC = {
  'ครูผู้ช่วย': { label: 'ปฏิบัติและเรียนรู้ (Focus and Learn)', desc: 'สามารถจัดการเรียนรู้และพัฒนาตนเองให้สอดคล้องกับบริบทของสถานศึกษา' },
  'ครู (ไม่มีวิทยฐานะ/คศ.1)': { label: 'ปรับประยุกต์ (Apply and Adapt)', desc: 'สามารถนำความรู้มาประยุกต์ใช้ในการจัดการเรียนรู้ได้อย่างเหมาะสม' },
  'ครูชำนาญการ (คศ.2)': { label: 'แก้ไขปัญหา (Solve the Problem)', desc: 'สามารถแก้ไขปัญหาที่เกิดขึ้นจากการจัดการเรียนรู้และพัฒนาผู้เรียนได้' },
  'ครูชำนาญการพิเศษ (คศ.3)': { label: 'ริเริ่มพัฒนา (Initiate and Develop)', desc: 'สามารถริเริ่ม สร้างสรรค์ และพัฒนานวัตกรรมเพื่อการเรียนรู้' },
  'ครูเชี่ยวชาญ (คศ.4)': { label: 'คิดค้นและปรับเปลี่ยน (Invent and Transform)', desc: 'สามารถคิดค้นนวัตกรรมใหม่และปรับเปลี่ยนรูปแบบให้เกิดผลสัมฤทธิ์สูง' },
  'ครูเชี่ยวชาญพิเศษ (คศ.5)': { label: 'สร้างการเปลี่ยนแปลง (Create an Impact)', desc: 'สามารถสร้างการเปลี่ยนแปลงในวงวิชาการและเป็นแบบอย่างที่ดี' }
};

const DEFAULT_DEPARTMENTS = [
  'ภาษาไทย', 'คณิตศาสตร์', 'วิทยาศาสตร์และเทคโนโลยี', 'สังคมศึกษา ศาสนาและวัฒนธรรม',
  'สุขศึกษาและพลศึกษา', 'ศิลปะ', 'การงานอาชีพ', 'ภาษาต่างประเทศ', 'กิจกรรมพัฒนาผู้เรียน'
];

const GRADES = ['ม.1', 'ม.2', 'ม.3', 'ม.4', 'ม.5', 'ม.6'];
const ROOMS = Array.from({length: 15}, (_, i) => (i + 1).toString());

// --- Main Application ---
export default function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [appSettings, setAppSettings] = useState({ paYear: 2567, departments: DEFAULT_DEPARTMENTS });
  const [usersMap, setUsersMap] = useState({});

  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @import url('https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700;900&display=swap');
      body { font-family: 'Prompt', sans-serif; }
      .glass-panel { background: rgba(255, 255, 255, 0.6); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.3); box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.1); }
      .glass-input { background: rgba(255, 255, 255, 0.5); border: 1px solid rgba(255, 255, 255, 0.5); backdrop-filter: blur(4px); }
      .glass-input:focus { background: rgba(255, 255, 255, 0.8); outline: none; border-color: #00529B; box-shadow: 0 0 0 2px rgba(0, 82, 155, 0.2); }
      .silver-frame { position: relative; background: white; padding: 4px; z-index: 1; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
      .silver-frame::before { content: ""; position: absolute; inset: 0; border-radius: inherit; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 25%, #e2ebf0 50%, #c3cfe2 75%, #f5f7fa 100%); z-index: -1; box-shadow: inset 0 0 4px rgba(255,255,255,0.8), 0 0 6px rgba(180,190,200,0.6); border: 1px solid rgba(255,255,255,0.5); }
      @keyframes fadeInDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
      .animate-fade-in-down { animation: fadeInDown 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
      div:where(.swal2-container) div:where(.swal2-popup) { font-family: 'Prompt', sans-serif !important; border-radius: 20px !important; }
      @media print {
        body { background: white !important; }
        .bg-fixed { background-image: none !important; }
        .glass-panel, .glass-input { background: white !important; backdrop-filter: none !important; border: 1px solid #ccc !important; box-shadow: none !important; color: black !important; }
        .no-print { display: none !important; }
      }
      .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
      .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
      .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.2); border-radius: 10px; }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.3); }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const closeToast = () => {
    if (window.Swal) window.Swal.close();
  }

  const showToast = (message, type = 'success') => {
    if (window.Swal) {
      if (type === 'loading' || type === 'info') {
        window.Swal.fire({
          title: message,
          allowOutsideClick: false,
          showConfirmButton: false,
          didOpen: () => { window.Swal.showLoading(); }
        });
      } else {
        window.Swal.fire({
          icon: type,
          title: type === 'success' ? 'สำเร็จ!' : 'ข้อความแจ้งเตือน',
          text: message,
          timer: type === 'success' ? 2500 : undefined,
          showConfirmButton: type === 'error',
          confirmButtonColor: '#00529B',
          confirmButtonText: 'ตกลงรับทราบ'
        });
      }
    } else {
      if(type !== 'loading') alert(message); 
    }
  };

  // 🚀 ระบบตัดจบการโหลด (Timeout Fallback) ป้องกันหน้าจอขาวหมุนค้างตลอดกาล
  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      if (loading) {
        setLoading(false);
        console.warn("Loading timed out. Forcing UI to display.");
      }
    }, 8000); // ถ้าเกิน 8 วินาที บังคับให้เข้าหน้าเว็บเลย ไม่ต้องรอ
    return () => clearTimeout(fallbackTimer);
  }, [loading]);

  useEffect(() => {
    const unsubSettings = onSnapshot(getDocRef('settings', 'system'), (docSnap) => {
      if (docSnap.exists()) { setAppSettings(prev => ({ ...prev, ...docSnap.data() })); } 
      else { setDoc(getDocRef('settings', 'system'), { paYear: 2567, departments: DEFAULT_DEPARTMENTS }, { merge: true }).catch(e => console.log("Settings init error:", e)); }
    }, (error) => {
      console.error("Firebase Snapshot Error (Settings):", error);
    });
    return () => unsubSettings();
  }, []);

  useEffect(() => {
    let profileUnsub;
    let usersUnsub;

    const authUnsub = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userRef = getDocRef('users', currentUser.uid);

        try {
          const docSnap = await getDoc(userRef);
          
          if (!docSnap.exists()) {
            let newProfile = {
              uid: currentUser.uid, email: currentUser.email, firstName: '', lastName: '', title: '',
              position: 'ครู', standing: 'ครู (ไม่มีวิทยฐานะ/คศ.1)', department: '', advisorGrade: '', advisorRoom: '', salary: '', photoUrl: '',
              roles: { teacher: true, supervisor: false, admin: false }, supervisorTasks: [], supervisorTitle: ''
            };

            const preUsersSnap = await getDocs(getColl('pre_users'));
            const preUserData = preUsersSnap.docs.find(d => d.data().email === currentUser.email.toLowerCase());

            if (preUserData) {
              const data = preUserData.data();
              newProfile = { ...newProfile, ...data, roles: data.roles || newProfile.roles };
              delete newProfile.password;
              await deleteDoc(preUserData.ref); 
            } else {
              const allUsers = await getDocs(getColl('users'));
              if (allUsers.empty) newProfile.roles.admin = true;
            }

            await setDoc(userRef, newProfile);
          }

          profileUnsub = onSnapshot(userRef, (snap) => {
            if (snap.exists()) setProfile(snap.data());
            setLoading(false); 
          }, (error) => {
            console.error("Profile Snapshot Error:", error);
            setLoading(false);
          });

          usersUnsub = onSnapshot(getColl('users'), (snap) => {
            const map = {}; snap.forEach(d => map[d.id] = d.data()); setUsersMap(map);
          }, (error) => {
             console.error("Users Map Error:", error);
          });

        } catch (error) {
          console.error("Database connection timeout or permission error:", error);
          setLoading(false); // บังคับปิดโหลดเมื่อเกิด Error เพื่อให้เห็นหน้าเว็บ
        }

      } else {
        setUser(null); setProfile(null); setLoading(false);
        if (profileUnsub) profileUnsub();
        if (usersUnsub) usersUnsub();
      }
    });

    return () => { authUnsub(); if (profileUnsub) profileUnsub(); if (usersUnsub) usersUnsub(); };
  }, []);

  if (loading) return <div className="min-h-screen flex flex-col items-center justify-center text-[#00529B] bg-white gap-4"><Loader2 className="animate-spin w-12 h-12" /><p className="font-bold animate-pulse">กำลังเชื่อมต่อฐานข้อมูล...</p></div>;

  return (
    <div className="min-h-screen bg-cover bg-center bg-fixed text-gray-800 relative font-['Prompt']" style={{ backgroundImage: "url('https://img1.pic.in.th/images/BG-web-app.png')" }}>
      {!user ? <Login showToast={showToast} closeToast={closeToast} /> : <MainLayout user={user} profile={profile} appSettings={appSettings} usersMap={usersMap} showToast={showToast} closeToast={closeToast} />}
    </div>
  );
}

function Login({ showToast, closeToast }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => { closeToast(); }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!email.endsWith('@sriracha.ac.th')) { showToast('กรุณาใช้อีเมลของโรงเรียน (@sriracha.ac.th)', 'error'); setIsLoading(false); return; }

    try {
      showToast('กำลังเข้าสู่ระบบ...', 'loading');
      
      try {
        await signInWithEmailAndPassword(auth, email, password);
        closeToast();
      } catch (loginError) {
        if (loginError.code === 'auth/user-not-found' || loginError.code === 'auth/invalid-credential') {
          try {
            await createUserWithEmailAndPassword(auth, email, password);
            showToast('ลงทะเบียนและเข้าสู่ระบบสำเร็จ', 'success');
          } catch (createError) {
            showToast('รหัสผ่านไม่ถูกต้อง หรือสร้างบัญชีไม่สำเร็จ', 'error');
          }
        } else {
          throw loginError;
        }
      }
    } catch (err) {
      showToast('เกิดข้อผิดพลาด: ' + err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-md p-8 rounded-3xl animate-fade-in-up border border-white/50 shadow-2xl bg-white/40">
        <div className="text-center mb-8">
          <img src="https://img1.pic.in.th/images/-69-1.png" alt="SRC Logo" className="h-24 mx-auto mb-4 drop-shadow-md hover:scale-105 transition-transform duration-300" />
          <h1 className="text-4xl md:text-5xl font-black tracking-tight pb-1 mb-2 drop-shadow-lg">
            <span className="bg-gradient-to-br from-[#FF6B6B] via-[#D31027] to-[#7A0000] bg-clip-text text-transparent pr-2 drop-shadow-sm">SRC</span>
            <span className="bg-gradient-to-b from-[#3A8DFF] via-[#00529B] to-[#002855] bg-clip-text text-transparent">PA Hub</span>
          </h1>
          <p className="text-gray-600 font-medium text-sm md:text-base">ระบบบริหารจัดการภาระงานและประเด็นท้าทาย</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-5">
          <div><label className="block text-sm font-bold text-gray-700 mb-1">ชื่อผู้ใช้งาน (Email โรงเรียน)</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@sriracha.ac.th" className="glass-input w-full px-4 py-3.5 rounded-xl transition-all shadow-sm focus:shadow-md font-bold" required disabled={isLoading} /></div>
          <div><label className="block text-sm font-bold text-gray-700 mb-1">รหัสผ่าน</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="กรอกรหัสผ่าน..." className="glass-input w-full px-4 py-3.5 rounded-xl transition-all shadow-sm focus:shadow-md font-bold" required disabled={isLoading} /></div>
          <button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-[#00529B] to-blue-700 hover:to-blue-800 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg mt-6 flex justify-center items-center transform hover:-translate-y-0.5">
            {isLoading ? <><Loader2 className="animate-spin mr-2" size={20} /> กำลังตรวจสอบสิทธิ์...</> : 'เข้าสู่ระบบ'}
          </button>
        </form>
      </div>
    </div>
  );
}

function MainLayout({ user, profile, appSettings, usersMap, showToast, closeToast }) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  const isTeacher = profile?.roles?.teacher || false;
  const isSupervisor = profile?.roles?.supervisor || false;
  const isAdmin = profile?.roles?.admin || false;

  const handleLogout = async () => {
    showToast('กำลังออกจากระบบ...', 'loading');
    try {
      await signOut(auth);
      closeToast();
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'หน้าหลัก', icon: BarChart, show: true },
    { id: 'part1', label: 'ส่วนที่ 1: ภาระงาน PA', icon: FileText, show: isTeacher },
    { id: 'part2', label: 'ส่วนที่ 2: ประเด็นท้าทาย', icon: Briefcase, show: isTeacher },
    { id: 'supervisor', label: 'บันทึกการส่งภาระงาน', icon: CheckSquare, show: isSupervisor },
    { id: 'admin', label: 'ผู้ดูแลระบบ', icon: Settings, show: isAdmin },
  ];

  const renderStanding = (standing) => {
    if (!standing || standing === '-' || standing.includes('ไม่มีวิทยฐานะ')) return 'ครู';
    return standing.split(' (')[0]; 
  };

  const LuxuryBrandName = ({ className = "text-xl" }) => (
    <span className={`font-black tracking-tight drop-shadow-md ${className}`}>
       <span className="bg-gradient-to-br from-[#FF6B6B] via-[#D31027] to-[#7A0000] bg-clip-text text-transparent pr-1">SRC</span>
       <span className="bg-gradient-to-b from-[#3A8DFF] via-[#00529B] to-[#002855] bg-clip-text text-transparent">PA Hub</span>
    </span>
  );

  return (
    <div className="flex h-screen overflow-hidden">
      <div className={`fixed inset-y-0 left-0 z-50 w-72 glass-panel transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} no-print bg-white/60`}>
        <div className="h-full flex flex-col">
          <div className="p-5 flex items-center justify-between border-b border-gray-200/50">
            <div className="flex items-center gap-3">
              <img src="https://img1.pic.in.th/images/-69-1.png" alt="Logo" className="h-10 drop-shadow-md" />
              <LuxuryBrandName />
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-500 hover:text-gray-800 bg-white/50 p-1 rounded-lg"><X size={20} /></button>
          </div>
          
          <div className="px-6 py-6 border-b border-gray-200/50 flex flex-col items-center text-center">
            <div className="silver-frame rounded-xl w-24 h-32 flex-shrink-0 mb-4 flex items-center justify-center overflow-hidden">
              {profile?.photoUrl ? <img src={profile.photoUrl} alt="Profile" className="w-full h-full object-cover rounded-lg" /> : <User size={40} className="text-gray-400" />}
            </div>
            <div className="font-bold text-blue-900 truncate w-full text-lg">{profile?.title}{profile?.firstName} {profile?.lastName}</div>
            <div className="text-sm font-bold text-blue-800 bg-blue-100/80 border border-blue-200 px-3 py-1 rounded-full mt-2 inline-block shadow-sm">
              {renderStanding(profile?.standing)}
            </div>
            {profile?.department && <div className="text-xs font-bold text-gray-600 mt-2 bg-white/70 px-3 py-1 rounded-lg border border-gray-200 shadow-sm">{profile.department}</div>}
          </div>

          <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto custom-scrollbar">
            {navItems.filter(item => item.show).map(item => (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all font-bold ${activeTab === item.id ? 'bg-gradient-to-r from-[#00529B] to-blue-700 text-white shadow-md' : 'text-gray-700 hover:bg-white/80'}`}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-gray-200/50">
            <button onClick={handleLogout} className="w-full flex items-center justify-center space-x-2 px-4 py-3 text-[#ED1C24] bg-red-50/50 hover:bg-red-100 rounded-xl transition-colors font-bold border border-red-100">
              <LogOut size={18} /><span>ออกจากระบบ</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <div className="lg:hidden glass-panel p-4 flex items-center justify-between z-40 no-print border-b border-white/50">
          <div className="flex items-center space-x-3">
            <button onClick={() => setSidebarOpen(true)} className="p-2 text-blue-900 bg-white/80 rounded-lg shadow-sm border border-gray-200"><Menu size={20} /></button>
            <LuxuryBrandName className="text-xl" />
          </div>
          <img src="https://img1.pic.in.th/images/-69-1.png" alt="Logo" className="h-8" />
        </div>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative custom-scrollbar">
          <div className="max-w-6xl mx-auto pb-20">
            {activeTab === 'dashboard' && <Dashboard profile={profile} usersMap={usersMap} />}
            {activeTab === 'part1' && <TeacherPart1 profile={profile} appSettings={appSettings} showToast={showToast} closeToast={closeToast} />}
            {activeTab === 'part2' && <TeacherPart2 profile={profile} showToast={showToast} closeToast={closeToast} />}
            {activeTab === 'supervisor' && <SupervisorPanel profile={profile} appSettings={appSettings} usersMap={usersMap} showToast={showToast} closeToast={closeToast} />}
            {activeTab === 'admin' && <AdminPanel profile={profile} showToast={showToast} appSettings={appSettings} closeToast={closeToast} />}
          </div>
        </main>
      </div>
    </div>
  );
}

function Dashboard({ profile, usersMap }) {
  const [tasksStatus, setTasksStatus] = useState({});
  const [stats, setStats] = useState({ total: 18, completed: 0, percent: 0 });

  useEffect(() => {
    if (!profile?.uid) return;
    const tasksRef = getDocRef('tasks', profile.uid);
    const unsubscribe = onSnapshot(tasksRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setTasksStatus(data);
        const completed = TASK_LIST.filter(t => data[t.id]?.status === true).length;
        setStats({ total: 18, completed, percent: Math.round((completed / 18) * 100) });
      }
    });
    return () => unsubscribe();
  }, [profile?.uid]);

  const renderStanding = (standing) => {
    if (!standing || standing === '-' || standing.includes('ไม่มีวิทยฐานะ')) return 'ครู';
    return standing.split(' (')[0];
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="glass-panel p-6 md:p-8 rounded-3xl flex flex-col md:flex-row items-center gap-8 relative overflow-hidden bg-white/40 border border-white/60">
        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-400/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-red-400/10 rounded-full blur-3xl -ml-10 -mb-10"></div>
        
        <div className="silver-frame rounded-2xl w-32 h-44 flex-shrink-0 z-10 flex items-center justify-center overflow-hidden bg-gray-100">
          {profile?.photoUrl ? <img src={profile.photoUrl} alt="Profile" className="w-full h-full object-cover rounded-xl" /> : <User size={48} className="text-gray-300" />}
        </div>
        
        <div className="flex-1 text-center md:text-left z-10 w-full">
          <h2 className="text-2xl md:text-3xl font-bold text-blue-900 drop-shadow-sm mb-1">{profile?.title}{profile?.firstName} {profile?.lastName || 'ยินดีต้อนรับ'}</h2>
          {!profile?.firstName && <p className="text-red-500 text-sm font-medium mb-2">* กรุณาให้ Admin นำเข้าข้อมูลส่วนตัวของคุณ</p>}
          
          <div className="mt-3 space-y-1.5 inline-block text-left bg-white/50 p-4 rounded-xl border border-white/60 shadow-sm">
            <p className="text-gray-700 font-medium flex items-center"><span className="w-24 text-gray-500 font-bold">ตำแหน่ง:</span> <span className="text-blue-800 font-bold">{renderStanding(profile?.standing)}</span></p>
            <p className="text-gray-700 font-medium flex items-center"><span className="w-24 text-gray-500 font-bold">กลุ่มสาระฯ:</span> <span className="text-blue-800 font-bold">{profile?.department || '-'}</span></p>
            {profile?.advisorGrade && <p className="text-gray-700 font-medium flex items-center"><span className="w-24 text-gray-500 font-bold">ที่ปรึกษา:</span> <span className="text-blue-800 font-bold">{profile.advisorGrade}/{profile.advisorRoom || '-'}</span></p>}
          </div>
          
          <div className="mt-6 glass-panel p-5 rounded-2xl bg-white/70 border-white shadow-sm">
            <div className="flex justify-between text-sm mb-3 text-blue-900 font-bold">
              <span className="flex items-center"><CheckCircle className="w-4 h-4 mr-1.5 text-green-500"/> ความคืบหน้าการส่งภาระงาน PA (18 งาน)</span>
              <span className="bg-blue-100 px-3 py-0.5 rounded-full text-blue-800">{stats.percent}% ({stats.completed}/18)</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 shadow-inner overflow-hidden relative">
              <div className={`h-full rounded-full transition-all duration-1000 ease-out relative ${stats.percent === 100 ? 'bg-gradient-to-r from-green-400 to-green-600' : 'bg-gradient-to-r from-[#ED1C24] to-red-500'}`} style={{ width: `${stats.percent}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 z-10 relative">
        <div className="glass-panel p-6 rounded-3xl flex flex-col h-[26rem] bg-white/50 border border-white">
          <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center pb-3 border-b border-gray-200/50"><CheckSquare className="mr-2 text-green-500" size={22}/> ภาระงานที่ส่งแล้ว ({stats.completed})</h3>
          <ul className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-1">
            {TASK_LIST.filter(t => tasksStatus[t.id]?.status).length === 0 && <div className="h-full flex flex-col items-center justify-center text-gray-400"><Info className="w-8 h-8 mb-2 opacity-50"/><p className="text-sm font-medium">ยังไม่มีงานที่ส่ง</p></div>}
            {TASK_LIST.filter(t => tasksStatus[t.id]?.status).map(task => {
               const record = tasksStatus[task.id];
               const supInfo = record.supervisorId ? usersMap[record.supervisorId] : null;
               const supName = supInfo ? `${supInfo.firstName} ${supInfo.lastName}` : 'หัวหน้างาน';
               const supTitle = supInfo?.supervisorTitle || '';

               return (
                <li key={task.id} className="flex items-start text-sm p-4 bg-white rounded-2xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
                  <CheckSquare size={20} className="text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <div className="font-bold text-gray-800 text-base">{task.name}</div>
                    <div className="text-xs text-blue-700 font-medium mt-1.5 bg-blue-50/80 border border-blue-100 px-2 py-1 rounded-lg inline-block">
                      บันทึกส่งโดย: <span className="font-bold">{supName}</span> {supTitle && <span className="text-gray-500 ml-1">({supTitle})</span>}
                    </div>
                  </div>
                </li>
               )
            })}
          </ul>
        </div>
        <div className="glass-panel p-6 rounded-3xl flex flex-col h-[26rem] bg-white/50 border border-white">
          <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center pb-3 border-b border-gray-200/50"><FileText className="mr-2 text-red-500" size={22}/> ภาระงานที่ยังไม่ส่ง ({18 - stats.completed})</h3>
          <ul className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-1">
             {TASK_LIST.filter(t => !tasksStatus[t.id]?.status).length === 0 && <div className="h-full flex flex-col items-center justify-center text-green-600 font-bold bg-green-50/50 rounded-xl border border-green-100"><span className="text-3xl mb-2">🎉</span>ส่งงานครบทุกรายการแล้ว เยี่ยมมาก!</div>}
            {TASK_LIST.filter(t => !tasksStatus[t.id]?.status).map(task => (
              <li key={task.id} className="flex items-center text-sm p-3.5 bg-red-50/50 rounded-xl border border-red-100">
                <X size={18} className="text-red-500 mr-3 flex-shrink-0" />
                <span className="text-gray-700 font-bold">{task.name}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function TeacherPart1({ profile, appSettings, showToast, closeToast }) {
  const [formData, setFormData] = useState({
    salary: '', licenseNumber: '', licenseIssue: '', licenseExpire: '', classes: [], subjects: '', 
    hours1: { teaching: '', support: '', dev: '', policy: '' }, hours2: { teaching: '', support: '', dev: '', policy: '' }
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile) setFormData(prev => ({ ...prev, ...profile }));
  }, [profile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({ ...prev, [parent]: { ...prev[parent], [child]: value } }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleCheckbox = (e) => {
    const { value, checked } = e.target;
    setFormData(prev => {
      const classes = prev.classes || [];
      return checked ? { ...prev, classes: [...classes, value] } : { ...prev, classes: classes.filter(c => c !== value) };
    });
  };

  const saveProfile = async () => {
    setIsSaving(true);
    showToast('กำลังบันทึกข้อมูล...', 'loading');
    try {
      const userRef = getDocRef('users', profile.uid);
      await setDoc(userRef, {
        salary: formData.salary || '', licenseNumber: formData.licenseNumber || '',
        licenseIssue: formData.licenseIssue || '', licenseExpire: formData.licenseExpire || '',
        classes: formData.classes || [], subjects: formData.subjects || '',
        hours1: formData.hours1 || {}, hours2: formData.hours2 || {}
      }, { merge: true });
      showToast('บันทึกข้อมูลส่วนที่ 1 สำเร็จแล้ว', 'success');
    } catch (err) { 
      showToast(err.message, 'error'); 
    } finally {
      setIsSaving(false);
    }
  };

  const totalHours1 = Object.values(formData.hours1 || {}).reduce((acc, val) => acc + (Number(val) || 0), 0);
  const totalHours2 = Object.values(formData.hours2 || {}).reduce((acc, val) => acc + (Number(val) || 0), 0);
  const paYear = appSettings?.paYear || 2567;

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print bg-white/60 p-5 rounded-3xl glass-panel border border-white">
        <h2 className="text-2xl font-bold text-blue-900 flex items-center"><FileText className="mr-3 text-[#ED1C24]" />ส่วนที่ 1: ข้อมูลส่วนตัวและภาระงาน</h2>
        <button onClick={saveProfile} disabled={isSaving} className="w-full md:w-auto bg-gradient-to-r from-[#00529B] to-blue-700 hover:shadow-lg text-white px-8 py-3 rounded-xl flex items-center justify-center shadow-md transition-all font-bold disabled:opacity-70">
          {isSaving ? <Loader2 size={20} className="mr-2 animate-spin" /> : <Save size={20} className="mr-2" />} 
          {isSaving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
        </button>
      </div>

      <div className="glass-panel p-6 md:p-8 rounded-3xl bg-white/50 border border-white">
        <h3 className="text-lg font-bold text-blue-900 border-b border-gray-200 pb-3 mb-6 flex flex-col md:flex-row justify-between md:items-center gap-2">
          <span className="flex items-center"><User className="mr-2 text-blue-600" size={20}/> ข้อมูลส่วนบุคคล</span>
          <span className="text-xs md:text-sm text-red-600 font-medium bg-red-50/80 px-3 py-1 rounded-lg border border-red-100 flex items-center"><AlertCircle size={14} className="mr-1"/>ข้อมูลส่วนนี้ตั้งค่าโดย Admin เท่านั้น</span>
        </h3>
        
        <div className="flex flex-col md:flex-row gap-8 mb-8 bg-white/40 p-6 rounded-2xl border border-white">
           <div className="silver-frame rounded-xl w-32 h-44 flex-shrink-0 flex items-center justify-center mx-auto md:mx-0 overflow-hidden bg-gray-100">
             {profile?.photoUrl ? <img src={profile?.photoUrl} className="w-full h-full object-cover rounded-lg" /> : <User size={48} className="text-gray-300" />}
           </div>
           <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div><label className="block text-sm font-bold text-gray-500 mb-1">คำนำหน้า</label><div className="px-4 py-3 bg-gray-50/80 rounded-xl text-gray-800 font-bold border border-gray-200/60 shadow-sm">{profile?.title || '-'}</div></div>
              <div><label className="block text-sm font-bold text-gray-500 mb-1">ชื่อ</label><div className="px-4 py-3 bg-gray-50/80 rounded-xl text-gray-800 font-bold border border-gray-200/60 shadow-sm">{profile?.firstName || '-'}</div></div>
              <div><label className="block text-sm font-bold text-gray-500 mb-1">นามสกุล</label><div className="px-4 py-3 bg-gray-50/80 rounded-xl text-gray-800 font-bold border border-gray-200/60 shadow-sm">{profile?.lastName || '-'}</div></div>
              <div><label className="block text-sm font-bold text-gray-500 mb-1">ตำแหน่ง</label><div className="px-4 py-3 bg-blue-50/80 rounded-xl text-blue-800 font-bold border border-blue-100 shadow-sm">{profile?.position || 'ครู'}</div></div>
              <div><label className="block text-sm font-bold text-gray-500 mb-1">วิทยฐานะ</label><div className="px-4 py-3 bg-gray-50/80 rounded-xl text-gray-800 font-bold border border-gray-200/60 shadow-sm">{profile?.standing || '-'}</div></div>
              <div><label className="block text-sm font-bold text-gray-500 mb-1">กลุ่มสาระฯ</label><div className="px-4 py-3 bg-gray-50/80 rounded-xl text-gray-800 font-bold border border-gray-200/60 shadow-sm">{profile?.department || '-'}</div></div>
              <div className="md:col-span-3 lg:col-span-1"><label className="block text-sm font-bold text-gray-500 mb-1">ครูที่ปรึกษา</label><div className="px-4 py-3 bg-green-50/80 rounded-xl text-green-800 font-bold border border-green-100 shadow-sm">{profile?.advisorGrade ? `ชั้น ${profile.advisorGrade} ห้อง ${profile.advisorRoom || '-'}` : 'ไม่ได้เป็นครูที่ปรึกษา'}</div></div>
           </div>
        </div>

        <h3 className="text-lg font-bold text-blue-900 border-b border-gray-200 pb-3 mb-6 flex items-center"><Edit className="mr-2 text-blue-600" size={20}/> ข้อมูลที่ต้องกรอกเพิ่มเติม</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/40 p-6 rounded-2xl border border-white">
          <div><label className="block text-sm font-bold text-gray-700 mb-2">อัตราเงินเดือนปัจจุบัน (บาท)</label><input type="number" name="salary" value={formData.salary || ''} onChange={handleChange} className="glass-input w-full px-4 py-3.5 rounded-xl font-bold bg-white shadow-sm" placeholder="ตัวเลขเท่านั้น" /></div>
          <div><label className="block text-sm font-bold text-gray-700 mb-2">เลขที่ใบอนุญาตประกอบวิชาชีพครู (14 หลัก)</label><input type="text" name="licenseNumber" maxLength={14} value={formData.licenseNumber || ''} onChange={handleChange} className="glass-input w-full px-4 py-3.5 rounded-xl font-bold bg-white shadow-sm" placeholder="กรอกเลข 14 หลัก" /></div>
          <div><label className="block text-sm font-bold text-gray-700 mb-2">วันออกใบอนุญาต</label><input type="date" name="licenseIssue" value={formData.licenseIssue || ''} onChange={handleChange} className="glass-input w-full px-4 py-3.5 rounded-xl font-bold bg-white shadow-sm" /></div>
          <div><label className="block text-sm font-bold text-gray-700 mb-2">วันหมดอายุใบอนุญาต</label><input type="date" name="licenseExpire" value={formData.licenseExpire || ''} onChange={handleChange} className="glass-input w-full px-4 py-3.5 rounded-xl font-bold bg-white shadow-sm" /></div>
        </div>
      </div>

      <div className="glass-panel p-6 md:p-8 rounded-3xl bg-white/50 border border-white">
        <h3 className="text-lg font-bold text-blue-900 border-b border-gray-200 pb-3 mb-6">ข้อมูลการปฏิบัติหน้าที่สอน</h3>
        <div className="mb-6 bg-white/40 p-6 rounded-2xl border border-white shadow-sm">
          <label className="block text-sm font-bold text-gray-700 mb-4">ระดับชั้นที่ทำการสอน (เลือกได้หลายข้อ)</label>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            {GRADES.map(grade => (
              <label key={grade} className={`flex items-center justify-center space-x-2 py-3 px-2 rounded-xl border-2 cursor-pointer transition-all shadow-sm ${ (formData.classes || []).includes(grade) ? 'bg-blue-50 border-blue-400 text-blue-800' : 'bg-white border-transparent text-gray-600 hover:border-gray-300' }`}>
                <input type="checkbox" value={grade} checked={(formData.classes || []).includes(grade)} onChange={handleCheckbox} className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 hidden" />
                <span className="font-bold">{grade}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="bg-white/40 p-6 rounded-2xl border border-white shadow-sm">
          <label className="block text-sm font-bold text-gray-700 mb-3">รายวิชาที่สอน (ระบุรหัสวิชา และชื่อวิชา)</label>
          <textarea name="subjects" value={formData.subjects || ''} onChange={handleChange} rows="4" placeholder="เช่น ท21101 ภาษาไทย, ว31101 ฟิสิกส์" className="glass-input w-full px-4 py-3.5 rounded-xl resize-none font-medium leading-relaxed bg-white"></textarea>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <HourCard title={`ชั่วโมงปฏิบัติงาน ภาคเรียนที่ 2 ปีการศึกษา ${paYear - 1}`} data={formData.hours1 || {}} prefix="hours1" onChange={handleChange} total={totalHours1} />
        <HourCard title={`ชั่วโมงปฏิบัติงาน ภาคเรียนที่ 1 ปีการศึกษา ${paYear}`} data={formData.hours2 || {}} prefix="hours2" onChange={handleChange} total={totalHours2} />
      </div>
    </div>
  );
}

function HourCard({ title, data, prefix, onChange, total }) {
  return (
    <div className="glass-panel p-6 rounded-3xl flex flex-col h-full bg-white/50 border border-white">
      <h3 className="text-md font-bold text-blue-900 border-b border-gray-200 pb-3 mb-5 bg-white/60 px-4 py-3 rounded-xl shadow-sm">{title}</h3>
      <div className="space-y-3 flex-1">
        {['teaching', 'support', 'dev', 'policy'].map((field, i) => {
          const labels = ['1. งานสอนตามตารางสอน', '2. งานส่งเสริมและสนับสนุนฯ', '3. งานพัฒนาคุณภาพฯ', '4. งานตอบสนองนโยบายฯ'];
          return (
            <div key={field} className="flex items-center justify-between bg-white p-3 rounded-xl border border-gray-100 shadow-sm hover:border-blue-200 transition-colors">
              <span className="text-sm font-bold text-gray-700 w-3/5 line-clamp-1">{labels[i]}</span>
              <div className="flex items-center"><input type="number" name={`${prefix}.${field}`} value={data[field] || ''} onChange={onChange} className="glass-input w-20 px-2 py-2 rounded-lg text-center font-bold bg-gray-50 focus:bg-white border-gray-200" /><span className="ml-2 text-sm text-gray-500 font-medium w-12 text-right">ชม./สป.</span></div>
            </div>
          )
        })}
      </div>
      <div className="pt-4 mt-5 border-t border-gray-200 flex items-center justify-between font-bold text-xl text-blue-900 bg-blue-50/80 border border-blue-100 px-5 py-4 rounded-2xl shadow-sm">
        <span>รวมทั้งหมด</span><span className={total > 0 ? "text-green-600" : "text-gray-400"}>{total} ชม./สป.</span>
      </div>
    </div>
  );
}

function TeacherPart2({ profile, showToast, closeToast }) {
  const [paData, setPaData] = useState({ issue: '', problem: '', method: '', resultQuantity: '', resultQuality: '' });
  const [isSaving, setIsSaving] = useState(false);
  
  const standingKey = profile?.standing ? profile.standing.split(' (')[0] : 'ครู (ไม่มีวิทยฐานะ/คศ.1)';
  const expectation = STANDINGS_DESC[standingKey] || STANDINGS_DESC['ครู (ไม่มีวิทยฐานะ/คศ.1)'];

  useEffect(() => {
    if (!profile?.uid) return;
    const unsubscribe = onSnapshot(getDocRef('pa', profile.uid), (snap) => { if (snap.exists()) setPaData(snap.data()); });
    return () => unsubscribe();
  }, [profile?.uid]);

  const savePA = async () => {
    setIsSaving(true);
    showToast('กำลังบันทึกประเด็นท้าทาย...', 'loading');
    try {
      await setDoc(getDocRef('pa', profile.uid), paData, { merge: true });
      showToast('บันทึกประเด็นท้าทาย (ส่วนที่ 2) สำเร็จ', 'success');
    } catch (err) { showToast(err.message, 'error'); }
    finally { setIsSaving(false); }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print bg-white/60 p-5 rounded-3xl glass-panel border border-white">
        <h2 className="text-2xl font-bold text-blue-900 flex items-center"><Briefcase className="mr-3 text-[#ED1C24]" />ส่วนที่ 2: ประเด็นท้าทาย (PA)</h2>
        <button onClick={savePA} disabled={isSaving} className="w-full md:w-auto bg-gradient-to-r from-[#ED1C24] to-red-700 hover:shadow-lg text-white px-8 py-3 rounded-xl flex items-center justify-center shadow-md transition-all font-bold disabled:opacity-70">
          {isSaving ? <Loader2 size={20} className="mr-2 animate-spin" /> : <Save size={20} className="mr-2" />}
          {isSaving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
        </button>
      </div>

      <div className="glass-panel p-8 rounded-3xl bg-gradient-to-r from-blue-50/90 to-red-50/90 border-l-8 border-l-[#00529B] shadow-md border-t border-r border-b border-white">
        <h3 className="text-sm font-bold text-gray-600 mb-1 flex items-center"><CheckCircle size={16} className="mr-1 text-green-600"/> เกณฑ์การประเมินวิทยฐานะของคุณ</h3>
        <p className="text-2xl font-bold text-blue-900 mb-3">{profile?.standing || 'ไม่ระบุ'}</p>
        <div className="bg-white/80 p-5 rounded-xl border border-white inline-block shadow-sm w-full md:w-auto">
          <p className="text-[#ED1C24] font-bold text-lg flex items-center mb-1"><ChevronRight size={20}/> {expectation.label}</p>
          <p className="text-gray-700 font-medium ml-6 leading-relaxed">คำอธิบาย: {expectation.desc}</p>
        </div>
      </div>

      <div className="glass-panel p-6 md:p-8 rounded-3xl space-y-6 bg-white/50 border border-white">
        <div className="bg-white/60 p-5 rounded-2xl border border-white shadow-sm">
          <label className="block font-bold text-blue-900 mb-3 text-xl">ประเด็นท้าทาย เรื่อง <span className="text-[#ED1C24]">*</span></label>
          <input type="text" value={paData.issue || ''} onChange={(e) => setPaData({...paData, issue: e.target.value})} className="glass-input w-full px-5 py-4 rounded-xl text-lg font-bold border-2 border-blue-100 focus:border-[#00529B] bg-white shadow-inner" placeholder="ระบุชื่อหัวข้อประเด็นท้าทาย..." />
        </div>
        
        <div className="bg-white/60 p-5 rounded-2xl border border-white shadow-sm">
          <label className="block font-bold text-gray-800 mb-3 text-lg">1. สภาพปัญหาของผู้เรียนและการจัดการเรียนรู้</label>
          <textarea value={paData.problem || ''} onChange={(e) => setPaData({...paData, problem: e.target.value})} rows="4" className="glass-input w-full px-5 py-4 rounded-xl resize-none leading-relaxed bg-white border border-gray-200" placeholder="อธิบายสภาพปัญหา..." />
        </div>

        <div className="bg-white/60 p-5 rounded-2xl border border-white shadow-sm">
          <label className="block font-bold text-gray-800 mb-3 text-lg">2. วิธีการดำเนินการ</label>
          <textarea value={paData.method || ''} onChange={(e) => setPaData({...paData, method: e.target.value})} rows="6" className="glass-input w-full px-5 py-4 rounded-xl resize-none leading-relaxed bg-white border border-gray-200" placeholder="ระบุขั้นตอนการดำเนินการให้สอดคล้องกับระดับปฏิบัติที่คาดหวัง..." />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-blue-50/50 p-6 md:p-8 rounded-2xl border border-blue-100 shadow-sm">
          <div className="col-span-1 md:col-span-2 pb-2 border-b border-blue-200"><h3 className="font-bold text-blue-900 text-xl flex items-center"><BarChart className="mr-2" size={24}/> 3. ผลลัพธ์การพัฒนา</h3></div>
          <div>
            <label className="block font-bold text-gray-800 mb-3">3.1 เชิงปริมาณ (ร้อยละ, จำนวน)</label>
            <textarea value={paData.resultQuantity || ''} onChange={(e) => setPaData({...paData, resultQuantity: e.target.value})} rows="4" className="glass-input w-full px-5 py-4 rounded-xl resize-none bg-white border border-gray-200" placeholder="เช่น ผู้เรียนร้อยละ 80 มีผลสัมฤทธิ์ทางการเรียนสูงขึ้น..." />
          </div>
          <div>
            <label className="block font-bold text-gray-800 mb-3">3.2 เชิงคุณภาพ (พฤติกรรม, ทักษะ)</label>
            <textarea value={paData.resultQuality || ''} onChange={(e) => setPaData({...paData, resultQuality: e.target.value})} rows="4" className="glass-input w-full px-5 py-4 rounded-xl resize-none bg-white border border-gray-200" placeholder="เช่น ผู้เรียนสามารถนำความรู้ไปประยุกต์ใช้ในชีวิตประจำวันได้..." />
          </div>
        </div>
      </div>
    </div>
  );
}

function SupervisorPanel({ profile, appSettings, usersMap, showToast, closeToast }) {
  const [teachers, setTeachers] = useState([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedTask, setSelectedTask] = useState('');
  const [tasksData, setTasksData] = useState({}); 
  const [isProcessing, setIsProcessing] = useState(false);
  
  const managedTasks = profile?.supervisorTasks || []; 
  const taskOptions = TASK_LIST.filter(t => managedTasks.includes(t.id));

  useEffect(() => {
    const unsubUsers = onSnapshot(query(getColl('users')), (snapshot) => {
      const users = []; snapshot.forEach(doc => { if (doc.data().roles?.teacher) users.push(doc.data()); }); setTeachers(users);
    });
    const unsubTasks = onSnapshot(query(getColl('tasks')), (snapshot) => {
      const tasksMap = {}; snapshot.forEach(doc => { tasksMap[doc.id] = doc.data(); }); setTasksData(tasksMap);
    });
    return () => { unsubUsers(); unsubTasks(); };
  }, []);

  const handleCheck = async (teacherUid, taskId, currentStatus) => {
    const newStatus = !currentStatus;
    setTasksData(prev => ({ ...prev, [teacherUid]: { ...(prev[teacherUid] || {}), [taskId]: { status: newStatus, supervisorId: newStatus ? profile.uid : null, timestamp: Date.now() } } }));
    try {
      await setDoc(getDocRef('tasks', teacherUid), { [taskId]: { status: newStatus, supervisorId: newStatus ? profile.uid : null, timestamp: Date.now() } }, { merge: true });
      showToast(`บันทึกการส่งงานสำเร็จแล้ว`, 'success');
    } catch (error) { showToast(error.message, "error"); }
  };

  const checkAll = async (status) => {
    if (!selectedTask) return;
    setIsProcessing(true);
    showToast('กำลังประมวลผล...', 'loading');
    const filteredTeachers = teachers.filter(t => (!selectedDept || t.department === selectedDept) && (!selectedGrade || t.advisorGrade === selectedGrade));
    
    try {
      const promises = [];
      for (const t of filteredTeachers) {
         setTasksData(prev => ({ ...prev, [t.uid]: { ...(prev[t.uid] || {}), [selectedTask]: { status: status, supervisorId: status ? profile.uid : null, timestamp: Date.now() } } }));
         promises.push(setDoc(getDocRef('tasks', t.uid), { [selectedTask]: { status: status, supervisorId: status ? profile.uid : null, timestamp: Date.now() } }, { merge: true }));
      }
      await Promise.all(promises);
      showToast(`ทำรายการ ${status ? 'บันทึกส่งงาน' : 'ยกเลิก'} ทั้งหมดสำเร็จแล้ว`, 'success');
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  if (managedTasks.length === 0) return <div className="glass-panel p-16 text-center rounded-3xl flex flex-col items-center bg-white/50 border border-white"><AlertCircle size={72} className="text-[#ED1C24] mb-6 opacity-80" /><h2 className="text-3xl font-bold mb-3 text-gray-800">ไม่มีสิทธิ์เข้าถึง</h2><p className="text-gray-600 text-lg font-medium">ติดต่อผู้ดูแลระบบเพื่อกำหนดสิทธิ์การเป็นหัวหน้าบันทึกการส่งงาน</p></div>;

  const filteredTeachers = teachers.filter(t => (!selectedDept || t.department === selectedDept) && (!selectedGrade || t.advisorGrade === selectedGrade));

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex justify-between items-center flex-wrap gap-4 bg-white/60 p-5 rounded-3xl glass-panel no-print border border-white shadow-sm">
        <h2 className="text-2xl font-bold text-blue-900 flex items-center"><CheckSquare className="mr-3 text-green-600" />ระบบบันทึกการส่งภาระงาน</h2>
        <button onClick={() => window.print()} className="bg-white hover:bg-gray-50 text-blue-900 px-6 py-3 rounded-xl flex items-center shadow-sm font-bold border border-gray-200 transition-all"><FileSpreadsheet size={20} className="mr-2" /> พิมพ์รายงาน</button>
      </div>
      
      <div className="glass-panel p-6 rounded-3xl flex flex-wrap gap-4 items-end no-print bg-white/50 border border-white shadow-sm">
        <div className="flex-1 min-w-[220px]"><label className="block text-sm font-bold text-blue-900 mb-2 flex items-center"><span className="bg-blue-100 text-blue-800 w-6 h-6 flex items-center justify-center rounded-full mr-2">1</span> ภาระงานที่ตรวจ</label><select value={selectedTask} onChange={(e) => setSelectedTask(e.target.value)} className="glass-input w-full px-5 py-3.5 rounded-xl text-blue-900 font-bold bg-white shadow-sm border-gray-200"><option value="">-- กรุณาเลือกงาน --</option>{taskOptions.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
        <div className="flex-1 min-w-[150px]"><label className="block text-sm font-bold text-gray-700 mb-2 flex items-center"><Filter size={16} className="mr-1"/> กรองกลุ่มสาระฯ</label><select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)} className="glass-input w-full px-4 py-3.5 rounded-xl font-bold bg-white/80 border-gray-200"><option value="">ทุกกลุ่มสาระฯ</option>{appSettings.departments.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
        <div className="flex-1 min-w-[150px]"><label className="block text-sm font-bold text-gray-700 mb-2 flex items-center"><Filter size={16} className="mr-1"/> กรองระดับชั้น</label><select value={selectedGrade} onChange={(e) => setSelectedGrade(e.target.value)} className="glass-input w-full px-4 py-3.5 rounded-xl font-bold bg-white/80 border-gray-200"><option value="">ทุกระดับชั้น</option>{GRADES.map(g => <option key={g} value={g}>{g}</option>)}</select></div>
        {selectedTask && <div className="flex gap-3 w-full lg:w-auto mt-2 lg:mt-0"><button onClick={() => checkAll(true)} disabled={isProcessing} className="flex-1 lg:flex-none bg-green-500 hover:bg-green-600 text-white px-5 py-3.5 rounded-xl font-bold shadow-md transition-all flex items-center justify-center disabled:opacity-70"><CheckCircle size={18} className="mr-2"/> บันทึกทั้งหมด</button><button onClick={() => checkAll(false)} disabled={isProcessing} className="flex-1 lg:flex-none bg-white hover:bg-red-50 text-red-600 border border-red-200 px-5 py-3.5 rounded-xl font-bold shadow-sm transition-all flex items-center justify-center disabled:opacity-70"><X size={18} className="mr-2"/> ยกเลิกทั้งหมด</button></div>}
      </div>

      {!selectedTask ? ( 
        <div className="glass-panel p-20 text-center text-blue-800/40 rounded-3xl bg-white/30 border border-white"><CheckSquare size={80} className="mx-auto mb-6 opacity-40" /><h3 className="text-2xl font-bold">เลือกภาระงานเพื่อเริ่มบันทึกการส่ง</h3></div> 
      ) : (
        <div className="glass-panel rounded-3xl overflow-hidden shadow-lg border border-white">
          <div className="bg-gradient-to-r from-[#00529B] to-blue-800 text-white p-5 flex flex-col md:flex-row justify-between items-start md:items-center font-bold gap-3">
            <span className="text-lg">รายชื่อครู ({filteredTeachers.length} คน)</span>
            <span className="text-sm bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full border border-white/30 flex items-center"><FileText size={16} className="mr-2"/> งาน: {TASK_LIST.find(t=>t.id===selectedTask)?.name}</span>
          </div>
          <div className="overflow-x-auto bg-white/60">
            <table className="w-full text-left border-collapse">
              <thead><tr className="bg-blue-50/90 text-blue-900 border-b-2 border-blue-100"><th className="p-4 w-16 text-center font-bold">ลำดับ</th><th className="p-4 font-bold">ชื่อ - นามสกุล</th><th className="p-4 font-bold">กลุ่ม/ที่ปรึกษา</th><th className="p-4 text-center w-40 font-bold">สถานะการส่ง</th></tr></thead>
              <tbody>
                {filteredTeachers.map((teacher, index) => {
                  const isSent = tasksData[teacher.uid]?.[selectedTask]?.status || false;
                  return (
                    <tr key={teacher.uid} className={`border-b border-gray-100 transition-colors ${isSent ? 'bg-green-50/40' : 'hover:bg-white/80'}`}>
                      <td className="p-4 text-center text-gray-500 font-bold">{index + 1}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="silver-frame w-14 h-16 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                            {teacher.photoUrl ? <img src={teacher.photoUrl} className="w-full h-full object-cover rounded-sm" /> : <User className="w-full h-full p-2 text-gray-400" />}
                          </div>
                          <div>
                            <div className="font-bold text-gray-800 text-base">{teacher.title}{teacher.firstName} {teacher.lastName}</div>
                            <div className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded inline-block mt-1 border border-blue-100">{teacher.position}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                         <div className="text-gray-600 font-medium text-sm">{teacher.department || '-'}</div>
                         {teacher.advisorGrade && <div className="text-xs text-gray-500 font-bold mt-1">อ.ที่ปรึกษา: {teacher.advisorGrade}/{teacher.advisorRoom||'-'}</div>}
                      </td>
                      <td className="p-4 text-center">
                        <label className="relative inline-flex items-center cursor-pointer no-print group">
                          <input type="checkbox" className="sr-only peer" checked={isSent} onChange={() => handleCheck(teacher.uid, selectedTask, isSent)} />
                          <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-500 shadow-sm group-hover:shadow-md"></div>
                        </label>
                        <div className="hidden print:block font-bold">{isSent ? <span className="text-green-600 flex items-center justify-center"><CheckCircle size={16} className="mr-1"/> ส่งแล้ว</span> : <span className="text-red-500 flex items-center justify-center"><X size={16} className="mr-1"/> ยังไม่ส่ง</span>}</div>
                      </td>
                    </tr>
                  )
                })}
                {filteredTeachers.length === 0 && <tr><td colSpan="4" className="p-10 text-center text-gray-500 font-medium">ไม่พบข้อมูล</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminPanel({ profile, showToast, appSettings, closeToast }) {
  const [users, setUsers] = useState([]);
  const [activeAdminTab, setActiveAdminTab] = useState('users'); 
  const [editingUser, setEditingUser] = useState(null);
  
  const [editFormData, setEditFormData] = useState(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isManualAddMode, setIsManualAddMode] = useState(false);

  const [importText, setImportText] = useState('');
  const [importResult, setImportResult] = useState(null);
  const [settingsForm, setSettingsForm] = useState({ paYear: appSettings.paYear, newDept: '' });

  useEffect(() => {
    if (!profile?.roles?.admin) return;
    const unsub = onSnapshot(query(getColl('users')), (snapshot) => {
      const u = []; snapshot.forEach(doc => u.push(doc.data())); setUsers(u);
    });
    return () => unsub();
  }, [profile]);

  const handleRoleChange = async (uid, roleKey, value) => {
    try { 
      await setDoc(getDocRef('users', uid), { roles: { [roleKey]: value } }, { merge: true }); 
      showToast(`อัปเดตสิทธิ์สำเร็จแล้ว`, 'success'); 
    } catch (err) { showToast(err.message, 'error'); }
  };

  const handleSupervisorTaskChange = async (uid, taskId, isChecked) => {
    try {
      const user = users.find(u => u.uid === uid);
      let tasks = user.supervisorTasks || [];
      if (isChecked) tasks.push(taskId); else tasks = tasks.filter(id => id !== taskId);
      await setDoc(getDocRef('users', uid), { supervisorTasks: tasks }, { merge: true });
      showToast(`อัปเดตภาระงานสำเร็จแล้ว`, 'success');
    } catch (err) { showToast(err.message, 'error'); }
  };

  const openEditModal = (user) => {
    setIsManualAddMode(false);
    setEditFormData({ 
      uid: user.uid, email: user.email, title: user.title || '', firstName: user.firstName || '', lastName: user.lastName || '',
      standing: user.standing || 'ครู (ไม่มีวิทยฐานะ/คศ.1)', department: user.department || '', advisorGrade: user.advisorGrade || '', advisorRoom: user.advisorRoom || '', photoUrl: user.photoUrl || '',
      supervisorTitle: user.supervisorTitle || '', roles: user.roles
    });
  };

  const openAddUserModal = () => {
    setIsManualAddMode(true);
    setEditFormData({ 
      uid: `pre_${Date.now()}`, email: '', password: '', title: '', firstName: '', lastName: '',
      standing: 'ครู (ไม่มีวิทยฐานะ/คศ.1)', department: '', advisorGrade: '', advisorRoom: '', photoUrl: '', supervisorTitle: ''
    });
  };

  const saveEditUser = async () => {
    showToast('กำลังบันทึกข้อมูล...', 'loading');
    try {
      if (isManualAddMode) {
        if (!editFormData.email || !editFormData.email.includes('@')) { showToast('กรุณาระบุ Email ให้ถูกต้อง', 'error'); return; }
        if (!editFormData.password || editFormData.password.length < 6) { showToast('รหัสผ่านเริ่มต้นต้องมีอย่างน้อย 6 ตัวอักษร', 'error'); return; }
        await setDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'pre_users', editFormData.uid), { ...editFormData, email: editFormData.email.toLowerCase() });
        showToast('เพิ่มผู้ใช้งานใหม่ลงในระบบสำเร็จแล้ว', 'success');
      } else {
        await setDoc(getDocRef('users', editFormData.uid), editFormData, { merge: true });
        showToast('บันทึกข้อมูลส่วนตัวสำเร็จแล้ว', 'success');
      }
      setEditFormData(null);
    } catch (err) { 
      showToast(err.message, 'error'); 
    } finally {
      if (editFormData === null) closeToast(); 
    }
  };

  const handleAdminImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploadingPhoto(true);
    showToast('กำลังประมวลผลรูปภาพ...', 'loading');
    try {
      const base64Image = await compressImageToBase64(file, 400); 
      setEditFormData(prev => ({ ...prev, photoUrl: base64Image }));
      showToast('อัปโหลดรูปภาพสำเร็จ (กรุณากดบันทึก)', 'success');
    } catch (err) { showToast(err.message, 'error'); } 
    finally { setIsUploadingPhoto(false); }
  };

  const processImport = async () => {
    if (!importText.trim()) { showToast('กรุณาวางข้อมูลก่อน', 'error'); return; }
    showToast('กำลังนำเข้าข้อมูล...', 'loading');
    const rows = importText.split('\n').filter(r => r.trim() !== '');
    let successCount = 0, failCount = 0, errors = [];

    for (let i = 0; i < rows.length; i++) {
      const separator = rows[i].includes('\t') ? '\t' : ',';
      const cols = rows[i].split(separator).map(c => c.trim().replace(/^"|"$/g, '')); 
      if (cols.length < 6) continue; 
      
      const [email, password, title, firstName, lastName, standing, department, advisorGrade, advisorRoom] = cols;
      const targetUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());

      if (targetUser) {
        try {
          await setDoc(getDocRef('users', targetUser.uid), { 
            title: title || targetUser.title || '', 
            firstName: firstName || targetUser.firstName || '', 
            lastName: lastName || targetUser.lastName || '', 
            standing: standing || targetUser.standing || '', 
            department: department || targetUser.department || '',
            advisorGrade: advisorGrade || targetUser.advisorGrade || '',
            advisorRoom: advisorRoom || targetUser.advisorRoom || ''
          }, { merge: true });
          successCount++;
        } catch (err) { failCount++; errors.push(`${email}: ${err.message}`); }
      } else {
        if(!password) { failCount++; errors.push(`${email}: ไม่ได้กำหนดรหัสผ่านตั้งต้น`); continue; }
        try {
          await setDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'pre_users', `pre_${Date.now()}_${i}`), { 
            email: email.toLowerCase(), password, title: title || '', firstName: firstName || '', lastName: lastName || '', 
            standing: standing || 'ครู (ไม่มีวิทยฐานะ/คศ.1)', department: department || '',
            advisorGrade: advisorGrade || '', advisorRoom: advisorRoom || ''
          });
          successCount++;
        } catch(err) { failCount++; errors.push(`${email}: บันทึกรอล็อกอินล้มเหลว`); }
      }
    }
    setImportResult({ success: successCount, fail: failCount, errors });
    if (successCount > 0) showToast(`นำเข้า/สร้างรอ สำเร็จ ${successCount} รายการ`, 'success');
    else showToast('นำเข้าไม่สำเร็จ โปรดตรวจสอบข้อมูล', 'error');
    setImportText('');
  };

  const saveSettings = async (key, value) => {
    showToast('กำลังบันทึกการตั้งค่า...', 'loading');
    try { await setDoc(getDocRef('settings', 'system'), { [key]: value }, { merge: true }); showToast('บันทึกการตั้งค่าสำเร็จแล้ว', 'success'); } 
    catch (err) { showToast(err.message, 'error'); }
  };

  const addDept = () => {
    if(!settingsForm.newDept.trim()) return;
    const newArr = [...appSettings.departments, settingsForm.newDept.trim()];
    saveSettings('departments', newArr);
    setSettingsForm(p => ({...p, newDept: ''}));
  };

  const removeDept = (dept) => {
    const newArr = appSettings.departments.filter(d => d !== dept);
    saveSettings('departments', newArr);
    showToast(`ลบกลุ่มสาระฯ "${dept}" สำเร็จแล้ว`, 'success');
  };

  if (!profile?.roles?.admin) return null;

  return (
    <div className="space-y-6 animate-fade-in-up relative">
      <div className="flex flex-wrap gap-3 mb-6 bg-white/50 p-3 rounded-2xl border border-white">
        <button onClick={() => setActiveAdminTab('users')} className={`px-5 py-3 rounded-xl font-bold shadow-sm transition-all flex items-center ${activeAdminTab === 'users' ? 'bg-[#00529B] text-white shadow-md' : 'bg-white/60 text-gray-700 hover:bg-white'}`}>
          <Users size={18} className="mr-2" /> จัดการผู้ใช้งาน
        </button>
        <button onClick={() => setActiveAdminTab('import')} className={`px-5 py-3 rounded-xl font-bold shadow-sm transition-all flex items-center ${activeAdminTab === 'import' ? 'bg-[#00529B] text-white shadow-md' : 'bg-white/60 text-gray-700 hover:bg-white'}`}>
          <ClipboardList size={18} className="mr-2" /> นำเข้า (Excel)
        </button>
        <button onClick={() => setActiveAdminTab('settings')} className={`px-5 py-3 rounded-xl font-bold shadow-sm transition-all flex items-center ${activeAdminTab === 'settings' ? 'bg-[#00529B] text-white shadow-md' : 'bg-white/60 text-gray-700 hover:bg-white'}`}>
          <Settings2 size={18} className="mr-2" /> ตั้งค่าระบบ
        </button>
      </div>

      {activeAdminTab === 'users' && (
        <div className="glass-panel rounded-3xl overflow-hidden shadow-lg border border-white">
          <div className="bg-white/60 p-4 border-b border-white flex justify-between items-center">
             <h3 className="font-bold text-blue-900 text-lg flex items-center"><Users className="mr-2" size={20}/> รายชื่อครูในระบบ ({users.length} คน)</h3>
             <button onClick={openAddUserModal} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md transition-colors flex items-center"><UserPlus size={16} className="mr-1.5"/> เพิ่มผู้ใช้งานใหม่</button>
          </div>
          <div className="overflow-x-auto bg-white/60">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-gray-800 to-gray-700 text-white shadow-sm">
                  <th className="p-5 w-12 text-center font-bold">#</th><th className="p-5 font-bold">บัญชีผู้ใช้ / ข้อมูล</th>
                  <th className="p-5 text-center font-bold">จัดการข้อมูลส่วนตัว</th><th className="p-5 text-center font-bold">สิทธิ์การใช้งาน (Roles)</th><th className="p-5 text-center font-bold">แผงหัวหน้างาน</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <React.Fragment key={u.uid}>
                    <tr className="border-b border-gray-200/50 hover:bg-white/80 transition-colors bg-white/30">
                      <td className="p-5 text-center text-gray-500 font-bold">{i + 1}</td>
                      <td className="p-5">
                        <div className="flex items-center gap-4">
                           <div className="silver-frame w-14 h-16 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                             {u.photoUrl ? <img src={u.photoUrl} className="w-full h-full object-cover rounded-sm" /> : <User className="w-full h-full p-2 text-gray-400" />}
                           </div>
                           <div>
                              <div className="font-bold text-blue-900 text-base">{u.email}</div>
                              <div className="text-sm font-medium mt-1 flex flex-col gap-1">
                                {u.firstName ? <span className="text-gray-800">{u.title}{u.firstName} {u.lastName}</span> : <span className="text-red-500 bg-red-50 px-2 py-0.5 rounded text-xs inline-block w-max">ยังไม่กรอกข้อมูล</span>}
                                {u.roles?.supervisor && u.supervisorTitle && <span className="text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-100 w-max">{u.supervisorTitle}</span>}
                              </div>
                           </div>
                        </div>
                      </td>
                      <td className="p-5 text-center">
                        <button onClick={() => openEditModal(u)} className="bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 px-4 py-2 rounded-xl text-sm font-bold shadow-sm flex items-center justify-center mx-auto transition-colors">
                          <Edit size={16} className="mr-1.5"/> แก้ไขข้อมูล
                        </button>
                      </td>
                      <td className="p-5">
                        <div className="flex flex-col gap-2 items-start pl-4">
                          <label className="flex items-center text-sm cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm w-full"><input type="checkbox" checked={u.roles?.teacher || false} onChange={(e)=>handleRoleChange(u.uid, 'teacher', e.target.checked)} className="mr-3 w-4 h-4 rounded text-blue-600 focus:ring-blue-500" /> <span className="font-bold text-gray-700">Teacher</span></label>
                          <label className="flex items-center text-sm cursor-pointer bg-green-50 px-3 py-1.5 rounded-lg border border-green-100 shadow-sm w-full"><input type="checkbox" checked={u.roles?.supervisor || false} onChange={(e)=>handleRoleChange(u.uid, 'supervisor', e.target.checked)} className="mr-3 w-4 h-4 rounded text-green-600 focus:ring-green-500" /> <span className="font-bold text-green-700">Supervisor</span></label>
                          <label className="flex items-center text-sm cursor-pointer bg-red-50 px-3 py-1.5 rounded-lg border border-red-100 shadow-sm w-full"><input type="checkbox" checked={u.roles?.admin || false} onChange={(e)=>handleRoleChange(u.uid, 'admin', e.target.checked)} className="mr-3 w-4 h-4 rounded text-red-600 focus:ring-red-500" /> <span className="font-bold text-red-700">Admin</span></label>
                        </div>
                      </td>
                      <td className="p-5 text-center">
                        {u.roles?.supervisor ? (
                          <button onClick={() => setEditingUser(editingUser === u.uid ? null : u.uid)} className={`px-5 py-2 rounded-xl text-sm font-bold shadow-sm transition-all border ${editingUser === u.uid ? 'bg-gray-800 text-white border-gray-800' : 'bg-green-100 text-green-800 hover:bg-green-200 border-green-200'}`}>
                            {editingUser === u.uid ? 'ปิดแผงตั้งค่า' : 'ตั้งค่างานรับผิดชอบ'}
                          </button>
                        ) : <span className="text-gray-400 text-sm font-medium bg-gray-100 px-3 py-1 rounded-lg border border-gray-200">ไม่มีสิทธิ์</span>}
                      </td>
                    </tr>
                    
                    {editingUser === u.uid && u.roles?.supervisor && (
                      <tr className="bg-gradient-to-r from-green-50/80 to-blue-50/80">
                        <td colSpan="5" className="p-8 border-b-2 border-green-200 shadow-inner">
                          <div className="font-bold text-blue-900 mb-4 text-lg flex items-center"><CheckSquare className="mr-2 text-green-600"/> เลือกภาระงานที่มอบหมายให้ <span className="text-green-700 mx-2">{u.firstName || u.email}</span> เป็นหัวหน้าบันทึกการส่ง:</div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 bg-white/70 p-5 rounded-2xl border border-white shadow-sm">
                            {TASK_LIST.map(task => (
                              <label key={task.id} className="flex items-start text-sm p-3 hover:bg-white rounded-xl border border-transparent hover:border-blue-100 cursor-pointer transition-all shadow-sm">
                                <input type="checkbox" checked={(u.supervisorTasks || []).includes(task.id)} onChange={(e) => handleSupervisorTaskChange(u.uid, task.id, e.target.checked)} className="mr-3 mt-0.5 w-4 h-4 text-green-600 rounded focus:ring-green-500" />
                                <span className="text-gray-800 font-medium leading-tight">{task.name}</span>
                              </label>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeAdminTab === 'settings' && (
        <div className="glass-panel p-8 md:p-10 rounded-3xl bg-white/60 border border-white shadow-lg max-w-4xl mx-auto space-y-8">
          <h2 className="text-2xl font-bold text-blue-900 flex items-center border-b border-gray-200 pb-4"><Settings2 className="mr-3 text-blue-600" size={28} /> ตั้งค่าระบบ (System Settings)</h2>
          
          <div className="bg-white/80 p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
             <div>
               <h3 className="font-bold text-lg text-gray-800 mb-1">ปีงบประมาณวงรอบ PA ปัจจุบัน (ปีการศึกษา)</h3>
               <p className="text-sm text-gray-500">ระบบจะนำปีนี้ไปคำนวณชื่อภาคเรียนในส่วนที่ 1 อัตโนมัติ</p>
             </div>
             <div className="flex gap-2 w-full md:w-auto">
               <input type="number" value={settingsForm.paYear} onChange={e=>setSettingsForm({...settingsForm, paYear: Number(e.target.value)})} className="glass-input px-4 py-2 rounded-xl font-bold w-32 text-center bg-white border-gray-300 shadow-sm" />
               <button onClick={()=>saveSettings('paYear', settingsForm.paYear)} className="bg-blue-600 text-white px-5 py-2 rounded-xl font-bold shadow-sm hover:bg-blue-700">บันทึก</button>
             </div>
          </div>

          <div className="bg-white/80 p-6 rounded-2xl border border-gray-100 shadow-sm">
             <h3 className="font-bold text-lg text-gray-800 mb-4">จัดการ กลุ่มสาระการเรียนรู้ / กลุ่มงาน</h3>
             <div className="flex flex-wrap gap-3 mb-6">
               {appSettings.departments.map(dept => (
                 <div key={dept} className="flex items-center bg-gray-50 border border-gray-200 px-4 py-2.5 rounded-xl shadow-sm group hover:border-red-200 transition-colors">
                   <span className="font-bold text-gray-700 mr-3">{dept}</span>
                   <button onClick={()=>removeDept(dept)} className="text-red-400 hover:text-red-600 p-1 bg-red-50 rounded-lg transition-colors"><Trash2 size={16}/></button>
                 </div>
               ))}
             </div>
             <div className="flex gap-3 max-w-md">
               <input type="text" value={settingsForm.newDept} onChange={e=>setSettingsForm({...settingsForm, newDept: e.target.value})} placeholder="เพิ่มชื่อกลุ่มสาระฯ ใหม่..." className="glass-input flex-1 px-4 py-3 rounded-xl bg-white border-gray-300 shadow-sm font-bold" />
               <button onClick={addDept} className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold shadow-sm hover:bg-green-700 flex items-center"><Plus size={18} className="mr-1"/> เพิ่ม</button>
             </div>
          </div>
        </div>
      )}

      {/* Bulk Import Tab */}
      {activeAdminTab === 'import' && (
        <div className="glass-panel p-8 md:p-10 rounded-3xl bg-white/60 border border-white shadow-lg max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-blue-900 mb-6 flex items-center"><ClipboardList className="mr-3 text-[#ED1C24]" size={28} />นำเข้าข้อมูลส่วนตัวครูจาก Excel</h2>
          
          <div className="bg-blue-50/80 p-6 rounded-2xl border border-blue-100 mb-6 shadow-sm">
            <h3 className="font-bold text-blue-900 mb-3 text-lg">วิธีใช้งาน:</h3>
            <ol className="list-decimal list-inside text-base text-gray-700 space-y-2 font-medium">
              <li>เปิดไฟล์ Excel ของคุณ</li>
              <li>จัดเรียงคอลัมน์ตามลำดับ 9 คอลัมน์ดังนี้: <br/><strong className="text-blue-800 bg-white px-2 py-0.5 rounded border border-blue-100 mt-2 inline-block">Email | รหัสผ่าน | คำนำหน้า | ชื่อ | นามสกุล | วิทยฐานะ | กลุ่มสาระฯ | ครูที่ปรึกษา(ชั้น) | ห้อง</strong></li>
              <li>วาง (Paste) ข้อมูลลงในกล่องด้านล่างแล้วกด "เริ่มนำเข้าข้อมูล"</li>
              <li className="text-[#ED1C24] pt-2 mt-2 border-t border-blue-100/50">หมายเหตุ: รหัสผ่าน จะใช้ได้เฉพาะคนที่ไม่เคย Login เข้าสู่ระบบมาก่อนเท่านั้น (สร้างบัญชีรอไว้)</li>
            </ol>
          </div>

          <textarea 
            value={importText} onChange={(e) => setImportText(e.target.value)} 
            className="w-full h-64 glass-input p-5 rounded-2xl font-mono text-sm resize-y bg-white/80 focus:bg-white transition-colors mb-6 shadow-inner border border-gray-200"
            placeholder="test@sriracha.ac.th   1234567890   นาย   สมชาย   ใจดี   ครูชำนาญการ (คศ.2)   วิทยาศาสตร์และเทคโนโลยี   ม.1   1"
          ></textarea>

          <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
             <button onClick={() => setImportText('')} className="px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors font-bold">ล้างข้อมูล</button>
             <button onClick={processImport} className="bg-gradient-to-r from-[#00529B] to-blue-700 text-white px-8 py-3 rounded-xl font-bold shadow-md hover:shadow-lg transition-all flex items-center">
               <Upload size={20} className="mr-2"/> เริ่มนำเข้าข้อมูล
             </button>
          </div>

          {importResult && (
            <div className={`mt-8 p-6 rounded-2xl border shadow-sm ${importResult.fail > 0 ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'}`}>
              <h4 className="font-bold text-xl mb-4 border-b border-gray-200/50 pb-2">สรุปผลการนำเข้า:</h4>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-white p-4 rounded-xl border border-green-100 flex items-center"><CheckCircle className="text-green-500 mr-3" size={24}/><span className="font-bold text-gray-700">สำเร็จ (อัปเดต/สร้างรอ): <span className="text-green-600 text-xl">{importResult.success}</span></span></div>
                <div className="bg-white p-4 rounded-xl border border-red-100 flex items-center"><AlertCircle className="text-red-500 mr-3" size={24}/><span className="font-bold text-gray-700">ล้มเหลว (ข้อมูลผิด): <span className="text-red-600 text-xl">{importResult.fail}</span></span></div>
              </div>
              {importResult.errors.length > 0 && (
                <ul className="mt-4 text-sm text-red-600 max-h-40 overflow-y-auto list-disc list-inside bg-white p-4 rounded-xl border border-red-100 font-medium">
                  {importResult.errors.map((err, i) => <li key={i}>{err}</li>)}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      {/* Edit / Add User Modal Overlay */}
      {editFormData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel w-full max-w-2xl p-0 rounded-3xl overflow-hidden shadow-2xl bg-white/95 border border-white">
            <div className={`p-5 flex justify-between items-center text-white ${isManualAddMode ? 'bg-gradient-to-r from-green-600 to-green-700' : 'bg-gradient-to-r from-[#00529B] to-blue-800'}`}>
              <h3 className="font-bold text-xl flex items-center">{isManualAddMode ? <UserPlus className="mr-2"/> : <Edit className="mr-2"/>} {isManualAddMode ? 'เพิ่มรายชื่อผู้ใช้งานใหม่' : `แก้ไขข้อมูล: ${editFormData.firstName || 'ผู้ใช้งาน'}`}</h3>
              <button onClick={() => setEditFormData(null)} className="hover:bg-white/20 p-1.5 rounded-xl transition-colors"><X size={24} /></button>
            </div>
            
            <div className="p-8 max-h-[80vh] overflow-y-auto custom-scrollbar">
              {isManualAddMode && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-start gap-3 shadow-sm">
                  <Info className="text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-900 leading-relaxed font-medium">การสร้างโปรไฟล์ผ่านระบบนี้ <span className="text-[#ED1C24] font-bold">แอดมินต้องกำหนดรหัสผ่านเบื้องต้น</span> เมื่อครูเข้าสู่ระบบครั้งแรกด้วย Email และรหัสผ่านนี้ ข้อมูลจะเชื่อมโยงกันโดยอัตโนมัติ</div>
                </div>
              )}

              <div className="flex flex-col md:flex-row gap-8 mb-8">
                <div className="flex flex-col items-center">
                  <div className="silver-frame w-32 h-44 rounded-xl overflow-hidden flex flex-col items-center justify-center relative group shadow-sm bg-gray-100">
                     {editFormData.photoUrl ? <img src={editFormData.photoUrl} className="w-full h-full object-cover rounded-lg" /> : <User size={48} className="text-gray-300" />}
                     <label className="absolute inset-0 bg-blue-900/60 backdrop-blur-sm flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity rounded-lg">
                       <Upload className="text-white mb-2" size={28} /> <span className="text-white text-sm font-bold">อัปโหลดรูป</span>
                       <input type="file" accept="image/*" className="hidden" onChange={handleAdminImageUpload} disabled={isUploadingPhoto} />
                     </label>
                  </div>
                  {isUploadingPhoto && <span className="text-sm text-blue-600 mt-3 font-bold flex items-center bg-blue-50 px-3 py-1 rounded-full border border-blue-100"><Loader2 size={14} className="animate-spin mr-2"/> กำลังประมวลผล</span>}
                </div>
                
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div><label className="block text-sm font-bold text-gray-700 mb-2">Email โรงเรียน <span className="text-red-500">*</span></label><input type="email" value={editFormData.email} onChange={(e) => setEditFormData({...editFormData, email: e.target.value})} disabled={!isManualAddMode} className={`w-full p-3.5 rounded-xl border border-gray-300 shadow-sm font-bold ${!isManualAddMode ? 'bg-gray-100 text-gray-500' : 'bg-white'}`} placeholder="example@sriracha.ac.th" /></div>
                  
                  {isManualAddMode ? (
                    <div><label className="block text-sm font-bold text-[#ED1C24] mb-2"><KeyRound size={16} className="inline mr-1"/>ตั้งรหัสผ่านเริ่มต้น <span className="text-red-500">*</span></label><input type="text" value={editFormData.password || ''} onChange={(e) => setEditFormData({...editFormData, password: e.target.value})} className="w-full p-3.5 rounded-xl border border-red-300 bg-red-50 shadow-sm font-bold" placeholder="ตัวเลข/ตัวอักษร 6 ตัวขึ้นไป" /></div>
                  ) : (
                    <div><label className="block text-sm font-bold text-gray-700 mb-2">คำนำหน้า</label><select value={editFormData.title} onChange={(e) => setEditFormData({...editFormData, title: e.target.value})} className="w-full p-3.5 rounded-xl border border-gray-300 bg-white shadow-sm font-bold"><option value="">-- เลือก --</option><option value="นาย">นาย</option><option value="นาง">นาง</option><option value="นางสาว">นางสาว</option><option value="ว่าที่ ร.ต.">ว่าที่ ร.ต.</option></select></div>
                  )}

                  {isManualAddMode && <div><label className="block text-sm font-bold text-gray-700 mb-2">คำนำหน้า</label><select value={editFormData.title} onChange={(e) => setEditFormData({...editFormData, title: e.target.value})} className="w-full p-3.5 rounded-xl border border-gray-300 bg-white shadow-sm font-bold"><option value="">-- เลือก --</option><option value="นาย">นาย</option><option value="นาง">นาง</option><option value="นางสาว">นางสาว</option><option value="ว่าที่ ร.ต.">ว่าที่ ร.ต.</option></select></div>}

                  <div><label className="block text-sm font-bold text-gray-700 mb-2">ชื่อ</label><input type="text" value={editFormData.firstName} onChange={(e) => setEditFormData({...editFormData, firstName: e.target.value})} className="w-full p-3.5 rounded-xl border border-gray-300 bg-white shadow-sm font-bold" /></div>
                  <div><label className="block text-sm font-bold text-gray-700 mb-2">นามสกุล</label><input type="text" value={editFormData.lastName} onChange={(e) => setEditFormData({...editFormData, lastName: e.target.value})} className="w-full p-3.5 rounded-xl border border-gray-300 bg-white shadow-sm font-bold" /></div>
                  <div><label className="block text-sm font-bold text-gray-700 mb-2">วิทยฐานะ</label><select value={editFormData.standing} onChange={(e) => setEditFormData({...editFormData, standing: e.target.value})} className="w-full p-3.5 rounded-xl border border-gray-300 bg-white shadow-sm font-bold">{Object.keys(STANDINGS_DESC).map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                  <div className={`${isManualAddMode ? '' : 'md:col-span-2'}`}><label className="block text-sm font-bold text-gray-700 mb-2">กลุ่มสาระการเรียนรู้/กลุ่มงาน</label><select value={editFormData.department} onChange={(e) => setEditFormData({...editFormData, department: e.target.value})} className="w-full p-3.5 rounded-xl border border-gray-300 bg-white shadow-sm font-bold"><option value="">-- เลือก --</option>{appSettings.departments.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
                  
                  <div className="md:col-span-2 bg-blue-50/80 p-4 rounded-xl border border-blue-200 flex gap-4 shadow-sm mt-2">
                     <div className="flex-1"><label className="block text-xs font-bold text-blue-900 mb-2">ครูที่ปรึกษา (ชั้น)</label><select value={editFormData.advisorGrade} onChange={(e) => setEditFormData({...editFormData, advisorGrade: e.target.value})} className="w-full p-2.5 rounded-lg border border-gray-300 bg-white shadow-sm font-bold"><option value="">-- ไม่เป็นที่ปรึกษา --</option>{GRADES.map(g => <option key={g} value={g}>{g}</option>)}</select></div>
                     <div className="flex-1"><label className="block text-xs font-bold text-blue-900 mb-2">ห้อง</label><select value={editFormData.advisorRoom} onChange={(e) => setEditFormData({...editFormData, advisorRoom: e.target.value})} className="w-full p-2.5 rounded-lg border border-gray-300 bg-white shadow-sm font-bold"><option value="">-- ไม่ระบุ --</option>{ROOMS.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
                  </div>
                </div>
              </div>

              {!isManualAddMode && editFormData.roles?.supervisor && (
                <div className="mb-6 p-5 bg-green-50/50 border border-green-200 rounded-2xl">
                  <h4 className="font-bold text-green-800 flex items-center mb-3"><CheckSquare size={18} className="mr-2"/> ตั้งค่าตำแหน่งหัวหน้างาน (นำไปแสดงในรายงานการส่งงาน)</h4>
                  <div><input type="text" value={editFormData.supervisorTitle} onChange={(e) => setEditFormData({...editFormData, supervisorTitle: e.target.value})} className="w-full p-3.5 rounded-xl border border-green-300 bg-white shadow-sm font-bold" placeholder="เช่น หัวหน้ากลุ่มสาระฯ ภาษาไทย, หัวหน้างานวิชาการ ฯลฯ" /></div>
                </div>
              )}

              <div className="flex justify-end gap-4 mt-6 pt-6 border-t border-gray-200">
                <button onClick={() => setEditFormData(null)} className="px-6 py-3 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">ยกเลิก</button>
                <button onClick={saveEditUser} className={`px-8 py-3 rounded-xl font-bold text-white transition-colors flex items-center shadow-md ${isManualAddMode ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}><Save size={20} className="mr-2"/> บันทึกข้อมูล</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}