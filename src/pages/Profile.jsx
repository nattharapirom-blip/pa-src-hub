import { useAuth } from '../contexts/AuthContext';

export default function Profile() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';

  return (
    <div className="max-w-3xl mx-auto p-8 bg-white shadow-xl rounded-2xl mt-10">
      <h2 className="text-2xl font-bold text-gray-800 border-b pb-4 mb-6">ข้อมูลส่วนตัวบุคลากร</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          { label: 'คำนำหน้า', value: profile?.prefix },
          { label: 'ชื่อ', value: profile?.first_name },
          { label: 'นามสกุล', value: profile?.last_name },
          { label: 'ตำแหน่ง', value: profile?.positions?.name },
          { label: 'วิทยฐานะ', value: profile?.academic_standings?.name },
          { label: 'กลุ่มสาระการเรียนรู้/กลุ่มงาน', value: profile?.departments?.name },
          { label: 'ครูที่ปรึกษา', value: profile?.advisor_class }
        ].map((item, i) => (
          <div key={i} className={i === 0 ? "md:col-span-2 md:w-1/3" : ""}>
            <label className="block text-sm font-semibold text-gray-700 mb-2">{item.label}</label>
            <input 
              type="text" 
              value={item.value || ''} 
              disabled={!isAdmin} 
              className={`w-full p-3 rounded-lg border outline-none ${
                !isAdmin ? 'bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed' : 'bg-white border-blue-300 focus:border-blue-500'
              }`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}