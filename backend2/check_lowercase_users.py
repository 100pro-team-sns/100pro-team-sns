import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv()

def check_lowercase_users():
    try:
        connection = mysql.connector.connect(
            host=os.getenv('DATABASE_HOST'),
            port=int(os.getenv('DATABASE_PORT', 3306)),
            user=os.getenv('DATABASE_USER'),
            password=os.getenv('DATABASE_PASSWORD'),
            database=os.getenv('DATABASE_NAME')
        )
        
        cursor = connection.cursor(dictionary=True)
        
        print("users table (lowercase) schema:")
        cursor.execute("DESCRIBE users")
        columns = cursor.fetchall()
        for col in columns:
            print(f"  {col['Field']:<20} {col['Type']:<15} {col['Null']:<5} {col['Key']:<5}")
        
        print("\n" + "="*80)
        print("Current data in users (lowercase):")
        cursor.execute("SELECT * FROM users")
        users_data = cursor.fetchall()
        for user in users_data:
            print(f"  ID: {user.get('id')}")
            print(f"  Email: {user.get('email')}")
            print(f"  Token: {user.get('token', 'N/A')}")
            print(f"  Token Expires: {user.get('token_expired_at', 'N/A')}")
            print("-" * 40)
        
        cursor.close()
        connection.close()
        
    except mysql.connector.Error as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_lowercase_users()