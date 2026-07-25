import { Metadata } from "next";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "Cookie Policy for Austin Mander AI Consulting",
};

export default function CookiesPage() {
  return (
    <>
      <Navigation />
      <main className="pt-16">
        <section className="py-20 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-4xl font-bold text-navy dark:text-white mb-8">
                Cookie Policy
              </h1>
              
              <Card className="p-8">
                <div className="prose prose-slate dark:prose-invert max-w-none">
                  <p className="text-muted-foreground mb-6">
                    <strong>Last Updated: November 2024</strong>
                  </p>

                  <h2 className="text-2xl font-semibold mt-8 mb-4">1. What Are Cookies?</h2>
                  <p className="text-muted-foreground mb-4">
                    Cookies are small text files that are placed on your device when you visit a website. They help websites remember your preferences, improve your user experience, and provide information to website owners about how their site is being used.
                  </p>

                  <h2 className="text-2xl font-semibold mt-8 mb-4">2. How We Use Cookies</h2>
                  <p className="text-muted-foreground mb-4">
                    Austin Mander uses cookies and similar technologies to:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
                    <li>Remember your preferences and settings</li>
                    <li>Understand how you use our website</li>
                    <li>Improve website performance and functionality</li>
                    <li>Analyse website traffic and user behaviour</li>
                    <li>Provide relevant content and communications</li>
                    <li>Ensure website security</li>
                  </ul>

                  <h2 className="text-2xl font-semibold mt-8 mb-4">3. Types of Cookies We Use</h2>
                  
                  <h3 className="text-xl font-semibold mt-6 mb-3">Essential Cookies</h3>
                  <p className="text-muted-foreground mb-4">
                    These cookies are necessary for the website to function properly. They enable basic functions like page navigation and access to secure areas of the website.
                  </p>
                  <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg mb-4">
                    <p className="font-semibold mb-2">Examples:</p>
                    <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
                      <li>Session cookies for maintaining your session</li>
                      <li>Security cookies for preventing CSRF attacks</li>
                      <li>Load balancing cookies for optimal performance</li>
                    </ul>
                  </div>

                  <h3 className="text-xl font-semibold mt-6 mb-3">Analytics Cookies</h3>
                  <p className="text-muted-foreground mb-4">
                    These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously.
                  </p>
                  <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg mb-4">
                    <p className="font-semibold mb-2">Examples:</p>
                    <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
                      <li>Google Analytics (_ga, _gid) - 26 months retention</li>
                      <li>Plausible Analytics - no cookies, privacy-focused</li>
                      <li>Page view tracking and user journey analysis</li>
                    </ul>
                  </div>

                  <h3 className="text-xl font-semibold mt-6 mb-3">Functional Cookies</h3>
                  <p className="text-muted-foreground mb-4">
                    These cookies enable enhanced functionality and personalisation, such as remembering your preferences.
                  </p>
                  <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg mb-4">
                    <p className="font-semibold mb-2">Examples:</p>
                    <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
                      <li>Theme preference (dark/light mode)</li>
                      <li>Language settings</li>
                      <li>Form auto-fill preferences</li>
                    </ul>
                  </div>

                  <h3 className="text-xl font-semibold mt-6 mb-3">Marketing Cookies</h3>
                  <p className="text-muted-foreground mb-4">
                    These cookies may be set through our site by advertising partners to build a profile of your interests and show relevant ads on other sites.
                  </p>
                  <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg mb-4">
                    <p className="font-semibold mb-2">Examples:</p>
                    <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
                      <li>LinkedIn Insight Tag - professional targeting</li>
                      <li>Facebook Pixel - retargeting campaigns</li>
                      <li>Google Ads - conversion tracking</li>
                    </ul>
                  </div>

                  <h2 className="text-2xl font-semibold mt-8 mb-4">4. Third-Party Cookies</h2>
                  <p className="text-muted-foreground mb-4">
                    Some cookies are placed by third-party services that appear on our pages. We do not control these cookies. Third-party providers include:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
                    <li><strong>Google Analytics:</strong> Website analytics</li>
                    <li><strong>Calendly:</strong> Appointment booking</li>
                    <li><strong>YouTube:</strong> Embedded videos</li>
                    <li><strong>LinkedIn:</strong> Social sharing and analytics</li>
                    <li><strong>Typeform:</strong> Forms and surveys</li>
                  </ul>

                  <h2 className="text-2xl font-semibold mt-8 mb-4">5. Managing Cookies</h2>
                  
                  <h3 className="text-xl font-semibold mt-6 mb-3">Cookie Preferences</h3>
                  <p className="text-muted-foreground mb-4">
                    You can manage your cookie preferences at any time by clicking the “Cookie Settings” button at the bottom of any page on our website.
                  </p>
                  
                  <h3 className="text-xl font-semibold mt-6 mb-3">Browser Settings</h3>
                  <p className="text-muted-foreground mb-4">
                    Most web browsers allow you to control cookies through their settings. You can:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
                    <li>View what cookies are stored on your device</li>
                    <li>Delete cookies individually or entirely</li>
                    <li>Block third-party cookies</li>
                    <li>Block all cookies from specific websites</li>
                    <li>Block all cookies completely</li>
                  </ul>

                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 rounded-lg mb-4">
                    <p className="text-amber-800 dark:text-amber-200">
                      <strong>Note:</strong> Blocking all cookies may impact your experience on our website and prevent certain features from functioning properly.
                    </p>
                  </div>

                  <h3 className="text-xl font-semibold mt-6 mb-3">Browser-Specific Instructions</h3>
                  <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
                    <li><a href="https://support.google.com/chrome/answer/95647" className="text-teal hover:underline">Google Chrome</a></li>
                    <li><a href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer" className="text-teal hover:underline">Mozilla Firefox</a></li>
                    <li><a href="https://support.apple.com/en-gb/guide/safari/sfri11471/mac" className="text-teal hover:underline">Safari</a></li>
                    <li><a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" className="text-teal hover:underline">Microsoft Edge</a></li>
                  </ul>

                  <h2 className="text-2xl font-semibold mt-8 mb-4">6. Do Not Track Signals</h2>
                  <p className="text-muted-foreground mb-4">
                    Our website responds to Do Not Track (DNT) browser signals. When DNT is enabled, we limit the collection of browsing data and disable certain tracking technologies.
                  </p>

                  <h2 className="text-2xl font-semibold mt-8 mb-4">7. Cookie Duration</h2>
                  <p className="text-muted-foreground mb-4">
                    Cookies can be either “session” or “persistent” cookies:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
                    <li><strong>Session cookies:</strong> Deleted when you close your browser</li>
                    <li><strong>Persistent cookies:</strong> Remain on your device for a set period</li>
                  </ul>
                  
                  <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg mb-4">
                    <p className="font-semibold mb-2">Our Cookie Retention Periods:</p>
                    <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
                      <li>Essential cookies: Session or up to 24 hours</li>
                      <li>Analytics cookies: Up to 26 months</li>
                      <li>Functional cookies: Up to 1 year</li>
                      <li>Marketing cookies: Up to 90 days</li>
                    </ul>
                  </div>

                  <h2 className="text-2xl font-semibold mt-8 mb-4">8. Updates to This Policy</h2>
                  <p className="text-muted-foreground mb-4">
                    We may update this Cookie Policy from time to time to reflect changes in our practices or for legal, operational, or regulatory reasons. We will notify you of any material changes by posting the new policy on this page.
                  </p>

                  <h2 className="text-2xl font-semibold mt-8 mb-4">9. Contact Us</h2>
                  <p className="text-muted-foreground mb-4">
                    If you have questions about our use of cookies, please contact us at:
                  </p>
                  <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg mb-4">
                    <p className="text-muted-foreground">
                      <strong>Austin Mander</strong><br />
                      Email: privacy@austinmander.com<br />
                      Address: London, United Kingdom
                    </p>
                  </div>

                  <h2 className="text-2xl font-semibold mt-8 mb-4">10. More Information</h2>
                  <p className="text-muted-foreground mb-4">
                    For more information about cookies and how to manage them, visit:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                    <li><a href="https://www.allaboutcookies.org" className="text-teal hover:underline">All About Cookies</a></li>
                    <li><a href="https://ico.org.uk/for-organisations/guide-to-pecr/cookies-and-similar-technologies/" className="text-teal hover:underline">ICO Guidance on Cookies</a></li>
                    <li><a href="https://www.youronlinechoices.eu" className="text-teal hover:underline">Your Online Choices (EU)</a></li>
                  </ul>
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