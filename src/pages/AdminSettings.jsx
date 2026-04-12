import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Swal from 'sweetalert2';
import { Trash2, Plus, Settings } from 'lucide-react';

export default function AdminSettings() {
  const [settings, setSettings] = useState({ id: 1, academic_year: '', budget_year: '' });
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [standings, setStandings] = useState([]);
  const [newItem, setNewItem] = useState({ departments: '', positions: '', academic_standings: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: set } = await supabase.from('system_settings').select('*').single();
    if (set) setSettings(set);

    const { data: dpt } = await supabase.from('departments').select('*').order('name');
    const { data: pos } = await supabase.from('positions').select('*').order('name');
    const { data: std } = await supabase.from('academic_standings').select('*').order('name');
    
    setDepartments(dpt || []);
    setPositions(pos || []);
    setStandings(std || []);
  };

  const handleAddItem = async (tableName) => {
    const value = newItem[tableName];
    if (!value) return;

    try {
      const { data, error } = await supabase.from(tableName).insert([{ name: value }]).select();
      if (error) throw error;

      // อัปเดตหน้าจอทันที
      if (tableName === 'departments') setDepartments(prev => [...prev, data[0]]);
      if (tableName === 'positions') setPositions(prev => [...prev, data[0]]);
      if (tableName === 'academic_standings') setStandings(prev => [...prev, data[0]]);

      setNewItem({ ...newItem, [tableName]: '' });
      Swal.fire({ title: 'สำเร็จ', icon: 'success', timer: 1000, showConfirmButton: false });
    } catch (error) {
      Swal.fire('เกิดข้อผิดพลาด', error.message, 'error');
    }
  };

  const handleDeleteItem = async (tableName, id) => {
    const res = await Swal.fire({
      title: 'ยืนยันการลบ?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'ลบข้อมูล'
    });

    if (res.isConfirmed) {
      try {
        const { error } = await supabase.from(tableName).delete().eq('id', id);
        if (error) throw error;

        // ลบข้อมูลออกจากหน้าจอทันที 100%
        if (tableName === 'departments') setDepartments(prev => prev.filter(item => item.id !== id));
        if (tableName === 'positions') setPositions(prev => prev.filter(item => item.id !== id));
        if (tableName === 'academic_standings') setStandings(prev => prev.filter(item => item.id !== id));

        Swal.fire({ title: 'ลบสำเร็จ', icon: 'success', timer: 1000, showConfirmButton: false });
      } catch (error) {
        Swal.fire('ลบไม่สำเร็จ', `ข้อมูลนี้อาจถูกใช้งานอยู่: ${error.message}`, 'error');
      }
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-gray-50 min-h-screen">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="text-blue-700" size={32} />
        <h1 className="text-3xl font-bold text-gray-800">ตั้งค่าระบบจัดการข้อมูล</h1>
      </div>
      
      {/* จัดการตัวเลือก (ตำแหน่ง, วิทยฐานะ, กลุ่มสาระ) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[
          { label: 'กลุ่มสาระการเรียนรู้', table: 'departments', data: departments },
          { label: 'ตำแหน่ง', table: 'positions', data: positions },
          { label: 'วิทยฐานะ', table: 'academic_standings', data: standings }
        ].map((item, idx) => (
          <div key={idx} className="bg-white p-5 rounded-2xl shadow-sm border flex flex-col h-[500px]">
            <h3 className="font-bold text-lg mb-4 text-gray-800 border-b pb-2">{item.label}</h3>
            <div className="flex gap-2 mb-4">
              <input 
                type="text" 
                value={newItem[item.table]} 
                onChange={e => setNewItem({...newItem, [item.table]: e.target.value})} 
                className="border p-2 flex-1 rounded-lg outline-none focus:border-blue-500" 
                placeholder={`เพิ่ม${item.label}ใหม่...`} 
              />
              <button onClick={() => handleAddItem(item.table)} className="bg-green-600 text-white p-2 rounded-lg"><Plus size={20}/></button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2">
              {item.data.map(d => (
                <div key={d.id} className="flex justify-between items-center p-3 bg-gray-50 border rounded-xl">
                  <span className="text-gray-700 text-sm font-medium">{d.name}</span>
                  <button onClick={() => handleDeleteItem(item.table, d.id)} className="text-red-400 hover:text-red-600"><Trash2 size={18}/></button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}