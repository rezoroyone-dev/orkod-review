import SuperUser from '@/interfaces/SuperUser';
import ContactMessageService, { ContactMessage } from '@/services/ContactMessageService';
import SuperUserService from '@/services/SuperUserService';
import { createPinia, setActivePinia } from 'pinia';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { getAdminUser } from './testAuth';

describe('Contact Message Integration', () => {
  const adminCreds: SuperUser = { id: undefined, userName: 'admin', passWord: 'R8g9f6T@21/N' };
  let adminUser: SuperUser;

  beforeAll(async () => {
    process.env.VITE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:9091';
    adminUser = await getAdminUser();
  });

  beforeEach(() => {
    setActivePinia(createPinia());
    process.env.VITE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:9091';
  });

  it('should send a public contact message and verify it appears in admin inbox', async () => {
    const uniqueSuffix = Date.now();

    // 1. Send a public contact message (no auth required)
    const newMessage: ContactMessage = {
      name: `Integration Tester ${uniqueSuffix}`,
      email: `tester_${uniqueSuffix}@example.com`,
      subject: `Test Subject ${uniqueSuffix}`,
      message: `This is an automated integration test message. Timestamp: ${uniqueSuffix}`
    };

    console.log('Sending public contact message...');
    const saved = await ContactMessageService.saveContactMessage(newMessage);
    expect(saved).toBeDefined();

    // 2. Admin fetches the inbox
    console.log('Admin fetching inbox...');
    const messages = await ContactMessageService.getContactMessages();
    expect(Array.isArray(messages)).toBe(true);

    // 3. Find our message
    const found = messages.find(m => m.subject === newMessage.subject);
    expect(found).toBeDefined();
    expect(found!.name).toBe(newMessage.name);
    expect(found!.email).toBe(newMessage.email);
    expect(found!.message).toBe(newMessage.message);

    console.log(`Found message ID: ${found!.id}`);

    // 4. Cleanup - Delete the message
    console.log('Deleting test message...');
    await ContactMessageService.deleteContactMessage(found!.id!);

    // 5. Verify deletion
    const messagesAfter = await ContactMessageService.getContactMessages();
    const stillExists = messagesAfter.find(m => m.id === found!.id);
    expect(stillExists).toBeUndefined();
    console.log('Message deleted successfully.');
  });

  it('should mark a message as read', async () => {
    const uniqueSuffix = Date.now();

    // 1. Send a message
    const newMessage: ContactMessage = {
      name: `Read Test User ${uniqueSuffix}`,
      email: `readtest_${uniqueSuffix}@example.com`,
      subject: `Read Test Subject ${uniqueSuffix}`,
      message: 'Test message for mark-as-read flow'
    };

    console.log('Sending message for read test...');
    await ContactMessageService.saveContactMessage(newMessage);

    // 2. Admin fetches inbox and finds the message
    const messages = await ContactMessageService.getContactMessages();
    const found = messages.find(m => m.subject === newMessage.subject);
    expect(found).toBeDefined();
    expect(found!.read).toBeFalsy(); // Should be unread initially

    // 3. Mark as read
    console.log(`Marking message ID ${found!.id} as read...`);
    await ContactMessageService.markAsRead(found!.id!);

    // 4. Verify it's now marked as read
    const messagesAfterRead = await ContactMessageService.getContactMessages();
    const updatedMessage = messagesAfterRead.find(m => m.id === found!.id);
    expect(updatedMessage).toBeDefined();
    expect(updatedMessage!.read).toBe(true);

    // 5. Cleanup
    await ContactMessageService.deleteContactMessage(found!.id!);
    console.log('Mark-as-read test completed.');
  });

  it('should return inbox as an array', async () => {
    const messages = await ContactMessageService.getContactMessages();
    expect(Array.isArray(messages)).toBe(true);
  });

  it('should verify message structure from inbox', async () => {
    const uniqueSuffix = Date.now();

    // 1. Send a message to ensure at least one exists
    const newMessage: ContactMessage = {
      name: `Structure Test ${uniqueSuffix}`,
      email: `structure_${uniqueSuffix}@example.com`,
      subject: `Structure Test Subject ${uniqueSuffix}`,
      message: 'Testing message structure'
    };

    await ContactMessageService.saveContactMessage(newMessage);
    const messages = await ContactMessageService.getContactMessages();
    const found = messages.find(m => m.subject === newMessage.subject);
    expect(found).toBeDefined();

    // 2. Verify structure
    expect(found!.id).toBeDefined();
    expect(typeof found!.id).toBe('number');
    expect(found!.name).toBeDefined();
    expect(found!.email).toBeDefined();
    expect(found!.subject).toBeDefined();
    expect(found!.message).toBeDefined();
    expect(found!.createdAt).toBeDefined();
    expect(typeof found!.read).toBe('boolean');

    // 3. Cleanup
    await ContactMessageService.deleteContactMessage(found!.id!);
  });

  it('should fail to fetch messages with wrong credentials', async () => {
    // Attempt to authenticate with wrong password — should throw
    await expect(SuperUserService.authenticate('admin', 'wrong_password')).rejects.toThrow();
  });
});
