import React, { useState, useEffect } from 'react';
import { 
  Users, CheckSquare, FileText, User, Settings, LogOut, 
  Menu, X, Upload, Save, FileSpreadsheet, Briefcase, BarChart, 
  CheckCircle, AlertCircle, Edit, ClipboardList, Loader2, Info, ChevronRight,
  UserPlus, RefreshCw, KeyRound
} from 'lucide-react';

// 🛑 1. ใส่ URL และ Key ของ Supabase ของคุณครูที่นี่ 🛑
const SUPABASE_URL = 'https://sigyovimpryzthfgtyzt.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_UQdwrtJ7S9mQ58FZf-K-Pg_cNYZ7D0-';

const isSupabaseConfigured = SUPABASE_URL.startsWith('http');
let supabase = null;

// --- Constants (กำหนดค่าเริ่มต้นที่ไม่มีในฐานข้อมูล) ---
const TASK_LIST = [
  { id: 't1', name: '1. หลักสูตรกลุ่มสาระฯ' }, { id: 't2', name: '2. รายงานการใช้หลักสูตร' },
  { id: 't3', name: '3. แผนการสอนภาคเรียนที่ 1' }, { id: 't4', name: '4. บันทึกหลังสอนภาคเรียนที่ 1' },
  { id: 't5', name: '5. รายงานการใช้และพัฒนาสื่อฯ ภาคเรียนที่ 1' }, { id: 't6', name: '6. รายงานการนิเทศการสอน ภาคเรียนที่ 1' },
  { id: 't7', name: '7. แผนการสอนภาคเรียนที่ 2' }, { id: 't8', name: '8. บันทึกหลังสอนภาคเรียนที่ 2' },
  { id: 't9', name: '9. รายงานการใช้และพัฒนาสื่อฯ ภาคเรียนที่ 2' }, { id: 't10', name: '10. รายงานการนิเทศการสอน ภาคเรียนที่ 2' },
  { id: 't11', name: '11. วิจัยในชั้นเรียน' }, { id: 't12', name: '12. PLC' },
  { id: 't13', name: '13. รายงานการเยี่ยมบ้านนักเรียน' }, { id: 't14', name: '14. SDQ' },
  { id: 't15', name: '15. Hero OBEC Care' }, { id: 't16', name: '16. ID PLAN' },
  { id: 't17', name: '17. SAR' }, { id: 't18', name: '18. เครือข่ายผู้ปกครองนักเรียน' }
];

const STANDINGS_DESC = {
  'ครูผู้ช่วย': { label: 'ปฏิบัติและเรียนรู้ (Focus and Learn)' },
  'ครู (ไม่มีวิทยฐานะ/คศ.1)': { label: 'ปรับประยุกต์ (Apply and Adapt)' },
  'ครูชำนาญการ (คศ.2)': { label: 'แก้ไขปัญหา (Solve the Problem)' },
  'ครูชำนาญการพิเศษ (คศ.3)': { label: 'ริเริ่มพัฒนา (Initiate and Develop)' },
  'ครูเชี่ยวชาญ (คศ.4)': { label: 'คิดค้นและปรับเปลี่ยน (Invent and Transform)' },
  'ครูเชี่ยวชาญพิเศษ (คศ.5)': { label: 'สร้างการเปลี่ยนแปลง (Create an Impact)' }
};

const DEPARTMENTS = [
  'ภาษาไทย', 'คณิตศาสตร์', 'วิทยาศาสตร์และเทคโนโลยี', 'สังคมศึกษา ศาสนาและวัฒนธรรม',
  'สุขศึกษาและพลศึกษา', 'ศิลปะ', 'การงานอาชีพ', 'ภาษาต่างประเทศ', 'กิจกรรมพัฒนาผู้เรียน'
];

const GRADES = ['ม.1', 'ม.2', 'ม.3', 'ม.4', 'ม.5', 'ม.6'];
const ROOMS = Array.from({length: 15}, (_, i) => (i + 1).toString());

