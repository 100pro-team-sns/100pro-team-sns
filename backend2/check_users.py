import mysql.connector
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta

load_dotenv()

def check_users():
    try:
        connection = mysql.connector.connect(
            host=os.getenv('DATABASE_HOST'),
            port=int(os.getenv('DATABASE_PORT', 3306)),
            user=os.getenv('DATABASE_USER'),
            password=os.getenv('DATABASE_PASSWORD'),
            database=os.getenv('DATABASE_NAME')
        )
        
        cursor = connection.cursor(dictionary=True)
        
        # USERSテーブルの内容を確認
        cursor.execute("SELECT ID, EMAIL, TOKEN, TOKEN_EXPIRED_AT FROM USERS LIMIT 10")
        users = cursor.fetchall()
        
        print("Current users in database:")
        print("="*80)
        
        if not users:
            print("No users found in the database.")
            print("\nCreating a test user with token...")
            
            # テスト用ユーザーを作成
            test_token = "test_token_12345"
            future_date = datetime.now() + timedelta(days=7)
            
            insert_query = """
                INSERT INTO USERS (EMAIL, PASSWORD, TOKEN, TOKEN_EXPIRED_AT, TRAIN_ID)
                VALUES (%s, %s, %s, %s, %s)
            """
            cursor.execute(insert_query, (
                "test@example.com",
                "hashed_password_here",
                test_token,
                future_date,
                ""
            ))
            connection.commit()
            print(f"✓ Test user created with token: {test_token}")
            
        else:
            for user in users:
                print(f"ID: {user['ID']}")
                print(f"  Email: {user['EMAIL']}")
                print(f"  Token: {user['TOKEN']}")
                print(f"  Token Expires: {user['TOKEN_EXPIRED_AT']}")
                if user['TOKEN_EXPIRED_AT']:
                    if user['TOKEN_EXPIRED_AT'] > datetime.now():
                        print(f"  Status: ✓ Valid")
                    else:
                        print(f"  Status: ✗ Expired")
                else:
                    print(f"  Status: ✓ No expiration")
                print("-"*40)
        
        cursor.close()
        connection.close()
        
    except mysql.connector.Error as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_users()