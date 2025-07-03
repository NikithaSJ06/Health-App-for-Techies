import React, { useState, useEffect } from 'react';
import { Pie, Line } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

const HealthDashboard = () => {
  // BMI State
  const [metrics, setMetrics] = useState({
    weight: '',
    height: '',
    age: ''
  });
  const [bmiData, setBmiData] = useState(null);
  const [history, setHistory] = useState([]);
  
  // Screen Time State
  const [screenTime, setScreenTime] = useState({
    today: 0,
    workMode: false
  });
  const [screenTimeHistory, setScreenTimeHistory] = useState([]);
  const [screenTimeAlert, setScreenTimeAlert] = useState('');
  const [showDefaultScreenTime, setShowDefaultScreenTime] = useState(false);
  
  // UI State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Generate random default screen time (20-120 minutes)
  const getDefaultScreenTime = () => Math.floor(Math.random() * 101) + 20;

  // BMI Calculations (unchanged from original)
  const calculateBmi = (weight, height) => {
    if (!weight || !height) return null;
    
    const bmi = Math.round((weight / ((height / 100) ** 2)) * 10) / 10;
    const classification = classifyBmi(bmi);
    const analysis = getBmiAnalysis(classification);
    
    return {
      bmi,
      classification,
      ...analysis,
      lastUpdated: new Date().toLocaleString()
    };
  };

  const classifyBmi = (bmi) => {
    if (bmi < 18.5) return "Underweight";
    else if (bmi < 25) return "Normal weight";
    else if (bmi < 30) return "Overweight";
    else if (bmi < 35) return "Obesity (Class 1)";
    else if (bmi < 40) return "Obesity (Class 2)";
    else return "Extreme Obesity (Class 3)";
  };

  const getBmiAnalysis = (classification) => {
    const analyses = {
      "Underweight": {
        healthRisks: [
          "Increased risk of osteoporosis and bone fractures",
          "Higher susceptibility to infections",
          "Potential fertility issues in women",
          "Nutritional deficiencies"
        ],
        recommendations: [
          "Add nutrient-dense foods like nuts and avocados",
          "Consider small, frequent meals",
          "Incorporate protein-rich foods at every meal",
          "Focus on strength training to build muscle mass"
        ],
        quickTips: [
          "Set reminders to eat regularly",
          "Keep healthy snacks available",
          "Stand up and stretch every hour"
        ]
      },
      "Normal weight": {
        healthRisks: [
          "Lower risk of chronic diseases with healthy lifestyle",
          "Potential for metabolic issues if poor body composition"
        ],
        recommendations: [
          "Maintain current balance of nutrition and activity",
          "Incorporate variety of foods",
          "Stay hydrated with water",
          "Aim for 150 minutes of activity weekly"
        ],
        quickTips: [
          "Use a standing desk periodically",
          "Take short walk breaks",
          "Keep a water bottle handy"
        ]
      },
      "Overweight": {
        healthRisks: [
          "3x higher risk of type 2 diabetes",
          "Higher likelihood of high blood pressure",
          "Increased risk of coronary heart disease",
          "Greater chance of osteoarthritis"
        ],
        recommendations: [
          "Aim for 5-10% weight reduction initially",
          "Create 500 calorie daily deficit",
          "Increase protein intake",
          "Replace refined carbs with fiber"
        ],
        quickTips: [
          "Use smaller plates for meals",
          "Swap sugary drinks for water",
          "Start meetings with stretching"
        ]
      },
      "Obesity (Class 1)": {
        healthRisks: [
          "7x higher risk of type 2 diabetes",
          "High probability of sleep apnea",
          "Increased risk of gallbladder disease",
          "Higher likelihood of fatty liver"
        ],
        recommendations: [
          "Target 10% weight reduction over 6 months",
          "Focus on whole foods",
          "Begin with low-impact exercises",
          "Gradually increase activity"
        ],
        quickTips: [
          "Use timer to stand regularly",
          "Keep food journal",
          "Find exercise accountability partner"
        ]
      },
      "Obesity (Class 2)": {
        healthRisks: [
          "Extremely high cardiovascular risk",
          "Increased likelihood of stroke",
          "Higher chance of metabolic syndrome",
          "Greater risk of kidney disease"
        ],
        recommendations: [
          "Consult healthcare provider",
          "Join structured weight loss program",
          "Start with gentle movement",
          "Focus on sustainable changes"
        ],
        quickTips: [
          "Use ergonomic supports",
          "Practice mindful eating",
          "Try seated exercises"
        ]
      },
      "Extreme Obesity (Class 3)": {
        healthRisks: [
          "Life-threatening heart failure risk",
          "Very high risk of blood clots",
          "Severe breathing difficulties",
          "10-15 years reduced life expectancy"
        ],
        recommendations: [
          "Medical professional consultation",
          "Small achievable lifestyle changes",
          "Water-based exercises",
          "Realistic short-term goals"
        ],
        quickTips: [
          "Specialized ergonomic equipment",
          "Gentle seated stretches",
          "Proper breathing techniques"
        ]
      }
    };
    
    return analyses[classification] || {
      healthRisks: ["Unknown risks - consult doctor"],
      recommendations: ["Consult healthcare provider"],
      quickTips: ["Schedule health check-up"]
    };
  };

  // Screen Time Analysis (unchanged from original)
  const getScreenTimeAnalysis = (minutes) => {
    const percentage = ((minutes / 1440) * 100).toFixed(1);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const timeString = `${hours > 0 ? `${hours}h ` : ''}${mins}m`;

    if (minutes <= 120) {
      return {
        title: "Healthy Screen Time",
        healthRisks: [
          "Minimal digital eye strain risk",
          "Low probability of posture issues",
          "Unlikely to impact sleep quality"
        ],
        insights: [
          `Only ${percentage}% of your day on screens`,
          "Below average screen time",
          "Good digital habits likely"
        ],
        recommendations: [
          "Maintain this balance",
          "Track specific app usage",
          "Use night mode in evenings"
        ],
        timeString
      };
    } else if (minutes <= 240) {
      return {
        title: "Moderate Screen Time",
        healthRisks: [
          "Potential eye strain and headaches",
          "Increased neck/back pain risk",
          "Possible sleep disruption",
          "Mild sedentary behavior risks"
        ],
        insights: [
          `${percentage}% of day (${timeString})`,
          "Close to average screen time",
          "Watch productive vs passive use"
        ],
        recommendations: [
          "Reduce passive scrolling",
          "Use app timers for social media",
          "Practice 20-20-20 rule (every 20 mins, look at something 20 feet away for 20 seconds)"
        ],
        timeString
      };
    } else {
      return {
        title: "Excessive Screen Time",
        healthRisks: [
          "High computer vision syndrome risk",
          "Significant sedentary behavior risks",
          "Likely sleep/circadian disruption",
          "Increased tech neck and RSI risk",
          "Potential mental health impacts"
        ],
        insights: [
          `${percentage}% of day (${timeString})`,
          "Above healthy limits",
          "Impacts sleep, posture, mental health"
        ],
        recommendations: [
          "Set no-screen times",
          "Enable grayscale mode",
          "Replace 30 mins with activity",
          "Weekly digital detox day",
          "Use blue light filters"
        ],
        timeString
      };
    }
  };

  // Screen Time Functions (unchanged from original)
  const checkScreenTimeAlerts = (minutes, workMode) => {
    const breakThreshold = workMode ? 180 : 120;
    const riskThreshold = workMode ? 360 : 240;
    
    if (minutes >= riskThreshold) {
      setScreenTimeAlert(`Warning: You've spent more than ${riskThreshold/60} hours on screen today. This can impact your health!`);
    } else if (minutes >= breakThreshold) {
      setScreenTimeAlert(`Alert: You've exceeded ${breakThreshold/60} hours of screen time. Take a break!`);
    } else {
      setScreenTimeAlert('');
    }
  };

  const logScreenTime = (minutes, workMode) => {
    const today = new Date().toISOString().split('T')[0];
    const newEntry = {
      date: today,
      minutes,
      workMode
    };
    
    const updatedHistory = [newEntry, ...screenTimeHistory.filter(entry => entry.date !== today)];
    setScreenTimeHistory(updatedHistory);
    localStorage.setItem('screenTimeHistory', JSON.stringify(updatedHistory));
    
    setScreenTime({
      today: minutes,
      workMode
    });
    localStorage.setItem('screenTime', JSON.stringify({ today: minutes, workMode }));
    
    checkScreenTimeAlerts(minutes, workMode);
    setShowDefaultScreenTime(false);
  };

  // Generate Charts (unchanged from original)
  const getScreenTimePieData = () => {
    const screenMinutes = showDefaultScreenTime ? getDefaultScreenTime() : screenTime.today;
    const otherMinutes = 1440 - screenMinutes;
    
    return {
      labels: ['Screen Time', 'Other Activities'],
      datasets: [{
        data: [screenMinutes, otherMinutes],
        backgroundColor: ['#ff9999', '#66b3ff'],
        hoverBackgroundColor: ['#ff6666', '#3399ff']
      }]
    };
  };

  const getWeeklyTrendData = () => {
    const days = [];
    const screenTimes = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const entry = screenTimeHistory.find(e => e.date === dateStr);
      days.push(dateStr.slice(5));
      screenTimes.push(entry ? entry.minutes : 0);
    }
    
    return {
      labels: days,
      datasets: [{
        label: 'Screen Time (minutes)',
        data: screenTimes,
        fill: false,
        backgroundColor: 'rgb(75, 192, 192)',
        borderColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1
      }]
    };
  };

  // Load saved data (unchanged from original)
  useEffect(() => {
    const loadData = () => {
      try {
        // Load BMI data
        const savedMetrics = localStorage.getItem('healthMetrics');
        const savedHistory = localStorage.getItem('healthHistory');
        
        if (savedMetrics) {
          const parsed = JSON.parse(savedMetrics);
          setMetrics(parsed);
          if (parsed.weight && parsed.height) {
            setBmiData(calculateBmi(parseFloat(parsed.weight), parseFloat(parsed.height)));
          }
        }
        
        if (savedHistory) {
          setHistory(JSON.parse(savedHistory));
        }
        
        // Load Screen Time data
        const savedScreenTime = localStorage.getItem('screenTime');
        const savedScreenHistory = localStorage.getItem('screenTimeHistory');
        
        if (savedScreenTime) {
          const parsed = JSON.parse(savedScreenTime);
          setScreenTime(parsed);
          checkScreenTimeAlerts(parsed.today, parsed.workMode);
        }
        
        if (savedScreenHistory) {
          setScreenTimeHistory(JSON.parse(savedScreenHistory));
        }

        // Show default screen time if no data exists
        if (!savedScreenTime && !savedScreenHistory) {
          setShowDefaultScreenTime(true);
        }
      } catch (error) {
        console.error("Error loading data:", error);
        setError("Failed to load saved data.");
      }
    };

    loadData();
  }, []);

  // BMI Form Handling (unchanged from original)
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setMetrics(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const { weight, height, age } = metrics;
    
    if (!weight || !height || !age) {
      setError('All fields are required');
      setLoading(false);
      return;
    }
    
    if (weight <= 0 || height <= 0 || age <= 0) {
      setError('Values must be positive');
      setLoading(false);
      return;
    }
    
    if (weight > 500 || height > 300 || age > 120) {
      setError('Values exceed reasonable limits');
      setLoading(false);
      return;
    }

    try {
      const newBmiData = calculateBmi(parseFloat(weight), parseFloat(height));
      setBmiData(newBmiData);
      
      const historyEntry = {
        date: new Date().toLocaleString(),
        weight: parseFloat(weight),
        height: parseFloat(height),
        age: parseInt(age),
        bmi: newBmiData.bmi,
        classification: newBmiData.classification
      };
      
      const savedHistory = localStorage.getItem('healthHistory');
      let updatedHistory = [];
      
      if (savedHistory) {
        updatedHistory = JSON.parse(savedHistory);
      }
      
      updatedHistory = [historyEntry, ...updatedHistory].slice(0, 100);
      
      setHistory(updatedHistory);
      localStorage.setItem('healthHistory', JSON.stringify(updatedHistory));
      localStorage.setItem('healthMetrics', JSON.stringify(metrics));
      
    } catch (err) {
      setError('Failed to update metrics. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Screen Time Form Handling (unchanged from original)
  const handleScreenTimeChange = (e) => {
    const { name, value } = e.target;
    setScreenTime(prev => ({
      ...prev,
      [name]: name === 'workMode' ? e.target.checked : parseInt(value) || 0
    }));
  };

  const handleScreenTimeSubmit = (e) => {
    e.preventDefault();
    logScreenTime(screenTime.today, screenTime.workMode);
  };

  const getUnifiedHistory = () => {
    const historyMap = {};
    
    history.forEach(entry => {
      const dateKey = new Date(entry.date).toLocaleDateString();
      historyMap[dateKey] = { ...entry };
    });
    
    screenTimeHistory.forEach(entry => {
      const dateKey = new Date(entry.date).toLocaleDateString();
      if (historyMap[dateKey]) {
        historyMap[dateKey].screenTime = entry.minutes;
        historyMap[dateKey].workMode = entry.workMode;
      } else {
        historyMap[dateKey] = {
          date: dateKey,
          screenTime: entry.minutes,
          workMode: entry.workMode
        };
      }
    });
    
    return Object.values(historyMap).sort((a, b) => {
      return new Date(b.date) - new Date(a.date);
    });
  };

  // Get current screen time analysis
  const currentScreenTime = showDefaultScreenTime ? getDefaultScreenTime() : screenTime.today;
  const screenAnalysis = getScreenTimeAnalysis(currentScreenTime);

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
        <div className="p-6 md:p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Health Dashboard</h1>
          <p className="text-gray-600">Track your health metrics and screen time habits</p>
        </div>
        
        <div className="flex border-b border-gray-200 px-6">
          <button 
            className={`py-3 px-4 font-medium text-sm md:text-base transition-colors duration-200 ${
              activeTab === 'dashboard' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('dashboard')}
          >
            <i className="fas fa-tachometer-alt mr-2"></i>
            Dashboard
          </button>
          <button 
            className={`py-3 px-4 font-medium text-sm md:text-base transition-colors duration-200 ${
              activeTab === 'history' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('history')}
          >
            <i className="fas fa-history mr-2"></i>
            History
          </button>
        </div>
      </div>
      
      {activeTab === 'dashboard' ? (
        <div className="space-y-8">
          {/* BMI Section */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Metrics Form */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="bg-blue-100 p-2 rounded-lg mr-3">
                    <i className="fas fa-weight text-blue-600"></i>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-800">Update Your Metrics</h2>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                    <input
                      type="number"
                      name="weight"
                      value={metrics.weight}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      placeholder="Enter weight"
                      step="0.1"
                      min="0"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
                    <input
                      type="number"
                      name="height"
                      value={metrics.height}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      placeholder="Enter height"
                      step="0.1"
                      min="0"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                    <input
                      type="number"
                      name="age"
                      value={metrics.age}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      placeholder="Enter age"
                      min="0"
                    />
                  </div>
                  
                  {error && (
                    <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                      <i className="fas fa-exclamation-circle mr-2"></i>
                      {error}
                    </div>
                  )}
                  
                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        Updating...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save mr-2"></i>
                        Update Metrics
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
            
            {/* BMI Analysis */}
            {bmiData ? (
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="bg-green-100 p-2 rounded-lg mr-3">
                      <i className="fas fa-chart-line text-green-600"></i>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-800">Your BMI Analysis</h2>
                  </div>
                  
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold text-gray-800">{bmiData.bmi}</p>
                        <p className={`text-sm font-medium ${
                          bmiData.classification === "Normal weight" ? "text-green-600" :
                          bmiData.classification.includes("Obesity") ? "text-red-600" :
                          "text-yellow-600"
                        }`}>
                          {bmiData.classification}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Last updated</p>
                        <p className="text-xs text-gray-600">{bmiData.lastUpdated}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h3 className="font-medium text-blue-800 mb-2 flex items-center">
                        <i className="fas fa-exclamation-triangle mr-2"></i>
                        Health Risks
                      </h3>
                      <ul className="space-y-2">
                        {bmiData.healthRisks.map((risk, index) => (
                          <li key={index} className="text-sm text-gray-700 flex items-start">
                            <span className="text-blue-500 mr-1">•</span>
                            {risk}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h3 className="font-medium text-purple-800 mb-2 flex items-center">
                        <i className="fas fa-lightbulb mr-2"></i>
                        Recommendations
                      </h3>
                      <ul className="space-y-2">
                        {bmiData.recommendations.map((rec, index) => (
                          <li key={index} className="text-sm text-gray-700 flex items-start">
                            <span className="text-purple-500 mr-1">•</span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h3 className="font-medium text-green-800 mb-2 flex items-center">
                        <i className="fas fa-bolt mr-2"></i>
                        Quick Tips
                      </h3>
                      <ul className="space-y-2">
                        {bmiData.quickTips.map((tip, index) => (
                          <li key={index} className="text-sm text-gray-700 flex items-start">
                            <span className="text-green-500 mr-1">•</span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-md overflow-hidden flex items-center justify-center h-full">
                <div className="p-6 text-center">
                  <div className="bg-gray-100 p-4 rounded-full inline-block mb-3">
                    <i className="fas fa-chart-pie text-gray-400 text-xl"></i>
                  </div>
                  <p className="text-gray-500">Enter your metrics to see BMI analysis</p>
                  <p className="text-sm text-gray-400 mt-1">We'll provide personalized health insights</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Screen Time Section */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Screen Time Form */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="bg-indigo-100 p-2 rounded-lg mr-3">
                    <i className="fas fa-desktop text-indigo-600"></i>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-800">Screen Time Tracking</h2>
                </div>
                
                <form onSubmit={handleScreenTimeSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Today's Screen Time (minutes)</label>
                    <div className="relative">
                      <input
                        type="number"
                        name="today"
                        value={screenTime.today}
                        onChange={handleScreenTimeChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        placeholder="Enter minutes"
                        min="0"
                        max="1440"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                        mins
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="flex items-center h-5">
                      <input
                        type="checkbox"
                        name="workMode"
                        checked={screenTime.workMode}
                        onChange={handleScreenTimeChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                    <label className="ml-2 block text-sm text-gray-700">
                      Work Mode (longer thresholds)
                    </label>
                  </div>
                  
                  <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center"
                  >
                    <i className="fas fa-clock mr-2"></i>
                    Update Screen Time
                  </button>
                </form>
                
                {screenTimeAlert && (
                  <div className={`mt-4 p-3 rounded-lg flex items-start ${
                    screenTimeAlert.includes('Warning') 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    <i className={`fas ${
                      screenTimeAlert.includes('Warning') 
                        ? 'fa-exclamation-triangle' 
                        : 'fa-info-circle'
                    } mr-2 mt-0.5`}></i>
                    <span>{screenTimeAlert}</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Screen Time Analysis */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="bg-pink-100 p-2 rounded-lg mr-3">
                    <i className="fas fa-chart-pie text-pink-600"></i>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-800">Screen Time Analysis</h2>
                </div>
                
                {showDefaultScreenTime && (
                  <div className="mb-4 p-3 bg-blue-50 text-blue-800 rounded-lg flex items-start">
                    <i className="fas fa-info-circle mr-2 mt-0.5"></i>
                    <span className="text-sm">Showing sample data. Track your actual screen time for personalized insights.</span>
                  </div>
                )}
                
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div className="h-64">
                    <Pie 
                      data={getScreenTimePieData()} 
                      options={{ 
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'bottom',
                            labels: {
                              font: {
                                family: "'Inter', sans-serif"
                              }
                            }
                          },
                          title: {
                            display: true,
                            text: showDefaultScreenTime ? 'Sample Screen Time Distribution' : 'Your Screen Time Today',
                            font: {
                              family: "'Inter', sans-serif",
                              size: 14
                            }
                          }
                        }
                      }}
                    />
                  </div>
                  
                  <div className="h-64">
                    <Line 
                      data={getWeeklyTrendData()} 
                      options={{ 
                        maintainAspectRatio: false,
                        scales: {
                          y: {
                            beginAtZero: true,
                            max: 600,
                            ticks: {
                              stepSize: 60
                            }
                          }
                        },
                        plugins: {
                          legend: {
                            position: 'bottom',
                            labels: {
                              font: {
                                family: "'Inter', sans-serif"
                              }
                            }
                          }
                        },
                        elements: {
                          line: {
                            tension: 0.4
                          }
                        }
                      }}
                    />
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-lg text-gray-800 mb-3 flex items-center">
                    <i className={`fas ${
                      screenAnalysis.title.includes('Healthy') ? 'fa-check-circle text-green-500' :
                      screenAnalysis.title.includes('Moderate') ? 'fa-exclamation-circle text-yellow-500' :
                      'fa-times-circle text-red-500'
                    } mr-2`}></i>
                    {screenAnalysis.title}
                  </h3>
                  
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <h4 className="font-medium text-sm text-gray-700 mb-2 flex items-center">
                        <i className="fas fa-heartbeat text-red-400 mr-2"></i>
                        Health Risks
                      </h4>
                      <ul className="space-y-2">
                        {screenAnalysis.healthRisks.map((risk, index) => (
                          <li key={index} className="text-xs text-gray-600 flex items-start">
                            <span className="text-gray-400 mr-1">•</span>
                            {risk}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-sm text-gray-700 mb-2 flex items-center">
                        <i className="fas fa-chart-bar text-blue-400 mr-2"></i>
                        Insights
                      </h4>
                      <ul className="space-y-2">
                        {screenAnalysis.insights.map((insight, index) => (
                          <li key={index} className="text-xs text-gray-600 flex items-start">
                            <span className="text-gray-400 mr-1">•</span>
                            {insight}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-sm text-gray-700 mb-2 flex items-center">
                        <i className="fas fa-lightbulb text-yellow-400 mr-2"></i>
                        Recommendations
                      </h4>
                      <ul className="space-y-2">
                        {screenAnalysis.recommendations.map((rec, index) => (
                          <li key={index} className="text-xs text-gray-600 flex items-start">
                            <span className="text-gray-400 mr-1">•</span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6">
            <div className="flex items-center mb-6">
              <div className="bg-purple-100 p-2 rounded-lg mr-3">
                <i className="fas fa-history text-purple-600"></i>
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Health History</h2>
            </div>
            
            {getUnifiedHistory().length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weight (kg)</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Height (cm)</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">BMI</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Screen Time</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Work Mode</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {getUnifiedHistory().map((entry, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{entry.date}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{entry.weight || '—'}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{entry.height || '—'}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{entry.bmi || '—'}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {entry.classification ? (
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              entry.classification === "Normal weight" ? "bg-green-100 text-green-800" :
                              entry.classification.includes("Obesity") ? "bg-red-100 text-red-800" :
                              "bg-yellow-100 text-yellow-800"
                            }`}>
                              {entry.classification}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {entry.screenTime ? (
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              entry.screenTime <= 120 ? "bg-green-100 text-green-800" :
                              entry.screenTime <= 240 ? "bg-yellow-100 text-yellow-800" :
                              "bg-red-100 text-red-800"
                            }`}>
                              {entry.screenTime} mins
                            </span>
                          ) : '—'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {entry.workMode !== undefined ? (
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              entry.workMode ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"
                            }`}>
                              {entry.workMode ? 'Yes' : 'No'}
                            </span>
                          ) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="bg-gray-100 p-4 rounded-full inline-block mb-3">
                  <i className="fas fa-database text-gray-400 text-xl"></i>
                </div>
                <p className="text-gray-500">No history data available</p>
                <p className="text-sm text-gray-400 mt-1">Update your metrics and screen time to see data here</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthDashboard;