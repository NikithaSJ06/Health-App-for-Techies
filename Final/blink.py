import cv2
import mediapipe as mp
import time
import numpy as np
from scipy.spatial import distance as dist
from collections import deque
from plyer import notification  # For desktop notifications

# Initialize MediaPipe Face Mesh with optimized settings
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(
    min_detection_confidence=0.6,  # Slightly reduced from 0.65
    min_tracking_confidence=0.6,   # Slightly reduced for better tracking
    refine_landmarks=True,         # Enable refined landmarks for better eye detection
    max_num_faces=1                # Focus on a single face for better performance
)

# Define eye landmarks
LEFT_EYE = [33, 160, 158, 133, 153, 144]  
RIGHT_EYE = [362, 385, 387, 263, 373, 380]
LEFT_EYE_CONTOUR = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246]
RIGHT_EYE_CONTOUR = [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398]
EYE_CORNER_LANDMARKS = [33, 263]  # Outer eye corners

# Face orientation landmarks
NOSE_TIP = 4
LEFT_EAR = 234
RIGHT_EAR = 454
FOREHEAD = 10
CHIN = 152

# Constants - Optimized for fast blink detection
BASELINE_EAR = None
BLINK_DURATION_MIN_FRAMES = 1     # Reduced to catch very fast blinks
BLINK_DURATION_MAX_FRAMES = 7     # Max frames for a valid blink
SLOW_BLINK_THRESHOLD = 10         # Below this → fatigue
FAST_BLINK_THRESHOLD = 25         # Above this → stress
NOTIFICATION_INTERVAL = 3600     # Notify every hour (3600 seconds) instead of 20 seconds
EAR_THRESHOLD_ADJUSTMENT = 0.78   # Less strict threshold to catch fast blinks

# Variables
blink_count = 0
blink_frames = 0                  # Count frames during a blink instead of time
last_notification_time = time.time()
blinks_in_window = deque(maxlen=60)  # Track blinks over last 60 seconds
ear_buffer = deque(maxlen=5)      # Reduced buffer size for faster response
frame_counter = 0
glasses_detected = False
calibration_frames = 30
ear_history = []
prev_ear = None
in_blink = False
debug_mode = True  # Enable debugging info

# Advanced EAR calculation with head tilt compensation
def calculate_ear(eye_landmarks, face_landmarks, head_rotation):
    try:
        # Traditional EAR calculation
        A = dist.euclidean(face_landmarks[eye_landmarks[1]], face_landmarks[eye_landmarks[5]])
        B = dist.euclidean(face_landmarks[eye_landmarks[2]], face_landmarks[eye_landmarks[4]])
        C = dist.euclidean(face_landmarks[eye_landmarks[0]], face_landmarks[eye_landmarks[3]])
        
        # Basic EAR
        ear = (A + B) / (2.0 * C)
        
        # Apply head tilt compensation
        # Adjust EAR based on pitch and yaw angles
        ear = ear * (1.0 + 0.2 * abs(head_rotation['pitch']))  # Compensate for vertical tilt
        
        # Glasses compensation
        if glasses_detected:
            # Make it slightly more sensitive for glasses wearers
            ear = ear * 0.92
            
        return ear
    except:
        return 1.0  # Default value on error

# Function to detect if user is wearing glasses
def detect_glasses(face_landmarks, eye_contour_landmarks):
    try:
        # Check for irregular contours which might indicate glasses
        contour_points = [face_landmarks[i] for i in eye_contour_landmarks]
        contour_dists = []
        
        # Calculate the variance in distances between consecutive points
        for i in range(len(contour_points)-1):
            contour_dists.append(dist.euclidean(contour_points[i], contour_points[i+1]))
        
        variance = np.var(contour_dists)
        
        # Higher variance can indicate glasses frame interrupting the contour
        return variance > 60  # Threshold determined empirically
    except:
        return False

