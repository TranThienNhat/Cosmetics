const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env') });

const {
  DB_HOST = 'localhost',
  DB_PORT = 3306,
  DB_USER = 'root',
  DB_PASSWORD = '',
  DB_NAME = 'mypham_db',
} = process.env;

async function initDB() {
  console.log(`\n⏳ Đang kết nối tới MySQL tại ${DB_HOST}:${DB_PORT} với user '${DB_USER}'...`);

  let connection;
  try {
    connection = await mysql.createConnection({
      host: DB_HOST,
      port: Number(DB_PORT),
      user: DB_USER,
      password: DB_PASSWORD,
      multipleStatements: true,
    });
    console.log('✅ Đã kết nối MySQL thành công!');
  } catch (err) {
    console.error('❌ Không thể kết nối tới MySQL:', err.message);
    console.error('👉 Vui lòng kiểm tra MySQL server đã bật chưa (XAMPP / Laragon / MySQL Service) và thông tin trong .env.');
    process.exit(1);
  }

  try {
    console.log(`⏳ Đang tạo cơ sở dữ liệu '${DB_NAME}' nếu chưa có...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;`);
    await connection.query(`USE \`${DB_NAME}\`;`);

    const sqlPath = path.join(__dirname, 'db.sql');
    if (!fs.existsSync(sqlPath)) {
      throw new Error(`Không tìm thấy file db.sql tại đường dẫn: ${sqlPath}`);
    }

    console.log('⏳ Đang đọc nội dung file db.sql...');
    const sqlContent = fs.readFileSync(sqlPath, 'utf-8');

    console.log('⏳ Đang thực thi tạo các bảng và chèn dữ liệu mẫu...');
    await connection.query('SET FOREIGN_KEY_CHECKS = 0;');
    await connection.query(sqlContent);
    await connection.query('SET FOREIGN_KEY_CHECKS = 1;');

    console.log('\n🎉 ==========================================');
    console.log(`✅ Khởi tạo cơ sở dữ liệu [${DB_NAME}] thành công!`);
    console.log('✅ Tất cả bảng và dữ liệu mẫu đã được nạp.');
    console.log('==========================================\n');
  } catch (err) {
    console.error('❌ Lỗi khi thực thi SQL:', err.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

initDB();
