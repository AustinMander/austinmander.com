"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Mail, 
  Gift, 
  TrendingUp, 
  CheckCircle, 
  ArrowRight,
  Download,
  Calculator,
  BookOpen
} from "lucide-react";

interface EmailCaptureProps {
  variant?: 'newsletter' | 'resource' | 'inline' | 'popup';
  title?: string;
  description?: string;
  buttonText?: string;
  placeholder?: string;
  incentive?: string;
  source?: string;
  onSuccess?: (email: string) => void;
  className?: string;
}

export function EmailCapture({
  variant = 'newsletter',
  title,
  description,
  buttonText,
  placeholder = "your@email.com",
  incentive,
  source,
  onSuccess,
  className = ""
}: EmailCaptureProps) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Default content based on variant
  const defaultContent = {
    newsletter: {
      title: "Join 5,000+ Transformation Leaders",
      description: "Weekly insights on AI transformation and change management. No spam, unsubscribe anytime.",
      buttonText: "Get Weekly Insights",
      incentive: "Plus immediate access to our transformation intelligence toolkit",
      icon: Mail
    },
    resource: {
      title: "Download Free Resources",
      description: "Get immediate access to transformation guides, templates, and tools.",
      buttonText: "Get Resources",
      incentive: "Instant download + weekly transformation insights",
      icon: Download
    },
    inline: {
      title: "Stay Updated",
      description: "Get transformation insights delivered weekly.",
      buttonText: "Subscribe",
      incentive: null,
      icon: TrendingUp
    },
    popup: {
      title: "Before You Go...",
      description: "Get our most popular transformation intelligence resources sent straight to your inbox.",
      buttonText: "Send Me Resources",
      incentive: "5 free tools + weekly insights",
      icon: Gift
    }
  };

  const content = defaultContent[variant];
  const Icon = content.icon;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) return;

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          source: source || `email_capture_${variant}`
        }),
      });

      if (response.ok) {
        setIsSubmitted(true);
        setEmail("");
        
        // Track conversion
        import('@/lib/analytics').then(({ trackConversion, identifyUser }) => {
          trackConversion.emailSignup(source || `email_capture_${variant}`);
          identifyUser({ email, userType: 'lead' });
        });

        onSuccess?.(email);
      } else {
        const errorData = await response.json();
        console.error("Email capture error:", errorData.error);
        // TODO: Show error toast
      }
    } catch (error) {
      console.error("Email capture error:", error);
      // TODO: Show error toast
    } finally {
      setIsSubmitting(false);
    }
  };

  if (variant === 'inline') {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-teal" />
          <span className="text-sm font-medium">{title || content.title}</span>
        </div>
        {!isSubmitted ? (
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={placeholder}
              required
              className="w-48"
              disabled={isSubmitting}
            />
            <Button 
              type="submit" 
              size="sm" 
              disabled={isSubmitting}
              className="bg-teal hover:bg-teal/90"
            >
              {isSubmitting ? "..." : buttonText || content.buttonText}
            </Button>
          </form>
        ) : (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span>Subscribed!</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className={`p-6 ${className}`}>
      <div className="text-center space-y-4">
        <div className="mx-auto w-12 h-12 rounded-full bg-teal/10 flex items-center justify-center">
          <Icon className="h-6 w-6 text-teal" />
        </div>
        
        <div>
          <h3 className="text-lg font-semibold mb-2">
            {title || content.title}
          </h3>
          <p className="text-sm text-muted-foreground">
            {description || content.description}
          </p>
        </div>

        {(incentive || content.incentive) && (
          <Badge variant="outline" className="bg-teal/5 border-teal/20 text-teal">
            <Gift className="h-3 w-3 mr-1" />
            {incentive || content.incentive}
          </Badge>
        )}

        {!isSubmitted ? (
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={placeholder}
              required
              disabled={isSubmitting}
            />
            <Button 
              type="submit" 
              className="w-full bg-teal hover:bg-teal/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Subscribing..." : buttonText || content.buttonText}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
        ) : (
          <div className="space-y-3">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <div>
              <h4 className="font-semibold text-green-700 mb-1">
                You’re all set!
              </h4>
              <p className="text-sm text-muted-foreground">
                Check your email for your first transformation intelligence insight.
              </p>
            </div>
          </div>
        )}

        {variant === 'newsletter' && !isSubmitted && (
          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              Join leaders from HSBC, Santander, and 100+ other organizations
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}

// Specific variants for common use cases
export function NewsletterCapture(props: Omit<EmailCaptureProps, 'variant'>) {
  return <EmailCapture {...props} variant="newsletter" />;
}

export function ResourceCapture(props: Omit<EmailCaptureProps, 'variant'>) {
  return <EmailCapture {...props} variant="resource" />;
}

export function InlineEmailCapture(props: Omit<EmailCaptureProps, 'variant'>) {
  return <EmailCapture {...props} variant="inline" />;
}

export function PopupEmailCapture(props: Omit<EmailCaptureProps, 'variant'>) {
  return <EmailCapture {...props} variant="popup" />;
}

// Blog post email capture component
export function BlogEmailCapture({ 
  articleTitle,
  className = ""
}: { 
  articleTitle?: string;
  className?: string;
}) {
  return (
    <Card className={`p-6 bg-gradient-to-br from-teal/5 to-blue/5 border-teal/20 ${className}`}>
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-teal/10 flex items-center justify-center flex-shrink-0">
          <BookOpen className="h-6 w-6 text-teal" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold mb-2">
            Get More Transformation Intelligence
          </h4>
          <p className="text-sm text-muted-foreground mb-4">
            {articleTitle 
              ? `Enjoyed "${articleTitle}"? Get weekly insights like this delivered to your inbox.`
              : "Get weekly transformation intelligence insights delivered to your inbox."
            }
          </p>
          <EmailCapture
            variant="inline"
            title="Weekly Insights"
            buttonText="Subscribe"
            source="blog_post"
            className="justify-start"
          />
        </div>
      </div>
    </Card>
  );
}

// Exit-intent popup trigger (to be used with a modal)
export function ExitIntentCapture({ onClose }: { onClose?: () => void }) {
  return (
    <div className="p-6 max-w-md mx-auto">
      <EmailCapture
        variant="popup"
        onSuccess={() => {
          setTimeout(() => onClose?.(), 2000);
        }}
      />
    </div>
  );
}