# Calculate 3D head rotation (approximate) for tilt compensation
def calculate_head_rotation(landmarks, frame_width, frame_height):
    try:
        # Get 3D coordinates (normalized by MediaPipe)
        nose = (landmarks[NOSE_TIP].x, landmarks[NOSE_TIP].y, landmarks[NOSE_TIP].z)
        left_ear = (landmarks[LEFT_EAR].x, landmarks[LEFT_EAR].y, landmarks[LEFT_EAR].z)
        right_ear = (landmarks[RIGHT_EAR].x, landmarks[RIGHT_EAR].y, landmarks[RIGHT_EAR].z)
        forehead = (landmarks[FOREHEAD].x, landmarks[FOREHEAD].y, landmarks[FOREHEAD].z)
        chin = (landmarks[CHIN].x, landmarks[CHIN].y, landmarks[CHIN].z)
        
        # Calculate yaw (horizontal rotation) - positive is turning right
        yaw = right_ear[0] - left_ear[0]  # Difference in x coordinates
        
        # Calculate roll (tilting head side to side)
        dy = right_ear[1] - left_ear[1]  # Difference in y coordinates
        dx = right_ear[0] - left_ear[0]  # Difference in x coordinates
        roll = np.arctan2(dy, dx) if dx != 0 else 0
        
        # Calculate pitch (nodding up/down)
        pitch = forehead[1] - chin[1]  # Difference in y coordinates
        
        return {
            'yaw': yaw,
            'pitch': pitch,
            'roll': roll
        }
    except:
        return {'yaw': 0, 'pitch': 0, 'roll': 0}

# Function to send desktop notification
def send_notification(title, message):
    try:
        notification.notify(
            title=title,
            message=message,
            app_name="Blink Monitor",
            timeout=30  # Notification will stay for 10 seconds
        )
        print(f"Desktop Notification sent: {title} - {message}")
    except Exception as e:
        print(f"Failed to send notification: {e}")
        # Fallback to console notification
        print(f"ALERT: {title} - {message}")

# Improved blink detection state machine
class BlinkDetector:
    def __init__(self):
        self.state = "OPEN"
        self.blink_frames = 0
        self.open_frames = 0
        self.total_blinks = 0
        self.min_blink_frames = BLINK_DURATION_MIN_FRAMES
        self.max_blink_frames = BLINK_DURATION_MAX_FRAMES
        self.min_open_frames = 2  # Minimum frames eyes must be open between blinks
        
    def update(self, is_closed, ear_value, threshold):
        blink_detected = False
        debug_info = ""
        
        if self.state == "OPEN":
            if is_closed:
                self.state = "CLOSING"
                self.blink_frames = 1
                debug_info = "OPEN→CLOSING"
            else:
                debug_info = "OPEN"
        
        elif self.state == "CLOSING":
            if is_closed:
                self.blink_frames += 1
                if self.blink_frames >= self.min_blink_frames:
                    self.state = "CLOSED"
                debug_info = f"CLOSING ({self.blink_frames})"
            else:
                # Too short to be a blink, return to OPEN
                self.state = "OPEN"
                debug_info = "CLOSING→OPEN (too brief)"
        
        elif self.state == "CLOSED":
            if is_closed:
                self.blink_frames += 1
                if self.blink_frames > self.max_blink_frames:
                    # Eyes held closed too long, not a normal blink
                    self.state = "HELD_CLOSED"
                debug_info = f"CLOSED ({self.blink_frames})"
            else:
                self.state = "OPENING"
                debug_info = "CLOSED→OPENING"
        
        elif self.state == "OPENING":
            if not is_closed:
                self.open_frames += 1
                if self.open_frames >= self.min_open_frames:
                    # Confirmed successful blink
                    self.total_blinks += 1
                    blink_detected = True
                    self.state = "OPEN"
                    self.open_frames = 0
                    debug_info = "BLINK DETECTED!"
                else:
                    debug_info = f"OPENING ({self.open_frames})"
            else:
                # Eyes closed again, go back to CLOSED
                self.state = "CLOSED"
                debug_info = "OPENING→CLOSED"
        
        elif self.state == "HELD_CLOSED":
            if not is_closed:
                self.state = "OPENING"
                self.open_frames = 1
                debug_info = "HELD_CLOSED→OPENING"
            else:
                debug_info = "HELD_CLOSED"
        
        return blink_detected, debug_info

