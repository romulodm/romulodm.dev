# Privacy Policy

**Last updated:** {{EFFECTIVE_DATE}}
**Version:** 1.0

This Privacy Policy explains how personal data belonging to visitors and users of **{{DOMAIN}}** (the "Site") is collected, used, shared, stored, and protected.

The Site is a personal portfolio and technical blog. It is not a large-scale commercial service, but it does handle real personal data. For that reason it follows Brazil's **General Data Protection Law (Lei nº 13.709/2018 — LGPD)** and, where applicable to visitors in the European Economic Area, the **EU General Data Protection Regulation (Regulation (EU) 2016/679 — GDPR)**.

Please read this document carefully. By creating an account, commenting, subscribing to the newsletter, or supporting the Site, you confirm that you understand the practices described here.

## 1. Who controls your data

| | |
|---|---|
| **Controller** | {{OWNER}} |
| **Address** | {{ADDRESS}} |
| **Privacy contact** | {{PRIVACY_EMAIL}} |
| **Country of operation** | Brazil |

The Site is run by an individual. No formal Data Protection Officer has been appointed, which is permitted for small-scale processing agents under the applicable ANPD rules. The contact channel above serves the function set out in Article 41, § 2 of the LGPD.


## 2. Guiding principle: collect the minimum

The Site is designed to **collect only what is necessary**. Specifically:

- **No personal data is sold, rented, or transferred** to third parties for commercial purposes.
- **No data is used for personalized advertising**, retargeting, or building advertising profiles.
- **No data is sold to data brokers.**
- **No sensitive data is collected** (LGPD, Art. 5, II): racial or ethnic origin, religious belief, political opinion, union membership, health data, sex life, genetic or biometric data. Please **do not include** such information in comments, messages, or your profile.
- **No automated decisions with legal effects** are made about you, other than the automated filtering of user-submitted content (section 5.1), which is always subject to human review.

## 3. What data is collected

The list below reflects exactly what the application stores. Not all of it applies to you — most exists only if you choose to use the corresponding feature.

### 3.1 Account data (if you create an account)

The core of your account is **username, email address, and avatar**. In addition, depending on the sign-in method you choose:

| Data | Source | Note |
|---|---|---|
| Email address | You or the OAuth provider | Unique account identifier |
| Username | Generated from your email/name, or chosen by you | Public |
| Avatar (image URL) | OAuth provider (Google/GitHub) | Public. The image stays hosted by the provider |
| Password | You, only when signing up with email and password | Stored exclusively as a cryptographic hash (bcrypt). **Your plaintext password is never stored and is never known to the controller** |
| OAuth provider identifier | Google or GitHub | A technical code linking your account to the provider. It does not grant access to your account at that provider |
| Email verification status | System | — |
| Creation and update timestamps | System | — |

When you sign in with Google or GitHub, the Site receives only your **email address, name, profile picture, and an identifier** from those providers. The Site does **not** receive your password, your contacts, your private repositories, or any other content from your account.

### 3.2 Public profile data (optional, provided by you)

If you fill them in, the Site stores and **publicly displays**: a short personal description ("about"), your GitHub profile link, and your LinkedIn profile link. These fields are entirely optional and can be cleared at any time in your profile settings.

### 3.3 Content you create

The following is stored and **publicly displayed**, associated with your username and avatar:

- comments on articles (and replies to comments);
- votes on comments;
- likes on articles;
- messages posted to the Guestbook/Wall.

Assume that anything published in these areas is **public, indexable by search engines, and potentially copied by third parties**. Do not post information you would not want to be public.

### 3.4 Newsletter (consent only)

The newsletter runs on a **double opt-in** basis: after you subscribe, you receive an email, and the subscription only becomes active if you click the confirmation link.

Stored data includes: email address, preferred language, subscription status, subscription/confirmation/cancellation dates, and random tokens used to confirm and to unsubscribe.

**Delivery metrics.** Newsletter emails contain a tracking pixel that records **whether and how many times the message was opened**, along with delivery status. This metric is used solely to assess content quality and deliverability. If you would rather not be counted, simply block image loading in your email client — the content will remain readable.

