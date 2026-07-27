import * as imaps from 'imap-simple';
import { simpleParser } from 'mailparser';

export async function fetchSteamGuardCode(targetUsername: string): Promise<string | null> {
  const config = {
    imap: {
      user: process.env.GMAIL_USER as string,
      password: process.env.GMAIL_PASS as string,
      host: 'imap.gmail.com',
      port: 993,
      tls: true,
      authTimeout: 3000,
      tlsOptions: { rejectUnauthorized: false }
    }
  };

  if (!config.imap.user || !config.imap.password) {
    console.error("[IMAP] Missing GMAIL_USER or GMAIL_PASS in .env");
    return null;
  }

  let connection: imaps.ImapSimple | null = null;
  try {
    connection = await imaps.connect(config);
    await connection.openBox('INBOX');

    // Search for recent emails from Steam (in the last 2 hours)
    const delay = 2 * 3600 * 1000;
    const since = new Date(Date.now() - delay).toISOString();
    
    // Gmail supports search criteria. We can search UNREAD or just from Steam.
    // Let's get the 20 most recent emails from Steam
    const searchCriteria = [
      ['FROM', 'noreply@steampowered.com'],
      ['SINCE', since]
    ];

    const fetchOptions = {
      bodies: ['HEADER', 'TEXT', ''],
      markSeen: false,
      struct: true
    };

    const messages = await connection.search(searchCriteria, fetchOptions);
    
    // Sort messages by date descending (newest first)
    messages.sort((a, b) => {
      const dateA = a.attributes.date ? new Date(a.attributes.date).getTime() : 0;
      const dateB = b.attributes.date ? new Date(b.attributes.date).getTime() : 0;
      return dateB - dateA;
    });

    for (const message of messages) {
      // Find the full body
      const allBody = message.parts.find(p => p.which === '');
      if (!allBody) continue;
      
      const parsed = await simpleParser(allBody.body);
      const text = parsed.text || '';
      
      // Check if this email is for the target username
      // Steam usually writes: "Dear botacc_022," or "to login to account botacc_022:"
      if (text.toLowerCase().includes(targetUsername.toLowerCase())) {
        
        // Find the 5 character code
        // Steam guard codes are 5 characters: A-Z and 2-9
        // Often formatted as: "Login Code\n\nABC12" or similar
        // Let's look for a 5 character alphanumeric string on its own line, or after specific phrases
        const lines = text.split('\n').map(l => l.trim());
        for (let i = 0; i < lines.length; i++) {
          if (lines[i] === 'Login Code' || lines[i].includes('Steam Guard code you need')) {
            // Check the next few lines for a 5-char code
            for (let j = 1; j <= 4; j++) {
              if (i + j < lines.length) {
                const possibleCode = lines[i + j];
                if (/^[A-Z0-9]{5}$/.test(possibleCode)) {
                  connection.end();
                  return possibleCode;
                }
              }
            }
          }
        }
        
        // Fallback regex search for any 5 uppercase alphanumeric chars if above fails
        const match = text.match(/\b([A-Z0-9]{5})\b/g);
        if (match) {
          // Filter out common false positives if any, but the first 5-char word after "code" is usually it
          for (const m of match) {
            // Don't match the username itself if it's 5 chars
            if (m.toLowerCase() !== targetUsername.toLowerCase()) {
              connection.end();
              return m;
            }
          }
        }
      }
    }
    
    connection.end();
    return null;
  } catch (error) {
    console.error("[IMAP] Error fetching emails:", error);
    if (connection) {
      connection.end();
    }
    return null;
  }
}
