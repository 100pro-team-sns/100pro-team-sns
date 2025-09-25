import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv()

def check_schema():
    try:
        connection = mysql.connector.connect(
            host=os.getenv('DATABASE_HOST'),
            port=int(os.getenv('DATABASE_PORT', 3306)),
            user=os.getenv('DATABASE_USER'),
            password=os.getenv('DATABASE_PASSWORD'),
            database=os.getenv('DATABASE_NAME')
        )
        
        cursor = connection.cursor()
        
        print("Tables in database:")
        cursor.execute("SHOW TABLES")
        tables = cursor.fetchall()
        for table in tables:
            print(f"- {table[0]}")
        
        print("\n" + "="*80)
        print("USERS table schema:")
        cursor.execute("DESCRIBE USERS")
        columns = cursor.fetchall()
        for col in columns:
            print(f"  {col[0]:<20} {col[1]:<15} {col[2]:<5} {col[3]:<5} {col[4] or '':<10} {col[5] or ''}")
        
        print("\n" + "="*80)
        print("Current data in USERS:")
        cursor.execute("SELECT * FROM USERS")
        users = cursor.fetchall()
        if users:
            for user in users:
                print(f"  {user}")
        else:
            print("  No data found")
        
        # サンプルデータの数を確認
        for table_name in ['users', 'USERS']:
            try:
                cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
                count = cursor.fetchone()[0]
                print(f"\nCount in {table_name}: {count}")
            except:
                print(f"\nTable {table_name} not accessible")
        
        cursor.close()
        connection.close()
        
    except mysql.connector.Error as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_schema()