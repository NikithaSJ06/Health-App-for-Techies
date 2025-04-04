# Health-App-for-Techies

''' cites to be refered:
1.  posture correction:  https://dl.acm.org/doi/fullHtml/10.1145/3529190.3535341?utm_source=chatgpt.com
2. virtual ergonomic recomendation:  https://www.nature.com/articles/s41598-024-79373-4?utm_source=chatgpt.com
3. Real-Time Posture Monitoring and Risk Assessment for Manual Lifting Tasks Using MediaPipe and LSTM:  https://arxiv.org/html/2408.12796v1?utm_source=chatgpt.com
4. Validation of Computer Vision-Based Ergonomic Risk Assessment:  https://www.nature.com/articles/s41598-024-79373-4?utm_source=chatgpt.com
5. A Systematic Review: Advancing Ergonomic Posture Risk Assessment through the Integration of Computer Vision and Machine Learning Techniques:  https://www.researchgate.net/publication/386359873_A_Systematic_Review_Advancing_Ergonomic_Posture_Risk_Assessment_through_the_Integration_of_Computer_Vision_and_Machine_Learning_Techniques
6. Diabetes Prediction Using Machine Learning Techniques: https://ieeexplore.ieee.org/document/10714699
7. https://github.com/itakurah/Sitting-Posture-Detection-YOLOv5
8. most useful: https://www.youtube.com/watch?v=OukxehGS9dQ
9.posture detection and correction using ml and dl https://ieeexplore.ieee.org/document/10079726
10.Classification and Disease Prediction of Heart Rate Signals Based on Random Forest  https://ieeexplore.ieee.org/document/10709083
11.pretrained models detecting arrhythmia https://bmcmedinformdecismak.biomedcentral.com/articles/10.1186/s12911-023-02326-w
# project phases: https://docs.google.com/document/d/106SEq-HIb3afYkRiXSunx8daqEXWS4E9MM7pVOVFn1M/edit?usp=sharing
# further scope: https://docs.google.com/document/d/1IDZkG5064P8EQc36vqi07I-eNG7TGG6esziIWKHzP20/edit?usp=sharing
# docs abstract link: https://docs.google.com/document/d/1He-idULRvf_YrWvpkGUdLUMlkRTlhvMeQfVtzdt2f64/edit?usp=sharing
https://pmc.ncbi.nlm.nih.gov/articles/PMC6118863/?utm_source=chatgpt.com  Data used to identify blink rate changes

#Datasets
https://www.kaggle.com/datasets/unidatapro/phone-and-webcam-video 
https://www.kaggle.com/datasets/arashnic/fitbit

Screen Time Tracker

A Flask application that helps users track and manage their screen time.
Features

    User registration and authentication
    Screen time logging with work mode option
    Health metrics tracking (weight, height, age)
    Customized alerts based on screen time usage
    Weekly insights with visualizations
    Personalized recommendations based on usage patterns

Setup Instructions

    Clone the repository
    Install required packages:

    pip install flask matplotlib

    Set up the database:

    python database_setup.py

    Run the application:

    python app.py

    Access the application at http://localhost:5000

API Endpoints
User Management

    POST /register - Register a new user
    POST /login - Login existing user

Health Metrics

    POST /health-metrics/<user_id> - Save health metrics
    GET /health-metrics/<user_id> - Retrieve health metrics

Screen Time

    POST /log - Log screen time
    GET /alerts/<user_id> - Get alerts based on today's screen time
    GET /insights/<user_id> - Get weekly insights and recommendations

Data Structure

The application uses SQLite with three main tables:

    users - Stores user credentials and basic information
    health_metrics - Stores user health data
    screen_time - Tracks daily screen time usage

Security Notes

    For production use, implement proper password hashing (e.g., bcrypt)
    Add user session management
    Implement CSRF protection
    Use environment variables for secrets

