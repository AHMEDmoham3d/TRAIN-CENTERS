'use client'

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase' // ✅ نستخدم فقط الكلاينت الجاهز من lib

export default function CompanyDashboard() {
  const [company, setCompany] = useState<any>(null)
  const [centers, setCenters] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newCenter, setNewCenter] = useState({ name: '', email: '', phone: '', address: '' })

  // 🧠 جلب بيانات الشركة والسناتر
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)

      // المستخدم الحالي
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        toast.error('يجب تسجيل الدخول أولًا')
        setLoading(false)
        return
      }

      // جلب بيانات الشركة بناءً على user_id
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (companyError || !companyData) {
        toast.error('حدث خطأ أثناء تحميل بيانات الشركة')
        setLoading(false)
        return
      }

      setCompany(companyData)

      // جلب السناتر التابعة للشركة
      const { data: centersData, error: centersError } = await supabase
        .from('centers')
        .select('*')
        .eq('company_id', companyData.id)

      if (centersError) {
        toast.error('حدث خطأ أثناء تحميل السناتر')
      } else {
        setCenters(centersData || [])
      }

      setLoading(false)
    }

    fetchData()
  }, [])

  // ➕ إضافة سنتر جديد
  const addCenter = async () => {
    if (!newCenter.name.trim()) return toast.error('يرجى كتابة اسم السنتر')

    const { error } = await supabase.from('centers').insert([
      {
        name: newCenter.name,
        email: newCenter.email,
        phone: newCenter.phone,
        address: newCenter.address,
        company_id: company?.id
      }
    ])

    if (error) {
      toast.error('فشل في إضافة السنتر')
    } else {
      toast.success('تم إضافة السنتر بنجاح')
      setNewCenter({ name: '', email: '', phone: '', address: '' })
      const { data } = await supabase.from('centers').select('*').eq('company_id', company.id)
      setCenters(data || [])
    }
  }

  // ❌ حذف سنتر
  const deleteCenter = async (id: string) => {
    const { error } = await supabase.from('centers').delete().eq('id', id)
    if (error) {
      toast.error('فشل في حذف السنتر')
    } else {
      toast.success('تم الحذف بنجاح')
      setCenters(centers.filter(c => c.id !== id))
    }
  }

  if (loading) return <p className="text-center p-8">جارِ التحميل...</p>

  return (
    <div className="p-8 space-y-6">
      <div className="bg-white rounded-lg shadow-card p-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-900">بيانات الشركة</h2>
        </div>
        <div>
          <p>الاسم: {company?.name}</p>
          <p>الإيميل: {company?.email}</p>
          <p>النطاق الفرعي: {company?.subdomain}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-card p-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-900">السناتر التابعة للشركة</h2>
        </div>
        <div>
          <div className="flex flex-wrap gap-2 mb-4">
            <input
              type="text"
              placeholder="اسم السنتر"
              value={newCenter.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewCenter({ ...newCenter, name: e.target.value })}
              className="border border-gray-300 rounded-md px-3 py-2"
            />
            <input
              type="email"
              placeholder="الإيميل"
              value={newCenter.email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewCenter({ ...newCenter, email: e.target.value })}
              className="border border-gray-300 rounded-md px-3 py-2"
            />
            <input
              type="tel"
              placeholder="رقم الهاتف"
              value={newCenter.phone}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewCenter({ ...newCenter, phone: e.target.value })}
              className="border border-gray-300 rounded-md px-3 py-2"
            />
            <input
              type="text"
              placeholder="العنوان"
              value={newCenter.address}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewCenter({ ...newCenter, address: e.target.value })}
              className="border border-gray-300 rounded-md px-3 py-2"
            />
            <button onClick={addCenter} className="bg-primary-500 text-white px-4 py-2 rounded-md hover:bg-primary-600">إضافة</button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">الاسم</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">الإيميل</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">الهاتف</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">العنوان</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">تحكم</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {centers.map(center => (
                  <tr key={center.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{center.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{center.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{center.phone}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{center.address}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button onClick={() => deleteCenter(center.id)} className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600">
                        حذف
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