// --- Main App Component ---
export default function App() {
  const [supabaseLoaded, setSupabaseLoaded] = useState(false);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [appSettings, setAppSettings] = useState({ academic_year: '2567' });

  // โหลด CSS และ SweetAlert2
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @import url('https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700;900&display=swap');
      body { font-family: 'Prompt', sans-serif; background-color: #f0f4f8; }
      .glass-panel { background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.6); box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.05); }
      .glass-input { background: rgba(255, 255, 255, 0.8); border: 1px solid rgba(200, 210, 220, 0.8); transition: all 0.2s; }
      .glass-input:focus { background: #ffffff; outline: none; border-color: #00529B; box-shadow: 0 0 0 3px rgba(0, 82, 155, 0.15); }
      .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
      .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,82,155,0.3); border-radius: 10px; }
      @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      .animate-fade-in-up { animation: fadeInUp 0.4s ease-out forwards; }
    `;
    document.head.appendChild(style);

    // ฝัง SweetAlert2 ถ้าไม่มี
    if (!window.Swal) {
      const swalScript = document.createElement('script');
      swalScript.src = "https://cdn.jsdelivr.net/npm/sweetalert2@11";
      document.head.appendChild(swalScript);
    }
  }, []);

  // โหลด Supabase Client
  useEffect(() => {
    const loadSupabase = () => {
      if (window.supabase && isSupabaseConfigured) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        setSupabaseLoaded(true);
      } else {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
        script.onload = () => {
          if (isSupabaseConfigured) supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
          setSupabaseLoaded(true);
        };
        document.head.appendChild(script);
      }
    };
    loadSupabase();
  }, []);

  // ฟังก์ชันแจ้งเตือน
  const showToast = (msg, type = 'success') => {
    if (window.Swal) {
      if (type === 'loading') {
        window.Swal.fire({ title: msg, allowOutsideClick: false, didOpen: () => window.Swal.showLoading() });
      } else {
        window.Swal.fire({ icon: type, title: type==='success'?'สำเร็จ':'แจ้งเตือน', text: msg, timer: 2000, showConfirmButton: type==='error', confirmButtonColor: '#00529B' });
      }
    } else {
      if (type !== 'loading') alert(msg);
    }
  };
  const closeToast = () => { if (window.Swal) window.Swal.close(); };

  // โหลดข้อมูล Profile
  const fetchProfile = async (userId, email) => {
    try {
      const { data: userProfile } = await supabase.from('profiles').select('*').eq('id', userId).single();
      
      if (userProfile) {
        setProfile(userProfile);
      } else {
        // กรณีไม่มีโปรไฟล์ ให้สร้างจำลองไว้ก่อน
        setProfile({ id: userId, email: email, is_teacher: true, is_supervisor: false, is_admin: false });
      }
    } catch (err) {
      console.error(err);
      showToast('ไม่สามารถโหลดข้อมูลส่วนตัวได้', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const { data } = await supabase.from('system_settings').select('*').limit(1).single();
      if (data) setAppSettings(data);
    } catch (err) { console.log('Using default settings'); }
  };

  // จัดการ Session (Login/Logout)
  useEffect(() => {
    if (!supabaseLoaded || !isSupabaseConfigured) return;
    
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      if (currentSession?.user) {
        fetchSettings();
        fetchProfile(currentSession.user.id, currentSession.user.email);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, curSession) => {
      setSession(curSession);
      if (curSession?.user) {
        fetchProfile(curSession.user.id, curSession.user.email);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription?.unsubscribe();
  }, [supabaseLoaded]);

  if (!isSupabaseConfigured) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-['Prompt']">
      <div className="bg-white p-10 rounded-3xl shadow-xl text-center max-w-md border border-red-100">
        <AlertCircle size={64} className="text-red-500 mx-auto mb-4"/>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">ไม่พบฐานข้อมูล</h2>
        <p className="text-gray-600">กรุณาใส่ URL และ KEY ของ Supabase ในไฟล์โค้ด</p>
      </div>
    </div>
  );

  if (!supabaseLoaded || loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white font-['Prompt']">
      <div className="text-center text-[#00529B]"><Loader2 className="animate-spin w-12 h-12 mx-auto mb-4" /><p className="font-bold">กำลังโหลดข้อมูล SRC PA Hub...</p></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-cover bg-center bg-fixed font-['Prompt'] text-gray-800" style={{ backgroundImage: "url('https://img1.pic.in.th/images/BG-web-app.png')" }}>
      {!session ? (
        <Login showToast={showToast} closeToast={closeToast} supabase={supabase} />
      ) : (
        <MainLayout 
          session={session} profile={profile} appSettings={appSettings} 
          showToast={showToast} closeToast={closeToast} supabase={supabase} 
          refreshProfile={() => fetchProfile(session.user.id, session.user.email)} 
        />
      )}
    </div>
  );
}

// --- Login Component ---
function Login({ showToast, closeToast, supabase }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.includes('@sriracha.ac.th')) { showToast('กรุณาใช้อีเมล @sriracha.ac.th', 'error'); return; }
    
    setIsLoading(true);
    showToast('กำลังเข้าสู่ระบบ...', 'loading');
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    
    if (error) showToast('อีเมลหรือรหัสผ่านไม่ถูกต้อง', 'error'); 
    else closeToast();
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-md p-10 rounded-[2.5rem] animate-fade-in-up border border-white/80 shadow-2xl bg-white/70">
        <div className="text-center mb-8">
          <img src="https://img1.pic.in.th/images/-69-1.png" className="h-24 mx-auto mb-4 drop-shadow-md" alt="Logo" />
          <h1 className="text-4xl font-black tracking-tight mb-2"><span className="text-[#ED1C24]">SRC</span> <span className="text-[#00529B]">PA Hub</span></h1>
          <p className="text-gray-600 font-medium text-sm">ระบบบริหารจัดการภาระงานและประเด็นท้าทาย</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-[#002855] mb-2 pl-1">บัญชีผู้ใช้ (อีเมลโรงเรียน)</label>
            <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} className="glass-input w-full px-5 py-4 rounded-2xl font-bold" placeholder="example@sriracha.ac.th" required disabled={isLoading} />
          </div>
          <div>
            <label className="block text-sm font-bold text-[#002855] mb-2 pl-1">รหัสผ่าน</label>
            <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} className="glass-input w-full px-5 py-4 rounded-2xl font-bold" placeholder="••••••••" required disabled={isLoading} />
          </div>
          <button type="submit" disabled={isLoading} className="w-full bg-[#00529B] hover:bg-[#003B73] text-white font-bold py-4 rounded-2xl shadow-lg mt-6 flex justify-center transition-colors">
            {isLoading ? <Loader2 className="animate-spin" size={24} /> : 'เข้าสู่ระบบ'}
          </button>
        </form>
      </div>
    </div>
  );
}

// --- Main Layout Component ---
function MainLayout({ profile, appSettings, showToast, closeToast, supabase, refreshProfile }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    showToast('กำลังออกจากระบบ...', 'loading');
    await supabase.auth.signOut();
    closeToast();
  };

  const navItems = [
    { id: 'dashboard', label: 'หน้าหลัก', icon: BarChart, show: true },
    { id: 'part1', label: 'ส่วนที่ 1: ภาระงาน', icon: FileText, show: profile?.is_teacher },
    { id: 'part2', label: 'ส่วนที่ 2: ประเด็นท้าทาย', icon: Briefcase, show: profile?.is_teacher },
    { id: 'supervisor', label: 'บันทึกการส่งงาน', icon: CheckSquare, show: profile?.is_supervisor },
    { id: 'admin', label: 'ผู้ดูแลระบบ', icon: Settings, show: profile?.is_admin },
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <div className={`fixed lg:relative z-50 w-72 h-full glass-panel transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} bg-white/80 border-r border-white/50 flex flex-col`}>
        <div className="p-6 flex items-center justify-between lg:justify-start">
           <div className="flex items-center gap-3"><img src="https://img1.pic.in.th/images/-69-1.png" className="h-10"/><span className="font-black text-2xl"><span className="text-[#ED1C24]">SRC</span> <span className="text-[#00529B]">PA Hub</span></span></div>
           <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-500"><X size={24}/></button>
        </div>
        
        <div className="px-6 py-5 flex flex-col items-center text-center border-b border-gray-200/50">
           <div className="w-24 h-32 mb-3 bg-gray-100 rounded-2xl overflow-hidden shadow-inner border-2 border-white flex-shrink-0">
              {profile?.photo_url ? <img src={profile.photo_url} className="w-full h-full object-cover"/> : <User size={40} className="w-full h-full p-4 text-gray-300"/>}
           </div>
           <div className="font-bold text-[#003B73] truncate w-full text-lg">{profile?.title}{profile?.first_name} {profile?.last_name || 'ผู้ใช้งาน'}</div>
           <div className="mt-2 font-bold text-xs bg-blue-50 text-[#00529B] px-3 py-1 rounded-lg border border-blue-100">{profile?.standing ? profile.standing.split(' (')[0] : 'ครู'}</div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
          {navItems.filter(i=>i.show).map(i => (
            <button key={i.id} onClick={()=>{setActiveTab(i.id); setSidebarOpen(false);}} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold transition-all ${activeTab === i.id ? 'bg-[#00529B] text-white shadow-md' : 'text-gray-600 hover:bg-blue-50 hover:text-[#00529B]'}`}><i.icon size={20}/>{i.label}</button>
          ))}
        </nav>
        <div className="p-5"><button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-3.5 text-[#ED1C24] bg-white hover:bg-red-50 rounded-2xl font-bold shadow-sm border border-red-100"><LogOut size={18}/> ออกจากระบบ</button></div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="lg:hidden p-4 bg-white/80 border-b flex items-center justify-between z-40">
          <button onClick={()=>setSidebarOpen(true)} className="p-2 text-[#00529B]"><Menu size={24}/></button>
          <span className="font-black text-xl"><span className="text-[#ED1C24]">SRC</span> <span className="text-[#00529B]">PA Hub</span></span>
          <div className="w-10"></div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          <div className="max-w-6xl mx-auto pb-16 animate-fade-in-up">
            {activeTab === 'dashboard' && <Dashboard profile={profile} supabase={supabase} />}
            {activeTab === 'part1' && <TeacherPart1 profile={profile} appSettings={appSettings} showToast={showToast} supabase={supabase} refreshProfile={refreshProfile} />}
            {activeTab === 'part2' && <TeacherPart2 profile={profile} showToast={showToast} supabase={supabase} />}
            {activeTab === 'supervisor' && <SupervisorPanel profile={profile} showToast={showToast} supabase={supabase} />}
            {activeTab === 'admin' && <AdminPanel profile={profile} showToast={showToast} supabase={supabase} />}
          </div>
        </main>
      </div>
    </div>
  );
}

