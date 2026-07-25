import { Metadata } from "next";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy for Austin Mander AI Consulting Services",
};

export default function PrivacyPage() {
  return (
    <>
      <Navigation />
      <main className="pt-16">
        <section className="py-20 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-4xl font-bold text-navy dark:text-white mb-8">
                Privacy Policy
              </h1>
              
              <Card className="p-8">
                <div className="prose prose-slate dark:prose-invert max-w-none">
                  <p className="text-muted-foreground mb-6">
                    <strong>Last Updated: November 2024</strong>
                  </p>

                  <h2 className="text-2xl font-semibold mt-8 mb-4">1. Introduction</h2>
                  <p className="text-muted-foreground mb-4">
                    Austin Mander (“we,” “our,” or “us”) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website austinmander.com or engage with our consulting services.
                  </p>

                  <h2 className="text-2xl font-semibold mt-8 mb-4">2. Information We Collect</h2>
                  
                  <h3 className="text-xl font-semibold mt-6 mb-3">Personal Information</h3>
                  <p className="text-muted-foreground mb-4">
                    We may collect personal information that you provide directly to us, including:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
                    <li>Name and job title</li>
                    <li>Email address</li>
                    <li>Phone number</li>
                    <li>Company name and address</li>
                    <li>Information provided in messages or consultation requests</li>
                    <li>Professional information relevant to our services</li>
                  </ul>

                  <h3 className="text-xl font-semibold mt-6 mb-3">Usage Information</h3>
                  <p className="text-muted-foreground mb-4">
                    We automatically collect certain information when you visit our website:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
                    <li>IP address and location data</li>
                    <li>Browser type and version</li>
                    <li>Pages visited and time spent</li>
                    <li>Referring website addresses</li>
                    <li>Device information</li>
                  </ul>

                  <h2 className="text-2xl font-semibold mt-8 mb-4">3. How We Use Your Information</h2>
                  <p className="text-muted-foreground mb-4">
                    We use the information we collect to:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
                    <li>Provide and improve our consulting services</li>
                    <li>Respond to your inquiries and consultation requests</li>
                    <li>Send you relevant information about our services</li>
                    <li>Analyse website usage and improve user experience</li>
                    <li>Comply with legal obligations</li>
                    <li>Protect against fraudulent or illegal activity</li>
                  </ul>

                  <h2 className="text-2xl font-semibold mt-8 mb-4">4. Information Sharing</h2>
                  <p className="text-muted-foreground mb-4">
                    We do not sell, trade, or rent your personal information. We may share your information only in the following circumstances:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
                    <li>With your consent</li>
                    <li>To comply with legal obligations</li>
                    <li>To protect our rights and safety</li>
                    <li>With service providers who assist in our operations (under strict confidentiality agreements)</li>
                    <li>In connection with a business transfer or merger</li>
                  </ul>

                  <h2 className="text-2xl font-semibold mt-8 mb-4">5. Data Security</h2>
                  <p className="text-muted-foreground mb-4">
                    We implement appropriate technical and organisational measures to protect your personal information against unauthorised access, alteration, disclosure, or destruction. These measures include:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
                    <li>SSL encryption for data transmission</li>
                    <li>Secure data storage systems</li>
                    <li>Regular security assessments</li>
                    <li>Limited access to personal information</li>
                    <li>Employee confidentiality agreements</li>
                  </ul>

                  <h2 className="text-2xl font-semibold mt-8 mb-4">6. Your Rights</h2>
                  <p className="text-muted-foreground mb-4">
                    Under GDPR and UK data protection laws, you have the right to:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
                    <li>Access your personal information</li>
                    <li>Correct inaccurate information</li>
                    <li>Request deletion of your information</li>
                    <li>Object to processing of your information</li>
                    <li>Request restriction of processing</li>
                    <li>Data portability</li>
                    <li>Withdraw consent at any time</li>
                  </ul>

                  <h2 className="text-2xl font-semibold mt-8 mb-4">7. Cookies</h2>
                  <p className="text-muted-foreground mb-4">
                    We use cookies and similar tracking technologies to enhance your experience on our website. For detailed information, please see our <a href="/cookies" className="text-teal hover:underline">Cookie Policy</a>.
                  </p>

                  <h2 className="text-2xl font-semibold mt-8 mb-4">8. Third-Party Services</h2>
                  <p className="text-muted-foreground mb-4">
                    Our website may contain links to third-party websites. We are not responsible for the privacy practices of these external sites. We encourage you to review their privacy policies.
                  </p>

                  <h2 className="text-2xl font-semibold mt-8 mb-4">9. Data Retention</h2>
                  <p className="text-muted-foreground mb-4">
                    We retain personal information only for as long as necessary to fulfil the purposes outlined in this policy, unless a longer retention period is required by law. Typically:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
                    <li>Client information: 7 years after last engagement</li>
                    <li>Newsletter subscribers: Until unsubscribe</li>
                    <li>Website analytics: 26 months</li>
                    <li>Consultation inquiries: 2 years</li>
                  </ul>

                  <h2 className="text-2xl font-semibold mt-8 mb-4">10. International Data Transfers</h2>
                  <p className="text-muted-foreground mb-4">
                    Your information may be transferred to and processed in countries other than your country of residence. We ensure appropriate safeguards are in place to protect your information in accordance with this policy.
                  </p>

                  <h2 className="text-2xl font-semibold mt-8 mb-4">11. Children’s Privacy</h2>
                  <p className="text-muted-foreground mb-4">
                    Our services are not directed to individuals under 18 years of age. We do not knowingly collect personal information from children.
                  </p>

                  <h2 className="text-2xl font-semibold mt-8 mb-4">12. Updates to This Policy</h2>
                  <p className="text-muted-foreground mb-4">
                    We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the “Last Updated” date.
                  </p>

                  <h2 className="text-2xl font-semibold mt-8 mb-4">13. Contact Us</h2>
                  <p className="text-muted-foreground mb-4">
                    If you have questions about this Privacy Policy or our privacy practices, please contact us at:
                  </p>
                  <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                    <p className="text-muted-foreground">
                      <strong>Austin Mander</strong><br />
                      Email: privacy@austinmander.com<br />
                      Address: London, United Kingdom
                    </p>
                  </div>

                  <h2 className="text-2xl font-semibold mt-8 mb-4">14. Supervisory Authority</h2>
                  <p className="text-muted-foreground">
                    If you are located in the UK, you have the right to lodge a complaint with the Information Commissioner’s Office (ICO) at <a href="https://ico.org.uk" className="text-teal hover:underline">ico.org.uk</a>.
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}