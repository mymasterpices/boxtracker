import requests
import sys
from datetime import datetime
import json

class BoxInventoryAPITester:
    def __init__(self, base_url="https://inventory-pulse-250.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.created_boxes = []

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        # Add auth header for non-auth endpoints
        if self.token and not endpoint.startswith('auth/'):
            headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
                except:
                    print(f"   Response: {response.text[:100]}...")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text}")

            return success, response.json() if response.text and response.status_code < 500 else {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        success, response = self.run_test(
            "Root API Endpoint",
            "GET",
            "",
            200
        )
        return success

    def test_get_empty_boxes(self):
        """Test getting boxes when empty"""
        success, response = self.run_test(
            "Get Empty Boxes List",
            "GET",
            "boxes",
            200
        )
        return success and isinstance(response, list)

    def test_create_box(self, name, quantity=50, cost=2.5, min_threshold=10):
        """Create a box type"""
        box_data = {
            "name": name,
            "quantity": quantity,
            "cost": cost,
            "min_threshold": min_threshold
        }
        success, response = self.run_test(
            f"Create Box '{name}'",
            "POST",
            "boxes",
            200,
            data=box_data
        )
        if success and 'id' in response:
            self.created_boxes.append(response['id'])
            return response['id']
        return None

    def test_get_box(self, box_id):
        """Get a specific box by ID"""
        success, response = self.run_test(
            f"Get Box {box_id}",
            "GET",
            f"boxes/{box_id}",
            200
        )
        return success

    def test_update_box(self, box_id, update_data):
        """Update a box"""
        success, response = self.run_test(
            f"Update Box {box_id}",
            "PUT",
            f"boxes/{box_id}",
            200,
            data=update_data
        )
        return success

    def test_record_usage(self, box_id, quantity_used, date=None):
        """Record usage for a box"""
        usage_data = {
            "box_type_id": box_id,
            "quantity_used": quantity_used
        }
        if date:
            usage_data["date"] = date
            
        success, response = self.run_test(
            f"Record Usage - {quantity_used} boxes",
            "POST",
            "usage",
            200,
            data=usage_data
        )
        return success

    def test_get_usage_records(self, days=30):
        """Get usage records"""
        success, response = self.run_test(
            f"Get Usage Records ({days} days)",
            "GET",
            "usage",
            200,
            params={"days": days}
        )
        return success and isinstance(response, list)

    def test_get_usage_trends(self, days=14):
        """Get usage trends"""
        success, response = self.run_test(
            f"Get Usage Trends ({days} days)",
            "GET",
            "usage/trends",
            200,
            params={"days": days}
        )
        return success and isinstance(response, list)

    def test_get_dashboard_stats(self):
        """Get dashboard statistics"""
        success, response = self.run_test(
            "Get Dashboard Stats",
            "GET",
            "stats",
            200
        )
        expected_fields = ['total_box_types', 'total_inventory', 'total_value', 'low_stock_count', 'low_stock_boxes']
        if success:
            missing_fields = [field for field in expected_fields if field not in response]
            if missing_fields:
                print(f"   ⚠️  Missing fields: {missing_fields}")
                return False
        return success

    def test_delete_box(self, box_id):
        """Delete a box"""
        success, response = self.run_test(
            f"Delete Box {box_id}",
            "DELETE",
            f"boxes/{box_id}",
            200
        )
        return success

    def test_error_cases(self):
        """Test error handling"""
        print("\n🔍 Testing Error Cases...")
        
        # Test getting non-existent box
        success, _ = self.run_test(
            "Get Non-existent Box",
            "GET",
            "boxes/non-existent-id",
            404
        )
        
        # Test creating box with invalid data
        success2, _ = self.run_test(
            "Create Box with Empty Name",
            "POST",
            "boxes",
            422,  # Validation error
            data={"name": "", "quantity": 10}
        )
        
        return success and success2

def main():
    print("🚀 Starting Box Inventory API Tests")
    print("=" * 50)
    
    tester = BoxInventoryAPITester()
    
    # Test basic connectivity
    if not tester.test_root_endpoint():
        print("❌ Cannot connect to API, stopping tests")
        return 1
    
    # Test empty state
    tester.test_get_empty_boxes()
    tester.test_get_dashboard_stats()
    
    # Create test boxes
    box1_id = tester.test_create_box("Small Shipping Box", 100, 1.50, 20)
    box2_id = tester.test_create_box("Medium Box", 50, 2.75, 10)
    box3_id = tester.test_create_box("Large Box", 5, 5.00, 15)  # This will be low stock
    
    if not all([box1_id, box2_id, box3_id]):
        print("❌ Failed to create test boxes, stopping tests")
        return 1
    
    # Test box operations
    tester.test_get_box(box1_id)
    tester.test_update_box(box1_id, {"quantity": 80, "cost": 1.75})
    
    # Test usage recording
    tester.test_record_usage(box1_id, 10, "2024-01-15")
    tester.test_record_usage(box2_id, 5, "2024-01-16")
    tester.test_record_usage(box1_id, 15, "2024-01-17")
    
    # Test data retrieval
    tester.test_get_usage_records(30)
    tester.test_get_usage_trends(14)
    tester.test_get_dashboard_stats()
    
    # Test error cases
    tester.test_error_cases()
    
    # Test insufficient stock error
    print("\n🔍 Testing Insufficient Stock Error...")
    tester.run_test(
        "Record Usage - Insufficient Stock",
        "POST",
        "usage",
        400,  # Should return 400 for insufficient stock
        data={"box_type_id": box3_id, "quantity_used": 100}  # More than available
    )
    
    # Clean up - delete test boxes
    print("\n🧹 Cleaning up test data...")
    for box_id in tester.created_boxes:
        tester.test_delete_box(box_id)
    
    # Print final results
    print("\n" + "=" * 50)
    print(f"📊 Final Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print(f"❌ {tester.tests_run - tester.tests_passed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())