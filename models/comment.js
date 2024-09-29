const db = require('./database');

class Comment {
  static getCommentsForPost(postId, callback) {
    const query = `
      SELECT comments.id, comments.user_id, comments.content, comments.timestamp, comments.likes, users.username, users.profile_picture
      FROM comments
      JOIN users ON comments.user_id = users.id
      WHERE comments.post_id = ?
      ORDER BY comments.timestamp ASC
    `;
    db.all(query, [postId], (err, rows) => {
      callback(err, rows);
    });
  }

  static createComment(userId, postId, content, callback) {
    db.run('INSERT INTO comments (user_id, post_id, content) VALUES (?, ?, ?)', [userId, postId, content], function(err) {
      console.log(this.lastID);
      callback(err, this.lastID);
    });
  }

  static likeComment(userId, commentId, callback) {
    const query = 'SELECT * FROM comment_likes WHERE user_id = ? AND comment_id = ?';
    db.get(query, [userId, commentId], (err, row) => {
      if (err) return callback(err);

      if (!row) {
        db.run('UPDATE comments SET likes = likes + 1 WHERE id = ?', [commentId], (err) => {
          if (err) return callback(err);
          db.run('INSERT INTO comment_likes (user_id, comment_id) VALUES (?, ?)', [userId, commentId], (err) => {
            callback(err);
          });
        });
      } else {
        callback(null, 'Already liked');
      }
    });
  }
}

module.exports = Comment;