# Initialize blink detector
blink_detector = BlinkDetector()

# Start webcam
cap = cv2.VideoCapture(0)

# Send startup notification
send_notification("Blink Monitor Started", "Monitoring your blink rate. Will notify you hourly if your blink rate is abnormal.")

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break

    # Flip the frame horizontally for a more natural view
    frame = cv2.flip(frame, 1)
    
    # Convert frame to RGB
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    
    # Process the frame
    results = face_mesh.process(rgb_frame)

    frame_height, frame_width, _ = frame.shape
    current_time = time.time()
    frame_counter += 1
    
    # Status text for display
    status_text = ""
    ear_text = ""
    tilt_text = ""

    if results.multi_face_landmarks:
        for face_landmarks in results.multi_face_landmarks:
            # Calculate head rotation for tilt compensation
            head_rotation = calculate_head_rotation(face_landmarks.landmark, frame_width, frame_height)
            
            # Display head tilt information
            tilt_text = f"Pitch: {head_rotation['pitch']:.2f}, Yaw: {head_rotation['yaw']:.2f}"
            
            # Convert normalized coordinates to pixel coordinates
            landmarks = []
            for i in range(len(face_landmarks.landmark)):
                x = int(face_landmarks.landmark[i].x * frame_width)
                y = int(face_landmarks.landmark[i].y * frame_height)
                landmarks.append((x, y))
            
            # Check if user is wearing glasses
            left_glasses = detect_glasses(landmarks, LEFT_EYE_CONTOUR)
            right_glasses = detect_glasses(landmarks, RIGHT_EYE_CONTOUR)
            glasses_detected = left_glasses or right_glasses
            
            # Calculate EAR for both eyes with head tilt compensation
            left_ear = calculate_ear(LEFT_EYE, landmarks, head_rotation)
            right_ear = calculate_ear(RIGHT_EYE, landmarks, head_rotation)
            avg_ear = (left_ear + right_ear) / 2
            
            # Fast response smoothing - basic averaging
            if prev_ear is not None:
                # Weighted average favoring new value for faster response
                avg_ear = 0.7 * avg_ear + 0.3 * prev_ear
            prev_ear = avg_ear
            
            # Calibration phase
            if frame_counter <= calibration_frames:
                ear_history.append(avg_ear)
                status_text = f"Calibrating... {int(frame_counter/calibration_frames*100)}%"
                
                if frame_counter == calibration_frames:
                    # Calculate baseline EAR from calibration
                    sorted_ears = sorted(ear_history)
                    # Use 70th percentile as baseline for better sensitivity
                    percentile_idx = int(len(sorted_ears) * 0.7)
                    BASELINE_EAR = sorted_ears[percentile_idx]
                    
                    # Calculate standard deviation for dynamic thresholding
                    std_dev = np.std(ear_history)
                    print(f"Calibration complete - Baseline EAR: {BASELINE_EAR:.4f}, StdDev: {std_dev:.4f}")
                    
                    # Notify user that calibration is complete
                    send_notification("Calibration Complete", "Blink monitor has been calibrated and is now tracking your blink rate.")
            
            # Only process blinks after calibration
            if BASELINE_EAR is not None:
                # Calculate threshold - dynamically adjust based on glasses
                current_threshold_adjustment = EAR_THRESHOLD_ADJUSTMENT
                if glasses_detected:
                    current_threshold_adjustment += 0.03  # More sensitive for glasses
                
                BLINK_THRESHOLD = BASELINE_EAR * current_threshold_adjustment
                
                # Detect if eyes are closed based on EAR
                is_closed = avg_ear < BLINK_THRESHOLD
                
                # Update blink detector state machine
                blink_detected, debug_info = blink_detector.update(is_closed, avg_ear, BLINK_THRESHOLD)
                
                if blink_detected:
                    blink_count += 1
                    blinks_in_window.append(time.time())
                    status_text = f"Blink Detected! Total: {blink_count}"
                
                # Display current EAR value and state for debugging
                ear_text = f"EAR: {avg_ear:.3f} / Threshold: {BLINK_THRESHOLD:.3f}"
                if debug_mode:
                    ear_text += f" | State: {debug_info}"
                
                # Draw eye contours with color based on state
                if is_closed:
                    eye_color = (0, 0, 255)  # Red for closed eyes
                else:
                    eye_color = (0, 255, 0)  # Green for open eyes
                
                # Draw eye landmarks
                for i in LEFT_EYE + RIGHT_EYE:
                    cv2.circle(frame, landmarks[i], 2, eye_color, -1)
                
                # Draw eye contours
                for eye in [LEFT_EYE_CONTOUR, RIGHT_EYE_CONTOUR]:
                    for i in range(len(eye)-1):
                        cv2.line(frame, landmarks[eye[i]], landmarks[eye[i+1]], eye_color, 1)
                    cv2.line(frame, landmarks[eye[-1]], landmarks[eye[0]], eye_color, 1)

    # Calculate BPM over last 60 seconds
    blinks_in_window = [t for t in blinks_in_window if time.time() - t <= 60]
    bpm = len(blinks_in_window)

    # Notify every hour (NOTIFICATION_INTERVAL) instead of 20 seconds
    if current_time - last_notification_time >= NOTIFICATION_INTERVAL:
        last_notification_time = current_time
        
        if bpm < SLOW_BLINK_THRESHOLD:
            status_text = f"Slow Blink Rate! ({bpm} BPM) - You may be fatigued."
            # Send desktop notification for slow blink rate
            send_notification(
                "Low Blink Rate Detected", 
                f"Your current blink rate is {bpm} blinks per minute. This is below the recommended rate and may indicate fatigue. Consider taking a break."
            )
        elif bpm > FAST_BLINK_THRESHOLD:
            status_text = f"Fast Blink Rate! ({bpm} BPM) - You may be stressed."
            # Send desktop notification for fast blink rate
            send_notification(
                "High Blink Rate Detected", 
                f"Your current blink rate is {bpm} blinks per minute. This is above the normal rate and may indicate stress. Consider taking a short break to relax."
            )
        else:
            status_text = f"Normal Blink Rate ({bpm} BPM)"
            # Optional: notify even for normal blink rate
            send_notification(
                "Normal Blink Rate", 
                f"Your current blink rate is {bpm} blinks per minute, which is within the normal range."
            )

    # Display the frame with info
    cv2.putText(frame, f"Blink Rate: {bpm} BPM", (30, 50), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
    
    if glasses_detected:
        cv2.putText(frame, "Glasses Detected", (30, 80), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 0, 0), 2)
    
    if status_text:
        cv2.putText(frame, status_text, (30, 110), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 165, 255), 2)
    
    if ear_text:
        cv2.putText(frame, ear_text, (30, 140), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
    
    if tilt_text:
        cv2.putText(frame, tilt_text, (30, 170), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
    
    # Display next notification time
    time_until_next = int(NOTIFICATION_INTERVAL - (current_time - last_notification_time))
    minutes = time_until_next // 60
    seconds = time_until_next % 60
    cv2.putText(frame, f"Next notification in: {minutes}m {seconds}s", 
                (30, 200), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
    
    cv2.imshow('Blink Tracker', frame)

    # Exit on pressing 'q'
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# Send shutdown notification
send_notification("Blink Monitor Stopped", "Blink rate monitoring has been stopped.")

# Cleanup
cap.release()
cv2.destroyAllWindows()