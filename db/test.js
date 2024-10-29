// 连接数据库（mongodb的服务端）
// 获取mongoose插件
require('dotenv').config();
const mongoose = require('mongoose');

//使用环境变量存储敏感信息，而不是直接在代码中硬编码
const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME;

// const uri = 'mongodb+srv://flyswxf:Wojiaowangyufei1@testcluster.wy2fq.mongodb.net/?retryWrites=true&w=majority&appName=TestCluster';
// const dbName = 'poem';

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