import mysql from 'mysql2/promise';

const pool = mysql.createPool({
    connectionLimit: 10,
    host: '127.0.0.1',
    user: 'root',
    password: '', 
    database: 'iron_work' 
});

export default pool;
