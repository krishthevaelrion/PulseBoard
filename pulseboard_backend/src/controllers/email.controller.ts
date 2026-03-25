import type { Request, Response } from 'express';
import Club from '../models/Club.model';
import Event from '../models/Event.model';
import { parseEventFromEmail } from '../services/emailParser.service';

/**
 * POST /api/email/inbound
 *
 * Handles inbound email webhooks from Mailgun.
 * Mailgun sends a multipart/form-data POST with fields:
 *   - sender (full "Name <email>" or just email)
 *   - subject
 *   - body-plain (plain text body)
 *
 * Also supports direct JSON body for testing:
 *   { sender, subject, body }
 */
export const handleInboundEmail = async (req: Request, res: Response) => {
    try {
        // Support both Mailgun form-data field names and direct JSON for testing
        const sender: string =
            req.body['sender'] || req.body['from'] || '';
        const subject: string =
            req.body['subject'] || req.body['Subject'] || '';
        const bodyText: string =
            req.body['body-plain'] || req.body['body'] || req.body['text'] || '';

        if (!sender) {
            return res.status(400).json({ message: 'No sender found in request' });
        }

        // Extract raw email from "Name <email@example.com>" format
        const emailMatch = sender.match(/<(.+?)>/) || sender.match(/([^\s]+@[^\s]+)/);
        const senderEmail = (emailMatch ? emailMatch[1] : sender).toLowerCase().trim();

        console.log(`[EmailParser] Inbound from: ${senderEmail}, subject: "${subject}"`);

        // Find the club linked to this email
        const club = await Club.findOne({ email: senderEmail });

        if (!club) {
            console.warn(`[EmailParser] No club found for sender email: ${senderEmail}`);
            return res.status(404).json({
                message: `No club registered for email: ${senderEmail}. Register the club email first via /api/clubs.`,
            });
        }

        console.log(`[EmailParser] Matched club: ${club.name} (ID: ${club.clubId})`);

        // Use Gemini AI to parse the email
        const parsed = await parseEventFromEmail(subject, bodyText);

        if (!parsed) {
            return res.status(200).json({ message: 'Email received but not event-worthy, skipped.' });
        }

        // Save the event to MongoDB
        const newEvent = new Event({
            clubId: club.clubId,
            title: parsed.title,
            description: parsed.description,
            date: parsed.date,
            timeDisplay: parsed.timeDisplay,
            location: parsed.location,
            badge: parsed.badge,
            icon: parsed.icon,
            color: parsed.color,
        });

        const savedEvent = await newEvent.save();

        console.log(`[EmailParser] Event created: "${savedEvent.title}" for club "${club.name}"`);

        return res.status(200).json({
            message: 'Email parsed and event created successfully',
            event: savedEvent,
        });
    } catch (err) {
        console.error('[EmailParser] Error handling inbound email:', err);
        return res.status(500).json({ message: 'Internal server error', error: err });
    }
};
