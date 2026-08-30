import { ArrowLeft, ArrowUp, ExternalLink, FileText, ShieldCheck } from 'lucide-react'
import BrandLogo from './BrandLogo.jsx'
import '../legal-page.css'

const LEGAL_DOCUMENTS = [
  { id: 'terms', label: 'Terms of service', shortLabel: 'Terms' },
  { id: 'privacy', label: 'Privacy notice', shortLabel: 'Privacy' },
  { id: 'cookies', label: 'Cookie policy', shortLabel: 'Cookies' },
]

const LAST_UPDATED = '30 August 2026'
const LAST_UPDATED_ISO = '2026-08-30'

function EmailLink({ email }) {
  return <a href={`mailto:${email}`}>{email}</a>
}

function TermsSections({ businessName, contactEmail }) {
  return [
    {
      id: 'agreement',
      title: '1. Our agreement',
      content: (
        <>
          <p>
            These Terms govern your use of the Tell &amp; Wed website and any digital invitation,
            design, customisation, hosting, RSVP or related service you order from us. “You” means
            the person creating an account, placing an order or using the service. “We”, “us” and
            “Tell &amp; Wed” mean {businessName}, based in Nairobi, Kenya.
          </p>
          <p>
            By using the service or approving an order, you agree to these Terms and our Privacy
            Notice. If you order for a couple, organisation or another person, you confirm that you
            have authority to bind them. You must be at least 18 years old and legally able to enter
            a contract.
          </p>
        </>
      ),
    },
    {
      id: 'services',
      title: '2. What we provide',
      content: (
        <>
          <p>
            We create and, where included in your order, host digital invitations and related event
            pages. A product description, accepted quote or order confirmation sets the scope for
            your order, including the chosen design, included revisions, features and delivery
            format. Preview images are examples; colours and layout can vary by device, browser and
            screen.
          </p>
          <p>
            Template purchases include the personal, limited right to use the delivered invitation
            for the event named in the order. They do not transfer the template, source code,
            production files, fonts or reusable design system unless we expressly agree in writing.
          </p>
        </>
      ),
    },
    {
      id: 'accounts',
      title: '3. Accounts and accurate information',
      content: (
        <>
          <p>
            Keep your sign-in details confidential and tell us promptly if you suspect unauthorised
            access. You are responsible for activity under your account until you notify us. Please
            provide accurate contact, event and billing details and keep them current.
          </p>
          <p>
            We may ask you to verify your identity, authority or payment before fulfilling an order
            or responding to a data request. Do not share an editing link with anyone you do not
            trust; changes made through an authorised account or private link may be treated as
            changes made by you.
          </p>
        </>
      ),
    },
    {
      id: 'prices-payment',
      title: '4. Prices, currency and payment',
      content: (
        <>
          <ul>
            <li>Prices and the payment schedule shown at checkout or in your accepted quote apply to your order.</li>
            <li>A crossed-out “Was” amount is the price that applied before the current promotion; “Now” is the current promotional price.</li>
            <li>Unless stated otherwise, payment is due before work starts or digital files and publishing access are released.</li>
            <li>Optional extras, work outside the agreed scope and additional revision rounds may be quoted separately.</li>
            <li>You are responsible for applicable taxes, bank fees and card-provider charges that are not included in the displayed total.</li>
          </ul>
          <p>
            Currency conversions shown on the site are conveniences based on recent exchange rates.
            Your payment provider may use a different rate or fee; the currency and final amount
            confirmed at checkout control. We may correct an obvious pricing error before accepting
            an order and will let you choose whether to pay the corrected price or cancel for a full
            refund of that unaccepted order.
          </p>
        </>
      ),
    },
    {
      id: 'custom-digital',
      title: '5. Custom work, cancellation and refunds',
      content: (
        <>
          <p>
            Our products are digital and are often personalised for a specific event. You may cancel
            before work begins for a refund of amounts paid, less any non-refundable payment costs
            disclosed to you and permitted by law. Once customisation, reserved production time or
            digital delivery has begun, we may retain the fair value of work already completed and
            committed third-party costs. After you approve a final design or receive a downloadable
            digital product, a change-of-mind refund is generally unavailable, subject always to
            rights that cannot be excluded under Kenyan consumer law.
          </p>
          <p>
            If we cannot provide a material part of the agreed service, we will offer a reasonable
            correction, replacement, credit or refund for the affected part. A request to postpone
            or substantially change an event may require a new timeline and fee. Tell us as early as
            possible at <EmailLink email={contactEmail} />.
          </p>
        </>
      ),
    },
    {
      id: 'client-content',
      title: '6. Your words, images, music and permissions',
      content: (
        <>
          <p>
            You keep ownership of material you supply. You give us a worldwide, non-exclusive,
            royalty-free licence to copy, edit, format, host and display that material only as needed
            to create, deliver, support and secure your order. This licence ends when the relevant
            material is deleted from our active systems, except for lawful records and temporary
            backups.
          </p>
          <p>
            You confirm that you have permission to use every name, photograph, illustration, logo,
            recording, song, location detail and other item you provide, including permission from
            identifiable people where required. Do not send unlawful, misleading, defamatory,
            discriminatory, threatening, obscene or infringing material, malware, or content that
            exposes someone’s private information without a proper basis.
          </p>
          <p>
            We may remove or decline material that creates a legal, safety or platform risk. Unless
            you separately opt in, we will not use your private event content in our portfolio or
            marketing.
          </p>
        </>
      ),
    },
    {
      id: 'proofs-approval',
      title: '7. Proofs, approvals and changes',
      content: (
        <>
          <p>
            You are responsible for checking names, dates, times, venues, directions, links,
            spelling, guest instructions and other details before approval and before sharing the
            invitation. Your written approval authorises us to publish or deliver that version.
          </p>
          <p>
            We will correct our production error without charge if you notify us promptly. Changes
            requested after approval—including corrections to information you supplied—may affect
            the delivery date and may carry a reasonable fee. Keep your own copy of final wording and
            important guest information.
          </p>
        </>
      ),
    },
    {
      id: 'timing-delivery',
      title: '8. Timing, delivery and availability',
      content: (
        <>
          <p>
            Delivery dates are good-faith estimates unless we expressly guarantee a deadline in
            writing. Your delay in supplying content, feedback, approval or payment moves the
            schedule accordingly. Internet services occasionally experience maintenance, outages or
            events outside reasonable control; we do not promise uninterrupted or error-free access.
          </p>
          <p>
            If hosting is included, the order confirmation should state the hosting period. We may
            archive or take an event page offline after that period. Download any records or keepsakes
            you wish to retain before the stated expiry date.
          </p>
        </>
      ),
    },
    {
      id: 'guest-data',
      title: '9. Guests, RSVPs and event data',
      content: (
        <>
          <p>
            You decide what guest information to collect and why. You must give guests an appropriate
            privacy notice, collect only what is reasonably needed, restrict access, and have a lawful
            basis for sending invitations or reminders. Sensitive details such as health, dietary,
            accessibility or religious information deserve extra care and should be optional unless
            genuinely needed.
          </p>
          <p>
            Where we process RSVP or guest data only on your instructions, you remain responsible for
            those instructions and your relationship with guests. We will process that data to provide
            and secure the service, as further described in our Privacy Notice.
          </p>
        </>
      ),
    },
    {
      id: 'acceptable-use',
      title: '10. Acceptable use and consequences',
      content: (
        <>
          <p>You must not use the service to:</p>
          <ul>
            <li>break a law, violate another person’s rights, impersonate someone or facilitate fraud;</li>
            <li>harass guests, send unsolicited bulk messages, scrape data or collect information deceptively;</li>
            <li>probe security, bypass access controls, introduce malicious code or interfere with the service;</li>
            <li>resell, copy, reverse engineer or commercially exploit our templates or service without permission; or</li>
            <li>publish content that creates a credible risk of harm to a person, venue, event or system.</li>
          </ul>
          <p>
            Depending on seriousness, we may ask you to correct the issue, restrict features, remove
            content, deactivate an invitation, suspend or close the account, preserve evidence, or
            report suspected unlawful conduct to the appropriate authority. Urgent safety, fraud,
            security or legal risks may require action without advance notice. Fees for properly
            completed work remain due, and a suspension caused by your breach does not create a right
            to a refund. You remain responsible for losses and claims caused by your unlawful content
            or misuse, subject to applicable law.
          </p>
        </>
      ),
    },
    {
      id: 'third-parties',
      title: '11. Third-party services',
      content: (
        <p>
          Payments, maps, messaging, social platforms, fonts, hosting or other features may be
          supplied by third parties under their own terms and privacy notices. We choose providers
          with reasonable care but do not control their networks, decisions or availability. A link
          to another site is not an endorsement. You are responsible for checking third-party terms
          before using their service.
        </p>
      ),
    },
    {
      id: 'intellectual-property',
      title: '12. Our intellectual property',
      content: (
        <p>
          The website, brand, software, templates, layouts, artwork and original content are owned by
          us or licensed to us and are protected by intellectual-property law. Except for the limited
          event-use licence in section 2, no right is transferred to you. Feedback may be used to
          improve the service without payment or attribution, but we will not treat your private event
          content as feedback.
        </p>
      ),
    },
    {
      id: 'liability',
      title: '13. Responsibility and limits',
      content: (
        <>
          <p>
            Nothing in these Terms excludes a right or remedy that cannot lawfully be excluded,
            including applicable rights under Kenya’s Consumer Protection Act. To the fullest extent
            the law permits, we are not liable for indirect, incidental or consequential loss, lost
            profits, lost opportunities, emotional distress, or losses caused by inaccurate client
            content, guest actions or third-party systems.
          </p>
          <p>
            To the fullest extent permitted by law, our total liability arising from an affected order
            is limited to the fees you paid us for that order. This cap does not apply to fraud,
            deliberate misconduct, death or personal injury caused by negligence, breach of data
            obligations where a cap is unlawful, or any liability the law does not allow us to limit.
          </p>
          <p>
            If a third party brings a claim because material you supplied infringes their rights, or
            because you used the service unlawfully, you will reimburse our reasonable resulting
            losses and legal costs to the extent you were responsible. We will notify you and allow
            reasonable participation in the defence.
          </p>
        </>
      ),
    },
    {
      id: 'ending',
      title: '14. Ending the service',
      content: (
        <>
          <p>
            You may stop using the site at any time and may ask us to close your account, subject to
            outstanding orders, lawful record-keeping and the cancellation terms above. We may end a
            discontinued feature or terminate an inactive service on reasonable notice. We may suspend
            or terminate sooner for a material breach, non-payment, fraud, security risk or legal
            requirement.
          </p>
          <p>
            Terms that logically continue—including payment, ownership, approved licences, liability,
            dispute and record-keeping provisions—survive termination.
          </p>
        </>
      ),
    },
    {
      id: 'law-changes-contact',
      title: '15. Changes, Kenyan law and contact',
      content: (
        <>
          <p>
            We may update these Terms for legal, security or service changes. The date above shows the
            latest version. Material changes will apply prospectively and, where reasonable, we will
            provide notice. The version accepted with an order continues to govern that order unless
            a change is required by law or you agree otherwise.
          </p>
          <p>
            These Terms are governed by the laws of Kenya. Before starting formal proceedings, each
            party should give the other written details and allow 30 days to try to resolve the issue
            in good faith. If it remains unresolved, the courts of Kenya will have jurisdiction,
            without preventing either party from seeking urgent protective relief or using a consumer
            remedy available by law.
          </p>
          <p>
            Questions or legal notices: {businessName}, Nairobi, Kenya, at{' '}
            <EmailLink email={contactEmail} />. Use the subject “Legal notice” for formal notices.
          </p>
        </>
      ),
    },
  ]
}

