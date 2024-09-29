const db = require('./database');

class Post {
  static getPosts(callback) {
    const postQuery = `
      SELECT posts.id AS post_id, posts.username AS post_username, posts.content AS post_content, posts.timestamp AS post_timestamp, posts.likes AS post_likes, 
             users.profile_picture AS user_profile_picture 
      FROM posts
      JOIN users ON posts.username = users.username
      ORDER BY posts.timestamp DESC
    `;
  
    const commentQuery = `
      SELECT comments.id AS comment_id, comments.post_id, comments.content AS comment_content, comments.timestamp AS comment_timestamp, comments.likes AS comment_likes,
             users.username AS comment_username, users.profile_picture AS comment_user_profile_picture
      FROM comments
      JOIN users ON comments.user_id = users.id
      ORDER BY comments.timestamp ASC
    `;
  
    db.all(postQuery, (err, posts) => {
      if (err) {
        return callback(err);
      }
  
      db.all(commentQuery, (err, comments) => {
        if (err) {
          return callback(err);
        }
  
        const postsWithComments = posts.map(post => {
          post.comments = comments.filter(comment => comment.post_id === post.post_id);
          return post;
        });
  
        callback(null, postsWithComments);
      });
    });
  }
  

  static createPost(username, content, callback) {
    db.run('INSERT INTO posts (username, content) VALUES (?, ?)', [username, content], function(err) {
      callback(err, this.lastID);
    });
  }

  static likePost(postId, callback) {
    db.run('UPDATE posts SET likes = likes + 1 WHERE id = ?', [postId], function(err) {
      callback(err);
    });
  }

  static hasLikedPost(userId, postId, callback) {
    const query = 'SELECT * FROM post_likes WHERE user_id = ? AND post_id = ?';
    db.get(query, [userId, postId], (err, row) => {
      callback(err, row);
    });
  }

  static likePost(userId, postId, callback) {
    Post.hasLikedPost(userId, postId, (err, row) => {
      if (err) return callback(err);

      if (!row) {  // If the user hasn't liked the post yet
        db.run('UPDATE posts SET likes = likes + 1 WHERE id = ?', [postId], (err) => {
          if (err) return callback(err);

          // Insert into post_likes to track the like
          db.run('INSERT INTO post_likes (user_id, post_id) VALUES (?, ?)', [userId, postId], (err) => {
            callback(err);
          });
        });
      } else {
        callback(null, 'Already liked');
      }
    });
  }
}

module.exports = Post;