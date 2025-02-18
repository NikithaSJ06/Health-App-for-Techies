import React from 'react';
import { Activity, Heart, Calendar, ArrowUp, Clock, Award, TrendingUp } from 'lucide-react';

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-800 mb-2">Welcome Back!</h1>
          <p className="text-gray-600">Track your health and wellness journey</p>
        </div>
        <div className="mt-4 md:mt-0">
          <span className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
            <Activity className="w-4 h-4 mr-2" />
            Active Status
          </span>
        </div>
      </div>

      {/* Stat Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Health Overview Card */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-6 rounded-lg shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-white mb-4">Health Overview</h2>
              <div className="space-y-3">
                <div className="flex items-center text-white">
                  <Heart className="w-5 h-5 mr-2" />
                  <span className="opacity-90">72 BPM</span>
                </div>
                <div className="flex items-center text-white">
                  <ArrowUp className="w-5 h-5 mr-2" />
                  <span className="opacity-90">12% from yesterday</span>
                </div>
              </div>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <Activity className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        {/* Progress Tracker Card */}
        <div className="bg-white p-6 rounded-lg shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl">
          <div className="flex items-start justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-700">Progress Tracker</h2>
            <Award className="w-6 h-6 text-yellow-500" />
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Daily Goal</span>
                <span className="text-sm font-medium text-blue-600">45%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className="bg-blue-500 h-4 rounded-full transition-all duration-500"
                  style={{ width: "45%" }}
                ></div>
              </div>
            </div>
            <div className="flex items-center text-green-500 text-sm">
              <TrendingUp className="w-4 h-4 mr-1" />
              <span>15% increase from last week</span>
            </div>
          </div>
        </div>

        {/* Today's Schedule Card */}
        <div className="bg-white p-6 rounded-lg shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl">
          <div className="flex items-start justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-700">Today's Schedule</h2>
            <Calendar className="w-6 h-6 text-indigo-500" />
          </div>
          <ul className="space-y-3">
            <li className="flex items-center text-gray-600">
              <Clock className="w-4 h-4 mr-2 text-indigo-500" />
              <span>Morning Workout - 7:00 AM</span>
            </li>
            <li className="flex items-center text-gray-600">
              <Clock className="w-4 h-4 mr-2 text-indigo-500" />
              <span>Meditation - 12:00 PM</span>
            </li>
            <li className="flex items-center text-gray-600">
              <Clock className="w-4 h-4 mr-2 text-indigo-500" />
              <span>Evening Run - 6:00 PM</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Health Insights Section */}
      <div className="mt-10 bg-white p-6 rounded-lg shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">Health Insights</h2>
          <button className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors duration-300">
            View Details
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center mb-2">
              <Heart className="w-5 h-5 text-red-500 mr-2" />
              <span className="font-medium text-gray-700">Heart Rate</span>
            </div>
            <p className="text-gray-600">Average: 72 BPM</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center mb-2">
              <Activity className="w-5 h-5 text-green-500 mr-2" />
              <span className="font-medium text-gray-700">Activity Level</span>
            </div>
            <p className="text-gray-600">Above Average</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center mb-2">
              <Award className="w-5 h-5 text-yellow-500 mr-2" />
              <span className="font-medium text-gray-700">Achievement</span>
            </div>
            <p className="text-gray-600">3 Goals Completed</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;