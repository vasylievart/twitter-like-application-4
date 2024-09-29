const express = require('express');
const bcrypt = require('bcrypt');
const multer = require('multer');

const router = express.Router();

const Post = require('../models/post.js');
const User = require('../models/user.js');

const userController = require('../controllers/userController');

const upload = multer({ dest: 'public/uploads/' });

router.get('/login', (req, res) => res.render('login'));
router.get('/register', (req, res) => res.render('register'));

router.get('/', userController.getPosts);
router.post('/login', userController.login);
router.post('/register', userController.register);
router.post('/post', userController.createPost);

router.get('/profile', userController.getProfile);
router.post('/profile', upload.single('profile_picture'), userController.updateProfile);

router.post('/like', userController.likePost);

router.post('/comment', userController.createComment);
router.post('/like-comment', userController.likeComment);

router.get('/api/posts', (req, res) => {
    Post.getPosts((err, posts) => {
        if (err) {
            return res.status(500).json({ error: 'An error occurred while fetching posts.' });
        }
        res.json(posts);
    });
});

router.post('/api/posts', (req, res) => {
    const { username, password, content } = req.body;

    if (!username || !password || !content) {
        return res.status(400).json({ error: 'Username, password, and content are required.' });
    }

    User.getUserByUsername(username, (err, user) => {
        if (err || !user) {
            return res.status(401).json({ error: 'Invalid username or password.' });
        }

        User.verifyPassword(password, user.password, (isMatch) => {
            if (!isMatch) {
                return res.status(401).json({ error: 'Invalid username or password.' });
            }

            Post.createPost(username, content, (err, postId) => {
                if (err) {
                    return res.status(500).json({ error: 'An error occurred while creating the post.' });
                }
                res.status(201).json({ message: 'Post created successfully.', postId });
            });
        });
    });
});

module.exports = router;
