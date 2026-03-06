/**
 * 健康报告组件
 */

import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../hooks/useAuth';

export function HealthReport() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { success, error } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    loadReports();
  }, [user]);

  const loadReports = async () => {
    if (!user?.userId) return;

    try {
      const response: any = await api.getReports(user.userId);
      setReports(response.data || []);
    } catch (err: any) {
      error(err.message || '加载健康报告失败');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    try {
      await api.createReport(user!.userId, {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      });
      success('健康报告已生成');
      loadReports();
    } catch (err: any) {
      error(err.message || '生成报告失败');
    }
  };

  if (loading) {
    return <div className="text-center py-8">加载中...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">📊 健康报告</h2>
        <button
          onClick={handleGenerate}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
        >
          生成报告（最近30天）
        </button>
      </div>

      {reports.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">暂无健康报告，点击"生成报告"开始生成</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reports.map(report => (
            <ReportCard key={report.id} report={report} />
          ))}
        </div>
      )}
    </div>
  );
}

function ReportCard({ report }: { report: any }) {
  const trends = JSON.parse(report.trends || '[]');
  const recommendations = JSON.parse(report.recommendations || '[]');

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-semibold text-gray-800">
            健康报告
          </h3>
          <p className="text-sm text-gray-600">
            {new Date(report.reportDate).toLocaleDateString()}
          </p>
        </div>
        <div className="text-right">
          <p className={`text-3xl font-bold ${getScoreColor(report.nutritionScore)}`}>
            {Math.round(report.nutritionScore)}
          </p>
          <p className="text-xs text-gray-500">平均营养分</p>
        </div>
      </div>

      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">数据范围</h4>
        <p className="text-sm text-gray-600">
          {new Date(report.startDate).toLocaleDateString()} - {new Date(report.endDate).toLocaleDateString()}
        </p>
      </div>

      {recommendations.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">建议</h4>
          <ul className="text-sm text-gray-600 list-disc list-inside">
            {recommendations.map((rec: string, idx: number) => (
              <li key={idx}>{rec}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="text-xs text-gray-500">
        共 {trends.length} 条记录
      </div>
    </div>
  );
}