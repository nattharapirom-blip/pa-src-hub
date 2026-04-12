import { useState } from 'react';
import { supabase } from '../lib/supabase';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      Swal.fire('เกิดข้อผิดพลาด', 'อีเมลหรือรหัสผ่านไม่ถูกต้อง', 'error');
    } else {
      Swal.fire('สำเร็จ', 'เข้าสู่ระบบเรียบร้อย', 'success');
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold text-center mb-6 text-blue-600">เข้าสู่ระบบ PA Hub</h2>
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">อีเมล</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 border rounded" required />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 mb-2">รหัสผ่าน</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 border rounded" required />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">เข้าสู่ระบบ</button>
        </form>
      </div>
    </div>
  );
}