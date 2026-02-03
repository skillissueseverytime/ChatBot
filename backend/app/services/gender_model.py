import logging
import requests
import os

logger = logging.getLogger(__name__)

# Local Model Service URL (Running in your terminal)
API_URL = "http://localhost:5000/predict_gender"

class GenderModel:
    def __init__(self):
        pass

    def predict(self, image_path: str):
        """
        Send image to local gender detection service.
        Returns: tuple(gender_string|None, error_message|None)
        """
        if not os.path.exists(image_path):
            return None, "System error: Image file missing."

        try:
            # Prepare file for upload
            with open(image_path, 'rb') as f:
                files = {'image': (os.path.basename(image_path), f, 'image/jpeg')}
                
                logger.info(f"Sending verification request to {API_URL}...")
                response = requests.post(API_URL, files=files, timeout=60) # 60s timeout
            
            # Check HTTP Status
            if response.status_code != 200:
                logger.error(f"API Error ({response.status_code}): {response.text}")
                try:
                    error_json = response.json()
                    if "error" in error_json:
                        return None, f"Verification failed: {error_json['error']}"
                except:
                    pass
                return None, "Verification service error."

            # Parse Success Response
            result = response.json()
            gender = result.get("gender")
            confidence = result.get("confidence", 0)
            
            logger.info(f"Local Model Response: {gender} ({confidence}%)")

            if not gender:
                return None, "Invalid response from model service."

            # Normalize
            if gender.lower() in ["man", "male"]:
                return "Man", None
            elif gender.lower() in ["woman", "female"]:
                return "Woman", None
                
            return None, f"Unknown gender result: {gender}"

        except requests.exceptions.ConnectionError:
            logger.error("Local Service Connection Error")
            return None, "Gender Service is not running. Please ensure 'app.py' is running on port 5000."
        except Exception as e:
            logger.error(f"Integration error: {e}")
            return None, "Verification process failed."

# Singleton instance
gender_model = GenderModel()