function PrivacySections({ businessName, contactEmail, navigate }) {
  const goToCookies = (event) => {
    if (!navigate) return
    event.preventDefault()
    navigate('cookies')
  }

  return [
    {
      id: 'scope',
      title: '1. Scope and who is responsible',
      content: (
        <>
          <p>
            This notice explains how {businessName}, based in Nairobi, Kenya, handles personal data
            when you browse, create an account, make an enquiry, place an order or interact with a
            Tell &amp; Wed invitation.
          </p>
          <p>
            For customer, account, order and website data, we normally decide why and how it is used
            and act as the data controller. For guest or RSVP information that a customer asks us to
            host or process on their behalf, the customer generally decides the purpose and we act as
            their service provider or data processor. Guests may contact either the event host or us
            if they are unsure.
          </p>
        </>
      ),
    },
    {
      id: 'data-collected',
      title: '2. Data we collect',
      content: (
        <>
          <ul>
            <li><strong>Account and contact data:</strong> name, email, phone number, sign-in records and communication preferences.</li>
            <li><strong>Order and event data:</strong> selected design, couple or host names, event dates and places, wording, images, customisation choices, correspondence and approvals.</li>
            <li><strong>Guest and RSVP data:</strong> name, response, party size, contact details and optional dietary, accessibility or message fields chosen by the event host.</li>
            <li><strong>Payment and transaction data:</strong> amount, currency, status and provider reference. A payment provider normally handles full card or mobile-money credentials; we do not need to store them.</li>
            <li><strong>Device and usage data:</strong> IP address, browser, device type, referring page, security logs and consent choices. Optional analytics are used only if enabled and consent is required.</li>
            <li><strong>Information you send us:</strong> support requests, reports, survey responses and other correspondence.</li>
          </ul>
          <p>Please do not send sensitive personal data unless it is genuinely needed for the requested service.</p>
        </>
      ),
    },
    {
      id: 'sources',
      title: '3. Where data comes from',
      content: (
        <p>
          We receive data directly from you, from an event host who includes you on an invitation or
          guest list, from your device when you use the site, and from service providers such as
          payment or authentication partners. If you give us another person’s data, you must have an
          appropriate reason and tell them how it will be used.
        </p>
      ),
    },
    {
      id: 'uses-bases',
      title: '4. Why we use data and our lawful bases',
      content: (
        <>
          <ul>
            <li><strong>Contract:</strong> to create accounts, respond to pre-order requests, fulfil and support orders, publish invitations, collect RSVPs and take payment.</li>
            <li><strong>Legitimate interests:</strong> to secure the service, prevent fraud, keep necessary business records, improve usability and handle disputes, where those interests do not override your rights.</li>
            <li><strong>Consent:</strong> for optional analytics, marketing messages, portfolio use and other activities where we ask you to choose. You may withdraw consent prospectively.</li>
            <li><strong>Legal obligation and public interest:</strong> to meet tax, accounting, consumer, data-protection or lawful-authority requirements and to address serious safety or security issues.</li>
          </ul>
          <p>We do not sell personal data. We do not use guest lists for our own advertising.</p>
        </>
      ),
    },
    {
      id: 'guest-data',
      title: '5. Guest and RSVP data',
      content: (
        <>
          <p>
            Event hosts choose the invitation audience and RSVP questions. We use guest data to show
            the invitation, record responses, send host-requested service messages, provide support
            and protect the page. The host can view and manage responses for their event.
          </p>
          <p>
            If you are a guest, first contact the host for changes tied to their guest list. You may
            also contact us, and we will help or forward the request where the host must decide it.
            We will not disclose one guest’s response to another guest unless the invitation clearly
            enables a shared feature and doing so is lawful.
          </p>
        </>
      ),
    },
    {
      id: 'sharing',
      title: '6. When data is shared',
      content: (
        <>
          <p>We share only what is reasonably necessary with:</p>
          <ul>
            <li>the customer or event host responsible for the invitation;</li>
            <li>hosting, storage, email, support, authentication, analytics and security providers acting under contract;</li>
            <li>payment providers, banks and fraud-prevention partners handling a transaction;</li>
            <li>professional advisers, insurers or a buyer during a genuine business restructuring under confidentiality; and</li>
            <li>courts, regulators, law enforcement or affected parties where disclosure is lawfully required or reasonably necessary to protect rights and safety.</li>
          </ul>
          <p>
            We do not make personal data public merely because it appears in an invitation. The host
            controls who receives the invitation link, but no online link is completely immune from
            forwarding or screenshots.
          </p>
        </>
      ),
    },
    {
      id: 'international',
      title: '7. International processing',
      content: (
        <p>
          Some providers may store or access data outside Kenya. When Kenyan data-protection law
          requires safeguards, we use an appropriate transfer mechanism, contractual protections,
          provider due diligence or consent, and consider the nature of the data and destination.
          Contact us for information about safeguards relevant to your data.
        </p>
      ),
    },
    {
      id: 'retention',
      title: '8. How long we keep data',
      content: (
        <>
          <p>
            We keep personal data only while needed for the purpose collected, then delete or
            anonymise it, subject to backups and lawful records. Retention depends on the order,
            hosting period, account activity, sensitivity, dispute risk and legal duties.
          </p>
          <ul>
            <li>Account data is generally kept while the account is active and for a reasonable closure period.</li>
            <li>Invitation and RSVP data is kept through the hosting period and a reasonable download, support and backup cycle.</li>
            <li>Invoices, payment records, approvals and key correspondence may be kept for the period required for tax, accounting, fraud prevention and legal claims.</li>
            <li>Consent records are kept long enough to demonstrate and respect your choice.</li>
          </ul>
          <p>You can ask about or request deletion of a specific record using the contact details below.</p>
        </>
      ),
    },
    {
      id: 'security',
      title: '9. Security',
      content: (
        <p>
          We use proportionate technical and organisational measures such as access controls,
          provider review, secure transport, backups and limited staff access. No online system is
          perfectly secure. Keep account and private invitation links confidential and notify us at{' '}
          <EmailLink email={contactEmail} /> if you suspect misuse. Where required, we will assess and
          notify affected people and Kenya’s Office of the Data Protection Commissioner of a breach.
        </p>
      ),
    },
    {
      id: 'choices-rights',
      title: '10. Your choices and rights',
      content: (
        <>
          <p>
            Subject to the Data Protection Act, 2019 and lawful exceptions, you may have the right to
            be informed, access your personal data, object to processing, correct false or misleading
            data, request deletion of false or misleading data, restrict certain processing, obtain
            portable data, and withdraw consent without affecting earlier lawful processing.
          </p>
          <p>
            Email <EmailLink email={contactEmail} /> with enough detail to identify the account,
            invitation or response. We may verify identity and authority before acting. You may also
            complain to Kenya’s Office of the Data Protection Commissioner at{' '}
            <a href="https://www.odpc.go.ke/" target="_blank" rel="noreferrer">
              odpc.go.ke <ExternalLink size={13} aria-hidden="true" />
            </a>.
          </p>
        </>
      ),
    },
    {
      id: 'cookies-marketing',
      title: '11. Cookies and marketing',
      content: (
        <>
          <p>
            Necessary browser storage supports preferences and security. Optional analytics and
            marketing storage remain off unless you choose them where consent is required. Read our{' '}
            <a href="#legal/cookies" onClick={goToCookies}>Cookie Policy</a> or open Cookie settings
            from the site footer to change your choice.
          </p>
          <p>
            We send promotional email or messages only with a lawful basis. You can use an unsubscribe
            control or contact us. Service messages about an account, order, security or RSVP are not
            marketing and may still be sent when necessary.
          </p>
        </>
      ),
    },
    {
      id: 'children',
      title: '12. Children',
      content: (
        <p>
          The ordering service is for adults and is not directed to children. An event host may include
          a child’s name or attendance details where they have authority to do so, but should minimise
          that information and avoid making it publicly accessible. Contact us if you believe a child’s
          data was supplied improperly.
        </p>
      ),
    },
    {
      id: 'changes-contact',
      title: '13. Changes and contact',
      content: (
        <>
          <p>
            We may update this notice when our service, providers or legal obligations change. We will
            post the new date and give proportionate notice of material changes.
          </p>
          <p>
            Privacy questions and requests: {businessName}, Nairobi, Kenya, at{' '}
            <EmailLink email={contactEmail} />. Please use the subject “Privacy request”.
          </p>
        </>
      ),
    },
  ]
}

