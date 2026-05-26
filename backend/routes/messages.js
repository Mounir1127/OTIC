const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Message = require('../models/Message');

const adminAuth = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user || (user.role !== 'admin_regional' && user.role !== 'super_admin' && user.role !== 'admin_tre')) {
            return res.status(403).json({ msg: 'Access denied. Admin only.' });
        }
        next();
    } catch (err) {
        res.status(500).send('Server error');
    }
};

// @route   GET api/messages/contacts
// @desc    Get contacts (super admins for regional, regional for super admin)
router.get('/contacts', [auth, adminAuth], async (req, res) => {
    try {
        const currentUser = await User.findById(req.user.id);
        let query = {};
        
        if (currentUser.role === 'admin_regional' || currentUser.role === 'admin_tre') {
            query.role = 'super_admin';
        } else if (currentUser.role === 'super_admin') {
            query.role = { $in: ['admin_regional', 'admin_tre'] };
        } else {
            return res.status(403).json({ msg: 'Not authorized' });
        }

        const contacts = await User.find(query).select('nom prenom email role adresse').lean();
        
        for (let contact of contacts) {
            contact.unreadCount = await Message.countDocuments({
                sender: contact._id,
                receiver: req.user.id,
                read: false
            });
            const lastMessage = await Message.findOne({
                $or: [
                    { sender: contact._id, receiver: req.user.id },
                    { sender: req.user.id, receiver: contact._id }
                ]
            }).sort({ dateCreation: -1 });
            
            contact.lastMessageDate = lastMessage ? new Date(lastMessage.dateCreation).getTime() : 0;
        }

        contacts.sort((a, b) => {
            if (b.lastMessageDate !== a.lastMessageDate) {
                return b.lastMessageDate - a.lastMessageDate;
            }
            // Secondary sort: Alphabetical by name
            const nameA = (a.prenom + ' ' + a.nom).toLowerCase();
            const nameB = (b.prenom + ' ' + b.nom).toLowerCase();
            return nameA.localeCompare(nameB);
        });

        res.json(contacts);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET api/messages/conversation/:userId
// @desc    Get conversation with a user
router.get('/conversation/:userId', [auth, adminAuth], async (req, res) => {
    try {
        const messages = await Message.find({
            $or: [
                { sender: req.user.id, receiver: req.params.userId },
                { sender: req.params.userId, receiver: req.user.id }
            ]
        }).sort({ dateCreation: 1 });
        
        // Mark as read for messages sent to me
        await Message.updateMany(
            { sender: req.params.userId, receiver: req.user.id, read: false },
            { $set: { read: true } }
        );

        res.json(messages);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   POST api/messages/send
// @desc    Send a message
router.post('/send', [auth, adminAuth], async (req, res) => {
    try {
        const { receiverId, content } = req.body;
        
        const newMessage = new Message({
            sender: req.user.id,
            receiver: receiverId,
            content
        });

        await newMessage.save();
        res.json(newMessage);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET api/messages/unread-count
// @desc    Get total unread messages count
router.get('/unread-count', [auth, adminAuth], async (req, res) => {
    try {
        const count = await Message.countDocuments({ receiver: req.user.id, read: false });
        res.json({ count });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
