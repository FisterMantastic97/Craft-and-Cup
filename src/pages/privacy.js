import LegalPage from "../components/LegalPage";

export default function Privacy() {
  return (
    <LegalPage
      title="Privacy Policy"
      lastUpdated="July 18, 2026"
      description="How Craft & Cup collects, uses, and protects your information."
    >
      <p>
        This Privacy Policy explains how Craft &amp; Cup (the &ldquo;Service&rdquo;), operated by{" "}
        <span className="ph">[legal operator name]</span> (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or
        &ldquo;our&rdquo;), collects, uses, and shares information when you use the Service. By
        using Craft &amp; Cup, you agree to the practices described here.
      </p>

      <h2>1. Information we collect</h2>

      <h3>Account information</h3>
      <p>
        You sign in through Google or Discord. When you do, we receive basic account information
        from that provider - typically your email address, name, a provider account identifier, and
        (if available) an avatar image. We do not receive or store your password for those
        providers.
      </p>

      <h3>Profile and content you create</h3>
      <p>
        We store the content you add to build your journal: your screenname and display name, beans,
        recipes, tasting notes, scores, brew details, collections, and any photos you upload.{" "}
        <strong>
          Photos you upload are stored in our image storage and served through public URLs
        </strong>
        , which means an image can be viewed by anyone who has its link. Content you mark as public
        - including your public profile - may be visible to anyone on the internet.
      </p>

      <h3>Social activity</h3>
      <p>
        If you use social features, we store your friend connections, items you share, feed
        activity, and messages you send or receive through the in-app inbox.
      </p>

      <h3>Usage and device information</h3>
      <p>
        We use <strong>Vercel Analytics</strong> and <strong>Vercel Speed Insights</strong> to
        understand how the Service is used and to monitor performance. These collect aggregated,
        privacy-conscious information such as page views, referrers, approximate location derived
        from your IP, and general device and browser type. We use this to improve the Service, not
        to build advertising profiles.
      </p>

      <h3>Local storage on your device</h3>
      <p>
        The Service stores small amounts of data in your browser (for example, your theme
        preference, dismissed prompts, and your sign-in session). This stays on your device and is
        used to keep the app working and remember your preferences.
      </p>

      <h2>2. How we use your information</h2>
      <ul>
        <li>
          To provide and operate the Service - your account, journal, brews, and social features;
        </li>
        <li>To generate flavor profiles from your tasting notes (see the next section);</li>
        <li>To keep the Service secure, prevent abuse, and troubleshoot problems;</li>
        <li>To understand usage and improve performance and features; and</li>
        <li>To communicate with you about the Service where necessary.</li>
      </ul>

      <h2>3. AI processing of your tasting notes</h2>
      <p>
        When you ask Craft &amp; Cup to build a flavor profile, the relevant text you entered (such
        as your tasting notes or recipe ingredients) is sent to a third-party AI provider (
        <span className="ph">[name of AI provider]</span>) which processes it and returns a flavor
        mapping. We send only the text needed for that feature. Please review that provider&rsquo;s
        practices for details on how they handle data; you can find their policy at{" "}
        <span className="ph">[link to AI provider policy]</span>.
      </p>

      <h2>4. How we share information</h2>
      <p>
        We do <strong>not</strong> sell your personal information. We share information only as
        follows:
      </p>
      <ul>
        <li>
          <strong>Service providers (subprocessors)</strong> that run the Service on our behalf:{" "}
          <strong>Supabase</strong> (authentication, database, and image storage),{" "}
          <strong>Vercel</strong> (hosting and analytics), your sign-in provider (
          <strong>Google</strong> or <strong>Discord</strong>), and our <strong>AI provider</strong>{" "}
          for flavor analysis;
        </li>
        <li>
          <strong>Other users</strong>, when you choose to share content, add friends, send
          messages, or make content public;
        </li>
        <li>
          <strong>Legal and safety</strong> reasons, when we reasonably believe disclosure is
          required by law or necessary to protect the Service, our rights, or people&rsquo;s safety;
          and
        </li>
        <li>
          <strong>In a business transfer</strong>, such as a merger or acquisition, in which case we
          will take reasonable steps to protect your information.
        </li>
      </ul>

      <h2>5. Cookies and local storage</h2>
      <p>
        We use browser local storage and the cookies necessary for sign-in and core functionality,
        plus the privacy-conscious analytics described above. We do not use third-party advertising
        cookies. You can clear local storage and cookies in your browser settings, though doing so
        will sign you out and reset your preferences.
      </p>

      <h2>6. Data retention</h2>
      <p>
        We keep your information for as long as your account is active or as needed to provide the
        Service. When you delete content or your account, we delete or de-identify the associated
        personal information within a reasonable period, except where we need to retain it to comply
        with legal obligations, resolve disputes, or enforce our agreements, and except for content
        you have already shared with others.
      </p>

      <h2>7. Security</h2>
      <p>
        We use reasonable technical and organizational measures - including reputable infrastructure
        providers and access controls - to protect your information. No method of transmission or
        storage is completely secure, however, and we cannot guarantee absolute security.
      </p>

      <h2>8. Your rights and choices</h2>
      <p>
        Depending on where you live, you may have rights to access, correct, delete, or export your
        personal information, or to object to or restrict certain processing. You can edit much of
        your information directly in the app, and you can request account deletion or a copy of your
        data by contacting us at <span className="ph">[contact email]</span>. We will respond
        consistent with applicable law. If you are in the EU/UK, our legal bases for processing
        include performing our contract with you, your consent (which you may withdraw), and our
        legitimate interests in operating and improving the Service.
      </p>

      <h2>9. Children&rsquo;s privacy</h2>
      <p>
        The Service is not directed to children under <span className="ph">13</span>, and we do not
        knowingly collect personal information from them. If you believe a child has provided us
        personal information, contact us and we will take appropriate steps to delete it.
      </p>

      <h2>10. International users</h2>
      <p>
        We and our service providers may process and store information in countries other than
        yours, including the United States. Where required, we take steps to ensure appropriate
        protections for international transfers of personal information.
      </p>

      <h2>11. Changes to this policy</h2>
      <p>
        We may update this Privacy Policy from time to time. When we do, we will revise the
        &ldquo;Last updated&rdquo; date above and, for material changes, take reasonable steps to
        notify you. Your continued use of the Service after changes take effect means you accept the
        updated policy.
      </p>

      <h2>12. Contact</h2>
      <p>
        Questions or requests about your privacy? Reach us at{" "}
        <span className="ph">[contact email]</span>.
      </p>
    </LegalPage>
  );
}
