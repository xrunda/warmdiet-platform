import React from 'react';
import './App.css';

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>🍽️ 三餐管家 (WarmDiet)</h1>
        <p>医疗健康管理系统 - 患者日常餐食记录与医生授权管理平台</p>
      </header>

      <main className="app-main">
        <div className="card">
          <h2>👤 患者端（C端 - 免费）</h2>
          <ul>
            <li>餐食记录管理</li>
            <li>健康分析报告</li>
            <li>医生授权管理</li>
            <li>个人设置</li>
          </ul>
        </div>

        <div className="card">
          <h2>🏥 医院端（B端 - 付费订阅）</h2>
          <ul>
            <li>访问患者数据</li>
            <li>随诊健康管理</li>
            <li>数据统计报告</li>
            <li>专属技术支持</li>
          </ul>
        </div>

        <div className="card">
          <h2>📋 套餐定价</h2>
          <table className="pricing-table">
            <thead>
              <tr>
                <th>套餐</th>
                <th>医生数量</th>
                <th>价格</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>基础版</td>
                <td>1-5 位</td>
                <td>¥299/月</td>
              </tr>
              <tr>
                <td>专业版</td>
                <td>6-20 位</td>
                <td>¥899/月</td>
              </tr>
              <tr>
                <td>企业版</td>
                <td>20+ 位</td>
                <td>¥1999/月起</td>
              </tr>
            </tbody>
          </table>
        </div>
      </main>

      <footer className="app-footer">
        <p>符合《个人信息保护法》要求 · 患者自主控制授权 · 可随时撤销</p>
      </footer>
    </div>
  );
}

export default App;