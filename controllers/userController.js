const User = require('../models/user');
const Post = require('../models/post');
const Comment = require('../models/comment');
const { hashPassword, comparePassword } = require('../utils/auth');
const { validateUsername, validatePassword } = require('../utils/validation');
const { handleError } = require('../utils/errorHandler');

exports.register = async (req, res) => {
  const { username, password } = req.body;
  try {
    validateUsername(username);
    validatePassword(password);
    
    User.findUser(username, async (err, user) => {
      if (err) return handleError(res, 'Error querying the database', 500);
      if (user) return handleError(res, 'User already exists', 400);

      const hashedPassword = await hashPassword(password);
      User.createUser(username, hashedPassword, (err, userId) => {
        if (err) return handleError(res, 'Error creating user', 500);
        res.redirect('/login');
      });
    });
  } catch (error) {
    return handleError(res, error.message, 400);
  }
};

exports.login = (req, res) => {
  const { username, password } = req.body;
  try {
    validateUsername(username);
    validatePassword(password);
    
    User.findUser(username, async (err, user) => {
      if (err) return handleError(res, 'Error querying the database', 500);
      if (!user) return handleError(res, 'Invalid credentials', 400);

      const isMatch = await comparePassword(password, user.password);
      if (!isMatch) return handleError(res, 'Invalid credentials', 400);

      req.session.user = user;
      res.redirect('/');
    });
  } catch (error) {
    return handleError(res, error.message, 400);
  }
};

exports.createPost = (req, res) => {
  if (!req.session.user) {
    return handleError(res, 'Unauthorized', 401);
  }
  const { content } = req.body;
  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return handleError(res, 'Content cannot be empty', 400);
  }
  Post.createPost(req.session.user.username, content, (err, postId) => {
    if (err) {
      return handleError(res, 'Error creating post', 500);
    }
    res.redirect('/');
  });
};

exports.getPosts = (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  Post.getPosts((err, posts) => {
    if (err) {
      return handleError(res, 'Error retrieving posts', 500);
    }
    res.render('home', { user: req.session.user, posts });
  });
};

exports.getProfile = (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  res.render('profile', { user: req.session.user });
};

exports.updateProfile = async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  const { username, password } = req.body;
  let profilePicture = req.session.user.profile_picture;

  if (req.file) {
    profilePicture = `/uploads/${req.file.filename}`;
  }

  try {
    validateUsername(username);
    if (password) {
      validatePassword(password);
      const hashedPassword = await hashPassword(password);
      User.updateUser(req.session.user.id, username, hashedPassword, profilePicture, (err) => {
        if (err) return handleError(res, 'Error updating profile', 500);
        req.session.user.username = username;
        req.session.user.profile_picture = profilePicture;
        res.redirect('/profile');
      });
    } else {
      User.updateUser(req.session.user.id, username, null, profilePicture, (err) => {
        if (err) return handleError(res, 'Error updating profile', 500);
        req.session.user.username = username;
        req.session.user.profile_picture = profilePicture;
        res.redirect('/profile');
      });
    }
  } catch (error) {
    return handleError(res, error.message, 400);
  }
};

exports.likePost = (req, res) => {
  const { postId } = req.body;
  
  if (!req.session.user) {
    return handleError(res, 'Unauthorized', 401);
  }

  const userId = req.session.user.id;  // Use user ID

  Post.likePost(userId, postId, (err, message) => {
    if (err) {
      return handleError(res, 'Error liking the post', 500);
    }
    if (message === 'Already liked') {
      return handleError(res, 'You have already liked this post', 400);
    }
    res.redirect('/');
  });
};

exports.createComment = (req, res) => {
  const { postId, content } = req.body;

  if (!req.session.user) {
    return handleError(res, 'Unauthorized', 401);
  }

  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return handleError(res, 'Content cannot be empty', 400);
  }

  const userId = req.session.user.id;

  Comment.createComment(userId, postId, content, (err, commentId) => {
    if (err) {
      return handleError(res, 'Error creating comment', 500);
    }
    res.redirect('/');
  });
};

exports.likeComment = (req, res) => {
  const { commentId } = req.body;

  if (!req.session.user) {
    return handleError(res, 'Unauthorized', 401);
  }

  const userId = req.session.user.id;

  Comment.likeComment(userId, commentId, (err, message) => {
    if (err) {
      return handleError(res, 'Error liking the comment', 500);
    }
    if (message === 'Already liked') {
      return handleError(res, 'You have already liked this comment', 400);
    }
    res.redirect('/');
  });
};