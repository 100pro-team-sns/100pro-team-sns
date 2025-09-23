import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv()

def test_connection():
    try:
        print("Attempting to connect to MySQL database...")
        print(f"Host: {os.getenv('DATABASE_HOST')}")
        print(f"Port: {os.getenv('DATABASE_PORT')}")
        print(f"User: {os.getenv('DATABASE_USER')}")
        print(f"Database: {os.getenv('DATABASE_NAME')} (will check available databases)")
        
        connection = mysql.connector.connect(
            host=os.getenv('DATABASE_HOST'),
            port=int(os.getenv('DATABASE_PORT', 3306)),
            user=os.getenv('DATABASE_USER'),
            password=os.getenv('DATABASE_PASSWORD')
        )
        
        if connection.is_connected():
            print("✓ Successfully connected to MySQL database")
            
            cursor = connection.cursor()
            cursor.execute("SHOW DATABASES;")
            databases = cursor.fetchall()

            print(f"\nAvailable databases:")
            for db in databases:
                print(f"  - {db[0]}")

            # Try to use v8sns database
            cursor.execute("USE v8sns;")
            print(f"\nUsing database: v8sns")

            cursor.execute("SHOW TABLES;")
            tables = cursor.fetchall()
            
            print(f"\nFound {len(tables)} tables in v8sns database:")
            for table in tables:
                print(f"  - {table[0]}")
            
            cursor.close()
            connection.close()
            print("\n✓ Connection closed successfully")
            return True
    
    except mysql.connector.Error as e:
        print(f"✗ Error connecting to MySQL: {e}")
        if "Access denied" in str(e) and "database" in str(e):
            print("\nTrying to connect without database specification...")
            try:
                connection = mysql.connector.connect(
                    host=os.getenv('DATABASE_HOST'),
                    port=int(os.getenv('DATABASE_PORT', 3306)),
                    user=os.getenv('DATABASE_USER'),
                    password=os.getenv('DATABASE_PASSWORD')
                )

                if connection.is_connected():
                    print("✓ Successfully connected to MySQL server")

                    cursor = connection.cursor()
                    cursor.execute("SHOW DATABASES;")
                    databases = cursor.fetchall()

                    print(f"\nAvailable databases:")
                    for db in databases:
                        print(f"  - {db[0]}")

                    cursor.close()
                    connection.close()
                    return True
            except Exception as e2:
                print(f"✗ Also failed without database: {e2}")
        return False
    except Exception as e:
        print(f"✗ Unexpected error: {e}")
        return False

if __name__ == "__main__":
    test_connection()