import math
from typing import Optional, Tuple
import json
import logging

logger = logging.getLogger(__name__)

class TrainDetector:
    def __init__(self):
        self.train_lines = self._load_train_data()
        self.speed_threshold = 10.0
        self.max_distance_from_line = 0.001
    
    def _load_train_data(self):
        train_lines = {
            "yamanote": {
                "name": "山手線",
                "stations": [
                    {"name": "東京", "lat": 35.681382, "lon": 139.766084},
                    {"name": "有楽町", "lat": 35.675069, "lon": 139.763328},
                    {"name": "新橋", "lat": 35.665498, "lon": 139.758660},
                    {"name": "浜松町", "lat": 35.655646, "lon": 139.756749},
                    {"name": "田町", "lat": 35.645736, "lon": 139.747575},
                    {"name": "品川", "lat": 35.630152, "lon": 139.740413},
                    {"name": "大崎", "lat": 35.619700, "lon": 139.728439},
                    {"name": "五反田", "lat": 35.626446, "lon": 139.723822},
                    {"name": "目黒", "lat": 35.633998, "lon": 139.715829},
                    {"name": "恵比寿", "lat": 35.645516, "lon": 139.710070},
                    {"name": "渋谷", "lat": 35.658517, "lon": 139.701334},
                    {"name": "原宿", "lat": 35.670168, "lon": 139.702687},
                    {"name": "代々木", "lat": 35.683061, "lon": 139.702042},
                    {"name": "新宿", "lat": 35.690921, "lon": 139.700258},
                    {"name": "新大久保", "lat": 35.701306, "lon": 139.700044},
                    {"name": "高田馬場", "lat": 35.712285, "lon": 139.703782},
                    {"name": "目白", "lat": 35.721204, "lon": 139.706587},
                    {"name": "池袋", "lat": 35.729503, "lon": 139.711086},
                    {"name": "大塚", "lat": 35.731401, "lon": 139.728584},
                    {"name": "巣鴨", "lat": 35.733492, "lon": 139.739345},
                    {"name": "駒込", "lat": 35.736489, "lon": 139.746875},
                    {"name": "田端", "lat": 35.738062, "lon": 139.760329},
                    {"name": "西日暮里", "lat": 35.732135, "lon": 139.766787},
                    {"name": "日暮里", "lat": 35.727772, "lon": 139.770987},
                    {"name": "鶯谷", "lat": 35.720495, "lon": 139.778837},
                    {"name": "上野", "lat": 35.713768, "lon": 139.777043},
                    {"name": "御徒町", "lat": 35.707438, "lon": 139.774632},
                    {"name": "秋葉原", "lat": 35.698683, "lon": 139.774219},
                    {"name": "神田", "lat": 35.691690, "lon": 139.770883}
                ]
            },
            "chuo": {
                "name": "中央線快速",
                "stations": [
                    {"name": "東京", "lat": 35.681382, "lon": 139.766084},
                    {"name": "神田", "lat": 35.691690, "lon": 139.770883},
                    {"name": "御茶ノ水", "lat": 35.699566, "lon": 139.763906},
                    {"name": "四ツ谷", "lat": 35.686290, "lon": 139.730641},
                    {"name": "新宿", "lat": 35.690921, "lon": 139.700258},
                    {"name": "中野", "lat": 35.705378, "lon": 139.665798},
                    {"name": "高円寺", "lat": 35.705398, "lon": 139.649635},
                    {"name": "阿佐ヶ谷", "lat": 35.704757, "lon": 139.635790},
                    {"name": "荻窪", "lat": 35.704438, "lon": 139.619981},
                    {"name": "西荻窪", "lat": 35.703627, "lon": 139.599614},
                    {"name": "吉祥寺", "lat": 35.703122, "lon": 139.579783},
                    {"name": "三鷹", "lat": 35.702739, "lon": 139.560566}
                ]
            }
        }
        return train_lines
    
    def _calculate_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        R = 6371
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        return R * c
    
    def _point_to_segment_distance(self, lat: float, lon: float, 
                                   lat1: float, lon1: float, 
                                   lat2: float, lon2: float) -> float:
        A = lat - lat1
        B = lon - lon1
        C = lat2 - lat1
        D = lon2 - lon1
        
        dot = A * C + B * D
        len_sq = C * C + D * D
        
        if len_sq == 0:
            return self._calculate_distance(lat, lon, lat1, lon1)
        
        t = max(0, min(1, dot / len_sq))
        
        proj_lat = lat1 + t * C
        proj_lon = lon1 + t * D
        
        return self._calculate_distance(lat, lon, proj_lat, proj_lon)
    
    def _find_nearest_line(self, lat: float, lon: float) -> Tuple[Optional[str], float]:
        min_distance = float('inf')
        nearest_line = None
        
        for line_id, line_data in self.train_lines.items():
            stations = line_data["stations"]
            for i in range(len(stations) - 1):
                dist = self._point_to_segment_distance(
                    lat, lon,
                    stations[i]["lat"], stations[i]["lon"],
                    stations[i+1]["lat"], stations[i+1]["lon"]
                )
                if dist < min_distance:
                    min_distance = dist
                    nearest_line = line_data["name"]
        
        return nearest_line, min_distance
    
    def _find_section(self, line_name: str, lat: float, lon: float) -> Optional[str]:
        """現在位置がどの駅間区間にあるかを判定"""
        line_data = None
        for line_id, data in self.train_lines.items():
            if data["name"] == line_name:
                line_data = data
                break

        if not line_data:
            return None

        stations = line_data["stations"]
        min_distance = float('inf')
        best_section = None

        # 各駅間区間をチェック
        for i in range(len(stations) - 1):
            dist = self._point_to_segment_distance(
                lat, lon,
                stations[i]["lat"], stations[i]["lon"],
                stations[i+1]["lat"], stations[i+1]["lon"]
            )

            if dist < min_distance:
                min_distance = dist
                # 駅名をソートして方向に依存しないsection_idを作成
                station_names = sorted([stations[i]["name"], stations[i+1]["name"]])
                best_section = f"{line_name}_{station_names[0]}_{station_names[1]}"

        return best_section if min_distance < self.max_distance_from_line else None

    def _generate_section_id(self, line: str, lat: float, lon: float) -> str:
        """駅間区間ベースのsection_idを生成（方向に依存しない）"""
        section = self._find_section(line, lat, lon)
        if section:
            return section

        # フォールバック: 路線名のみ
        return f"{line}_unknown"
    
    def detect_train(self, latitude: float, longitude: float,
                    speed: Optional[float] = None,
                    direction: Optional[float] = None) -> Tuple[Optional[str], Optional[str]]:
        
        if speed and speed < self.speed_threshold:
            logger.info(f"Speed {speed} km/h is below threshold {self.speed_threshold} km/h")
            return None, None
        
        nearest_line, distance = self._find_nearest_line(latitude, longitude)
        
        if distance > self.max_distance_from_line:
            logger.info(f"Distance {distance:.4f} km from nearest line exceeds threshold")
            return None, None
        
        if nearest_line:
            section_id = self._generate_section_id(nearest_line, latitude, longitude)
            logger.info(f"Detected train: {nearest_line}, section: {section_id}")
            return nearest_line, section_id
        
        return None, None