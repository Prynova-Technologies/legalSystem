import { Request, Response, NextFunction } from 'express';
import { Message, Notification } from '../models/communication.model';
import { MessageStatus } from '../interfaces/communication.interface';
import { IUserDocument } from '../interfaces/user.interface';

// Get all messages with filtering options
export const getAllMessages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filter: any = { isDeleted: false };
    
    // Apply filters if provided
    if (req.query.type) filter.type = req.query.type;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.case) filter.case = req.query.case;
    if (req.query.client) filter.client = req.query.client;
    
    // Filter by sender or recipient
    if (req.query.sender) filter.sender = req.query.sender;
    if (req.query.recipient) filter.recipients = req.query.recipient;
    
    // Date range filters
    if (req.query.sentAfter) filter.sentAt = { $gte: new Date(req.query.sentAfter as string) };
    if (req.query.sentBefore) {
      filter.sentAt = filter.sentAt || {};
      filter.sentAt.$lte = new Date(req.query.sentBefore as string);
    }
    
    // Search by content
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search as string, 'i');
      filter.content = searchRegex;
    }
    
    const messages = await Message.find(filter)
      .populate('sender', 'firstName lastName email')
      .populate('recipients', 'firstName lastName email company')
      .populate('case', 'caseNumber title')
      .populate('client', 'firstName lastName company')
      .sort({ sentAt: -1 });
    
    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages
    });
  } catch (error) {
    next(error);
  }
};

// Get a single message by ID
export const getMessageById = async (req: Request & { user?: IUserDocument }, res: Response, next: NextFunction) => {
  try {
    const message = await Message.findOne({ _id: req.params.id, isDeleted: false })
      .populate('sender', 'firstName lastName email')
      .populate('recipients', 'firstName lastName email company')
      .populate('case', 'caseNumber title')
      .populate('client', 'firstName lastName company')
      .populate('readBy.user', 'firstName lastName');
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }
    
    // Mark as read if not already read by this user
    if (req.user && message.readBy.findIndex(read => read.user.toString() === req.user?.id) === -1) {
      message.readBy.push({
        user: req.user?.id,
        readAt: new Date()
      });
      
      // Update status if all recipients have read the message
      if (message.readBy.length === message.recipients.length) {
        message.status = MessageStatus.READ;
      } else {
        message.status = MessageStatus.DELIVERED;
      }
      
      await message.save();
    }
    
    res.status(200).json({
      success: true,
      data: message
    });
  } catch (error) {
    next(error);
  }
};

// Create a new message
export const createMessage = async (req: Request & { user?: IUserDocument }, res: Response, next: NextFunction) => {
  try {
    // Add sender from authenticated user
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }
    req.body.sender = req.user?.id;
    
    // Set initial values
    req.body.sentAt = new Date();
    req.body.status = MessageStatus.SENT;
    req.body.readBy = [];
    
    const message = await Message.create(req.body);
    
    // Create notifications for recipients
    const notifications = req.body.recipients.map((recipient: string) => ({
      user: recipient,
      type: 'message',
      title: 'New Message',
      content: `You have a new message from ${req.user?.firstName || 'a user'} ${req.user?.lastName || ''}`,
      relatedTo: message._id,
      relatedModel: 'Message',
      isRead: false,
      createdAt: new Date()
    }));
    
    await Notification.insertMany(notifications);
    
    res.status(201).json({
      success: true,
      data: message
    });
  } catch (error) {
    next(error);
  }
};

// Delete a message (soft delete)
export const deleteMessage = async (req: Request & { user?: IUserDocument }, res: Response, next: NextFunction) => {
  try {
    const message = await Message.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }
    
    // Check if user is sender or recipient
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }
    const isSender = message.sender.toString() === req.user?.id;
    const isRecipient = message.recipients.some(recipient => recipient.toString() === req.user?.id);
    
    if (!isSender && !isRecipient) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this message'
      });
    }
    
    // Soft delete by setting isDeleted flag
    message.isDeleted = true;
    await message.save();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// Get user's messages (inbox)
export const getUserInbox = async (req: Request & { user?: IUserDocument }, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }
    
    const messages = await Message.find({
      recipients: req.user?.id,
      isDeleted: false
    })
      .populate('sender', 'firstName lastName email')
      .populate('case', 'caseNumber title')
      .populate('client', 'firstName lastName company')
      .sort({ sentAt: -1 });
    
    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages
    });
  } catch (error) {
    next(error);
  }
};

// Get user's sent messages
export const getUserSentMessages = async (req: Request & { user?: IUserDocument }, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }
    
    const messages = await Message.find({
      sender: req.user?.id,
      isDeleted: false
    })
      .populate('recipients', 'firstName lastName email company')
      .populate('case', 'caseNumber title')
      .populate('client', 'firstName lastName company')
      .sort({ sentAt: -1 });
    
    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages
    });
  } catch (error) {
    next(error);
  }
};

// Get user's notifications
export const getUserNotifications = async (req: Request & { user?: IUserDocument }, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }
    
    const notifications = await Notification.find({
      user: req.user?.id,
      isDeleted: false
    })
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications
    });
  } catch (error) {
    next(error);
  }
};

// Mark notification as read
export const markNotificationRead = async (req: Request & { user?: IUserDocument }, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }
    
    const notification = await Notification.findOne({
      _id: req.params.id,
      user: req.user?.id,
      isDeleted: false
    });
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();
    
    res.status(200).json({
      success: true,
      data: notification
    });
  } catch (error) {
    next(error);
  }
};

// Mark all notifications as read
export const markAllNotificationsRead = async (req: Request & { user?: IUserDocument }, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }
    
    await Notification.updateMany(
      { user: req.user?.id, isRead: false, isDeleted: false },
      { isRead: true, readAt: new Date() }
    );
    
    res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    next(error);
  }
};

// Get message statistics
export const getMessageStatistics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get messages by type
    const messagesByType = await Message.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);
    
    // Get messages by status
    const messagesByStatus = await Message.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    // Get messages sent in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentMessages = await Message.countDocuments({
      sentAt: { $gte: thirtyDaysAgo },
      isDeleted: false
    });
    
    // Get top message senders
    const topSenders = await Message.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$sender', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    
    // Populate user details for top senders
    const populatedSenders = await Message.populate(topSenders, {
      path: '_id',
      select: 'firstName lastName'
    });
    
    const statistics = {
      messagesByType: messagesByType.reduce((acc: any, curr: any) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {}),
      messagesByStatus: messagesByStatus.reduce((acc: any, curr: any) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {}),
      recentMessages,
      topSenders: populatedSenders.map((sender: any) => ({
        user: sender._id ? `${sender._id.firstName} ${sender._id.lastName}` : 'Unknown',
        count: sender.count
      }))
    };
    
    res.status(200).json({
      success: true,
      data: statistics
    });
  } catch (error) {
    next(error);
  }
};