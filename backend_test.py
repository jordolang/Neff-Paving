import requests
import json
import sys
from datetime import datetime

class NeffPavingAPITester:
    def __init__(self, base_url="http://localhost:8001"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}{endpoint}"
        
        if headers is None:
            headers = {'Content-Type': 'application/json'}
        
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            
            # Try to get JSON response, but handle cases where response is not JSON
            try:
                response_data = response.json()
            except:
                response_data = {"text": response.text}
            
            result = {
                "name": name,
                "success": success,
                "expected_status": expected_status,
                "actual_status": response.status_code,
                "response": response_data
            }
            
            self.test_results.append(result)
            
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"Response: {response_data}")

            return success, response_data

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.test_results.append({
                "name": name,
                "success": False,
                "error": str(e)
            })
            return False, {"error": str(e)}

    def test_health_check(self):
        """Test the health check endpoint"""
        return self.run_test(
            "Health Check",
            "GET",
            "/api/health",
            200
        )

    def test_admin_login(self, username, password):
        """Test admin login and get token"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "/api/auth/login",
            200,
            data={"username": username, "password": password}
        )
        
        if success and response.get('token'):
            self.token = response['token']
            return True
        return False

    def test_submit_estimate(self):
        """Test estimate submission"""
        test_data = {
            "firstName": "Test",
            "lastName": "User",
            "email": "test@example.com",
            "phone": "555-123-4567",
            "serviceType": "residential",
            "projectAddress": "123 Test St, Columbus, OH",
            "projectSize": "500 sq ft",
            "timeline": "2weeks",
            "projectDescription": "Test project for API testing"
        }
        
        return self.run_test(
            "Submit Estimate",
            "POST",
            "/api/estimates",
            200,
            data=test_data
        )

    def test_get_estimates(self):
        """Test getting estimates list"""
        return self.run_test(
            "Get Estimates",
            "GET",
            "/api/estimates",
            200
        )

    def test_calculate_area(self):
        """Test area calculation API"""
        # Sample coordinates forming a square
        test_data = {
            "coordinates": [
                {"lat": 40.0, "lng": -83.0},
                {"lat": 40.0, "lng": -82.9},
                {"lat": 39.9, "lng": -82.9},
                {"lat": 39.9, "lng": -83.0}
            ]
        }
        
        return self.run_test(
            "Calculate Area",
            "POST",
            "/api/maps/calculate-area",
            200,
            data=test_data
        )

    def test_dashboard_stats(self):
        """Test dashboard stats endpoint"""
        return self.run_test(
            "Dashboard Stats",
            "GET",
            "/api/admin/dashboard/stats",
            200
        )

    def test_dashboard_activities(self):
        """Test dashboard activities endpoint"""
        return self.run_test(
            "Dashboard Activities",
            "GET",
            "/api/admin/dashboard/activities",
            200
        )

    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*50)
        print(f"API TEST SUMMARY: {self.tests_passed}/{self.tests_run} tests passed")
        print("="*50)
        
        if self.tests_passed == self.tests_run:
            print("✅ All tests passed!")
        else:
            print("❌ Some tests failed:")
            for result in self.test_results:
                if not result.get("success"):
                    name = result['name']
                    error = result.get('error')
                    if error:
                        print(f"  - {name}: {error}")
                    else:
                        expected = result.get("expected_status")
                        actual = result.get("actual_status")
                        print(f"  - {name}: Expected {expected}, got {actual}")
        
        return self.tests_passed == self.tests_run

def main():
    # Get backend URL from environment or use default
    backend_url = "http://localhost:8001"
    
    print(f"Testing Neff Paving API at {backend_url}")
    tester = NeffPavingAPITester(backend_url)
    
    # Test health check
    tester.test_health_check()
    
    # Test admin login
    if tester.test_admin_login("admin", "admin123"):
        print("✅ Admin login successful, proceeding with authenticated tests")
        
        # Test dashboard endpoints
        tester.test_dashboard_stats()
        tester.test_dashboard_activities()
        
        # Test estimates endpoints
        tester.test_get_estimates()
    else:
        print("❌ Admin login failed, skipping authenticated tests")
    
    # Test public endpoints
    tester.test_submit_estimate()
    tester.test_calculate_area()
    
    # Print summary
    success = tester.print_summary()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())