function CookieSections({ businessName, contactEmail, onOpenCookiePreferences }) {
  return [
    {
      id: 'overview',
      title: '1. What this policy covers',
      content: (
        <>
          <p>
            This policy explains how {businessName} uses cookies and similar browser technologies,
            including local storage and session storage, on the Tell &amp; Wed website. These technologies
            can remember a choice, keep a feature working, measure use or support advertising.
          </p>
          <p>
            Our consent banner records your choice; it does not itself load analytics or advertising
            tools. Non-essential categories must remain disabled unless you opt in and the relevant
            tool has actually been integrated.
          </p>
        </>
      ),
    },
    {
      id: 'categories',
      title: '2. Categories we use',
      content: (
        <div className="tw-legal__table-wrap">
          <table>
            <caption>Browser-storage categories and their default status</caption>
            <thead>
              <tr><th scope="col">Category</th><th scope="col">Purpose</th><th scope="col">Default</th></tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Necessary</th>
                <td>Stores consent, sign-in or security state, session navigation, saved designs and settings requested by you. The site may not work as expected without it.</td>
                <td><span className="tw-legal__status tw-legal__status--on">Always on</span></td>
              </tr>
              <tr>
                <th scope="row">Analytics</th>
                <td>Would help us understand aggregate visits, performance and feature use so we can improve the service.</td>
                <td><span className="tw-legal__status">Off until accepted</span></td>
              </tr>
              <tr>
                <th scope="row">Marketing</th>
                <td>Would support campaign measurement, relevant promotions or social-media advertising across sites.</td>
                <td><span className="tw-legal__status">Off until accepted</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      ),
    },
    {
      id: 'current-storage',
      title: '3. Storage currently used by this site',
      content: (
        <>
          <p>Depending on the features you use, first-party browser storage may remember:</p>
          <ul>
            <li>your cookie choice and the policy version;</li>
            <li>whether the opening loading screen has already appeared during the browser session;</li>
            <li>saved invitation designs on that device;</li>
            <li>temporary collection filters, search and sort choices; and</li>
            <li>account or security state once sign-in features are enabled.</li>
          </ul>
          <p>
            Session storage is normally cleared when the browser session ends. Local storage remains
            until it expires, the site removes it or you clear it in your browser. The consent record
            is reviewed periodically and when this policy materially changes.
          </p>
        </>
      ),
    },
    {
      id: 'third-parties',
      title: '4. Third parties and social links',
      content: (
        <p>
          A payment, map, video, analytics or social provider may set its own technology if its feature
          is enabled or you follow a link to its site. Instagram and TikTok links do not need to load
          those platforms inside this site; once you leave Tell &amp; Wed, the destination’s own policy
          applies. We will update this policy and the consent controls before introducing a new
          non-essential tracker.
        </p>
      ),
    },
    {
      id: 'choices',
      title: '5. Change or withdraw your choice',
      content: (
        <>
          <p>
            You can accept all, reject non-essential categories or make a custom choice. Withdrawing
            consent is prospective and does not make earlier consented processing unlawful. Rejecting
            optional categories will not block core browsing or purchasing features.
          </p>
          {onOpenCookiePreferences && (
            <button className="tw-legal__settings-button" type="button" onClick={onOpenCookiePreferences}>
              Open cookie settings
            </button>
          )}
          <p>
            You can also clear or block storage through your browser. Blocking necessary storage may
            prevent saved designs, sign-in, security and preference features from working. Browser
            “do not track” signals are not yet interpreted consistently; we will honour legally
            recognised opt-out signals where required and technically supported.
          </p>
        </>
      ),
    },
    {
      id: 'updates-contact',
      title: '6. Updates and contact',
      content: (
        <>
          <p>
            We may update this policy when technologies, providers or legal requirements change. A
            material change may prompt the consent banner to ask again.
          </p>
          <p>
            Questions about cookies or privacy: {businessName}, Nairobi, Kenya, at{' '}
            <EmailLink email={contactEmail} />.
          </p>
        </>
      ),
    },
  ]
}

