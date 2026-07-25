import { Metadata } from "next";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of Service for Austin Mander AI Consulting",
};

export default function TermsPage() {
  return (
    <>
      <Navigation />
      <main className="pt-16">
        <section className="py-20 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-4xl font-bold text-navy dark:text-white mb-8">
                Terms of Service
              </h1>
              
              <Card className="p-8">
                <div className="prose prose-slate dark:prose-invert max-w-none">
                  <p className="text-muted-foreground mb-6">
                    <strong>Last Updated: November 2024</strong>
                  </p>

                  <h2 className="text-2xl font-semibold mt-8 mb-4">1. Agreement to Terms</h2>
                  <p className="text-muted-foreground mb-4">
                    By accessing or using the services provided by Austin Mander (“we,” “our,” or “us”) through austinmander.com or engaging our consulting services, you agree to be bound by these Terms of Service (“Terms”). If you disagree with any part of these terms, you may not access our services.
                  </p>

                  <h2 className="text-2xl font-semibold mt-8 mb-4">2. Description of Services</h2>
                  <p className="text-muted-foreground mb-4">
                    Austin Mander provides AI consulting services, including but not limited to:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
                    <li>Strategic AI consulting and advisory services</li>
                    <li>Change Radar platform implementation and support</li>
                    <li>AI transformation planning and execution</li>
                    <li>Training and educational resources</li>
                    <li>Custom AI solution development</li>
                  </ul>

                  <h2 className="text-2xl font-semibold mt-8 mb-4">3. Use of Website and Services</h2>
                  
                  <h3 className="text-xl font-semibold mt-6 mb-3">Acceptable Use</h3>
                  <p className="text-muted-foreground mb-4">
                    You agree to use our website and services only for lawful purposes and in accordance with these Terms. You agree not to:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
                    <li>Violate any applicable laws or regulations</li>
                    <li>Infringe upon intellectual property rights</li>
                    <li>Transmit harmful or malicious code</li>
                    <li>Attempt unauthorised access to our systems</li>
                    <li>Interfere with the proper functioning of our services</li>
                    <li>Misrepresent your identity or affiliation</li>
                  </ul>

                  <h2 className="text-2xl font-semibold mt-8 mb-4">4. Intellectual Property Rights</h2>
                  <p className="text-muted-foreground mb-4">
                    All content, features, and functionality on our website and in our services, including but not limited to text, graphics, logos, and software, are the exclusive property of Austin Mander and are protected by international copyright, trademark, and other intellectual property laws.
                  </p>
                  <p className="text-muted-foreground mb-4">
                    You may not reproduce, distribute, modify, or create derivative works without our express written permission.
                  </p>

                  <h2 className="text-2xl font-semibold mt-8 mb-4">5. Consulting Services Terms</h2>
                  
                  <h3 className="text-xl font-semibold mt-6 mb-3">Engagement</h3>
                  <p className="text-muted-foreground mb-4">
                    Specific terms for consulting engagements will be outlined in separate agreements or statements of work. These Terms serve as a foundation for all engagements unless explicitly superseded.
                  </p>

                  <h3 className="text-xl font-semibold mt-6 mb-3">Confidentiality</h3>
                  <p className="text-muted-foreground mb-4">
                    Both parties agree to maintain the confidentiality of proprietary information shared during the course of engagement. This obligation survives termination of services.
                  </p>

                  <h3 className="text-xl font-semibold mt-6 mb-3">Payment Terms</h3>
                  <p className="text-muted-foreground mb-4">
                    Payment terms, including fees, invoicing, and payment schedules, will be specified in individual service agreements. Late payments may incur interest charges as specified in the agreement.
                  </p>

                  <h2 className="text-2xl font-semibold mt-8 mb-4">6. Disclaimers and Warranties</h2>
                  <p className="text-muted-foreground mb-4">
                    Our services are provided “as is” without any warranties, express or implied. We do not guarantee:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
                    <li>Specific business outcomes or results</li>
                    <li>Uninterrupted or error-free service</li>
                    <li>Accuracy or completeness of information</li>
                    <li>Fitness for a particular purpose</li>
                  </ul>
                  <p className="text-muted-foreground mb-4">
                    Consulting advice is based on our professional judgment and experience but does not guarantee specific outcomes.
                  </p>

                  <h2 className="text-2xl font-semibold mt-8 mb-4">7. Limitation of Liability</h2>
                  <p className="text-muted-foreground mb-4">
                    To the maximum extent permitted by law, Austin Mander shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or business opportunities.
                  </p>
                  <p className="text-muted-foreground mb-4">
                    Our total liability for any claim arising from these Terms or our services shall not exceed the amount paid by you for the specific service giving rise to the claim.
                  </p>

                  <h2 className="text-2xl font-semibold mt-8 mb-4">8. Indemnification</h2>
                  <p className="text-muted-foreground mb-4">
                    You agree to indemnify and hold harmless Austin Mander, its officers, directors, employees, and agents from any claims, damages, losses, or expenses arising from your use of our services or violation of these Terms.
                  </p>

                  <h2 className="text-2xl font-semibold mt-8 mb-4">9. Data Protection</h2>
                  <p className="text-muted-foreground mb-4">
                    We process personal data in accordance with our <a href="/privacy" className="text-teal hover:underline">Privacy Policy</a> and applicable data protection laws. By using our services, you consent to such processing.
                  </p>

                  <h2 className="text-2xl font-semibold mt-8 mb-4">10. Third-Party Links and Services</h2>
                  <p className="text-muted-foreground mb-4">
                    Our website may contain links to third-party websites or services. We are not responsible for the content, accuracy, or practices of these third parties. Your use of third-party services is at your own risk.
                  </p>

                  <h2 className="text-2xl font-semibold mt-8 mb-4">11. Termination</h2>
                  <p className="text-muted-foreground mb-4">
                    We reserve the right to terminate or suspend your access to our services immediately, without prior notice, for any reason, including breach of these Terms.
                  </p>
                  <p className="text-muted-foreground mb-4">
                    Upon termination, your right to use our services will cease immediately. Provisions relating to intellectual property, confidentiality, and limitation of liability shall survive termination.
                  </p>

                  <h2 className="text-2xl font-semibold mt-8 mb-4">12. Force Majeure</h2>
                  <p className="text-muted-foreground mb-4">
                    Neither party shall be liable for any failure or delay in performance due to circumstances beyond reasonable control, including but not limited to acts of God, natural disasters, pandemic, war, terrorism, riots, or labour disputes.
                  </p>

                  <h2 className="text-2xl font-semibold mt-8 mb-4">13. Governing Law</h2>
                  <p className="text-muted-foreground mb-4">
                    These Terms shall be governed by and construed in accordance with the laws of England and Wales, without regard to its conflict of law provisions. Any disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales.
                  </p>

                  <h2 className="text-2xl font-semibold mt-8 mb-4">14. Severability</h2>
                  <p className="text-muted-foreground mb-4">
                    If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions shall continue in full force and effect.
                  </p>

                  <h2 className="text-2xl font-semibold mt-8 mb-4">15. Entire Agreement</h2>
                  <p className="text-muted-foreground mb-4">
                    These Terms, together with any specific service agreements and our Privacy Policy, constitute the entire agreement between you and Austin Mander regarding the use of our services.
                  </p>

                  <h2 className="text-2xl font-semibold mt-8 mb-4">16. Modifications</h2>
                  <p className="text-muted-foreground mb-4">
                    We reserve the right to modify these Terms at any time. We will notify users of any material changes by posting the updated Terms on our website. Your continued use of our services after such modifications constitutes acceptance of the updated Terms.
                  </p>

                  <h2 className="text-2xl font-semibold mt-8 mb-4">17. Contact Information</h2>
                  <p className="text-muted-foreground mb-4">
                    For questions about these Terms of Service, please contact us at:
                  </p>
                  <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                    <p className="text-muted-foreground">
                      <strong>Austin Mander</strong><br />
                      Email: legal@austinmander.com<br />
                      Address: London, United Kingdom
                    </p>
                  </div>
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