import Client from '../models/client.model';
import Case from '../models/case.model';
import Invoice from '../models/invoice.model';
import logger from '../utils/logger';
import Document from '../models/document.model';

/**
 * Service for client-related operations
 */
export class ClientService {
  /**
   * Get all clients with filtering options
   */
  static async getAllClients(filters: any = {}): Promise<any[]> {
    try {
      // Create a new filter object with isDeleted: false as a base
      // We need to be careful not to override this with any filters passed in
      const filter: any = { isDeleted: false };
      
      // Copy other filters without overriding isDeleted
      Object.keys(filters).forEach(key => {
        if (key !== 'isDeleted') {
          filter[key] = filters[key];
        }
      });
      
      // Handle date range filters if they exist in the filters object
      if (filter.intakeAfter) {
        filter.intakeDate = { $gte: new Date(filter.intakeAfter) };
        delete filter.intakeAfter;
      }
      
      if (filter.intakeBefore) {
        filter.intakeDate = filter.intakeDate || {};
        filter.intakeDate.$lte = new Date(filter.intakeBefore);
        delete filter.intakeBefore;
      }
      
      // Handle tag filtering
      if (filter.tags && typeof filter.tags === 'string') {
        const tags = filter.tags.split(',');
        filter.tags = { $in: tags };
      }
      
      // Handle search by name or company
      if (filter.search) {
        const searchRegex = new RegExp(filter.search, 'i');
        filter.$or = [
          { firstName: searchRegex },
          { lastName: searchRegex },
          { company: searchRegex }
        ];
        delete filter.search;
      }
      
      const clients = await Client.find(filter)
        .sort({ lastName: 1, firstName: 1 });
      
      return clients;
    } catch (error) {
      logger.error('Error fetching clients', { error, filters });
      throw error;
    }
  }

  /**
   * Get a single client by ID
   */
  static async getClientById(clientId: string): Promise<any | null> {
    try {
      const client = await Client.findOne({ _id: clientId, isDeleted: false })
        .populate('primaryAttorney', 'firstName lastName email');

        if (!client) return null;

        // Fetch related documents
      const documents = await Document.find({ client: clientId, isDeleted: false })
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 });

      const cases = await Case.find({ client: clientId, isDeleted: false })
        .populate('assignedAttorneys.attorney', 'firstName lastName email assignedAttorneys.isPrimary')
        .populate('assignedParalegals', 'firstName lastName email')
        .populate('parties');

      // Convert to plain object to allow adding properties
      const clientObject = client.toObject ? client.toObject() : client ;

      clientObject.documents = documents;
      clientObject.cases = cases;
      
      return clientObject;


    } catch (error) {
      logger.error('Error fetching client by ID', { error, clientId });
      throw error;
    }
  }

  /**
   * Create a new client
   */
  static async createClient(clientData: any): Promise<any> {
    try {
      // Set default values
      clientData.isActive = true;
      clientData.intakeDate = clientData.intakeDate || new Date();
      
      const client = await Client.create(clientData);
      logger.info('New client created', { clientId: client._id });
      return client;
    } catch (error) {
      logger.error('Error creating client', { error, clientData });
      throw error;
    }
  }

  /**
   * Update a client
   */
  static async updateClient(clientId: string, updateData: any): Promise<any | null> {
    try {
      const client = await Client.findOne({ _id: clientId, isDeleted: false });
      if (!client) return null;
      
      const updatedClient = await Client.findByIdAndUpdate(
        clientId,
        updateData,
        { new: true, runValidators: true }
      ).populate('primaryAttorney', 'firstName lastName email');
      
      logger.info('Client updated', { clientId });
      return updatedClient;
    } catch (error) {
      logger.error('Error updating client', { error, clientId, updateData });
      throw error;
    }
  }

  /**
   * Delete a client (soft delete)
   */
  static async deleteClient(clientId: string): Promise<boolean> {
    try {
      const client = await Client.findById(clientId);
      if (!client) return false;
      
      // Soft delete by setting isDeleted flag
      client.isDeleted = true;
      await client.save();
      
      logger.info('Client deleted (soft)', { clientId });
      return true;
    } catch (error) {
      logger.error('Error deleting client', { error, clientId });
      throw error;
    }
  }

  /**
   * Get client statistics
   */
  static async getClientStatistics(): Promise<any> {
    try {
      // Get total clients
      const totalClients = await Client.countDocuments({ isDeleted: false });
      
      // Get active clients
      const activeClients = await Client.countDocuments({ isActive: true, isDeleted: false });
      
      // Get inactive clients
      const inactiveClients = await Client.countDocuments({ isActive: false, isDeleted: false });
      
      // Get recently added clients (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentClients = await Client.countDocuments({
        intakeDate: { $gte: thirtyDaysAgo },
        isDeleted: false
      });
      
      // Get clients by type
      const clientsByType = await Client.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: '$clientType', count: { $sum: 1 } } }
      ]);
      
      // Get clients with outstanding invoices
      const clientsWithOutstandingInvoices = await Invoice.distinct('client', {
        status: 'unpaid',
        isDeleted: false
      }).then(ids => ids.length);
      
      const statistics = {
        totalClients,
        activeClients,
        inactiveClients,
        recentClients,
        clientsByType: clientsByType.reduce((acc: any, curr: any) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {}),
        clientsWithOutstandingInvoices
      };
      
      logger.info('Client statistics generated');
      return statistics;
    } catch (error) {
      logger.error('Error generating client statistics', { error });
      throw error;
    }
  }

  /**
   * Get client cases
   */
  static async getClientCases(clientId: string): Promise<any[]> {
    try {
      return await Case.find({
        client: clientId,
        isDeleted: false
      })
        .populate('attorneys', 'firstName lastName')
        .populate('paralegal', 'firstName lastName')
        .sort({ openDate: -1 });
    } catch (error) {
      logger.error('Error fetching client cases', { error, clientId });
      throw error;
    }
  }

  /**
   * Get client invoices
   */
  static async getClientInvoices(clientId: string): Promise<any[]> {
    try {
      return await Invoice.find({
        client: clientId,
        isDeleted: false
      })
        .populate('case', 'caseNumber title')
        .sort({ issueDate: -1 });
    } catch (error) {
      logger.error('Error fetching client invoices', { error, clientId });
      throw error;
    }
  }
}