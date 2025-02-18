import React, { useState, useRef, useEffect } from 'react';
import { Camera, CameraOff, AlertCircle, Shield, ShieldAlert, CheckCircle2, Bell } from 'lucide-react';

const PostureAnalysis = () => {
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [error, setError] = useState('');
  const [postureStatus, setPostureStatus] = useState('good');
  const [notifications, setNotifications] = useState([]);
  const [calibrationState, setCalibrationState] = useState('not-started');
  const [calibrationStep, setCalibrationStep] = useState(0);
  const [countdown, setCountdown] = useState(5);
  const [calibrationData, setCalibrationData] = useState(null);
  const [notificationCooldown, setNotificationCooldown] = useState(false);
  const [lastNotificationTime, setLastNotificationTime] = useState(null);
  const [notificationPermission, setNotificationPermission] = useState('default');

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const analyzerRef = useRef(null);
  const countdownRef = useRef(null);

  const NOTIFICATION_COOLDOWN = 30000; // 30 seconds

  useEffect(() => {
    // Check notification permission on component mount
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const requestNotificationPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  };

  const showDesktopNotification = (message) => {
    if (notificationPermission === 'granted') {
      const notification = new Notification('Posture Alert', {
        body: message,
        icon: '/favicon.ico',
        tag: 'posture-alert'
      });

      setTimeout(() => notification.close(), 5000);
    }
  };

  const calibrationSteps = [
    {
      title: "Sit in Your Best Posture",
      instructions: "Sit up straight, align your head, shoulders and hips. Keep your screen at eye level."
    },
    {
      title: "Position Your Face",
      instructions: "Look straight at the camera. Your entire face should be visible in the frame."
    },
    {
      title: "Position Your Upper Body",
      instructions: "Make sure your shoulders and upper body are visible in the frame."
    }
  ];

  const startCamera = async () => {
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      streamRef.current = stream;
      setIsCameraOn(true);
      setCalibrationState('not-started');
    } catch (err) {
      setError('Unable to access camera. Please ensure you have granted camera permissions.');
      console.error("Error accessing camera:", err);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setIsCameraOn(false);
      stopPostureAnalysis();
      setCalibrationState('not-started');
      setCalibrationStep(0);
    }
  };

  const toggleCamera = () => {
    if (isCameraOn) {
      stopCamera();
    } else {
      startCamera();
    }
  };

  const startCalibration = () => {
    setCalibrationState('in-progress');
    setCalibrationStep(0);
    stopPostureAnalysis();
  };

  const nextCalibrationStep = () => {
    if (calibrationStep < calibrationSteps.length - 1) {
      setCalibrationStep(prev => prev + 1);
    } else {
      startCalibrationCountdown();
    }
  };

  const startCalibrationCountdown = () => {
    setCalibrationState('countdown');
    setCountdown(5);
    
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownRef.current);
          captureCalibrationData();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const captureCalibrationData = () => {
    const mockCalibrationData = {
      headPosition: { x: 0.5, y: 0.3 },
      shoulderAlignment: 0.95,
      timestamp: Date.now()
    };
    
    setCalibrationData(mockCalibrationData);
    setCalibrationState('complete');
    startPostureAnalysis();
  };

  const startPostureAnalysis = () => {
    analyzerRef.current = setInterval(() => {
      const randomPosture = Math.random() > 0.7 ? 'bad' : 'good';
      setPostureStatus(randomPosture);
      
      if (randomPosture === 'bad' && !notificationCooldown) {
        const now = Date.now();
        addNotification('Poor posture detected! Please sit up straight.');
        setNotificationCooldown(true);
        setLastNotificationTime(now);
        
        setTimeout(() => {
          setNotificationCooldown(false);
        }, NOTIFICATION_COOLDOWN);
      }
    }, 2000);
  };

  const stopPostureAnalysis = () => {
    if (analyzerRef.current) {
      clearInterval(analyzerRef.current);
    }
  };

  const addNotification = (message) => {
    const now = Date.now();
    
    setNotifications(prev => {
      if (prev.some(n => n.message === message)) {
        return prev;
      }
      
      // Show desktop notification
      showDesktopNotification(message);

      const newNotification = {
        id: now,
        message,
        timestamp: now
      };

      const updatedNotifications = [...prev, newNotification].slice(-3);

      setTimeout(() => {
        setNotifications(current => 
          current.filter(n => n.id !== newNotification.id)
        );
      }, 5000);

      return updatedNotifications;
    });
  };

  useEffect(() => {
    return () => {
      stopPostureAnalysis();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white/50 backdrop-blur-sm border border-gray-200 rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h1 className="flex items-center gap-2 text-3xl font-bold text-gray-800">
            <Camera className="w-8 h-8" />
            Posture Analysis
          </h1>
        </div>
        
        <div className="p-6 space-y-6">
          {notificationPermission === 'default' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-600" />
                <h3 className="font-medium text-blue-800">Enable Desktop Notifications</h3>
              </div>
              <p className="mt-2 text-sm text-blue-600">
                Get alerts when your posture needs correction, even when the app is in the background.
              </p>
              <button
                onClick={requestNotificationPermission}
                className="mt-3 w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Enable Notifications
              </button>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <p>{error}</p>
            </div>
          )}

          <div className="flex gap-4 flex-col md:flex-row">
            <div className="flex-1">
              <div className="relative aspect-video rounded-xl overflow-hidden border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                {!isCameraOn && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 space-y-4">
                    <Camera className="w-16 h-16" />
                    <p className="text-lg font-medium">Camera feed will appear here</p>
                  </div>
                )}
                {calibrationState === 'countdown' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50">
                    <div className="text-6xl font-bold text-white">{countdown}</div>
                    <p className="text-white mt-2">Hold your posture</p>
                  </div>
                )}
              </div>
            </div>

            {isCameraOn && (
              <div className="w-full md:w-64 space-y-4">
                {calibrationState === 'not-started' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-medium text-blue-800">Calibration Required</h3>
                    <p className="mt-2 text-sm text-blue-600">Please calibrate your posture before starting the analysis.</p>
                    <button
                      onClick={startCalibration}
                      className="mt-3 w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Start Calibration
                    </button>
                  </div>
                )}

                {calibrationState === 'in-progress' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-blue-800">
                        {calibrationSteps[calibrationStep].title}
                      </h3>
                    </div>
                    <p className="mt-2 text-sm text-blue-600">
                      {calibrationSteps[calibrationStep].instructions}
                    </p>
                    <button
                      onClick={nextCalibrationStep}
                      className="mt-3 w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Next Step
                    </button>
                  </div>
                )}

                {calibrationState === 'complete' && (
                  <>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <h3 className="font-medium text-green-800">Calibration Complete</h3>
                      </div>
                      <p className="mt-2 text-sm text-green-600">
                        Your posture baseline has been set. Analysis is now active.
                      </p>
                    </div>

                    <div className={`p-4 rounded-lg ${
                      postureStatus === 'good' 
                        ? 'bg-green-50 border border-green-200' 
                        : 'bg-red-50 border border-red-200'
                    }`}>
                      <div className="flex items-center gap-2">
                        {postureStatus === 'good' ? (
                          <Shield className="w-5 h-5 text-green-600" />
                        ) : (
                          <ShieldAlert className="w-5 h-5 text-red-600" />
                        )}
                        <h3 className={`font-medium ${
                          postureStatus === 'good' ? 'text-green-800' : 'text-red-800'
                        }`}>
                          {postureStatus === 'good' ? 'Good Posture' : 'Poor Posture'}
                        </h3>
                      </div>
                      <p className={`mt-2 text-sm ${
                        postureStatus === 'good' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {postureStatus === 'good' 
                          ? 'Keep up the good work!' 
                          : 'Please adjust your sitting position.'}
                      </p>
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  {notifications.map(notification => (
                    <div 
                      key={notification.id}
                      className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800"
                    >
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-red-600" />
                        <h4 className="font-medium">Posture Alert</h4>
                      </div>
                      <p className="mt-1 text-sm text-red-600">{notification.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <button
              onClick={toggleCamera}
              className={`px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all duration-200 ${
                isCameraOn 
                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              {isCameraOn ? (
                <>
                  <CameraOff className="w-5 h-5" />
                  Stop Camera
                </>
              ) : (
                <>
                  <Camera className="w-5 h-5" />
                  Start Camera
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostureAnalysis;