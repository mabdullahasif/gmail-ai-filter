import re
import time
import imaplib
from imapclient import IMAPClient
import pyzmail
from bs4 import BeautifulSoup
from textblob import TextBlob
import asyncio

IMAP_SERVER = "imap.gmail.com"

labels_required = [
    "Spam", "Phishing", "Priority", "Support", "Sales", "Billing",
    "Bank", "Bank/BankOfKhyber", "Bank/StandardChartered", "Bank/Meezan",
    "Bank/JazzCash", "Bank/EasyPaisa", "Bank/Askari", "Bank/Nayapay",
    "Websites", "Websites/abdullahasif.net", "Websites/StackRoot Solutions",
    "Websites/WhisperQA", "Websites/HostNext",
    "Education", "Education/FAST"
]

domain_filters = {
    "bankofkhyber.com":"Bank/BankOfKhyber",
    "sc.com":"Bank/StandardChartered",
    "meezanbank.com":"Bank/Meezan",
    "jazzcash.com.pk":"Bank/JazzCash",
    "easypaisa.com.pk":"Bank/EasyPaisa",
    "askaribank.com":"Bank/Askari",
    "nayapay.com":"Bank/Nayapay",
    "abdullahasif.net":"Websites/abdullahasif.net",
    "stackrootsolutions.com":"Websites/StackRoot Solutions",
    "whisperqa.com":"Websites/WhisperQA",
    "hostnext.net":"Websites/HostNext",
    "nu.edu.pk":"Education/FAST",
    "isb.nu.edu.pk":"Education/FAST"
}

support_keywords = ["support","issue","error","bug","problem"]
sales_keywords = ["pricing","quote","purchase","proposal","demo"]
billing_keywords = ["invoice","payment","receipt"]
priority_keywords = ["urgent","important","server down"]
phishing_keywords = ["verify account", "reset password", "confirm payment", "urgent action", "login immediately"]
spam_keywords = ["win money", "free iphone", "lottery", "crypto investment"]

def clean_text(text):
    soup = BeautifulSoup(text,"html.parser")
    text = soup.get_text()
    text = text.lower()
    text = re.sub(r"http\S+","",text)
    text = re.sub(r"[^a-zA-Z0-9 ]"," ",text)
    return text

def create_labels(server, logger=None):
    existing = server.list_folders()
    existing_names = [folder[2] for folder in existing]
    sorted_labels = sorted(labels_required, key=lambda x: x.count("/"))
    for label in sorted_labels:
        if label not in existing_names:
            try:
                server.create_folder(label)
                if logger: logger(f"Created label: {label}")
            except Exception as e:
                if logger: logger(f"Label error {label}: {e}")

def detect_domain(sender):
    sender = sender.lower()
    for domain in domain_filters:
        if domain in sender:
            return domain_filters[domain]
    return None

def classify_email(text):
    for word in spam_keywords:
        if word in text: return "Spam"
    for word in phishing_keywords:
        if word in text: return "Phishing"
    for word in billing_keywords:
        if word in text: return "Billing"
    for word in support_keywords:
        if word in text: return "Support"
    for word in sales_keywords:
        if word in text: return "Sales"
    for word in priority_keywords:
        if word in text: return "Priority"
    return None

def sentiment(text):
    score = TextBlob(text).sentiment.polarity
    if score < -0.3: return "Negative"
    if score > 0.3: return "Positive"
    return "Neutral"

async def process_emails_async(email, password, progress_callback):
    """
    Asynchronous runner for processing emails callables by FastAPI.
    progress_callback: async function that takes (current, total, log_message)
    """
    try:
        server = IMAPClient(IMAP_SERVER)
        server.login(email, password)
        server.select_folder("INBOX")
        await progress_callback(0, 0, "Connected to Gmail")
        
        create_labels(server, lambda msg: None) # Silent label creation for now

        messages = server.search(["ALL"])
        total = len(messages)
        await progress_callback(0, total, f"Total emails to process: {total}")

        batch_size = 10 
        for i in range(0, total, batch_size):
            batch = messages[i:i+batch_size]
            
            try:
                envelope_data = server.fetch(batch, ['ENVELOPE'])
            except:
                # Simple reconnect attempt
                server = IMAPClient(IMAP_SERVER)
                server.login(email, password)
                server.select_folder("INBOX")
                envelope_data = server.fetch(batch, ['ENVELOPE'])

            for uid, data in envelope_data.items():
                try:
                    env = data[b'ENVELOPE']
                    subject = env.subject.decode(errors='ignore') if env.subject else "No Subject"
                    from_addr = env.from_[0]
                    sender = f"{from_addr.mailbox.decode(errors='ignore')}@{from_addr.host.decode(errors='ignore')}" if from_addr and from_addr.host else "unknown@unknown.com"

                    domain_label = detect_domain(sender)
                    if domain_label:
                        server.add_gmail_labels(uid, [domain_label])
                        await progress_callback(i + 1, total, f"Domain labeled ({domain_label}): {subject[:30]}...")

                    email_data = server.fetch(uid, ['BODY[]'])
                    msg = pyzmail.PyzMessage.factory(email_data[uid][b'BODY[]'])
                    body = ""
                    if msg.text_part:
                        body = msg.text_part.get_payload().decode(msg.text_part.charset or "utf-8", errors="ignore")
                    elif msg.html_part:
                        body = msg.html_part.get_payload().decode(msg.html_part.charset or "utf-8", errors="ignore")
                    
                    text = clean_text(subject + " " + body)
                    category = classify_email(text)
                    if category:
                        server.add_gmail_labels(uid, [category])
                        await progress_callback(i + 1, total, f"Categorized ({category}): {subject[:30]}...")

                    s = sentiment(text)
                    if s == "Negative":
                        server.add_gmail_labels(uid, ["Priority"])
                        await progress_callback(i + 1, total, f"Priority (Negative Sentiment): {subject[:30]}...")

                except Exception as e:
                    await progress_callback(i + 1, total, f"Error UID {uid}: {str(e)}")

            await progress_callback(min(i + batch_size, total), total, f"Batch finished {i+1}-{min(i+batch_size, total)}")
            await asyncio.sleep(0.1) # Small pause for yield

        await progress_callback(total, total, "Process complete!")
    except Exception as e:
        await progress_callback(0, 0, f"Critical error: {str(e)}")
