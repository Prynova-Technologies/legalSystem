import { Request, Response, NextFunction } from 'express';
import Client from '../models/client.model';
import Case from '../models/case.model';
import Invoice from '../models/invoice.model';

// Get all clients with filtering options
export const getAllClients = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filter: any = { isDeleted: false };
    
    // Apply filters if provided
    if (req.query.isActive) filter.isActive = req.query.isActive === 'true';
    if (req.query.attorney) filter.primaryAttorney = req.query.attorney;
    if (req.query.kycVerified) filter.kycVerified = req.query.kycVerified === 'true';
    
    // Date range filters
    if (req.query.intakeAfter) filter.intakeDate = { $gte: new Date(req.query.intakeAfter as string) };
    if (req.query.intakeBefore) {
      filter.intakeDate = filter.intakeDate || {};
      filter.intakeDate.$lte = new Date(req.query.intakeBefore as string);
    }
    
    // Tag filtering
    if (req.query.tags) {
      const tags = (req.query.tags as string).split(',');
      filter.tags = { $in: tags };
    }
    
    // Search by name or company
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search as string, 'i');
      filter.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { company: searchRegex }
      ];
    }
    
    const clients = await Client.find()
      // .populate('primaryAttorney', 'firstName lastName email')
      // .sort({ lastName: 1, firstName: 1 });
    
    res.status(200).json({
      success: true,
      count: clients.length,
      data: clients
    });
  } catch (error) {
    next(error);
  }
};

// Get a single client by ID
export const getClientById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const client = await Client.findById({ _id: req.params.id, isDeleted: false })
    
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: client
    });
  } catch (error) {
    next(error);
  }
};

// Create a new client
export const createClient = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Set default values
    req.body.isActive = true;
    req.body.intakeDate = req.body.intakeDate || new Date();
    
    const client = await Client.create(req.body);
    
    res.status(201).json({
      success: true,
      data: client
    });
  } catch (error) {
    next(error);
  }
};

// Update a client
export const updateClient = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const client = await Client.findOne({ _id: req.params.id, isDeleted: false });
    
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }
    
    const updatedClient = await Client.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('primaryAttorney', 'firstName lastName email');
    
    res.status(200).json({
      success: true,
      data: updatedClient
    });
  } catch (error) {
    next(error);
  }
};

// Delete a client (soft delete)
export const deleteClient = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const client = await Client.findById(req.params.id);
    
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }
    
    // Check if client has active cases
    const activeCases = await Case.countDocuments({
      client: req.params.id,
      status: { $ne: 'closed' },
      isDeleted: false
    });
    
    if (activeCases > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete client with active cases'
      });
    }
    
    // Soft delete by setting isDeleted flag
    client.isDeleted = true;
    client.isActive = false;
    await client.save();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// Add a contact to a client
export const addClientContact = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const client = await Client.findOne({ _id: req.params.id, isDeleted: false });
    
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }
    
    // If this is a primary contact, update other contacts of the same type
    if (req.body.isPrimary) {
      client.contacts.forEach(contact => {
        if (contact.type === req.body.type) {
          contact.isPrimary = false;
        }
      });
    }
    
    client.contacts.push(req.body);
    await client.save();
    
    res.status(200).json({
      success: true,
      data: client
    });
  } catch (error) {
    next(error);
  }
};

// Remove a contact from a client
export const removeClientContact = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const client = await Client.findOne({ _id: req.params.id, isDeleted: false });
    
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }
    
    client.contacts = client.contacts.filter(
      (contact) => contact._id.toString() !== req.params.contactId
    );
    
    await client.save();
    
    res.status(200).json({
      success: true,
      data: client
    });
  } catch (error) {
    next(error);
  }
};

// Get client cases
export const getClientCases = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const client = await Client.findOne({ _id: req.params.id, isDeleted: false });
    
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }
    
    const cases = await Case.find({ client: req.params.id, isDeleted: false })
      .populate('attorneys', 'firstName lastName')
      .populate('paralegal', 'firstName lastName')
      .sort({ openDate: -1 });
    
    res.status(200).json({
      success: true,
      count: cases.length,
      data: cases
    });
  } catch (error) {
    next(error);
  }
};

// Get client invoices
export const getClientInvoices = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const client = await Client.findOne({ _id: req.params.id, isDeleted: false });
    
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }
    
    const invoices = await Invoice.find({ client: req.params.id, isDeleted: false })
      .populate('case', 'caseNumber title')
      .sort({ issueDate: -1 });
    
    res.status(200).json({
      success: true,
      count: invoices.length,
      data: invoices
    });
  } catch (error) {
    next(error);
  }
};

// Get client statistics
export const getClientStatistics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get total number of clients
    const totalClients = await Client.countDocuments({ isDeleted: false });
    
    // Get active vs inactive clients
    const activeClients = await Client.countDocuments({ isActive: true, isDeleted: false });
    const inactiveClients = totalClients - activeClients;
    
    // Get clients by KYC verification status
    const verifiedClients = await Client.countDocuments({ kycVerified: true, isDeleted: false });
    const unverifiedClients = totalClients - verifiedClients;
    
    // Get new clients in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const newClients = await Client.countDocuments({
      intakeDate: { $gte: thirtyDaysAgo },
      isDeleted: false
    });
    
    // Get clients by referral source
    const clientsByReferral = await Client.aggregate([
      { $match: { isDeleted: false, referralSource: { $exists: true, $ne: null } } },
      { $group: { _id: '$referralSource', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    
    const statistics = {
      totalClients,
      activeClients,
      inactiveClients,
      verifiedClients,
      unverifiedClients,
      newClients,
      clientsByReferral: clientsByReferral.reduce((acc: any, curr: any) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {})
    };
    
    res.status(200).json({
      success: true,
      data: statistics
    });
  } catch (error) {
    next(error);
  }
};