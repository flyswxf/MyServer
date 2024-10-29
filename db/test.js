// 连接数据库（mongodb的服务端）
// 获取mongoose插件
require('dotenv').config();
const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME;

// 连接数据库
mongoose.connect(`${uri}/${dbName}`)
  .then(() => {
    console.log('数据库连接成功');
  })
  .catch(err => {
    console.error('数据库连接失败', err);
  });

// 获取当前的连接对象
const conn = mongoose.connection;

conn.on('error', err => {
  console.error('mongoose连接出错', err);

  mongoose.connect(`${uri}/${dbName}`)
    .catch((err) => {
      console.error('重新连接失败', err);
    });
});

conn.once('open', () => {
  console.log('connect...');
});