// --- Dashboard ---
function Dashboard({ profile, supabase }) {
  const [stats, setStats] = useState({ completed: 0, percent: 0 });
  const [tasksStatus, setTasksStatus] = useState([]);

  useEffect(() => {
    if (!profile?.id) return;
    const fetchStats = async () => {
      const { data } = await supabase.from('tasks').select('*').eq('teacher_id', profile.id).eq('status', true);
      if (data) {
        setTasksStatus(data);
        setStats({ completed: data.length, percent: Math.round((data.length/18)*100) });
      }
    };
    fetchStats();
  }, [profile?.id]);

  return (
    <div className="space-y-6">
      <div className="glass-panel p-8 md:p-10 rounded-[2.5rem] bg-white/70 border border-white flex flex-col md:flex-row items-center gap-8 shadow-sm">
        <div className="w-32 h-44 rounded-2xl bg-gray-100 border-4 border-white shadow-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
           {profile?.photo_url ? <img src={profile.photo_url} className="w-full h-full object-cover"/> : <User size={48} className="w-full h-full p-4 text-gray-300"/>}
        </div>
        <div className="flex-1 text-center md:text-left w-full">
           <h2 className="text-3xl font-black text-[#002855] mb-3">{profile?.title}{profile?.first_name} {profile?.last_name || 'ยินดีต้อนรับ'}</h2>
           <div className="flex flex-wrap justify-center md:justify-start gap-3 mb-6">
             <span className="bg-white px-4 py-2 rounded-xl font-bold text-sm text-gray-700 shadow-sm border border-gray-100">{profile?.standing || 'ครู'}</span>
             <span className="bg-blue-50 px-4 py-2 rounded-xl font-bold text-sm text-[#00529B] border border-blue-100">{profile?.department || 'ยังไม่ระบุกลุ่มสาระฯ'}</span>
           </div>
           <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
             <div className="flex justify-between font-bold text-sm mb-3">
               <span className="text-gray-600">ความคืบหน้าการประเมิน (18 รายการ)</span>
               <span className="text-[#00529B] bg-blue-50 px-2 py-0.5 rounded-lg">{stats.percent}% ({stats.completed}/18)</span>
             </div>
             <div className="w-full bg-gray-100 h-4 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-[#ED1C24] to-[#00529B] transition-all duration-1000" style={{width: `${stats.percent}%`}}></div></div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel p-6 rounded-[2rem] bg-white/70 h-96 flex flex-col">
           <h3 className="font-bold text-[#003B73] mb-4 pb-3 border-b flex items-center"><span className="bg-green-100 p-1.5 rounded-lg mr-2"><CheckSquare size={16} className="text-green-600"/></span> งานที่ผ่านการรับรอง</h3>
           <div className="overflow-y-auto flex-1 space-y-2 custom-scrollbar pr-2">
             {TASK_LIST.filter(t => tasksStatus.some(s => s.task_id === t.id)).map(t => <div key={t.id} className="p-3 bg-white rounded-xl text-sm font-bold border border-gray-100 flex items-center"><CheckCircle size={16} className="text-green-500 mr-2"/>{t.name}</div>)}
           </div>
        </div>
        <div className="glass-panel p-6 rounded-[2rem] bg-white/70 h-96 flex flex-col">
           <h3 className="font-bold text-[#003B73] mb-4 pb-3 border-b flex items-center"><span className="bg-red-100 p-1.5 rounded-lg mr-2"><AlertCircle size={16} className="text-red-500"/></span> งานที่รอการรับรอง</h3>
           <div className="overflow-y-auto flex-1 space-y-2 custom-scrollbar pr-2">
             {TASK_LIST.filter(t => !tasksStatus.some(s => s.task_id === t.id)).map(t => <div key={t.id} className="p-3 bg-red-50/50 rounded-xl text-sm font-bold border border-red-100/50 text-gray-700 flex items-center"><div className="w-2 h-2 rounded-full bg-red-400 mr-3"/>{t.name}</div>)}
           </div>
        </div>
      </div>
    </div>
  );
}

