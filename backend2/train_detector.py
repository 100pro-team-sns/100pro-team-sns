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
            "midosuji": {
                "name": "御堂筋線（北大阪急行直通）",
                "stations": [
                    {"name": "なかもず", "lat": 34.556697, "lon": 135.503074},
                    {"name": "新金岡", "lat": 34.567780, "lon": 135.515000},
                    {"name": "北花田", "lat": 34.582500, "lon": 135.516390},
                    {"name": "あびこ", "lat": 34.609930, "lon": 135.516434},
                    {"name": "長居", "lat": 34.609542, "lon": 135.513714},
                    {"name": "西田辺", "lat": 34.621625, "lon": 135.515150},
                    {"name": "昭和町", "lat": 34.638297, "lon": 135.519226},
                    {"name": "天王寺", "lat": 34.646553, "lon": 135.513761},
                    {"name": "動物園前", "lat": 34.648814, "lon": 135.504411},
                    {"name": "大国町", "lat": 34.655539, "lon": 135.497950},
                    {"name": "なんば", "lat": 34.666756, "lon": 135.501644},
                    {"name": "心斎橋", "lat": 34.672594, "lon": 135.501297},
                    {"name": "本町", "lat": 34.681936, "lon": 135.498983},
                    {"name": "淀屋橋", "lat": 34.692350, "lon": 135.500994},
                    {"name": "梅田", "lat": 34.702833, "lon": 135.497722},
                    {"name": "中津", "lat": 34.709756, "lon": 135.497650},
                    {"name": "西中島南方", "lat": 34.726478, "lon": 135.498575},
                    {"name": "新大阪", "lat": 34.727583, "lon": 135.500822},
                    {"name": "東三国", "lat": 34.733386, "lon": 135.500458},
                    {"name": "江坂", "lat": 34.761119, "lon": 135.497931},
                    {"name": "緑地公園", "lat": 34.777231, "lon": 135.492361},
                    {"name": "桃山台", "lat": 34.792639, "lon": 135.497389},
                    {"name": "千里中央", "lat": 34.807449, "lon": 135.495114},
                    {"name": "箕面船場阪大前", "lat": 34.821110, "lon": 135.490280},
                    {"name": "箕面萱野", "lat": 34.831670, "lon": 135.489170},
                ],
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

        # 速度条件を撤廃 - 停車中や低速でも判定する

        nearest_line, distance = self._find_nearest_line(latitude, longitude)

        # 距離条件も緩和 - 御堂筋線付近であればOK
        # if distance > self.max_distance_from_line:
        #     logger.info(f"Distance {distance:.4f} km from nearest line exceeds threshold")
        #     return None, None
        
        if nearest_line:
            section_id = self._generate_section_id(nearest_line, latitude, longitude)
            logger.info(f"Detected train: {nearest_line}, section: {section_id}")
            return nearest_line, section_id
        
        return None, None