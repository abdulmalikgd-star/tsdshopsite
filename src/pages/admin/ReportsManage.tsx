import React from 'react';
import { BarChart3, TrendingUp, Users, ShoppingCart, DollarSign, Package } from 'lucide-react';

export default function ReportsManage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">التقارير والإحصائيات</h1>
        <p className="text-gray-500">تحليل شامل لأداء المتجر والمبيعات.</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: 'إجمالي المبيعات', value: '45,230 ريال', icon: DollarSign, trend: '+12%', color: 'text-green-500', bg: 'bg-green-50' },
          { title: 'الطلبات المكتملة', value: '342', icon: ShoppingCart, trend: '+5%', color: 'text-blue-500', bg: 'bg-blue-50' },
          { title: 'العملاء النشطين', value: '89', icon: Users, trend: '+18%', color: 'text-purple-500', bg: 'bg-purple-50' },
          { title: 'المنتجات المباعة', value: '1,204', icon: Package, trend: '-2%', color: 'text-orange-500', bg: 'bg-orange-50' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-start justify-between">
            <div>
              <p className="text-gray-500 text-sm font-bold mb-1">{stat.title}</p>
              <h3 className="text-3xl font-black text-gray-900">{stat.value}</h3>
              <div className={`mt-2 text-sm font-bold flex items-center gap-1 ${stat.trend.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                <TrendingUp className={`w-4 h-4 ${stat.trend.startsWith('-') ? 'rotate-180' : ''}`} />
                {stat.trend} مقارنة بالشهر الماضي
              </div>
            </div>
            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
              <stat.icon className="h-6 w-6" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
           <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
             <BarChart3 className="text-primary-600 w-5 h-5" />
             المبيعات الشهرية
           </h3>
           <div className="h-64 flex items-end justify-between gap-2">
             {[30, 45, 25, 60, 40, 70, 85].map((val, idx) => (
                <div key={idx} className="w-full flex flex-col items-center gap-2 group">
                  <div className="w-full bg-primary-100 rounded-t-lg relative group-hover:bg-primary-200 transition-colors" style={{ height: `${val}%` }}>
                     <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                        {val * 1000}
                     </div>
                  </div>
                  <span className="text-xs text-gray-400 font-bold">شهر {idx + 1}</span>
                </div>
             ))}
           </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
           <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
             <Package className="text-primary-600 w-5 h-5" />
             الأقسام الأكثر مبيعاً
           </h3>
           <div className="space-y-6">
             {[
               { name: 'جوالات', percent: 45, color: 'bg-blue-500' },
               { name: 'سماعات', percent: 25, color: 'bg-purple-500' },
               { name: 'حواسب محمولة', percent: 20, color: 'bg-green-500' },
               { name: 'إكسسوارات', percent: 10, color: 'bg-orange-500' },
             ].map((cat, idx) => (
                <div key={idx}>
                  <div className="flex justify-between text-sm font-bold mb-2">
                    <span className="text-gray-700">{cat.name}</span>
                    <span className="text-gray-500">{cat.percent}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className={`${cat.color} h-2 rounded-full`} style={{ width: `${cat.percent}%` }} />
                  </div>
                </div>
             ))}
           </div>
        </div>
      </div>
    </div>
  );
}