// --- Teacher Part 1 ---
function TeacherPart1({ profile, appSettings, showToast, supabase, refreshProfile }) {
  const [formData, setFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => { 
    if (profile) setFormData({
      title: profile.title || '', first_name: profile.first_name || '', last_name: profile.last_name || '',
      salary: profile.salary || '', license_number: profile.license_number || '', license_issue: profile.license_issue || '', license_expire: profile.license_expire || '',
      classes: profile.classes || [], subjects: profile.subjects || '',
      hours1: profile.hours1 || { teaching: '', support: '', dev: '', policy: '' }, hours2: profile.hours2 || { teaching: '', support: '', dev: '', policy: '' }
    });
  }, [profile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({ ...prev, [parent]: { ...(prev[parent] || {}), [child]: value } }));
    } else { setFormData(prev => ({ ...prev, [name]: value })); }
  };

  const handleCheckbox = (e) => {
    const { value, checked } = e.target;
    setFormData(prev => ({ ...prev, classes: checked ? [...(prev.classes||[]), value] : (prev.classes||[]).filter(c => c !== value) }));
  };

  const save = async () => {
    setIsSaving(true);
    showToast('กำลังบันทึก...', 'loading');
    
    // 🚨 ส่งเฉพาะข้อมูลที่มีใน Table profiles จริงๆ ห้ามส่ง password
    const payload = {
      title: formData.title, first_name: formData.first_name, last_name: formData.last_name,
      salary: formData.salary, license_number: formData.license_number, license_issue: formData.license_issue, license_expire: formData.license_expire,
      classes: formData.classes, subjects: formData.subjects, hours1: formData.hours1, hours2: formData.hours2
    };

    const { error } = await supabase.from('profiles').update(payload).eq('id', profile.id);
    if (error) showToast(error.message, 'error'); 
    else { showToast('บันทึกข้อมูลสำเร็จ', 'success'); refreshProfile(); }
    setIsSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 bg-white/80 p-5 md:px-8 rounded-[2rem] border border-white shadow-sm">
        <h2 className="text-2xl font-black text-[#002855] flex items-center"><FileText className="mr-3 text-[#ED1C24]"/> ข้อมูลส่วนบุคคลและภาระงาน</h2>
        <button onClick={save} disabled={isSaving} className="bg-[#00529B] text-white px-8 py-3 rounded-2xl font-bold shadow-md hover:shadow-lg transition-all flex justify-center items-center gap-2 w-full md:w-auto">
          {isSaving ? <Loader2 className="animate-spin" size={20}/> : <Save size={20}/>} บันทึกข้อมูล
        </button>
      </div>

      <div className="glass-panel p-6 md:p-8 rounded-[2.5rem] bg-white/70 shadow-sm space-y-6 border border-white">
        <h3 className="font-bold text-lg text-[#00529B] border-b pb-3 flex items-center"><User className="mr-2"/> ข้อมูลบุคคล</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
           <div><label className="block text-sm font-bold mb-1.5 pl-1">คำนำหน้า</label><input type="text" name="title" value={formData.title||''} onChange={handleChange} className="glass-input w-full p-4 rounded-xl font-bold" /></div>
           <div><label className="block text-sm font-bold mb-1.5 pl-1">ชื่อ</label><input type="text" name="first_name" value={formData.first_name||''} onChange={handleChange} className="glass-input w-full p-4 rounded-xl font-bold" /></div>
           <div><label className="block text-sm font-bold mb-1.5 pl-1">นามสกุล</label><input type="text" name="last_name" value={formData.last_name||''} onChange={handleChange} className="glass-input w-full p-4 rounded-xl font-bold" /></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 bg-blue-50/50 p-6 rounded-3xl border border-blue-50">
           <div><label className="block text-sm font-bold mb-1.5 pl-1">เงินเดือน (บาท)</label><input type="number" name="salary" value={formData.salary||''} onChange={handleChange} className="w-full p-4 rounded-xl font-bold border border-gray-200" /></div>
           <div className="lg:col-span-2"><label className="block text-sm font-bold mb-1.5 pl-1">เลขใบประกอบวิชาชีพ</label><input type="text" name="license_number" maxLength="14" value={formData.license_number||''} onChange={handleChange} className="w-full p-4 rounded-xl font-bold border border-gray-200 font-mono tracking-widest" /></div>
           <div><label className="block text-sm font-bold mb-1.5 pl-1">วันหมดอายุ</label><input type="date" name="license_expire" value={formData.license_expire||''} onChange={handleChange} className="w-full p-4 rounded-xl font-bold border border-gray-200" /></div>
        </div>
      </div>

      <div className="glass-panel p-6 md:p-8 rounded-[2.5rem] bg-white/70 shadow-sm space-y-6 border border-white">
        <h3 className="font-bold text-lg text-[#00529B] border-b pb-3 flex items-center"><Briefcase className="mr-2"/> ข้อมูลหน้าที่สอน</h3>
        <div>
           <label className="block text-sm font-bold mb-3 pl-1">ระดับชั้นที่สอน (เลือกได้หลายข้อ)</label>
           <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
             {GRADES.map(grade => (
               <label key={grade} className={`flex justify-center p-3 rounded-xl border-2 cursor-pointer font-bold transition-all ${ (formData.classes||[]).includes(grade) ? 'bg-blue-50 border-[#00529B] text-[#00529B]' : 'bg-white border-gray-100 text-gray-500 hover:border-gray-300' }`}>
                 <input type="checkbox" value={grade} checked={(formData.classes||[]).includes(grade)} onChange={handleCheckbox} className="hidden" /> {grade}
               </label>
             ))}
           </div>
        </div>
        <div>
           <label className="block text-sm font-bold mb-2 pl-1">รายวิชาที่สอน (คั่นด้วยลูกน้ำ)</label>
           <textarea name="subjects" value={formData.subjects||''} onChange={handleChange} rows="2" className="glass-input w-full p-4 rounded-xl resize-none font-bold" placeholder="ท21101 ภาษาไทย, ว31101 ฟิสิกส์"></textarea>
        </div>
      </div>
    </div>
  );
}

