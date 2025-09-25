# Backend2 - 位置情報サービス

FastAPIを使用した位置情報から電車判定を行うサーバー

## セットアップ

1. Python仮想環境の作成と依存パッケージのインストール
```bash
cd backend2
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

2. 環境変数の設定
```bash
cp .env.example .env
# .envファイルを編集してデータベース接続情報を設定
```

3. サーバーの起動
```bash
source venv/bin/activate
python main.py
# または
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## APIエンドポイント

### POST /api/set-location

位置情報を受信し、電車判定を行う

**リクエスト:**
```json
{
  "token": "JWT_TOKEN_HERE",
  "latitude": 34.700594,
  "longitude": 135.496505
}
```

**レスポンス (電車に乗車中):**
```json
{
  "line": "御堂筋線",
  "description": "あなたは御堂筋線の中津駅と梅田駅の間にいます"
}
```

**レスポンス (非乗車時):**
```json
{
  "line": null,
  "description": null
}
```

### GET /health

ヘルスチェック

**レスポンス:**
```json
{
  "status": "healthy",
  "timestamp": "2025-09-20T15:30:00.000000"
}
```

## 機能

- **トークン検証**: JWTトークンによるユーザー認証
- **電車路線判定**: GPS位置情報から御堂筋線の判定
- **駅間区間特定**: 方向に依存しない駅間区間の特定
- **サーバーサイド1連携**: マッチングキューへの自動登録

## 判定ロジック

1. **位置チェック**: 御堂筋線の各駅間区間の最短距離を計算
2. **section_id生成**: 駅名をアルファベット順でソート（方向非依存）
   - 例: `御堂筋線（北大阪急行直通）_中津_梅田`

## データベース

MySQLを使用（users, rooms, chatsテーブル）

## 対応路線

- 御堂筋線（江坂〜なかもず）

## テスト

```bash
source venv/bin/activate
python test_midosuji.py  # 御堂筋線テスト
python test_api.py       # 基本APIテスト
```