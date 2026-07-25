"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Calendar,
  Clock,
  CheckCircle,
  ArrowRight,
  Star,
  Zap,
  Target,
  Settings,
  ExternalLink,
  User,
  Building
} from "lucide-react";
import { getBookingRecommendation, BOOKING_TYPES, type BookingType } from "@/lib/booking";

interface BookingWidgetProps {
  variant?: 'full' | 'compact' | 'inline';
  context?: {
    page?: string;
    source?: string;
    leadScore?: number;
    userRole?: string;
    companySize?: string;
    timeOnSite?: number;
    previousInteractions?: string[];
  };
  defaultBookingType?: 'quickwin' | 'demo' | 'strategy' | 'implementation';
  showRecommendation?: boolean;
  className?: string;
  onBookingComplete?: (bookingId: string, calendlyUrl: string) => void;
}

export function BookingWidget({
  variant = 'full',
  context = {},
  defaultBookingType,
  showRecommendation = true,
  className = "",
  onBookingComplete
}: BookingWidgetProps) {
  const [selectedBookingType, setSelectedBookingType] = useState<BookingType['id'] | null>(null);
  const [currentStep, setCurrentStep] = useState<'select' | 'form' | 'success'>('select');
  const [formData, setFormData] = useState({
    userName: '',
    userEmail: '',
    userCompany: '',
    userRole: '',
    userPhone: '',
    responses: {} as Record<string, string>
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recommendation, setRecommendation] = useState<ReturnType<typeof getBookingRecommendation> | null>(null);

  // Get booking recommendation on mount
  useEffect(() => {
    if (showRecommendation && !defaultBookingType) {
      const rec = getBookingRecommendation(context);
      setRecommendation(rec);
      setSelectedBookingType(rec.primaryBooking);
    } else if (defaultBookingType) {
      setSelectedBookingType(defaultBookingType);
    }
  }, [context, defaultBookingType, showRecommendation]);

  const bookingType = selectedBookingType ? BOOKING_TYPES[selectedBookingType] : null;

  const getBookingIcon = (type: BookingType['id']) => {
    switch (type) {
      case 'quickwin': return Zap;
      case 'demo': return Target;
      case 'strategy': return Star;
      case 'implementation': return Settings;
      default: return Calendar;
    }
  };

  const getBookingColor = (type: BookingType['id']) => {
    switch (type) {
      case 'quickwin': return 'border-orange-200 bg-orange-50';
      case 'demo': return 'border-teal-200 bg-teal-50';
      case 'strategy': return 'border-blue-200 bg-blue-50';
      case 'implementation': return 'border-purple-200 bg-purple-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const handleBookingTypeSelect = (type: BookingType['id']) => {
    setSelectedBookingType(type);
    setCurrentStep('form');
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingType || !bookingType) return;

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/booking/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingType: selectedBookingType,
          ...formData,
          source: context.source || 'booking_widget',
          leadScore: context.leadScore,
          utmSource: context.source
        }),
      });

      const result = await response.json();

      if (result.success) {
        setCurrentStep('success');
        
        // Track conversion
        import('@/lib/analytics').then(({ trackConversion, identifyUser }) => {
          if (selectedBookingType === 'quickwin') {
            trackConversion.quickWinInquiry('booking_widget');
          } else if (selectedBookingType === 'demo') {
            trackConversion.demoRequest();
          }
          
          identifyUser({
            email: formData.userEmail,
            userType: 'booking_requested'
          });
        });

        // Open Calendly in new tab
        if (result.calendlyUrl) {
          window.open(result.calendlyUrl, '_blank');
        }

        onBookingComplete?.(result.bookingId, result.calendlyUrl);
      } else {
        console.error('Booking request failed:', result.error);
        // TODO: Show error message
      }
    } catch (error) {
      console.error('Booking request error:', error);
      // TODO: Show error message
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith('response_')) {
      const responseId = field.replace('response_', '');
      setFormData(prev => ({
        ...prev,
        responses: { ...prev.responses, [responseId]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  if (variant === 'inline') {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-teal" />
          <span className="text-sm font-medium">
            {selectedBookingType ? `Book ${BOOKING_TYPES[selectedBookingType].name}` : 'Schedule Consultation'}
          </span>
        </div>
        <Button 
          onClick={() => setCurrentStep('form')}
          size="sm"
          className="bg-teal hover:bg-teal/90"
        >
          Book Now
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <Card className={`p-6 ${className}`}>
        {currentStep === 'select' && (
          <div className="text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-teal/10 flex items-center justify-center">
              <Calendar className="h-6 w-6 text-teal" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Schedule a Call</h3>
              {recommendation && (
                <p className="text-sm text-muted-foreground mb-4">
                  Recommended: {BOOKING_TYPES[recommendation.primaryBooking].name}
                </p>
              )}
            </div>
            <Button 
              onClick={() => handleBookingTypeSelect(selectedBookingType || 'strategy')}
              className="w-full bg-teal hover:bg-teal/90"
            >
              {selectedBookingType ? `Book ${BOOKING_TYPES[selectedBookingType].name}` : 'Schedule Call'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
        {/* Add form and success states here for compact variant */}
      </Card>
    );
  }

  // Full variant
  return (
    <Card className={`p-8 ${className}`}>
      {currentStep === 'select' && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Schedule Your Consultation</h2>
            <p className="text-muted-foreground">
              Choose the type of consultation that best fits your needs
            </p>
            {recommendation && showRecommendation && (
              <div className="mt-4 p-3 bg-teal/10 border border-teal/20 rounded-lg">
                <p className="text-sm text-teal-700">
                  <strong>Recommended:</strong> {BOOKING_TYPES[recommendation.primaryBooking].name}
                  <br />
                  <span className="text-xs">{recommendation.reasoning}</span>
                </p>
              </div>
            )}
          </div>

          <div className="grid gap-4">
            {Object.values(BOOKING_TYPES).map((booking) => {
              const Icon = getBookingIcon(booking.id);
              const isRecommended = recommendation?.primaryBooking === booking.id;
              
              return (
                <div
                  key={booking.id}
                  className={`relative p-6 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                    getBookingColor(booking.id)
                  } ${isRecommended ? 'ring-2 ring-teal-500' : ''}`}
                  onClick={() => handleBookingTypeSelect(booking.id)}
                >
                  {isRecommended && (
                    <Badge className="absolute -top-2 left-4 bg-teal text-white">
                      Recommended
                    </Badge>
                  )}
                  
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center">
                      <Icon className="h-6 w-6 text-gray-700" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold">{booking.name}</h3>
                        {booking.price && (
                          <Badge variant="outline">{booking.price}</Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-3">
                        {booking.description}
                      </p>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{booking.duration} min</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span>{booking.targetAudience[0]}</span>
                        </div>
                      </div>
                    </div>
                    
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {currentStep === 'form' && bookingType && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">{bookingType.name}</h2>
            <p className="text-muted-foreground">{bookingType.description}</p>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-4">
            {/* Basic Information */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="userName">Name *</Label>
                <Input
                  id="userName"
                  value={formData.userName}
                  onChange={(e) => handleInputChange('userName', e.target.value)}
                  required
                  placeholder="Your full name"
                />
              </div>
              <div>
                <Label htmlFor="userEmail">Email *</Label>
                <Input
                  id="userEmail"
                  type="email"
                  value={formData.userEmail}
                  onChange={(e) => handleInputChange('userEmail', e.target.value)}
                  required
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <Label htmlFor="userCompany">Company</Label>
                <Input
                  id="userCompany"
                  value={formData.userCompany}
                  onChange={(e) => handleInputChange('userCompany', e.target.value)}
                  placeholder="Your company"
                />
              </div>
              <div>
                <Label htmlFor="userRole">Role</Label>
                <Input
                  id="userRole"
                  value={formData.userRole}
                  onChange={(e) => handleInputChange('userRole', e.target.value)}
                  placeholder="Your role/title"
                />
              </div>
            </div>

            {/* Qualification Questions */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Quick Questions</h3>
              {bookingType.qualificationQuestions.map((question, index) => (
                <div key={question.id}>
                  <Label htmlFor={question.id}>
                    {question.question}
                    {question.required && <span className="text-red-500"> *</span>}
                  </Label>
                  
                  {question.type === 'select' && question.options ? (
                    <Select
                      value={formData.responses[question.id] || ''}
                      onValueChange={(value) => handleInputChange(`response_${question.id}`, value)}
                      required={question.required}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select an option" />
                      </SelectTrigger>
                      <SelectContent>
                        {question.options.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : question.type === 'textarea' ? (
                    <Textarea
                      id={question.id}
                      value={formData.responses[question.id] || ''}
                      onChange={(e) => handleInputChange(`response_${question.id}`, e.target.value)}
                      required={question.required}
                      placeholder={question.helpText}
                      rows={3}
                    />
                  ) : (
                    <Input
                      id={question.id}
                      value={formData.responses[question.id] || ''}
                      onChange={(e) => handleInputChange(`response_${question.id}`, e.target.value)}
                      required={question.required}
                      placeholder={question.helpText}
                    />
                  )}
                  
                  {question.helpText && question.type !== 'textarea' && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {question.helpText}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep('select')}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-teal hover:bg-teal/90"
              >
                {isSubmitting ? 'Scheduling...' : 'Schedule Call'}
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </form>
        </div>
      )}

      {currentStep === 'success' && (
        <div className="text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-green-500/10 flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
          
          <div>
            <h2 className="text-2xl font-bold mb-2">Request Submitted!</h2>
            <p className="text-muted-foreground">
              Your {bookingType?.name} request has been submitted. You should see a Calendly window to select your preferred time.
            </p>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Next steps:</strong> Select your preferred time in the Calendly window, 
              and I’ll send you preparation materials 24 hours before our call.
            </p>
          </div>

          <Button
            onClick={() => setCurrentStep('select')}
            variant="outline"
          >
            Schedule Another Call
          </Button>
        </div>
      )}
    </Card>
  );
}