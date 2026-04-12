import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserPlus, Save, Loader2, Trash2, Users } from 'lucide-react';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // เพิ่มช่องอีเมลและรหัสผ่านใน State
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    position: 'ครูชำนาญการ',
    department: 'ภาษาไทย',
    advisor_grade: '',
    advisor_room: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('id', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password || !formData.full_name) {
      alert('กรุณากรอกอีเมล รหัสผ่าน และชื่อ-นามสกุลให้ครบถ้วน');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. สร้างผู้ใช้งานในระบบ Auth ของ Supabase (ระบบจะเก็บรหัสผ่านไว้ที่นี่ ไม่ได้เก็บในตาราง profiles)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;

      // ตรวจสอบว่าสร้างสำเร็จและได้ id กลับมาหรือไม่
      if (authData.user) {
        // 2. นำ id ที่ได้ มาสร้างโปรไฟล์ในตาราง profiles
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: authData.user.id, // ใช้ id เดียวกันกับ Auth เพื่อเชื่อมโยงกัน
              full_name: formData.full_name,
              position: formData.position,
              department: formData.department,
              advisor_grade: formData.advisor_grade,
              advisor_room: formData.advisor_room
            }
          ])
          .select();

        if (profileError) {
            // ถ้าบันทึกโปรไฟล์ไม่สำเร็จ อาจจะต้องมีการจัดการลบ User ใน Auth ทิ้ง (เพื่อให้ระบบคลีน)
            // แต่เพื่อความง่ายในเบื้องต้น เราจะแค่แจ้งเตือนก่อนครับ
            throw profileError;
        }

        if (profileData && profileData.length > 0) {
          setUsers([profileData[0], ...users]);
          
          // ล้างฟอร์ม
          setFormData({
            email: '',
            password: '',
            full_name: '',
            position: 'ครูชำนาญการ',
            department: 'ภาษาไทย',
            advisor_grade: '',
            advisor_room: ''
          });
          alert('เพิ่มผู้ใช้งานสำเร็จ!');
        }
      }
    } catch (error) {
      console.error('Error adding user:', error.message);
      alert('เกิดข้อผิดพลาด: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('คุณยืนยันที่จะลบโปรไฟล์ผู้ใช้งานนี้ใช่หรือไม่? (การลบที่นี่จะไม่ลบบัญชีล็อกอิน)')) return;
    
    try {
      // หมายเหตุ: การลบตรงนี้จะลบแค่ข้อมูลโปรไฟล์ ไม่ได้ลบบัญชีในระบบ Auth
      // หากต้องการลบ Auth ด้วย ต้องใช้ Admin API (Supabase Service Role Key) ซึ่งซับซ้อนขึ้น
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      setUsers(users.filter(user => user.id !== id));
    } catch (error) {
      console.error('Error deleting user:', error.message);
      alert('เกิดข้อผิดพลาดในการลบ: ' + error.message);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="flex items-center gap-3 border-b pb-4 border-gray-200">
        <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
          <Users className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800">จัดการข้อมูลผู้ใช้งาน</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* ฟอร์มด้านซ้าย */}
        <div className="lg:col-span-1 bg-white border border-gray-100 p-6 rounded-2xl shadow-sm h-fit">
          <h2 className="text-lg font-semibold mb-5 flex items-center gap-2 text-gray-800">
            <UserPlus className="w-5 h-5 text-blue-500" />
            เพิ่มผู้ใช้งานใหม่
          </h2>
          
          <form onSubmit={handleAddUser} className="space-y-4">
            {/* ข้อมูลการเข้าสู่ระบบ */}
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3 mb-4">
                <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">ข้อมูลเข้าสู่ระบบ (Login)</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">อีเมล</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full p-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="example@school.ac.th"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">รหัสผ่าน</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full p-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="รหัสผ่านอย่างน้อย 6 ตัวอักษร"
                  />
                </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อ-นามสกุล</label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="เช่น นายณัฏฐรภิรมณ์ วราสินธ์"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ตำแหน่ง</label>
              <select 
                name="position" 
                value={formData.position} 
                onChange={handleChange} 
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ครูผู้ช่วย">ครูผู้ช่วย</option>
                <option value="ครู">ครู</option>
                <option value="ครูชำนาญการ">ครูชำนาญการ</option>
                <option value="ครูชำนาญการพิเศษ">ครูชำนาญการพิเศษ</option>
                <option value="ครูเชี่ยวชาญ">ครูเชี่ยวชาญ</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">กลุ่มสาระการเรียนรู้</label>
              <select 
                name="department" 
                value={formData.department} 
                onChange={handleChange} 
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ภาษาไทย">ภาษาไทย</option>
                <option value="คณิตศาสตร์">คณิตศาสตร์</option>
                <option value="วิทยาศาสตร์และเทคโนโลยี">วิทยาศาสตร์และเทคโนโลยี</option>
                <option value="สังคมศึกษาฯ">สังคมศึกษาฯ</option>
                <option value="ภาษาต่างประเทศ">ภาษาต่างประเทศ</option>
                <option value="ศิลปะ">ศิลปะ</option>
                <option value="การงานอาชีพ">การงานอาชีพ</option>
                <option value="สุขศึกษาและพลศึกษา">สุขศึกษาและพลศึกษา</option>
              </select>
            </div>
            
            {/* แยกช่องกรอก ชั้น และ ห้อง ออกจากกัน */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ชั้นที่ปรึกษา</label>
                <input
                  type="text"
                  name="advisor_grade"
                  value={formData.advisor_grade}
                  onChange={handleChange}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="เช่น ม.6"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ห้อง</label>
                <input
                  type="text"
                  name="advisor_room"
                  value={formData.advisor_room}
                  onChange={handleChange}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="เช่น 5"
                />
              </div>
            </div>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex justify-center items-center gap-2 transition-all disabled:opacity-70 mt-4"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
            </button>
          </form>
        </div>

        {/* ตารางแสดงผลด้านขวา */}
        <div className="lg:col-span-2 bg-white border border-gray-100 p-6 rounded-2xl shadow-sm">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-lg font-semibold text-gray-800">รายชื่อผู้ใช้งานในระบบ</h2>
            <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-sm font-medium">
              ทั้งหมด {users.length} คน
            </span>
          </div>
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin mb-3 text-blue-500" />
              <p>กำลังโหลดข้อมูลผู้ใช้งาน...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-16 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>ยังไม่มีข้อมูลผู้ใช้งานในระบบ</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="text-xs text-gray-500 bg-gray-50 uppercase">
                  <tr>
                    <th className="px-5 py-4 font-medium">ชื่อ-นามสกุล</th>
                    <th className="px-5 py-4 font-medium">ตำแหน่ง</th>
                    <th className="px-5 py-4 font-medium">กลุ่มสาระ</th>
                    <th className="px-5 py-4 font-medium">ที่ปรึกษา</th>
                    <th className="px-5 py-4 font-medium text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-5 py-4 font-medium text-gray-800 whitespace-nowrap">
                        {user.full_name || '-'}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-1 rounded-md text-xs">
                          {user.position || '-'}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">{user.department || '-'}</td>
                      {/* รวมค่า ชั้น และ ห้อง มาแสดงด้วยกัน */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {user.advisor_grade ? `${user.advisor_grade}/${user.advisor_room || '-'}` : '-'}
                      </td>
                      <td className="px-5 py-4 text-center whitespace-nowrap">
                        <button 
                          onClick={() => handleDelete(user.id)}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="ลบผู้ใช้งาน"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
