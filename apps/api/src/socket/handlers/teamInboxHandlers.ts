import type { AuthenticatedSocket } from '../types.js';
import { isStaffRole } from '../../utils/staffRoles.js';

/**
 * Shared editor inbox: staff join one room ('team:inbox') that mirrors every
 * message flowing through team-account conversations, so all editors see the
 * same threads in real time regardless of who is talking to the user.
 */
export function initializeTeamInboxHandlers(socket: AuthenticatedSocket): void {
  socket.on('team-inbox:join', (callback) => {
    if (typeof callback !== 'function') return;
    if (!isStaffRole(socket.userRole)) {
      return callback({ error: 'Only staff can join the team inbox' });
    }
    socket.join('team:inbox');
    callback({ success: true });
  });

  socket.on('team-inbox:leave', () => {
    socket.leave('team:inbox');
  });
}