function getDocumentContent(type, options) {
  if (type === 'privacy') {
    return {
      eyebrow: 'Your information',
      title: 'Privacy notice',
      intro: 'What we collect, why we use it, who receives it and the choices available to customers and wedding guests.',
      summary: ['No sale of personal data', 'Guest lists are not used for our advertising', 'Kenyan data rights respected'],
      sections: PrivacySections(options),
    }
  }

  if (type === 'cookies') {
    return {
      eyebrow: 'Your browser, your choice',
      title: 'Cookie policy',
      intro: 'A clear guide to the browser storage we need, the optional categories you control, and how to change your mind.',
      summary: ['Necessary storage only by default', 'Analytics and marketing are optional', 'Change your choice at any time'],
      sections: CookieSections(options),
    }
  }

  return {
    eyebrow: 'The working agreement',
    title: 'Terms of service',
    intro: 'The practical rules for ordering, approving and using a Tell & Wed digital invitation.',
    summary: ['Clear approval and delivery responsibilities', 'Fair rules for personalised digital work', 'Kenyan law applies'],
    sections: TermsSections(options),
  }
}

/**
 * Standalone legal document view.
 *
 * `navigate` receives one of: "home", "terms", "privacy", or "cookies".
 * Without it, ordinary hash links still work.
 */
