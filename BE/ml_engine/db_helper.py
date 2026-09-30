import os
import pymysql
from dotenv import load_dotenv

# Load .env from BE directory
current_dir = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(current_dir, '..', '.env')
load_dotenv(env_path)

def get_db_connection():
    db_host = os.getenv('DB_HOST', 'localhost')
    is_tidb = 'tidbcloud.com' in db_host or os.getenv('DB_SSL') == 'true'
    
    connect_kwargs = {
        'host': db_host,
        'port': int(os.getenv('DB_PORT', 4000 if 'tidbcloud.com' in db_host else 3306)),
        'user': os.getenv('DB_USER', 'root'),
        'password': os.getenv('DB_PASSWORD', ''),
        'database': os.getenv('DB_NAME', 'mypham_db'),
        'charset': 'utf8mb4',
        'cursorclass': pymysql.cursors.DictCursor
    }
    
    if is_tidb:
        # TiDB Cloud requires SSL/TLS
        connect_kwargs['ssl'] = {'ssl': True}
        
    return pymysql.connect(**connect_kwargs)
