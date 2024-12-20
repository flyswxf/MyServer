// 引入express模块
const express = require("express");
const axios = require("axios");
// 定义路由级中间件
const router = express.Router();
const userFavorite = require("../models/userFavorite");
const Comment = require("../models/comment");
const post = require("../models/postPoem");
const User = require("../models/user");
const mongoose = require("mongoose");

router.get("/addComment", async (req, res) => {
  console.log(req.body, "collectPoem");
  let { content = "测试一下", id = "", imgUrl } = req.query;

  let userId = req.user_id;
  console.log(content, id, "id");
  //古诗id
  //   let userId = "66c6d551c84f06f8a3676535";
  let poemId = "66c6e41ee4efc4e9371af2c4";
  if (id) {
    //添加二级评论
    let findContent = await Comment.findById(id);
    let user = await User.findById(userId);
    if (findContent) {
      const newReply = {
        content: content,
        nickname: user.nickname,
        authorId: userId,
        authoAvator: user.avatarUrl,
        imgUrl: imgUrl,
      };
      findContent.replies.push(newReply);
      await findContent.save();
      res.send({ status: 200, message: "评论已更新", data: "" });
    } else {
      // Promise.reject(new Error("评论不存在"));
      res.send({ status: 200, message: "评论不存在", data: "" });
    }
  } else {
	 let user = await User.findById(userId)||{};
    let data = await Comment.create({ content, author: userId,avatarUrl:user.avatarUrl, replies: [] });
    res.send({ status: 200, message: "", data: "评论已更新" });
  }
});

router.delete('/deleteComment', async (req, res) => {
  const { commentId, replyId, content } = req.query;
  const userId = req.user_id;

  if (!mongoose.Types.ObjectId.isValid(commentId)) {
    return res.status(400).send({ message: '无效的评论 ID' });
  }

  try {
    let comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).send({ message: '评论不存在' });
    }

    if (replyId) {
      // 删除回复
      if (!mongoose.Types.ObjectId.isValid(replyId)) {
        return res.status(400).send({ message: '无效的回复 ID' });
      }

      const replyIndex = comment.replies.findIndex(reply => reply._id.toString() === replyId);
      if (replyIndex === -1) {
        return res.status(404).send({ message: '回复不存在' });
      }

      comment.replies.splice(replyIndex, 1);
    } else {
      await Comment.findByIdAndDelete(commentId);
      return res.send({ status: 200, message: '评论已删除' });
    }

    await comment.save();
    res.send({ status: 200, message: '回复已删除' });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: '服务器错误', error: error.message });
  }
});




//是否需要分页查询
router.get("/getComments", async (req, res) => {
  let { pageNum = 1 } = req.query;
  let userId = req.user_id;

  const page = parseInt(req.query.pageNum) || 1; // 当前页码，默认为 1
  const limit = parseInt(req.query.limit) || 10; // 每页数量，默认为 10
  console.log(req.body, "collectPoem");

  let data = await Comment.aggregate([
    {
      $lookup: {
        from: "userfavorites", // 收藏表的名称
        localField: "_id", // 评论的 ID
        foreignField: "commentId", // 收藏表中的评论 ID
        as: "favorites",
      },
    },




    {
      $sort: { createdAt: -1 }, // 根据创建时间倒序排序
    },
    {
      $skip: (page - 1) * limit, // 跳过前面的数据
    },
    {
      $limit: limit, // 限制返回数量
    },
  ]);
  /*   .sort({ createdAt: -1 }) // 根据创建时间排序
      .skip((page - 1) * limit) // 跳过前面的数据
      .limit(limit) // 限制返回数量 */
  //根据评论判断当前用户是否收藏过
  console.log("comments", data);
  data = data.map(v=> {
	let bool = false;
	if(v.favorites&& v.favorites.length){
		 bool = v.favorites.find(vv =>vv.userId ==userId );
		console.log(bool,'bool----------')
		
	}
	return {
			...v,
			favorites: bool?v.favorites:[]
		}
  })
 
  /* data中favorites */

  res.send({ status: 200, message: "", data: data });
});

// 点赞
/* 
点赞过的评论

*/
router.get("/setLike", async (req, res) => {
  let { like, id } = req.query;
  let userId = req.user_id;
  console.log(like, id, "like");
  like = JSON.parse(like);
  console.log(typeof like, "like222");
  try {
    // let user_id = req.user_id;
    let findComment = await Comment.findById(id);
    if (!findComment.like) {
      findComment.like = 0;
    }
    findComment.like = like ? findComment.like + 1 : findComment.like - 1;
    console.log(findComment);
    await findComment.save();
    //将点赞的评论添加到足迹里
    if (like) {
      //检查用户是否收藏过该古诗
      let hasData = await post.find({
        $and: [{ userId }, { commentId: id }],
      });
      if (hasData.length) {
        await post.deleteOne({ _id: hasData._id });
        //删除
      }

      //将点赞的评论添加到足迹中
      let addPost = await post.create({ userId, commentId: id });
    }
    res.send({
      status: 200,
      msg: "success",
    });
  } catch (err) {
    console.log(err);
    res.send({
      status: 500,
      msg: "操作失败",
    });
  }
});

router.get("/collectComment", async (req, res) => {
  console.log(req.body, "collectPoem");

  let userId = req.user_id;
  let { id, status } = req.query;
  console.log(id);

  status = Boolean(JSON.parse(status)) != void 0 ? JSON.parse(status) : false;
  try {
    if (!status) {
      await userFavorite.deleteOne({
        $and: [{ userId }, { commentId: id }],
      });
      res.send({ status: 200, message: "取消收藏", data: "" });
    } else {
      //检查用户是否收藏过该古诗
      let hasData = await userFavorite.find({
        $and: [{ userId }, { commentId: id }],
      });
      if (hasData.length) {
        console.log(hasData, "2222");
        res.send({ status: 200, message: "评论已收藏", data: "" });
        return;
      }

      let data = await userFavorite.create({
        userId,
        commentId: id,
        type: "comment",
      });

      res.send({ status: 200, message: "收藏成功", data: "" });
    }
  } catch (err) {
    console.log(err);
    res.send({ status: 500, message: "收藏失败", data: "" });
  }
});

module.exports = router;