Every newsletter email contains a one-click unsubscribe link that remains valid indefinitely.

### 3.5 Financial support (`/support` page)

See also **section 9**, which explains how donations work.

Per donation, the Site stores: display name (optional), public message (optional), number of "coffees", amount, currency, payment method, charge status, a private-donation flag, and the **transaction identifier issued by the payment processor**.

The Site does **not store** card numbers, CVV, expiry dates, bank details, or financial credentials. That data is entered and processed directly in the payment processor's environment and never passes through the Site's database.

In the PIX flow, the data required by payment regulations (name, email, phone number, and Brazilian tax ID) is **transmitted directly to the processor** to issue the charge and is **not persisted** in the Site's database.

For cryptocurrency donations, the following is recorded: originating wallet address, transaction hash, network, asset, amount, block number, and the optional message. This data **is already public by nature**, as it lives on the blockchain (see section 9.3).

### 3.6 Contact form

The contact form collects **name, email address, and the message text**. It is operated by a **third-party form-forwarding service**; messages are delivered to the controller's mailbox and are not written to the Site's database.

### 3.7 Technical and security data

| Data | Purpose | Where it lives |
|---|---|---|
| IP address | Rate limiting and prevention of abuse, spam, and automated attacks | Short-lived cache storage (Redis) with automatic expiry |
| Error and performance logs | Fault diagnosis and stability | Error monitoring service |
| Application access logs | Compliance with Art. 15 of Law 12,965/2014 (Brazilian Internet Civil Framework) | Server/infrastructure |
| Cookies and identifiers | See section 7 | Your browser |
| Aggregate audience metrics | Readership statistics | Google Analytics 4, with consent only |
| Article view counts | Editorial statistics | Short-lived technical cookie + aggregate counter. Does not identify the reader |

## 4. Why data is collected and the legal basis

The LGPD requires a lawful basis for every processing activity. The table below sets out the basis adopted for each purpose.

| Purpose | Data involved | Legal basis (LGPD) |
|---|---|---|
| Create and maintain your account; authenticate access | Account data (3.1) | Art. 7, V — performance of a contract or preliminary steps |
| Display your public profile, comments, votes, and messages | 3.2 and 3.3 | Art. 7, V — performance of a contract |
| Password recovery | Email and temporary token | Art. 7, V |
| Send the newsletter | Email and preferences (3.4) | Art. 7, I — **consent**, revocable at any time |
| Measure newsletter opens and delivery | Campaign metrics (3.4) | Art. 7, IX — legitimate interest in content quality and deliverability |
| Process and record financial support | 3.5 | Art. 7, V — performance of a contract; and Art. 7, II — compliance with legal and regulatory obligations |
| Reply to contact messages | 3.6 | Art. 7, V and IX |
| Moderate content; prevent spam, scams, phishing, and abuse | Comment text, URLs, IP, account data | Art. 7, IX — legitimate interest in user safety and service integrity |
| Apply suspensions and bans and keep a record of them | Account and reason for the block | Art. 7, IX and VI — legitimate interest and regular exercise of rights |
| Maintain Site security, availability, and diagnostics | Technical data (3.7) | Art. 7, IX |
| Retain application access logs | Connection records | Art. 7, II — compliance with a legal obligation (Internet Civil Framework, Art. 15) |
| Produce audience statistics using analytics cookies | See section 7 | Art. 7, I — **consent** |
| Defend against judicial, administrative, or arbitral proceedings | As required | Art. 7, VI |

Where legitimate interest is the basis, processing is limited to what is strictly necessary for the stated purpose, and you may object to it through the channel in section 12.

## 5. Who data is shared with

The Site **does not sell data**. Sharing occurs only with **processors** performing functions essential to running the service, always limited to the minimum necessary.

### 5.1 Categories of processors

