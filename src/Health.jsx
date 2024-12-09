import React, { useState, useEffect } from 'react';
import './App.css';
import { Line } from "react-chartjs-2";
import {Chart as ChartJS, LineElement, PointElement, LinearScale, Title, Tooltip, CategoryScale} from "chart.js";

ChartJS.register(LineElement, PointElement, LinearScale, Title, Tooltip, CategoryScale);

const username = process.env.REACT_APP_USERNAME || '';
const password = process.env.REACT_APP_PASSWORD || '';
const url = process.env.REACT_APP_URL || '';
const auth = btoa(`${username}:${password}`); 

const Health = () => {
  const [res, setRes] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        setRes(data);
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };

    fetchData();
  }, []);

  const formatDate = (dob) => {
    const date = new Date(dob);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const levelMap = {
    'Lower than Average': -1,
    'Normal': 0,
    'Higher than Average': 1,
  };
  const reverseMap = {
    '-1': 'Lower than Average',
    '0': 'Normal',
    '1': 'Higher than Average',
  };

  const calculateAvg = (data) => {
    const vals = data.map((entry) => levelMap[entry.levels]);
    const avg = vals.reduce((sum, level) => sum + level, 0) / vals.length;
  
    const rounded = Math.round(avg);
    return reverseMap[rounded];
  };

  if (!res) return <div className="flex items-center justify-center h-screen">Loading...</div>;
  const ans = res?.find((r) => r.name === 'Jessica Taylor');
  console.log(ans);
  const hRate = ans.diagnosis_history.reduce((sum, rate) => sum + rate.heart_rate.value, 0) / ans.diagnosis_history.length;
  const resp = ans.diagnosis_history.reduce((sum, rate) => sum + rate.respiratory_rate.value, 0) / ans.diagnosis_history.length;
  const temp = ans.diagnosis_history.reduce((sum, rate) => sum + rate.temperature.value, 0) / ans.diagnosis_history.length;
  const heartTemp = ans.diagnosis_history.map((history) => history.heart_rate);
  const respTemp = ans.diagnosis_history.map((history) => history.respiratory_rate);
  const tempTemp = ans.diagnosis_history.map((history) => history.temperature);

  const BloodPressureChart = ({ diagnosisHistory }) => {
      const reversedHistory = [...diagnosisHistory].reverse().slice(-6);
      const labels = reversedHistory.map((entry) => `${entry.month} ${entry.year}`);
      const systolic = reversedHistory.map((entry) => entry.blood_pressure.systolic.value);
      const diastolic = reversedHistory.map((entry) => entry.blood_pressure.diastolic.value);
      const avgSystolic = (systolic.reduce((sum, val) => sum + val, 0) / systolic.length).toFixed(1);
      const avgDiastolic = (diastolic.reduce((sum, val) => sum + val, 0) / diastolic.length).toFixed(1);
      const systolicStat = calculateAvg(reversedHistory.map((entry) => entry.blood_pressure.systolic));
      const diastolicStat = calculateAvg(reversedHistory.map((entry) => entry.blood_pressure.diastolic));

      const data = {
        labels, 
        datasets: [
          {
            label: "Systolic",
            data: systolic,
            borderColor: "pink",
            tension: 0.3,
          },
          {
            label: "Diastolic",
            data: diastolic,
            borderColor: "purple",
            tension: 0.3,
          },
        ],
      };
      const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "top",
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: "Months",
            },
          },
          y: {
            title: {
              display: true,
              text: "Blood Pressure (mmHg)",
            },
          },
        },
      };
      return (
      <div className="grid grid-cols-3 gap-6 items-center bg-white rounded shadow-md p-4">
        <div className="col-span-2 h-full">
          <Line data={data} options={options} />
        </div>
        <div className="space-y-4">
          <div className="text-left">
            <h2 className="text-lg font-bold text-pink-500">Average Systolic</h2>
            <p className="text-2xl font-semibold text-gray-700">{avgSystolic}</p>
            <p className="mt-2 text-xl font-semibold text-gray-700">{systolicStat}</p>
          </div>
          <div className="text-left">
            <h2 className="text-lg font-bold text-purple-500">Average Diastolic</h2>
            <p className="text-2xl font-semibold text-gray-700">{avgDiastolic}</p>
            <p className="mt-2 text-xl font-semibold text-gray-700">{diastolicStat}</p>
          </div>
        </div>
      </div>);
    }

  return (
      <div className="grid grid-cols-4 gap-4 bg-gray-100 p-6 min-h-screen">
        <div className="col-span-3 space-y-6">
          <BloodPressureChart diagnosisHistory={ans.diagnosis_history} />

          <div className="grid grid-cols-3 gap-4">
            {[
              { title: 'Respiratory Rate', value: `${resp} bpm`, status: `${calculateAvg(respTemp)}`, color: '#e0f3fa'},
              { title: 'Temperature', value: `${temp}°C`, status: `${calculateAvg(tempTemp)}`, color: '#ffe6e9'},
              { title: 'Heart Rate', value: `${hRate} bpm`, status: `${calculateAvg(heartTemp)}`, color: '#ffe6f1'},
            ].map((metric, idx) => (
              <div
                key={idx}
                className="rounded shadow-md p-6 text-left flex flex-col"
                style={{backgroundColor: metric.color}}
              >
                <h2 className="text-lg font-bold">{metric.title}</h2>
                <p className="text-2xl font-semibold text-500">{metric.value}</p>
                <p className='mt-5'>{metric.status}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded shadow-md p-6">
            <h2 className="text-lg font-bold mb-4">Diagnostic List</h2>
            <table className="w-full table-auto border-collapse">
              <thead>
                <tr className="bg-gray-200 text-left">
                  {['Problem/Diagnosis', 'Description', 'Status'].map((header, idx) => (
                    <th key={idx} className="border p-2">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ans.diagnostic_list.map((list, index) => (
                  <tr
                    key={index}
                    className="text-left odd:bg-white even:bg-gray-50"
                  >
                    <td className="border p-2">{list.name}</td>
                    <td className="border p-2">{list.description}</td>
                    <td className="border p-2">{list.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="col-span-1 space-y-4">
          <div className="bg-white rounded shadow-md p-6 text-center">
            <img
              src={ans.profile_picture}
              alt="Profile"
              className="rounded-full w-32 h-32 mx-auto mb-4"
            />
            <h1 className="text-xl font-bold">{ans.name}</h1>
            <p className="mt-4 text-left">
              <strong>Date of Birth</strong> <br />{formatDate(ans.date_of_birth)}
            </p>
            <p className="text-left">
              <strong>Gender:</strong> <br /> {ans.gender}
            </p>
            <div className="space-y-2 text-left">
              <p>
                <strong>Contact Info</strong> <br />{ans.phone_number}
              </p>
              <p>
                <strong>Emergency Contacts</strong> <br />{ans.emergency_contact}
              </p>
              <p>
                <strong>Insurance Provider</strong> <br />{ans.insurance_type}
              </p>
            </div>
          </div>

          <div className="bg-white rounded shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">Lab Results</h2>
            <ul className="space-y-2 text-left">
              {ans.lab_results.map((res, index) => (
                <li key={index} className="text-gray-800">
                  {res}
                </li>
              ))}
            </ul>
          </div>
        </div>
    </div>

  );
};

export default Health;
