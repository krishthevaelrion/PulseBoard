import User from '../models/User.model';
import Club from '../models/Club.model';
import Event from '../models/Event.model';
import PersonalEvent from '../models/PersonalEvent.model';
import ProcessedEmail from '../models/ProcessedEmail.model';
import { parseEventFromEmail } from './emailParser.service';
import { getGoogleClient } from '../utils/googleClient';
import { sendPushNotification } from './notification.service';

let isRunning = false;

/** Decode base64url-encoded Gmail message body recursively */
function extractBody(payload: any): string {
    if (!payload) return '';

    if (payload.body?.data) {
        return Buffer.from(payload.body.data, 'base64url').toString('utf-8');
    }

    if (payload.parts) {
        for (const part of payload.parts) {
            if (part.mimeType === 'text/plain' && part.body?.data) {
                return Buffer.from(part.body.data, 'base64url').toString('utf-8');
            }
        }
        for (const part of payload.parts) {
            const text = extractBody(part);
            if (text) return text;
        }
    }

    return '';
}

/** Make a Gmail API request, auto-refreshing the access token on 401 */
async function gmailRequest(user: any, url: string, options: RequestInit = {}): Promise<any> {
    const makeRequest = (token: string) =>
        fetch(url, {
            ...options,
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
                ...(options.headers || {}),
            },
        });

    let res = await makeRequest(user.googleAccessToken);

    if (res.status === 401 && user.googleRefreshToken) {
        console.log(`[GmailWatcher] Refreshing token for ${user.email}`);
        const client = getGoogleClient();
        client.setCredentials({ refresh_token: user.googleRefreshToken });
        const { credentials } = await client.refreshAccessToken();
        user.googleAccessToken = credentials.access_token as string;
        await user.save();

        res = await makeRequest(user.googleAccessToken);
    }

    if (!res.ok) {
        throw new Error(`Gmail API ${res.status}: ${await res.text()}`);
    }

    return res.json();
}