| Category | Purpose | Data transmitted |
|---|---|---|
| Authentication providers (Google, GitHub) | Social sign-in | Identity confirmation; we receive email, name, avatar, and an identifier |
| Card payment processor | Charging and fraud prevention | Card data (entered directly in the processor's environment), amount, and donation metadata |
| PIX payment processor | Issuing and settling the charge | Payer's name, email, phone, and tax ID, when provided; amount |
| Infrastructure and hosting provider | Running the application and database | All stored data, under contract and confidentiality obligations |
| Transactional email and newsletter delivery service | Delivering confirmations, password recovery, and campaigns | Recipient email address and message content |
| Contact form service | Forwarding form messages | Name, email, and message |
| Automated content moderation service | Detecting abusive content before publication | Comment or message text |
| URL safety verification service | Blocking phishing and malware links | URLs contained in submitted content |
| Error monitoring service | Diagnosing failures | Technical logs, which may include a user identifier |
| Google Analytics 4 | Audience statistics | See section 7; with consent only |
| Public blockchain network | Settling cryptocurrency donations | Wallet address, amount, and message — **public and permanent** |

> **Customize:** the providers currently in use are **Stripe** (credit card) and **AbacatePay** (PIX). This list may be updated if providers change; the category and purpose of processing, however, remain as described above.

### 5.2 Other sharing scenarios

Data may also be shared where there is:

- a **court order or a request from a competent authority**, within the limits of the law;
- a **need to exercise rights** in judicial, administrative, or arbitral proceedings;
- an **investigation of fraud, abuse, or a security threat** to users or the service;
- your **specific and informed consent**.

If the project is ever succeeded, transferred, or discontinued, you will be notified by email and/or a notice on the Site before any change of controller takes effect, and you may request deletion of your data.

### 5.3 International data transfers

Some processors are based outside Brazil, notably in the United States and the European Union. This constitutes an **international transfer of data**, permitted under Article 33 of the LGPD.

These transfers occur because they are **necessary for the performance of the contract** with you (Art. 33, VI) and, where applicable, are backed by **standard contractual clauses** and the compliance commitments offered by the providers themselves. For visitors subject to the GDPR, the corresponding bases are Articles 46 and 49 of the Regulation.

## 6. Where data is stored and how it is protected

Data is stored in a PostgreSQL database, with caching in Redis and static files in object storage, hosted by professional infrastructure providers.

Technical and organizational measures in place:

- **Encryption in transit** (HTTPS/TLS) across all pages and requests;
- **Passwords stored only as hashes**, using bcrypt with a per-user salt;
- **Sanitization of all user-submitted content** before rendering, to prevent script injection (XSS);
- **Rate limiting** on sensitive routes (sign-in, sign-up, comments, donations);
- **Access control** to the admin panel, restricted to accounts with explicit privileges;
- **Database backup routines**;
- **Error and availability monitoring**, with a public status page;
- **Automated link checking** against safety databases;
- **Secrets and API keys** kept out of source control, in environment variables.

**An honest statement about security.** No internet-connected system is absolutely secure. The commitment made here is to adopt technical and administrative measures that are **appropriate and proportionate to the risk**, as required by Article 46 of the LGPD — not to guarantee invulnerability, which would be legally impossible to honor.

**Security incidents.** In the event of an incident that may create relevant risk or harm, Brazil's National Data Protection Authority and affected data subjects will be notified within a reasonable period, with a description of what happened, the data involved, and the measures taken, in accordance with Article 48 of the LGPD.

## 7. Cookies and similar technologies

Cookies are small files stored in your browser. The Site uses the following categories:

### 7.1 Strictly necessary cookies

Always active, because the Site does not work without them. They do not require consent.

| Purpose | Examples |
|---|---|
| Keeping your session signed in | NextAuth session cookies |
| Recording your cookie choice | `cookie_consent` (12-month lifetime) |
| Preventing double-counting of article views | Technical cookie with a 30-minute lifetime |
| Security and CSRF protection | Framework protection cookies |

### 7.2 Analytics cookies (optional)

The Site uses **Google Analytics 4** to understand which content is read most and how navigation can be improved.

- Google Analytics scripts **load only after you click "Accept"** in the cookie notice. If you decline or ignore the notice, **no analytics script runs**.
- Collection is configured with **IP anonymization**.
- Data is used in **aggregate, statistical form**, for metrics such as most-visited pages, traffic sources, and navigation behavior.
- **This data is not used for personalized advertising**, does not feed ad networks, and is not cross-referenced with your profile on the Site.

### 7.3 How to manage cookies

If you decline optional cookies, the Site actively removes non-essential cookies present in your browser. You may also delete cookies and adjust preferences directly in your browser settings at any time. Restricting necessary cookies may prevent sign-in and other basic functionality.

To withdraw consent you have already given, delete the `cookie_consent` cookie — the notice will reappear on your next visit.

## 8. How long data is kept

| Category | Retention period |
|---|---|
| Account data | While the account remains active |
| Public content (comments, Wall messages, votes, likes) | While published; after account deletion it remains in **anonymized** form (see section 10) |
| Newsletter subscription | Until cancellation. After cancellation, a minimal record of the opt-out is kept to prevent improper re-subscription and to evidence your choice |
| Donation records | For the period required by applicable tax and civil legislation, counted from the transaction |
| Application access logs | 6 months, under Art. 15 of the Internet Civil Framework, extendable by court order |
| IP address used for rate limiting | Minutes to hours, with automatic cache expiry |
| Error and diagnostic logs | Per the monitoring service's retention policy, typically up to 90 days |
| Ban records | For as long as necessary to prevent recurrence and to exercise legal rights |
| Blockchain donation data | **Permanent and irreversible by nature** — see section 9.3 |

Once the period or the purpose ends, data is deleted or anonymized, except in the cases listed in Article 16 of the LGPD (compliance with a legal obligation; study by a research body with anonymization; transfer to a third party in accordance with the law; and exclusive use by the controller in anonymized form).

## 9. Financial support and donations

The `/support` page lets you back the Site with a voluntary contribution ("buy me a coffee"). This is a **gift**, with no commercial consideration, no product delivered, and no service rendered.

### 9.1 PIX and credit card payments

Payments are handled by **specialized, duly established third-party payment platforms** operating under industry security standards (including PCI DSS for card payments).

- Financial data is entered **directly in the processor's environment**;
- The Site **does not receive, view, or store** card numbers, security codes, expiry dates, or banking credentials;
- The Site stores only the **transaction identifier** returned by the processor, along with amount, currency, and charge status;
- Confirmation is communicated through signed and validated webhooks.

**Refunds.** Refund or chargeback requests for PIX and card payments follow the **rules, timelines, and procedures of the payment platform used**, over which the Site has no unilateral control. Requests should be sent to {{CONTACT_EMAIL}}, which will forward them appropriately to the processor. The Site will act in good faith to enable a refund where it is technically possible and legally due, but **cannot guarantee the outcome**, which depends on the processor's policy and the financial institution involved.

### 9.2 Recurring donations

If you choose a monthly contribution, the recurring charge is managed by the payment platform. Cancellation may be requested at any time through the contact channel and takes effect from the next billing cycle.

### 9.3 Cryptocurrency donations (ETH, USDT, and USDC)

Crypto donations are made **directly on the blockchain**, wallet to wallet, without the Site acting as an intermediary.

You need to be aware that:

- **Blockchain transactions are irreversible.** Once confirmed, a transfer **cannot be cancelled, charged back, or reversed** by anyone — not by the Site, not by your wallet, not by any authority. **There is no refund for cryptocurrency donations.**
- **Verifying the network is your responsibility.** Transfers sent on the wrong network, to the wrong address, or with an unsupported asset may result in **permanent loss of funds**, with no liability on the part of the Site.
- **Your wallet address, the amount, and the message are recorded publicly** on the blockchain and can be viewed by anyone, indefinitely. This is a property of the technology, not a choice made by the Site.
- **Blockchain records cannot be erased.** The right to deletion under Article 18, VI of the LGPD is, on this point, **technically unenforceable**. What the Site can do — and will do on request — is remove the display of that data from the Site's interface and unlink the record from your account.
- You may mark a donation as **private**, in which case the name and message are not shown publicly on the Site (the blockchain record, however, remains public).
- Crypto assets are **volatile**. Any conversion shown on the Site is purely informational.

## 10. Your rights as a data subject

Under Article 18 of the LGPD, you may at any time, free of charge, request:

| Right | What it means in practice |
|---|---|
| **Confirmation and access** | Know whether processing occurs and obtain a copy of your data |
| **Correction** | Correct incomplete, inaccurate, or outdated data |
| **Anonymization, blocking, or deletion** | Remove unnecessary or excessive data, or data processed unlawfully |
| **Portability** | Receive your data in a structured, interoperable format |
| **Deletion of data processed on the basis of consent** | E.g., unsubscribing from the newsletter and removing the corresponding record |
| **Information about sharing** | Know which public and private entities your data has been shared with |
| **Information about the option not to consent** | Understand the consequences of refusal |
| **Withdrawal of consent** | Withdraw, at any time, consent previously given |
| **Objection** | Object to processing based on legitimate interest |
| **Complaint to the ANPD** | File a complaint directly with the national authority |

Visitors in the European Economic Area additionally hold the rights set out in Articles 15 to 22 of the GDPR, including the right to lodge a complaint with their national supervisory authority.

### 10.1 Account deletion

You may close your account at any time through your profile settings, or by requesting it through the contact channel.

Upon deletion:

- **Deleted:** email address, username, password hash, avatar, OAuth provider identifier, personal description, profile links, password recovery tokens, and the link between your account and donations and the newsletter.
- **Kept in anonymized form:** comments, replies, votes, and Guestbook/Wall messages. The content remains visible but is **shown as belonging to a "deleted user"**, with no connection to you. Anonymization preserves the integrity and coherence of public conversations that other people took part in, and is expressly permitted by Article 18, IV of the LGPD as an alternative to deletion. If you also want **the content itself removed**, delete or request deletion of your comments and messages **before** closing your account.
- **Retained:** donation records, to the extent required by tax and accounting legislation; access logs, for the period set out in Article 15 of the Internet Civil Framework; and ban records, where applicable, for as long as necessary to exercise legal rights.
- **Cannot be removed:** blockchain transaction records (section 9.3).

### 10.2 How to exercise your rights

Send a request to **{{PRIVACY_EMAIL}}**, preferably from the email address registered to your account, describing the right you wish to exercise.

Requests are answered **within 15 (fifteen) days**, in accordance with Article 19, II of the LGPD. If a request cannot be met immediately, you will receive a reasoned reply explaining the factual or legal grounds.

**Additional identity verification** may be requested before a request is fulfilled, solely to protect your account against fraudulent third-party requests.

## 11. Children and adolescents

The Site is **not directed at people under 18** and does not knowingly collect children's data.

Under Article 14 of the LGPD, processing children's data (under 12 years of age) requires **specific, prominent consent from at least one parent or legal guardian**. Adolescents should use the Site with the supervision and knowledge of their guardians.

If you are a legal guardian and discover that a minor in your care has created an account or posted content, write to {{PRIVACY_EMAIL}}: the account and content will be removed as a priority.

## 12. Changes to this Policy

This Policy may be updated to reflect changes in the Site's features, in the providers used, or in applicable legislation.

- The **last updated** date and **version** number appear at the top of the document.
- **Substantial changes** — such as new processing purposes, new categories of data, or a change of legal basis — will be announced through a prominent notice on the Site and, where consent is involved, by email, with reasonable advance notice.
- Continued use of the Site after a new version takes effect indicates awareness of the changes. Where a change requires consent, consent will be requested again.

## 13. Contact

For questions, requests, complaints, or to exercise any right under this Policy:

**Email:** {{PRIVACY_EMAIL}}
**Address:** {{ADDRESS}}
**Response time:** up to 15 days

If you believe your request was not handled properly, you may file a complaint with Brazil's **National Data Protection Authority (ANPD)** — [www.gov.br/anpd](https://www.gov.br/anpd) — or, if you are in the European Economic Area, with your national supervisory authority.

---

*This document forms part of, and should be read together with, the [Terms of Use](/legal/terms).*
