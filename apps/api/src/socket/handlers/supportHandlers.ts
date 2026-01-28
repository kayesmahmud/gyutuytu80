import { Server } from 'socket.io';
import { prisma } from '@thulobazaar/database';
import type { AuthenticatedSocket } from '../types.js';

export function initializeSupportHandlers(io: Server, socket: AuthenticatedSocket): void {
  const userId = socket.userId;
  const userRole = socket.userRole;

  /**
   * Join a support ticket room
   */
  socket.on('support:join-ticket', async (payload: { ticketId: number }, callback) => {
    try {
      const { ticketId } = payload;

      const ticket = await prisma.support_tickets.findUnique({
        where: { id: ticketId },
        select: { user_id: true },
      });

      if (!ticket) {
        return callback({ error: 'Ticket not found' });
      }

      const isStaff = userRole === 'editor' || userRole === 'super_admin' || userRole === 'root';

      if (!isStaff && ticket.user_id !== userId) {
        return callback({ error: 'Access denied' });
      }

      const roomName = `support:${ticketId}`;
      socket.join(roomName);
      console.log(`  🎫 User ${userId} joined support ticket room: ${roomName}`);

      callback({ success: true });
    } catch (error) {
      console.error('❌ Error joining support ticket:', error);
      callback({ error: (error as Error).message });
    }
  });

  /**
   * Leave a support ticket room
   */
  socket.on('support:leave-ticket', (payload: { ticketId: number }) => {
    const { ticketId } = payload;
    socket.leave(`support:${ticketId}`);
    console.log(`  🎫 User ${userId} left support ticket room: support:${ticketId}`);
  });

  /**
   * Send a support ticket message via Socket.IO
   */
  socket.on('support:send-message', async (payload: {
    ticketId: number;
    content: string;
    isInternal?: boolean;
  }, callback) => {
    try {
      const { ticketId, content, isInternal = false } = payload;

      const ticket = await prisma.support_tickets.findUnique({
        where: { id: ticketId },
        select: { id: true, user_id: true, status: true },
      });

      if (!ticket) {
        return callback({ error: 'Ticket not found' });
      }

      const isStaff = userRole === 'editor' || userRole === 'super_admin' || userRole === 'root';

      if (!isStaff && ticket.user_id !== userId) {
        return callback({ error: 'Access denied' });
      }

      const actualIsInternal = isStaff ? isInternal : false;

      const message = await prisma.support_messages.create({
        data: {
          ticket_id: ticketId,
          sender_id: userId,
          content: content.trim(),
          type: 'text',
          is_internal: actualIsInternal,
        },
        select: {
          id: true,
          sender_id: true,
          content: true,
          type: true,
          attachment_url: true,
          is_internal: true,
          created_at: true,
          users: {
            select: {
              id: true,
              full_name: true,
              avatar: true,
              role: true,
            },
          },
        },
      });

      const newStatus = isStaff ? 'waiting_on_user' : 'in_progress';
      if (ticket.status === 'open' || (isStaff && ticket.status === 'in_progress') || (!isStaff && ticket.status === 'waiting_on_user')) {
        await prisma.support_tickets.update({
          where: { id: ticketId },
          data: {
            status: newStatus,
            updated_at: new Date(),
          },
        });
      }

      const messageData = {
        id: message.id,
        senderId: message.sender_id,
        content: message.content,
        type: message.type,
        attachmentUrl: message.attachment_url,
        isInternal: message.is_internal,
        createdAt: message.created_at,
        sender: {
          id: message.users.id,
          fullName: message.users.full_name,
          avatar: message.users.avatar,
          isStaff: message.users.role !== 'user',
        },
      };

      io.to(`support:${ticketId}`).emit('support:message-new', {
        ticketId,
        message: messageData,
        newStatus,
      });

      io.to('support:staff').emit('support:ticket-updated', {
        ticketId,
        status: newStatus,
        lastMessage: {
          content: actualIsInternal ? '[Internal note]' : content.substring(0, 100),
          createdAt: message.created_at,
        },
      });

      callback({ success: true, message: messageData });
    } catch (error) {
      console.error('❌ Error sending support message:', error);
      callback({ error: (error as Error).message });
    }
  });

  /**
   * Update support ticket (status, priority, assignment)
   */
  socket.on('support:update-ticket', async (payload: {
    ticketId: number;
    status?: string;
    priority?: string;
    assignedTo?: number | null;
  }, callback) => {
    try {
      const { ticketId, status, priority, assignedTo } = payload;

      const isStaff = userRole === 'editor' || userRole === 'super_admin' || userRole === 'root';

      if (!isStaff) {
        return callback({ error: 'Only staff can update tickets' });
      }

      const updateData: any = {
        updated_at: new Date(),
      };

      if (status) {
        updateData.status = status;
        if (status === 'resolved') {
          updateData.resolved_at = new Date();
        } else if (status === 'closed') {
          updateData.closed_at = new Date();
        }
      }

      if (priority) {
        updateData.priority = priority;
      }

      if (assignedTo !== undefined) {
        updateData.assigned_to = assignedTo || null;
      }

      const ticket = await prisma.support_tickets.update({
        where: { id: ticketId },
        data: updateData,
        select: {
          id: true,
          ticket_number: true,
          status: true,
          priority: true,
          assigned_to: true,
          updated_at: true,
          users_support_tickets_assigned_toTousers: {
            select: {
              id: true,
              full_name: true,
              avatar: true,
            },
          },
        },
      });

      const updatePayload = {
        ticketId: ticket.id,
        ticketNumber: ticket.ticket_number,
        status: ticket.status,
        priority: ticket.priority,
        assignedTo: ticket.users_support_tickets_assigned_toTousers
          ? {
              id: ticket.users_support_tickets_assigned_toTousers.id,
              fullName: ticket.users_support_tickets_assigned_toTousers.full_name,
              avatar: ticket.users_support_tickets_assigned_toTousers.avatar,
            }
          : null,
        updatedAt: ticket.updated_at,
      };

      io.to(`support:${ticketId}`).emit('support:ticket-status-changed', updatePayload);
      io.to('support:staff').emit('support:ticket-updated', updatePayload);

      callback({ success: true, data: updatePayload });
    } catch (error) {
      console.error('❌ Error updating support ticket:', error);
      callback({ error: (error as Error).message });
    }
  });

  /**
   * Staff joins the staff room to receive all ticket updates
   */
  socket.on('support:join-staff-room', (callback) => {
    const isStaff = userRole === 'editor' || userRole === 'super_admin' || userRole === 'root';

    if (!isStaff) {
      return callback({ error: 'Only staff can join this room' });
    }

    socket.join('support:staff');
    console.log(`  🎫 Staff ${userId} joined support:staff room`);
    callback({ success: true });
  });

  /**
   * Staff typing indicator
   */
  socket.on('support:typing-start', (payload: { ticketId: number }) => {
    const { ticketId } = payload;
    socket.to(`support:${ticketId}`).emit('support:typing', {
      ticketId,
      userId,
      isTyping: true,
    });
  });

  socket.on('support:typing-stop', (payload: { ticketId: number }) => {
    const { ticketId } = payload;
    socket.to(`support:${ticketId}`).emit('support:typing', {
      ticketId,
      userId,
      isTyping: false,
    });
  });
}


