const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env') });

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = Number(process.env.DB_PORT) || 3306;
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '123456';
const DB_NAME = process.env.DB_NAME || 'mypham_db';

async function initDB() {
  console.log(`\n⏳ Đang kết nối tới MySQL tại ${DB_HOST}:${DB_PORT} với user '${DB_USER}'...`);

  let connection;
  try {
    const isTiDB = DB_HOST.includes('tidbcloud.com');
    connection = await mysql.createConnection({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
      multipleStatements: true,
      ssl: isTiDB || process.env.DB_SSL === 'true' ? {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: true,
      } : undefined,
    });
    console.log('✅ Đã kết nối MySQL thành công!');
  } catch (err) {
    console.error('❌ Không thể kết nối tới MySQL:', err.message);
    console.error('👉 Vui lòng kiểm tra MySQL server đã bật chưa (XAMPP / Laragon / MySQL Service) và thông tin trong .env.');
    process.exit(1);
  }

  try {
    const sqlPath = path.join(__dirname, 'db.sql');
    if (!fs.existsSync(sqlPath)) {
      throw new Error(`Không tìm thấy file db.sql tại đường dẫn: ${sqlPath}`);
    }

    console.log('⏳ Đang đọc nội dung file db.sql...');
    let sqlContent = fs.readFileSync(sqlPath, 'utf-8');

    console.log('⏳ Đang thực thi chạy db.sql...');
    await connection.query(sqlContent);

    console.log('\n🎉 ==========================================');
    console.log(`✅ Khởi tạo cơ sở dữ liệu [${DB_NAME}] thành công!`);
    console.log('✅ Đã thực thi xong toàn bộ nội dung db.sql.');
    console.log('==========================================\n');
  } catch (err) {
    if (err.message && (err.message.includes('0900_ai_ci') || err.message.includes('collation') || err.message.includes('Collation'))) {
      try {
        console.log('⚠️ MySQL chưa hỗ trợ utf8mb4_0900_ai_ci, tự động chuyển sang utf8mb4_unicode_ci...');
        const sqlPath = path.join(__dirname, 'db.sql');
        let sqlContent = fs.readFileSync(sqlPath, 'utf-8');
        sqlContent = sqlContent.replace(/utf8mb4_0900_ai_ci/g, 'utf8mb4_unicode_ci');
        await connection.query(sqlContent);
        console.log('\n🎉 ==========================================');
        console.log(`✅ Khởi tạo cơ sở dữ liệu [${DB_NAME}] thành công!`);
        console.log('✅ Đã thực thi xong toàn bộ nội dung db.sql.');
        console.log('==========================================\n');
        return;
      } catch (retryErr) {
        console.error('❌ Lỗi khi thực thi SQL:', retryErr.message);
        process.exit(1);
      }
    }
    console.error('❌ Lỗi khi thực thi SQL:', err.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

initDB();
