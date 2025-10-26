import React, { useMemo } from 'react';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Title
} from 'chart.js';

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend, Title);

function percent(n) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

export default function DashboardCharts({ flights = [], warehouse = { capacityPct: 0 } }) {
  const { statusData, cartsData, capacityData } = useMemo(() => {
    const ready = flights.filter(f => f.status === 'Ready').length;
    const active = flights.filter(f => f.status === 'Active').length;
    const pending = flights.filter(f => f.status === 'Pending').length;

    const statusData = {
      labels: ['Ready', 'Active', 'Pending'],
      datasets: [
        {
          label: 'Flights',
          data: [ready, active, pending],
          backgroundColor: ['#52c41a', '#faad14', '#f5222d'],
          borderWidth: 0
        }
      ]
    };

    const cartsValues = flights.slice(0, 5).map(f => {
      const total = f.carts.length || 0;
      const completed = f.carts.filter(c => c.completed).length;
      return total === 0 ? 0 : percent((completed / total) * 100);
    });
    const cartsLabels = flights.slice(0, 5).map(f => f.id);
    const cartsData = {
      labels: cartsLabels,
      datasets: [
        {
          label: '% carts completed',
          data: cartsValues,
          backgroundColor: '#020064',
          borderRadius: 6,
        }
      ]
    };

    const capacityData = {
      labels: ['Capacity'],
      datasets: [
        {
          label: 'Warehouse Capacity',
          data: [percent(warehouse.capacityPct), 100 - percent(warehouse.capacityPct)],
          backgroundColor: ['#1890ff', '#e6f7ff'],
          borderWidth: 0,
        }
      ]
    };

    return { statusData, cartsData, capacityData };
  }, [flights, warehouse]);

  const doughnutOpts = {
    responsive: true,
    plugins: {
      legend: { position: 'bottom' },
      title: { display: true, text: 'Flights by status' }
    },
    cutout: '60%'
  };

  const barOpts = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: true, text: 'Carts completion per flight' }
    },
    scales: {
      y: { beginAtZero: true, max: 100, ticks: { callback: (v) => `${v}%` } }
    }
  };

  const capacityOpts = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: true, text: 'Warehouse capacity' }
    },
    rotation: -90,
    circumference: 180,
    cutout: '70%'
  };

  return (
    <section className="charts-card">
      <h2>Insights</h2>
      <div className="charts-grid">
        <div className="chart-item"><Doughnut data={statusData} options={doughnutOpts} /></div>
        <div className="chart-item"><Bar data={cartsData} options={barOpts} /></div>
        <div className="chart-item"><Doughnut data={capacityData} options={capacityOpts} /></div>
      </div>
    </section>
  );
}