// --- Teacher Part 2 ---
function TeacherPart2() {
  return (
    <div className="glass-panel p-10 rounded-[3rem] text-center bg-white/60 min-h-[60vh] flex flex-col items-center justify-center border border-white">
      <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-6"><Briefcase size={48} className="text-[#00529B] opacity-50"/></div>
      <h2 className="text-3xl font-black text-[#002855] mb-2">ส่วนที่ 2: ประเด็นท้าทาย (PA)</h2>
      <p className="text-gray-500 font-medium max-w-md">ระบบนี้ต้องการสร้างตาราง 'pa_data' เพิ่มเติมในฐานข้อมูล เพื่อใช้งานอย่างสมบูรณ์</p>
    </div>
  );
}

// --- Supervisor Panel ---
function SupervisorPanel({ profile, supabase, showToast }) {
  const [teachers, setTeachers] = useState([]);
  const [selectedTask, setSelectedTask] = useState('');
  const [tasksData, setTasksData] = useState([]);

  const managedTasks = profile?.supervisor_tasks || [];
  const taskOptions = TASK_LIST.filter(t => managedTasks.includes(t.id));

  const loadData = async () => {
    const { data: users } = await supabase.from('profiles').select('id, title, first_name, last_name, department, photo_url').eq('is_teacher', true).order('first_name');
    if (users) setTeachers(users);
    const { data: tasks } = await supabase.from('tasks').select('*');
    if (tasks) setTasksData(tasks);
  };
  useEffect(() => { loadData(); }, []);

  const toggleCheck = async (teacherId, taskId, currentStatus) => {
    const newStatus = !currentStatus;
    setTasksData(prev => {
      const exist = prev.find(t => t.teacher_id === teacherId && t.task_id === taskId);
      if (exist) return prev.map(t => t.teacher_id === teacherId && t.task_id === taskId ? {...t, status: newStatus} : t);
      return [...prev, { teacher_id: teacherId, task_id: taskId, status: newStatus }];
    });
    const { error } = await supabase.from('tasks').upsert({ teacher_id: teacherId, task_id: taskId, status: newStatus, supervisor_id: newStatus ? profile.id : null, timestamp: Date.now() });
    if (error) { showToast('ไม่สามารถบันทึกได้', 'error'); loadData(); }
  };

  if (managedTasks.length === 0) return <div className="p-10 text-center font-bold text-red-500 glass-panel rounded-3xl bg-white/60">คุณยังไม่มีสิทธิ์ในการตรวจรับรองงาน กรุณาติดต่อแอดมิน</div>;

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 rounded-[2rem] bg-white/80 border border-white shadow-sm flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-bold text-gray-700 mb-2 pl-1">เลือกภาระงานที่ตรวจ</label>
          <select value={selectedTask} onChange={(e) => setSelectedTask(e.target.value)} className="glass-input w-full p-3.5 rounded-xl font-bold text-[#00529B] bg-white">
            <option value="">-- เลือกงาน --</option>
            {taskOptions.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
      </div>

      {selectedTask && (
        <div className="glass-panel rounded-[2rem] overflow-hidden bg-white shadow-md">
          <div className="bg-[#002855] text-white p-4 font-bold flex justify-between">
            <span>รายชื่อครู ({teachers.length} คน)</span>
            <span className="text-sm bg-white/20 px-3 py-1 rounded">งาน: {TASK_LIST.find(t=>t.id===selectedTask)?.name}</span>
          </div>
          <table className="w-full text-left border-collapse text-sm">
            <thead><tr className="bg-gray-50 border-b"><th className="p-4">ชื่อ-นามสกุล</th><th className="p-4 text-center">สถานะการส่ง</th></tr></thead>
            <tbody>
              {teachers.map(teacher => {
                const isSent = tasksData.find(t => t.teacher_id === teacher.id && t.task_id === selectedTask)?.status || false;
                return (
                  <tr key={teacher.id} className="border-b">
                    <td className="p-4 font-bold text-gray-800 flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                          {teacher.photo_url ? <img src={teacher.photo_url} className="w-full h-full object-cover"/> : <User className="w-full h-full p-1.5 text-gray-400"/>}
                       </div>
                       {teacher.title}{teacher.first_name} {teacher.last_name}
                    </td>
                    <td className="p-4 text-center">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={isSent} onChange={() => toggleCheck(teacher.id, selectedTask, isSent)} />
                        <div className="w-12 h-6 bg-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-green-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                      </label>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// --- Admin Panel ---
function AdminPanel({ profile, supabase, showToast }) {
  const [users, setUsers] = useState([]);
  const [editFormData, setEditFormData] = useState(null);
  const [isManualAddMode, setIsManualAddMode] = useState(false);
  const [activeTab, setActiveTab] = useState('users');

  const fetchUsers = async () => {
    const { data } = await supabase.from('profiles').select('*').order('first_name');
    if (data) setUsers(data);
  };
  useEffect(() => { if (profile?.is_admin) fetchUsers(); }, [profile]);

  const saveEditUser = async () => {
    showToast('กำลังบันทึก...', 'loading');
    try {
      if (isManualAddMode) {
        if (!editFormData.email || !editFormData.password || editFormData.password.length < 6) throw new Error("ข้อมูลไม่ครบ หรือรหัสสั้นไป");
        
        // 1. สร้างบัญชี (Auth) - ตรงนี้ส่ง password ได้ เพราะยิงไปที่ Auth system
        const { data: authData, error: authErr } = await supabase.auth.signUp({ email: editFormData.email.trim(), password: editFormData.password });
        if (authErr) throw authErr;

        // 2. บันทึกโปรไฟล์ - 🚨 ตรงนี้สำคัญมาก! ห้ามมีคอลัมน์ password 🚨
        if (authData?.user) {
          const profilePayload = {
            id: authData.user.id, 
            email: editFormData.email.trim(),
            title: editFormData.title || null, 
            first_name: editFormData.first_name || null, 
            last_name: editFormData.last_name || null,
            standing: editFormData.standing || null, 
            department: editFormData.department || null,
            advisor_grade: editFormData.advisor_grade || null, 
            advisor_room: editFormData.advisor_room || null,
            is_teacher: true, 
            is_supervisor: false, 
            is_admin: false
          };
          const { error: dbErr } = await supabase.from('profiles').insert(profilePayload);
          if (dbErr) throw dbErr;
        }
      } else {
        // กรณีแก้ไข: 🚨 ดึงเฉพาะฟิลด์ที่มีในฐานข้อมูลจริง 🚨
        const updatePayload = {
          title: editFormData.title || null, 
          first_name: editFormData.first_name || null, 
          last_name: editFormData.last_name || null,
          standing: editFormData.standing || null, 
          department: editFormData.department || null,
          advisor_grade: editFormData.advisor_grade || null, 
          advisor_room: editFormData.advisor_room || null,
          is_teacher: editFormData.is_teacher ?? true, 
          is_supervisor: editFormData.is_supervisor ?? false, 
          is_admin: editFormData.is_admin ?? false
        };
        const { error } = await supabase.from('profiles').update(updatePayload).eq('id', editFormData.id);
        if (error) throw error;
      }
      showToast('บันทึกสำเร็จ', 'success');
      setEditFormData(null);
      fetchUsers();
    } catch (err) { showToast(err.message, 'error'); }
  };

  if (!profile?.is_admin) return null;

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex gap-4">
        <button onClick={()=>setActiveTab('users')} className={`px-6 py-3 rounded-2xl font-bold shadow-sm ${activeTab==='users' ? 'bg-[#002855] text-white' : 'bg-white text-gray-600'}`}>รายชื่อครู</button>
      </div>

      {activeTab === 'users' && (
        <div className="glass-panel rounded-[2rem] overflow-hidden bg-white/80 shadow-md border border-white">
          <div className="p-5 flex justify-between items-center bg-white border-b">
             <h3 className="font-bold text-xl text-[#003B73]">จัดการบุคลากร ({users.length})</h3>
             <button onClick={()=>{setIsManualAddMode(true); setEditFormData({email:'', password:'', title:'', first_name:'', last_name:'', standing:'', department:'', advisor_grade:'', advisor_room:''});}} className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm hover:bg-green-700 transition-colors"><UserPlus size={16}/> เพิ่มครูใหม่</button>
          </div>
          <table className="w-full text-left text-sm">
             <thead className="bg-gray-50 border-b text-gray-500"><tr><th className="p-4 font-bold">ชื่อ-นามสกุล</th><th className="p-4 font-bold">อีเมล</th><th className="p-4 text-center font-bold">จัดการ</th></tr></thead>
             <tbody>
               {users.map(u => (
                 <tr key={u.id} className="border-b hover:bg-white/60 transition-colors">
                    <td className="p-4 font-bold text-gray-800 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                         {u.photo_url ? <img src={u.photo_url} className="w-full h-full object-cover"/> : <User className="w-full h-full p-1.5 text-gray-400"/>}
                      </div>
                      {u.title}{u.first_name} {u.last_name || <span className="text-red-400 text-xs font-normal">ยังไม่ระบุชื่อ</span>}
                    </td>
                    <td className="p-4 text-gray-500">{u.email}</td>
                    <td className="p-4 text-center"><button onClick={()=>{setIsManualAddMode(false); setEditFormData(u);}} className="text-[#00529B] bg-blue-50 hover:bg-[#00529B] hover:text-white transition-colors p-2 rounded-lg shadow-sm"><Edit size={16}/></button></td>
                 </tr>
               ))}
             </tbody>
          </table>
        </div>
      )}

      {/* Modal จัดการข้อมูล */}
      {editFormData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in-up">
          <div className="bg-white rounded-[2rem] w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
             <div className="bg-[#002855] text-white p-5 flex justify-between items-center shrink-0">
                <h3 className="font-bold text-lg">{isManualAddMode ? 'เพิ่มบัญชีผู้ใช้งานใหม่' : 'แก้ไขข้อมูล'}</h3>
                <button onClick={()=>setEditFormData(null)} className="hover:bg-white/20 p-1 rounded-lg transition-colors"><X size={20}/></button>
             </div>
             <div className="p-6 overflow-y-auto space-y-4 custom-scrollbar">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2"><label className="block text-xs font-bold text-gray-500 mb-1">อีเมลโรงเรียน</label><input type="email" value={editFormData.email||''} onChange={e=>setEditFormData({...editFormData, email: e.target.value})} disabled={!isManualAddMode} className={`w-full p-3 rounded-xl border font-bold ${!isManualAddMode ? 'bg-gray-100 text-gray-500 border-transparent' : 'bg-white focus:border-[#00529B] outline-none'}`} /></div>
                  {isManualAddMode && <div className="col-span-2"><label className="block text-xs font-bold text-red-500 mb-1">รหัสผ่านเริ่มต้น (สำหรับเข้าสู่ระบบครั้งแรก)</label><input type="text" value={editFormData.password||''} onChange={e=>setEditFormData({...editFormData, password: e.target.value})} className="w-full p-3 rounded-xl border border-red-200 bg-red-50 font-bold focus:border-red-400 outline-none" placeholder="ขั้นต่ำ 6 ตัวอักษร"/></div>}
                  <div className="col-span-2 md:col-span-1"><label className="block text-xs font-bold text-gray-500 mb-1">คำนำหน้า</label><input type="text" value={editFormData.title||''} onChange={e=>setEditFormData({...editFormData, title: e.target.value})} className="w-full p-3 rounded-xl border font-bold focus:border-[#00529B] outline-none" placeholder="เช่น นาย, นาง"/></div>
                  <div className="col-span-2 md:col-span-1"><label className="block text-xs font-bold text-gray-500 mb-1">ชื่อ</label><input type="text" value={editFormData.first_name||''} onChange={e=>setEditFormData({...editFormData, first_name: e.target.value})} className="w-full p-3 rounded-xl border font-bold focus:border-[#00529B] outline-none" /></div>
                  <div className="col-span-2 md:col-span-1"><label className="block text-xs font-bold text-gray-500 mb-1">นามสกุล</label><input type="text" value={editFormData.last_name||''} onChange={e=>setEditFormData({...editFormData, last_name: e.target.value})} className="w-full p-3 rounded-xl border font-bold focus:border-[#00529B] outline-none" /></div>
                  <div className="col-span-2"><label className="block text-xs font-bold text-gray-500 mb-1">กลุ่มสาระฯ</label><select value={editFormData.department||''} onChange={e=>setEditFormData({...editFormData, department: e.target.value})} className="w-full p-3 rounded-xl border font-bold focus:border-[#00529B] outline-none"><option value="">-- เลือก --</option>{DEPARTMENTS.map(d=><option key={d} value={d}>{d}</option>)}</select></div>
                </div>
                {!isManualAddMode && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200 flex gap-4">
                     <label className="flex items-center gap-2 text-sm font-bold cursor-pointer"><input type="checkbox" checked={editFormData.is_teacher} onChange={e=>setEditFormData({...editFormData, is_teacher: e.target.checked})} className="rounded text-[#00529B]"/> ครูผู้สอน</label>
                     <label className="flex items-center gap-2 text-sm font-bold text-green-700 cursor-pointer"><input type="checkbox" checked={editFormData.is_supervisor} onChange={e=>setEditFormData({...editFormData, is_supervisor: e.target.checked})} className="rounded text-green-600"/> หัวหน้างาน</label>
                     <label className="flex items-center gap-2 text-sm font-bold text-red-600 cursor-pointer"><input type="checkbox" checked={editFormData.is_admin} onChange={e=>setEditFormData({...editFormData, is_admin: e.target.checked})} className="rounded text-red-600"/> ผู้ดูแลระบบ</label>
                  </div>
                )}
             </div>
             <div className="p-5 bg-gray-50 border-t flex justify-end gap-3 shrink-0">
               <button onClick={()=>setEditFormData(null)} className="px-5 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-200 transition-colors">ยกเลิก</button>
               <button onClick={saveEditUser} className="px-6 py-2.5 rounded-xl font-bold bg-[#002855] text-white hover:bg-[#003B73] transition-colors shadow-md">บันทึกข้อมูล</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}