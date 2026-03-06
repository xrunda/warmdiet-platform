import { useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';

type HealthMetrics = {
  bmi: number;
  bloodPressure: { systolic: number; diastolic: number };
  bloodSugar: number;
  cholesterol: number;
  heartRate: number;
  sleepDuration: number;
  exerciseTime: number;
  waterIntake: number;
};

type HealthReportItem = {
  id: string;
  patientName: string;
  reportDate: string;
  period: '本周' | '本月';
  summary: string;
  metrics: HealthMetrics;
  recommendations: string[];
  riskFactors: string[];
};

type MetricScore = {
  name: string;
  score: number;
  icon: string;
};

const DEFAULT_METRICS: HealthMetrics = {
  bmi: 23.5,
  bloodPressure: { systolic: 120, diastolic: 80 },
  bloodSugar: 5.5,
  cholesterol: 4.8,
  heartRate: 72,
  sleepDuration: 7.5,
  exerciseTime: 4.5,
  waterIntake: 2.0,
};

function getMetricScores(report: HealthReportItem): MetricScore[] {
  const m = report.metrics;
  return [
    {
      name: 'BMI',
      score: m.bmi < 25 ? 90 : m.bmi < 30 ? 75 : 60,
      icon: '⚖️'
    },
    {
      name: '血压',
      score:
        m.bloodPressure.systolic < 130
          ? 90
          : m.bloodPressure.systolic < 140
          ? 80
          : 70,
      icon: '💓'
    },
    {
      name: '血糖',
      score: m.bloodSugar < 6.1 ? 95 : m.bloodSugar < 7.0 ? 85 : 75,
      icon: '🩸'
    },
    {
      name: '胆固醇',
      score: m.cholesterol < 5.2 ? 90 : m.cholesterol < 6.2 ? 80 : 70,
      icon: '🥚'
    },
    {
      name: '心率',
      score: m.heartRate < 100 ? 95 : m.heartRate < 110 ? 85 : 75,
      icon: '❤️'
    },
    {
      name: '睡眠',
      score: m.sleepDuration >= 7 ? 90 : m.sleepDuration >= 6 ? 75 : 65,
      icon: '😴'
    },
    {
      name: '运动',
      score: m.exerciseTime >= 4 ? 85 : m.exerciseTime >= 3 ? 75 : 65,
      icon: '🏃'
    }
  ];
}

function getAverageScore(report: HealthReportItem): number {
  const scores = getMetricScores(report);
  const total = scores.reduce((sum, item) => sum + item.score, 0);
  return Math.round(total / scores.length);
}

function getHealthStatus(report: HealthReportItem) {
  if (report.riskFactors.length === 0) {
    return { label: '健康', color: '#10b981', bg: '#d1fae5' };
  }
  if (report.riskFactors.length <= 1) {
    return { label: '亚健康', color: '#f59e0b', bg: '#fef3c7' };
  }
  return { label: '需关注', color: '#f97316', bg: '#fee2e2' };
}

export function HealthReport() {
  const [reports, setReports] = useState<HealthReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReport, setSelectedReport] = useState<HealthReportItem | null>(null);

  useEffect(() => {
    loadReports();
  }, []);

  async function loadReports() {
    try {
      const doctorsRes: any = await api.getDoctors();
      const doctors = doctorsRes.data || [];

      const patientIds = new Set<string>();
      for (const doc of doctors) {
        try {
          const authRes: any = await api.getDoctorAuthorizations(doc.id);
          const auths = authRes.data || [];
          for (const auth of auths) {
            if (auth.status === 'active') patientIds.add(auth.patientId);
          }
        } catch { /* skip */ }
      }

      const allReports: HealthReportItem[] = [];
      for (const pid of patientIds) {
        try {
          const reportsRes: any = await api.getReports(pid);
          const patientReports = reportsRes.data || [];
          for (const report of patientReports) {
            let recommendations: string[] = [];
            try {
              recommendations = typeof report.recommendations === 'string'
                ? JSON.parse(report.recommendations)
                : report.recommendations || [];
            } catch {
              recommendations = report.recommendations ? [String(report.recommendations)] : [];
            }

            let trends: any = {};
            try {
              trends = typeof report.trends === 'string'
                ? JSON.parse(report.trends)
                : report.trends || {};
            } catch { /* ignore */ }

            const riskFactors: string[] = [];
            if (report.nutritionScore != null && report.nutritionScore < 70) {
              riskFactors.push('营养评分偏低');
            }

            const reportDate = (report.reportDate || report.createdAt || '').split('T')[0];
            const startDate = report.startDate ? report.startDate.split('T')[0] : '';
            const endDate = report.endDate ? report.endDate.split('T')[0] : '';
            const daysDiff = startDate && endDate
              ? Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000)
              : 7;

            allReports.push({
              id: report.id,
              patientName: pid,
              reportDate,
              period: daysDiff <= 7 ? '本周' : '本月',
              summary: recommendations[0] || `营养评分: ${report.nutritionScore ?? '暂无'}`,
              metrics: {
                ...DEFAULT_METRICS,
                ...(trends.bmi != null ? { bmi: trends.bmi } : {}),
              },
              recommendations: recommendations.length > 0
                ? recommendations
                : ['暂无具体建议，请继续保持良好的生活习惯。'],
              riskFactors,
            });
          }
        } catch { /* skip patient with no reports */ }
      }

      setReports(allReports);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  }

  const filteredReports = useMemo(
    () =>
      reports.filter(
        (r) =>
          !searchTerm.trim() || r.patientName.includes(searchTerm.trim())
      ),
    [searchTerm, reports]
  );

  const stats = useMemo(
    () => ({
      total: reports.length,
      thisWeek: reports.filter((r) => r.period === '本周').length,
      healthy: reports.filter((r) => r.riskFactors.length === 0).length,
      needsAttention: reports.filter((r) => r.riskFactors.length > 0).length
    }),
    [reports]
  );

  const handleCloseModal = () => setSelectedReport(null);

  return (
    <div
      style={{
        minHeight: '100%',
        backgroundColor: '#f8fafc',
        padding: 24
      }}
    >
      <div style={{ marginBottom: 24 }}>
        <h1
          style={{
            fontSize: 24,
            fontWeight: 'bold',
            color: '#1e293b',
            margin: 0
          }}
        >
          健康报告
        </h1>
        <p
          style={{
            color: '#64748b',
            marginTop: 4,
            fontSize: 14,
            marginBottom: 0
          }}
        >
          查看患者的关键健康指标与综合评分。
        </p>
      </div>

      {/* 统计概览 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          marginBottom: 24
        }}
      >
        {[
          { label: '总报告数', value: stats.total, icon: '📋', color: '#64748b' },
          { label: '本周报告', value: stats.thisWeek, icon: '📅', color: '#3b82f6' },
          { label: '健康状况良好', value: stats.healthy, icon: '✅', color: '#10b981' },
          { label: '需要关注', value: stats.needsAttention, icon: '⚠️', color: '#f97316' }
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 16,
              padding: 20,
              boxShadow: '0 1px 3px rgba(15,23,42,0.08)',
              border: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div>
              <p
                style={{
                  color: '#64748b',
                  fontSize: 14,
                  margin: 0
                }}
              >
                {stat.label}
              </p>
              <p
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  color: '#1e293b',
                  marginTop: 8,
                  marginBottom: 0
                }}
              >
                {loading ? '...' : stat.value}
              </p>
            </div>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 16,
                backgroundColor: stat.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24,
                color: '#ffffff'
              }}
            >
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      {/* 搜索栏 */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 12,
          padding: 20,
          marginBottom: 24,
          boxShadow: '0 1px 3px rgba(15,23,42,0.06)',
          border: '1px solid #e2e8f0'
        }}
      >
        <input
          type="text"
          placeholder="搜索患者姓名..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 14px',
            backgroundColor: '#f8fafc',
            borderRadius: 10,
            border: '1px solid #e2e8f0',
            fontSize: 14,
            outline: 'none'
          }}
        />
      </div>

      {/* 加载中 */}
      {loading && (
        <div style={{ padding: '64px', textAlign: 'center', color: '#94a3b8' }}>加载中...</div>
      )}

      {/* 空状态 */}
      {!loading && filteredReports.length === 0 && (
        <div style={{ padding: '64px', textAlign: 'center', color: '#94a3b8', backgroundColor: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
          <h3 style={{ color: '#1e293b', fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
            暂无健康报告
          </h3>
          <p style={{ color: '#64748b' }}>
            授权患者的健康报告将显示在这里
          </p>
        </div>
      )}

      {/* 报告卡片 */}
      {!loading && filteredReports.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
            gap: 20
          }}
        >
          {filteredReports.map((report) => {
            const healthStatus = getHealthStatus(report);
            const avgScore = getAverageScore(report);
            return (
              <div
                key={report.id}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: 16,
                  padding: 20,
                  boxShadow: '0 1px 3px rgba(15,23,42,0.06)',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '1px solid #e5e7eb',
                    paddingBottom: 10
                  }}
                >
                  <div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 16,
                        fontWeight: 600,
                        color: '#1e293b'
                      }}
                    >
                      {report.patientName}
                    </p>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 12,
                        color: '#64748b',
                        marginTop: 4
                      }}
                    >
                      {report.reportDate} · {report.period}
                    </p>
                  </div>
                  <span
                    style={{
                      padding: '4px 10px',
                      borderRadius: 999,
                      fontSize: 12,
                      backgroundColor: healthStatus.bg,
                      color: healthStatus.color,
                      fontWeight: 600
                    }}
                  >
                    {healthStatus.label}
                  </span>
                </div>

                <p
                  style={{
                    margin: 0,
                    fontSize: 14,
                    color: '#64748b'
                  }}
                >
                  {report.summary}
                </p>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                    gap: 8
                  }}
                >
                  {[
                    {
                      label: 'BMI',
                      value: report.metrics.bmi,
                      unit: '',
                      icon: '⚖️'
                    },
                    {
                      label: '血压',
                      value: `${report.metrics.bloodPressure.systolic}/${report.metrics.bloodPressure.diastolic}`,
                      unit: '',
                      icon: '💓'
                    },
                    {
                      label: '血糖',
                      value: report.metrics.bloodSugar,
                      unit: '',
                      icon: '🩸'
                    },
                    {
                      label: '胆固醇',
                      value: report.metrics.cholesterol,
                      unit: '',
                      icon: '🥚'
                    }
                  ].map((metric) => (
                    <div
                      key={metric.label}
                      style={{
                        textAlign: 'center',
                        padding: 8,
                        backgroundColor: '#f8fafc',
                        borderRadius: 8
                      }}
                    >
                      <div style={{ fontSize: 22, marginBottom: 2 }}>{metric.icon}</div>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 12,
                          color: '#64748b'
                        }}
                      >
                        {metric.label}
                      </p>
                      <p
                        style={{
                          margin: 0,
                          marginTop: 4,
                          fontSize: 18,
                          fontWeight: 600,
                          color: '#1e293b'
                        }}
                      >
                        {metric.value}
                        {metric.unit}
                      </p>
                    </div>
                  ))}
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: 4
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontSize: 14,
                      color: '#94a3b8'
                    }}
                  >
                    健康评分{' '}
                    <span
                      style={{
                        fontSize: 20,
                        fontWeight: 700,
                        color: '#1e293b'
                      }}
                    >
                      {avgScore}
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        color: '#64748b',
                        marginLeft: 4
                      }}
                    >
                      / 100
                    </span>
                  </p>
                  <button
                    type="button"
                    onClick={() => setSelectedReport(report)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 999,
                      border: 'none',
                      backgroundImage:
                        'linear-gradient(135deg, #10b981, #06b6d4)',
                      color: '#ffffff',
                      fontSize: 14,
                      fontWeight: 500,
                      cursor: 'pointer'
                    }}
                  >
                    查看详情
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 报告详情弹窗 */}
      {selectedReport && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCloseModal();
            }
          }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            backgroundColor: 'rgba(15,23,42,0.45)',
            backdropFilter: 'blur(4px)'
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 800,
              backgroundColor: '#ffffff',
              borderRadius: 16,
              boxShadow: '0 20px 25px -5px rgba(15,23,42,0.25)',
              maxHeight: '90vh',
              overflow: 'auto'
            }}
          >
            <div
              style={{
                padding: 20,
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: 20,
                    fontWeight: 600,
                    color: '#1e293b'
                  }}
                >
                  健康报告详情
                </h3>
                <p
                  style={{
                    margin: 0,
                    marginTop: 4,
                    fontSize: 13,
                    color: '#64748b'
                  }}
                >
                  {selectedReport.patientName} · {selectedReport.reportDate}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                style={{
                  border: 'none',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  fontSize: 18,
                  color: '#64748b'
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: 20 }}>
              {/* 综合评分 */}
              <div
                style={{
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16
                }}
              >
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: '50%',
                    backgroundImage:
                      'conic-gradient(#22c55e 0deg, #22c55e 240deg, #e5e7eb 240deg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: '50%',
                      backgroundColor: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'column'
                    }}
                  >
                    <span
                      style={{
                        fontSize: 20,
                        fontWeight: 700,
                        color: '#16a34a'
                      }}
                    >
                      {getAverageScore(selectedReport)}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        color: '#94a3b8'
                      }}
                    >
                      /100
                    </span>
                  </div>
                </div>
                <div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 14,
                      color: '#64748b'
                    }}
                  >
                    综合健康评分
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 13,
                      color: '#94a3b8',
                      marginTop: 4
                    }}
                  >
                    分数越高表示整体健康状况越好。
                  </p>
                </div>
              </div>

              {/* 健康指标明细 */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  gap: 12,
                  marginBottom: 20
                }}
              >
                {[
                  {
                    label: 'BMI',
                    value: selectedReport.metrics.bmi,
                    unit: '',
                    icon: '⚖️',
                    status:
                      selectedReport.metrics.bmi < 25
                        ? '正常'
                        : selectedReport.metrics.bmi < 30
                        ? '超重'
                        : '肥胖'
                  },
                  {
                    label: '血压',
                    value: `${selectedReport.metrics.bloodPressure.systolic}/${selectedReport.metrics.bloodPressure.diastolic}`,
                    unit: 'mmHg',
                    icon: '💓',
                    status:
                      selectedReport.metrics.bloodPressure.systolic < 130
                        ? '正常'
                        : '偏高'
                  },
                  {
                    label: '血糖',
                    value: selectedReport.metrics.bloodSugar,
                    unit: 'mmol/L',
                    icon: '🩸',
                    status:
                      selectedReport.metrics.bloodSugar < 6.1
                        ? '正常'
                        : '偏高'
                  },
                  {
                    label: '胆固醇',
                    value: selectedReport.metrics.cholesterol,
                    unit: 'mmol/L',
                    icon: '🥚',
                    status:
                      selectedReport.metrics.cholesterol < 5.2
                        ? '正常'
                        : '偏高'
                  },
                  {
                    label: '心率',
                    value: selectedReport.metrics.heartRate,
                    unit: 'bpm',
                    icon: '❤️',
                    status:
                      selectedReport.metrics.heartRate < 100
                        ? '正常'
                        : '偏高'
                  },
                  {
                    label: '睡眠',
                    value: selectedReport.metrics.sleepDuration,
                    unit: '小时',
                    icon: '😴',
                    status:
                      selectedReport.metrics.sleepDuration >= 7
                        ? '充足'
                        : '不足'
                  },
                  {
                    label: '运动',
                    value: selectedReport.metrics.exerciseTime,
                    unit: '小时/周',
                    icon: '🏃',
                    status:
                      selectedReport.metrics.exerciseTime >= 4
                        ? '达标'
                        : '不足'
                  },
                  {
                    label: '饮水',
                    value: selectedReport.metrics.waterIntake,
                    unit: 'L/天',
                    icon: '💧',
                    status:
                      selectedReport.metrics.waterIntake >= 2
                        ? '充足'
                        : '不足'
                  }
                ].map((metric) => (
                  <div
                    key={metric.label}
                    style={{
                      padding: 12,
                      borderRadius: 10,
                      backgroundColor: '#f8fafc',
                      display: 'flex',
                      gap: 10
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 10,
                        backgroundColor: '#e0f2fe',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 18
                      }}
                    >
                      {metric.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 14,
                          color: '#1e293b'
                        }}
                      >
                        {metric.label}
                      </p>
                      <p
                        style={{
                          margin: 0,
                          marginTop: 4,
                          fontSize: 16,
                          fontWeight: 600,
                          color: '#1e293b'
                        }}
                      >
                        {metric.value} {metric.unit}
                      </p>
                      <span
                        style={{
                          display: 'inline-block',
                          marginTop: 4,
                          padding: '2px 8px',
                          borderRadius: 999,
                          fontSize: 11,
                          backgroundColor:
                            metric.status === '正常'
                              ? '#dcfce7'
                              : metric.status === '达标'
                              ? '#e0f2fe'
                              : metric.status === '充足'
                              ? '#dcfce7'
                              : '#fee2e2',
                          color:
                            metric.status === '正常'
                              ? '#166534'
                              : metric.status === '达标'
                              ? '#075985'
                              : metric.status === '充足'
                              ? '#166534'
                              : '#b91c1c'
                        }}
                      >
                        {metric.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* 建议 */}
              <div
                style={{
                  padding: 14,
                  borderRadius: 10,
                  backgroundColor: '#f8fafc',
                  marginBottom: 16
                }}
              >
                <h4
                  style={{
                    margin: 0,
                    marginBottom: 8,
                    fontSize: 16,
                    fontWeight: 600,
                    color: '#1e293b'
                  }}
                >
                  健康建议
                </h4>
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: 20,
                    fontSize: 14,
                    color: '#475569'
                  }}
                >
                  {selectedReport.recommendations.map((rec) => (
                    <li key={rec} style={{ marginBottom: 4 }}>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>

              {/* 风险因素 */}
              {selectedReport.riskFactors.length > 0 && (
                <div
                  style={{
                    padding: 14,
                    borderRadius: 10,
                    backgroundColor: '#fef2f2',
                    marginBottom: 16
                  }}
                >
                  <h4
                    style={{
                      margin: 0,
                      marginBottom: 8,
                      fontSize: 16,
                      fontWeight: 600,
                      color: '#b91c1c'
                    }}
                  >
                    风险因素
                  </h4>
                  <ul
                    style={{
                      margin: 0,
                      paddingLeft: 20,
                      fontSize: 14,
                      color: '#991b1b'
                    }}
                  >
                    {selectedReport.riskFactors.map((risk) => (
                      <li key={risk}>{risk}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 操作按钮 */}
              <div
                style={{
                  display: 'flex',
                  gap: 12,
                  marginTop: 4
                }}
              >
                <button
                  type="button"
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    borderRadius: 999,
                    border: 'none',
                    backgroundImage:
                      'linear-gradient(135deg, #10b981, #06b6d4)',
                    color: '#ffffff',
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  导出 PDF 报告
                </button>
                <button
                  type="button"
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    borderRadius: 999,
                    border: '1px solid #e2e8f0',
                    backgroundColor: '#ffffff',
                    color: '#1e293b',
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  分享报告
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
