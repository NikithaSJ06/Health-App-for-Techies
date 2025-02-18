import React, { useEffect, useState } from 'react';
import { Droplet, Activity, X, Bell, CheckCircle } from 'lucide-react';

function Reminders() {
  const [reminders, setReminders] = useState([]);
  const [waterIntake, setWaterIntake] = useState(0);
  const [exerciseMinutes, setExerciseMinutes] = useState(0);
  const [showNotification, setShowNotification] = useState(false);

  const WATER_GOAL = 8; // 8 glasses per day
  const EXERCISE_GOAL = 30; // 30 minutes per day

  useEffect(() => {
    // Water reminder
    const waterReminderInterval = setInterval(() => {
      addReminder("Time to drink water! Stay hydrated. 💧", "water");
      setShowNotification(true);
    }, 60 * 60 * 1000); // Every hour

    // Exercise reminder
    const exerciseReminderInterval = setInterval(() => {
      addReminder("Take a short walk! Stretch your legs. 🚶‍♂️", "exercise");
      setShowNotification(true);
    }, 2 * 60 * 60 * 1000); // Every 2 hours

    return () => {
      clearInterval(waterReminderInterval);
      clearInterval(exerciseReminderInterval);
    };
  }, []);

  const addReminder = (message, type) => {
    setReminders(prev => [...prev, { id: Date.now(), message, type }]);
  };

  const dismissReminder = (id) => {
    setReminders(prev => prev.filter(reminder => reminder.id !== id));
  };

  const addWaterGlass = () => {
    setWaterIntake(prev => Math.min(prev + 1, WATER_GOAL));
  };

  const addExerciseTime = () => {
    setExerciseMinutes(prev => Math.min(prev + 10, EXERCISE_GOAL));
  };

  const resetDaily = () => {
    setWaterIntake(0);
    setExerciseMinutes(0);
  };

  return (
    <div className="bg-white shadow-lg rounded-xl p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Bell className="w-6 h-6 text-blue-500" />
          Daily Health Tracker
        </h2>
        <button
          onClick={resetDaily}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          Reset Daily Progress
        </button>
      </div>

      {/* Progress Trackers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Water Intake */}
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-blue-700 flex items-center gap-2">
              <Droplet className="w-5 h-5" />
              Water Intake
            </h3>
            <span className="text-sm text-blue-600">{waterIntake}/{WATER_GOAL} glasses</span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2.5 mb-4">
            <div 
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${(waterIntake / WATER_GOAL) * 100}%` }}
            ></div>
          </div>
          <button
            onClick={addWaterGlass}
            className="w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
          >
            <Droplet className="w-4 h-4" />
            Log Water Intake
          </button>
        </div>

        {/* Exercise Tracking */}
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-green-700 flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Exercise Time
            </h3>
            <span className="text-sm text-green-600">{exerciseMinutes}/{EXERCISE_GOAL} minutes</span>
          </div>
          <div className="w-full bg-green-200 rounded-full h-2.5 mb-4">
            <div 
              className="bg-green-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${(exerciseMinutes / EXERCISE_GOAL) * 100}%` }}
            ></div>
          </div>
          <button
            onClick={addExerciseTime}
            className="w-full py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
          >
            <Activity className="w-4 h-4" />
            Log Exercise Time
          </button>
        </div>
      </div>

      {/* Active Reminders */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-700">Active Reminders</h3>
        {reminders.map(reminder => (
          <div 
            key={reminder.id}
            className={`flex items-center justify-between p-4 rounded-lg shadow-sm ${
              reminder.type === 'water' ? 'bg-blue-100' : 'bg-green-100'
            }`}
          >
            <div className="flex items-center gap-3">
              {reminder.type === 'water' ? (
                <Droplet className="w-5 h-5 text-blue-500" />
              ) : (
                <Activity className="w-5 h-5 text-green-500" />
              )}
              <p className={`${
                reminder.type === 'water' ? 'text-blue-700' : 'text-green-700'
              }`}>
                {reminder.message}
              </p>
            </div>
            <button
              onClick={() => dismissReminder(reminder.id)}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ))}
        {reminders.length === 0 && (
          <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg">
            <CheckCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p>No active reminders</p>
          </div>
        )}
      </div>

      {/* Notification Banner */}
      {showNotification && (
        <div className="fixed bottom-4 right-4 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg animate-slide-up">
          <button 
            onClick={() => setShowNotification(false)}
            className="absolute top-2 right-2"
          >
            <X className="w-4 h-4" />
          </button>
          <p>New health reminder! Check your dashboard.</p>
        </div>
      )}
    </div>
  );
}

export default Reminders;