export default function LegalPage({
  document: requestedDocument = 'terms',
  navigate,
  businessName = 'Tell & Wed',
  contactEmail = 'hello@tellandwed.com',
  onOpenCookiePreferences,
}) {
  const type = LEGAL_DOCUMENTS.some((item) => item.id === requestedDocument)
    ? requestedDocument
    : 'terms'
  const content = getDocumentContent(type, {
    businessName,
    contactEmail,
    navigate,
    onOpenCookiePreferences,
  })
  const titleId = `legal-${type}-top`

  const followNavigation = (event, destination) => {
    if (!navigate) return
    event.preventDefault()
    navigate(destination)
  }

  const followSectionLink = (event, targetId) => {
    event.preventDefault()
    const target = window.document.getElementById(targetId)
    if (!target) return
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
    window.requestAnimationFrame(() => target.focus({ preventScroll: true }))
  }

  return (
    <main className="tw-legal" aria-labelledby={titleId}>
      <header className="tw-legal__masthead">
        <a
          className="tw-legal__home"
          href="#home"
          onClick={(event) => followNavigation(event, 'home')}
          aria-label="Back to Tell & Wed home"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          <BrandLogo />
        </a>

        <nav className="tw-legal__documents" aria-label="Legal documents">
          {LEGAL_DOCUMENTS.map((item) => (
            <a
              key={item.id}
              href={`#legal/${item.id}`}
              onClick={(event) => followNavigation(event, item.id)}
              className={type === item.id ? 'is-current' : undefined}
              aria-current={type === item.id ? 'page' : undefined}
            >
              <span className="tw-legal__document-long">{item.label}</span>
              <span className="tw-legal__document-short">{item.shortLabel}</span>
            </a>
          ))}
        </nav>
      </header>

      <section className="tw-legal__hero">
        <div className="tw-legal__hero-copy">
          <span className="tw-legal__eyebrow"><ShieldCheck size={15} aria-hidden="true" /> {content.eyebrow}</span>
          <h1 id={titleId} tabIndex={-1}>{content.title}</h1>
          <p>{content.intro}</p>
          <span className="tw-legal__updated">Last updated <time dateTime={LAST_UPDATED_ISO}>{LAST_UPDATED}</time></span>
        </div>
        <aside className="tw-legal__summary" aria-label={`${content.title} at a glance`}>
          <span><FileText size={16} aria-hidden="true" /> At a glance</span>
          <ul>{content.summary.map((item) => <li key={item}>{item}</li>)}</ul>
        </aside>
      </section>

      <div className="tw-legal__layout">
        <aside className="tw-legal__index">
          <nav aria-label={`Sections in ${content.title}`}>
            <span>On this page</span>
            <ol>
              {content.sections.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#legal-${type}-${section.id}`}
                    onClick={(event) => followSectionLink(event, `legal-${type}-${section.id}`)}
                  >
                    {section.title.replace(/^\d+\.\s*/, '')}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </aside>

        <article className="tw-legal__article">
          <div className="tw-legal__plain-language">
            <strong>Plain-language document.</strong>
            <span>Headings and summaries help navigation; the full sections below form the policy.</span>
          </div>
          {content.sections.map((section) => (
            <section id={`legal-${type}-${section.id}`} key={section.id} tabIndex={-1}>
              <h2>{section.title}</h2>
              {section.content}
            </section>
          ))}
          <div className="tw-legal__end-mark" aria-hidden="true"><span>&amp;</span></div>
          <a className="tw-legal__to-top" href={`#${titleId}`} onClick={(event) => followSectionLink(event, titleId)}>
            Back to top <ArrowUp size={15} aria-hidden="true" />
          </a>
        </article>
      </div>
    </main>
  )
}
