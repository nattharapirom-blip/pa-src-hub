import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function TaskDashboard() {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    // โค้ดพระเอก: ดึงข้อมูลงาน และวิ่งไปหยิบชื่อคนอนุมัติ + ตำแหน่งคนอนุมัติ มาให้ด้วย
    const { data } = await supabase
      .from('tasks')
      .select(`
        *,
        approver:profiles!approver_id (
          full_name,
          positions:position_id (name)
        )
      `)
      .order('created_at', { ascending: false });

    if (data) setTasks(data);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">รายการภาระงาน</h1>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3">ชื่องาน</th>
              <th className="p-3">สถานะ</th>
              <th className="p-3">ผู้รับรอง / อนุมัติ</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map(task => (
              <tr key={task.id} className="border-t">
                <td className="p-3">{task.title}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded text-sm ${task.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {task.status === 'approved' ? 'อนุมัติแล้ว' : 'รอตรวจสอบ'}
                  </span>
                </td>
                <td className="p-3 text-sm text-gray-600">
                  {/* แสดงชื่อและตำแหน่งคนอนุมัติตามจริง */}
                  {task.approver 
                    ? `รับรองโดย: ${task.approver.full_name} (${task.approver.positions?.name})` 
                    : '-'}
                </td>
              </tr>
            ))}
            {tasks.length === 0 && (
              <tr><td colSpan="3" className="p-6 text-center text-gray-500">ยังไม่มีข้อมูลภาระงาน</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}