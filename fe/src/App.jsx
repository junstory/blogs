import React, { useEffect, useState } from 'react';

const SENSOR_INFO = {
  mq2:    { name: 'MQ-2',    unit: '' },
  mq135:  { name: 'MQ-135',  unit: '' },
  lm35dz: { name: 'LM35DZ',  unit: '°C' },
  dm436:  { name: 'DM436',   unit: '' },
  relay:  { name: '릴레이',  unit: '' }
};

function App() {
  const [sensorData, setSensorData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let intervalId;

    const fetchData = () => {
      fetch('http://localhost:8888/data')
        .then(res => res.json())
        .then(data => {
          setSensorData(data);
          setLoading(false);
        })
        .catch(() => {
          setSensorData(null);
          setLoading(false);
        });
    };

    fetchData();
    intervalId = setInterval(fetchData, 1000);

    return () => clearInterval(intervalId);
  }, []);

  if (loading) return <p style={{ textAlign: 'center', marginTop: 40 }}>Loading...</p>;
  if (!sensorData) return <p style={{ textAlign: 'center', marginTop: 40 }}>데이터가 없습니다.</p>;

  // created_at 출력용 포맷 (예: 2023-05-22 15:30:00)
  const formatDateTime = dateStr => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleString();
  };

  return (
    <div style={{
      maxWidth: 900,
      margin: '40px auto',
      fontFamily: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
        Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif`,
      backgroundColor: '#f9fafb',
      padding: 30,
      borderRadius: 12,
      boxShadow: '0 8px 24px rgba(149, 157, 165, 0.2)'
    }}>
      <h1 style={{ textAlign: 'center', color: '#2c3e50', marginBottom: 10, fontWeight: '700' }}>
        센서 데이터 대시보드
      </h1>
      <p style={{ textAlign: 'center', color: '#7f8c8d', marginBottom: 20 }}>
        데이터 생성 시간: {formatDateTime(sensorData.created_at)}
      </p>
      <table style={{
        width: '100%',
        borderCollapse: 'separate',
        borderSpacing: '0 12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <thead>
          <tr style={{ backgroundColor: '#34495e', color: 'white', textAlign: 'left' }}>
            <th style={{ padding: '14px 24px', borderTopLeftRadius: 12, borderBottomLeftRadius: 12 }}>센서 이름</th>
            <th style={{ padding: '14px 24px', borderTopRightRadius: 12, borderBottomRightRadius: 12 }}>현재 값</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(sensorData).filter(([key]) => key !== 'created_at').map(([key, value], idx) => {
            const info = SENSOR_INFO[key] || { name: key, unit: '' };
            return (
              <tr key={key} style={{
                backgroundColor: idx % 2 === 0 ? 'white' : '#f4f7f9',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                borderRadius: 8,
                fontWeight: 500,
                color: '#34495e',
              }}>
                <td style={{ padding: '16px 24px', borderTopLeftRadius: 8, borderBottomLeftRadius: 8 }}>{info.name}</td>
                <td style={{ padding: '16px 24px', borderTopRightRadius: 8, borderBottomRightRadius: 8 }}>
                  {(value === null || value === undefined || value === '') ? (
                    <span style={{ color: '#bdc3c7', fontStyle: 'italic' }}>측정된 값이 없습니다</span>
                  ) : (
                    <>
                      {value}{info.unit && <span style={{ marginLeft: 4, color: '#7f8c8d' }}>{info.unit}</span>}
                    </>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default App;