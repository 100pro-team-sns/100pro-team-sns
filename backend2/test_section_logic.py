import requests
import json

def test_section_logic():
    base_url = "http://localhost:8000"
    token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsImlhdCI6MTc1ODM1ODcwOSwiZXhwIjoxNzU4NDQ1MTA5fQ.bXDWsrNU2nqiNf3eYsB8mn1WwSAa_B0HyDk3F_WcTQA"
    
    print("=" * 50)
    print("Section IDロジックテスト")
    print("=" * 50)
    
    test_cases = [
        {
            "name": "東京駅付近",
            "lat": 35.681382,
            "lon": 139.766084,
            "expected_section": "東京-有楽町間"
        },
        {
            "name": "有楽町駅付近",
            "lat": 35.675069,
            "lon": 139.763328,
            "expected_section": "東京-有楽町間"
        },
        {
            "name": "新橋駅付近",
            "lat": 35.665498,
            "lon": 139.758660,
            "expected_section": "有楽町-新橋間"
        },
        {
            "name": "渋谷駅付近",
            "lat": 35.658517,
            "lon": 139.701334,
            "expected_section": "恵比寿-渋谷間"
        },
        {
            "name": "反対方向（恵比寿→渋谷方向）",
            "lat": 35.650000,
            "lon": 139.705000,
            "expected_section": "恵比寿-渋谷間（同じ）"
        }
    ]
    
    for i, test in enumerate(test_cases, 1):
        print(f"\n{i}. {test['name']}:")
        print(f"   座標: ({test['lat']:.6f}, {test['lon']:.6f})")
        
        data = {
            "token": token,
            "latitude": test["lat"],
            "longitude": test["lon"],
            "speed": 30.0,
            "direction": 180.0
        }
        
        response = requests.post(f"{base_url}/api/set-location", json=data)
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.json()}")
        print(f"   期待されるsection: {test['expected_section']}")
    
    print("\n" + "=" * 50)
    print("Section IDロジックテスト完了")
    print("※ section_idは駅名をアルファベット順でソートした形式で生成されます")
    print("  例: 山手線_恵比寿_渋谷")
    print("=" * 50)

if __name__ == "__main__":
    test_section_logic()