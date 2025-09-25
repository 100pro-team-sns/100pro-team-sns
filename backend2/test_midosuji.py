import requests
import json

def test_midosuji_line():
    base_url = "http://localhost:8000"
    token = "test_token_ea382c01eb8d9c192166c4daf3984e36"
    
    print("=" * 50)
    print("御堂筋線テスト")
    print("=" * 50)
    
    test_cases = [
        {
            "name": "梅田駅付近",
            "lat": 34.700594,
            "lon": 135.496505,
            "expected": "御堂筋線",
            "section": "中津-梅田間"
        },
        {
            "name": "心斎橋駅付近",
            "lat": 34.673201,
            "lon": 135.501111,
            "expected": "御堂筋線",
            "section": "心斎橋-本町間"
        },
        {
            "name": "なんば駅付近",
            "lat": 34.665906,
            "lon": 135.501621,
            "expected": "御堂筋線",
            "section": "なんば-心斎橋間"
        },
        {
            "name": "天王寺駅付近",
            "lat": 34.646830,
            "lon": 135.515312,
            "expected": "御堂筋線",
            "section": "動物園前-天王寺間"
        },
        {
            "name": "新大阪駅付近",
            "lat": 34.733135,
            "lon": 135.500195,
            "expected": "御堂筋線",
            "section": "東三国-新大阪間"
        },
        {
            "name": "路線から離れた位置テスト",
            "lat": 34.700594,
            "lon": 135.496505,
            "expected": "御堂筋線"
        },
        {
            "name": "路線から離れた位置",
            "lat": 34.700000,
            "lon": 135.480000,
            "expected": None
        }
    ]
    
    for i, test in enumerate(test_cases, 1):
        print(f"\n{i}. {test['name']}:")
        print(f"   座標: ({test['lat']:.6f}, {test['lon']:.6f})")
        
        data = {
            "token": token,
            "latitude": test["lat"],
            "longitude": test["lon"]
        }
        
        response = requests.post(f"{base_url}/api/set-location", json=data)
        result = response.json()
        
        print(f"   Status: {response.status_code}")
        print(f"   Response: {result}")
        
        if test['expected']:
            if result.get('line') == test['expected']:
                print(f"   ✓ 正常に判定")
            else:
                print(f"   ✗ 期待: {test['expected']}, 実際: {result.get('line')}")
        else:
            if result.get('line') is None:
                print(f"   ✓ 正常に非乗車判定")
            else:
                print(f"   ✗ 期待: null, 実際: {result.get('line')}")
    
    print("\n" + "=" * 50)
    print("御堂筋線テスト完了")
    print("=" * 50)

if __name__ == "__main__":
    test_midosuji_line()