async function checkUserEmails(user: any) {
    const thirtyDaysAgo = Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000);

    const listData = await gmailRequest(
        user,
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=is:unread+after:${thirtyDaysAgo}&labelIds=INBOX&maxResults=50`
    );

    const messages: { id: string }[] = listData.messages || [];
    if (messages.length === 0) {
        console.log(`[GmailWatcher] No unread emails for ${user.email}`);
        return;
    }

    console.log(`[GmailWatcher] ${messages.length} unread email(s) for ${user.email}`);

    for (const msg of messages) {
        try {
            // Fetch full message to get Message-ID header
            const msgData = await gmailRequest(
                user,
                `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`
            );

            const headers: { name: string; value: string }[] = msgData.payload?.headers || [];

            // RFC 2822 Message-ID — identical for all recipients of the same email
            const emailMessageId = headers.find(h => h.name.toLowerCase() === 'message-id')?.value?.trim();
            if (!emailMessageId) continue; // malformed email, skip

            const fromHeader = headers.find(h => h.name.toLowerCase() === 'from');
            const subjectHeader = headers.find(h => h.name.toLowerCase() === 'subject');

            const rawFrom = (fromHeader?.value || '').toLowerCase();
            const from = rawFrom.includes('<')
                ? rawFrom.replace(/.*<(.+)>.*/, '$1').trim()
                : rawFrom.trim();

            const subject = subjectHeader?.value || '';

            // Check if this email has already been processed before (by anyone)
            const existing = await ProcessedEmail.findOne({ emailMessageId });

            if (existing) {
                // Email already seen — check if this specific user was handled
                const alreadyHandled = existing.processedByUsers.some(
                    id => id.toString() === user._id.toString()
                );
                if (alreadyHandled) continue;

                // New user, but email already analysed by Gemini — reuse cached result
                if (existing.isEvent) {
                    await PersonalEvent.create({
                        userId: user._id,
                        gmailMessageId: msg.id,
                        title: existing.eventTitle!,
                        description: existing.eventDescription,
                        date: existing.eventDate!,
                        timeDisplay: existing.eventTimeDisplay!,
                        location: existing.eventLocation!,
                        badge: existing.eventBadge!,
                        icon: existing.eventIcon!,
                        color: existing.eventColor!,
                        category: existing.eventCategory || 'general',
                        sourceFrom: from,
                        sourceSubject: subject,
                    }).catch(() => {}); // ignore if somehow already exists

                    if (user.expoPushToken) {
                        sendPushNotification(
                            user.expoPushToken,
                            `${existing.eventIcon} New Event in Smart Inbox`,
                            existing.eventTitle!,
                        ).catch(() => {});
                    }

                    console.log(`[GmailWatcher] Reused cached event "${existing.eventTitle}" for ${user.email}`);
                }

                // Mark this user as handled (whether event or not)
                await ProcessedEmail.updateOne(
                    { _id: existing._id },
                    { $addToSet: { processedByUsers: user._id } }
                );

                continue;
            }

            // First time seeing this email
            console.log(`[GmailWatcher] [${user.email}] From: ${from} | Subject: "${subject}"`);

            const bodyText = extractBody(msgData.payload);

            // Groq parses and filters the email in one step
            const eventData = await parseEventFromEmail(subject, bodyText);

            if (!eventData) {
                await ProcessedEmail.create({
                    emailMessageId,
                    isEvent: false,
                    processedByUsers: [user._id],
                });
                console.log(`[GmailWatcher] Groq skipped (not an event): "${subject}"`);
                continue;
            }

            // Store the parsed result so other users get it for free
            await ProcessedEmail.create({
                emailMessageId,
                isEvent: true,
                eventTitle: eventData.title,
                eventDescription: eventData.description,
                eventDate: eventData.date,
                eventTimeDisplay: eventData.timeDisplay,
                eventLocation: eventData.location,
                eventBadge: eventData.badge,
                eventIcon: eventData.icon,
                eventColor: eventData.color,
                eventCategory: eventData.category,
                processedByUsers: [user._id],
            });

            // Check if this user is a club account — if so, publish to the global feed
            const linkedClub = await Club.findOne({ email: user.email.toLowerCase() });
            if (linkedClub) {
                await Event.create({
                    clubId: linkedClub.clubId,
                    title: eventData.title,
                    description: eventData.description,
                    date: eventData.date,
                    timeDisplay: eventData.timeDisplay,
                    location: eventData.location,
                    badge: eventData.badge,
                    icon: eventData.icon,
                    color: eventData.color,
                });
                console.log(`[GmailWatcher] Published club event: "${eventData.title}" for ${linkedClub.name}`);
            } else {
                // Regular user — save to personal Smart Inbox
                await PersonalEvent.create({
                    userId: user._id,
                    gmailMessageId: msg.id,
                    title: eventData.title,
                    description: eventData.description,
                    date: eventData.date,
                    timeDisplay: eventData.timeDisplay,
                    location: eventData.location,
                    badge: eventData.badge,
                    icon: eventData.icon,
                    color: eventData.color,
                    category: eventData.category,
                    sourceFrom: from,
                    sourceSubject: subject,
                });

                if (user.expoPushToken) {
                    sendPushNotification(
                        user.expoPushToken,
                        `${eventData.icon} New Event in Smart Inbox`,
                        eventData.title,
                    ).catch(() => {});
                }
            }

            console.log(`[GmailWatcher] Created personal event: "${eventData.title}" for ${user.email}`);

        } catch (err) {
            console.error(`[GmailWatcher] Error on message ${msg.id}:`, (err as Error).message);
        }
    }
}

async function checkAllUsers() {
    try {
        // Only scan users who have the app installed (have a push token)
        // This prevents scanning every account that ever logged in with Google
        const googleUsers = await User.find({
            $or: [
                { googleAccessToken: { $exists: true, $ne: null } },
                { googleRefreshToken: { $exists: true, $ne: null } },
            ],
            expoPushToken: { $exists: true, $ne: null },
        });

        if (googleUsers.length === 0) {
            console.log('[GmailWatcher] No Google-authenticated users found.');
            return;
        }

        console.log(`[GmailWatcher] Checking ${googleUsers.length} Google user(s)...`);

        for (const user of googleUsers) {
            try {
                await checkUserEmails(user);
            } catch (err) {
                console.error(`[GmailWatcher] Failed for ${user.email}:`, (err as Error).message);
            }
        }
    } catch (err) {
        console.error('[GmailWatcher] DB error, will retry next cycle:', (err as Error).message);
    }
}

export function startGmailWatcher(intervalMs = 60_000) {
    if (isRunning) return;
    isRunning = true;

    console.log(`[GmailWatcher] Watching all Google users every ${intervalMs / 1000}s`);
    checkAllUsers();
    setInterval(checkAllUsers, intervalMs);
}
