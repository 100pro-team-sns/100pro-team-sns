import requests
import json

def test_api():
    base_url = "http://localhost:8000"
    
    print("=" * 50)
    print("APIテスト開始")
    print("=" * 50)
    
    # 1. ヘルスチェック
    print("\n1. Health Check:")
    response = requests.get(f"{base_url}/health")
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.json()}")
    
    # 2. 有効なトークンでテスト（東京駅）
    print("\n2. Valid Token Test (Tokyo Station):")
    data = {
        "token": "test_token_12345",
        "latitude": 35.681382,
        "longitude": 139.766084,
        "speed": 30.0,
        "direction": 180.0
    }
    response = requests.post(f"{base_url}/api/set-location", json=data)
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.json()}")
    
    # 3. 東京駅の位置情報（山手線上）でテスト
    print("\n3. Tokyo Station Location Test (山手線):")
    print("   Note: 有効なトークンが必要です")
    
    # 4. 速度が低い場合のテスト
    print("\n4. Low Speed Test:")
    data = {
        "token": "test_token_12345",
        "latitude": 35.681382,
        "longitude": 139.766084,
        "speed": 5.0,  # 低速
        "direction": 180.0
    }
    response = requests.post(f"{base_url}/api/set-location", json=data)
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.json()}")
    
    # 5. 電車路線から離れた位置のテスト
    print("\n5. Far from Train Line Test:")
    data = {
        "token": "test_token_12345",
        "latitude": 35.700000,  # 電車路線から離れた位置
        "longitude": 139.700000,
        "speed": 30.0,
        "direction": 180.0
    }
    response = requests.post(f"{base_url}/api/set-location", json=data)
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.json()}")
    
    print("\n" + "=" * 50)
    print("APIテスト完了")
    print("=" * 50)

if __name__ == "__main__":
    test_api()