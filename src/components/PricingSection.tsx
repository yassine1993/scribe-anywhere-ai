import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Zap, Clock } from "lucide-react";

const PricingSection = () => {
  const plans = [
    {
      name: "Free Tier",
      icon: Clock,
      price: "$0",
      period: "forever",
      description: "Perfect for trying out our service",
      features: [
        "3 × 30-minute transcriptions per day",
        "Standard processing speed",
        "Basic export formats (TXT, SRT)",
        "98+ language support",
        "Basic editing tools",
        "Community support"
      ],
      limitations: [
        "Low priority processing",
        "Limited export options",
        "No batch processing"
      ],
      buttonText: "Start Free",
      variant: "outline" as const,
      popular: false
    },
    {
      name: "Unlimited Pro",
      icon: Crown,
      price: "$10",
      period: "month (billed annually)",
      description: "For professionals and teams who need unlimited access",
      features: [
        "Unlimited transcriptions",
        "10-hour file uploads",
        "5GB file size limit",
        "High priority processing",
        "All export formats (DOCX, PDF, CSV, VTT)",
        "Bulk export capabilities",
        "Speaker recognition",
        "Audio restoration",
        "Batch processing",
        "Priority support",
        "Custom branding",
        "Advanced editing suite"
      ],
      limitations: [],
      buttonText: "Start Pro Trial",
      variant: "hero" as const,
      popular: true
    }
  ];

  return (
    <section id="pricing" className="py-20 px-4 bg-gradient-to-br from-ai-primary/5 to-background">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            <Crown className="w-4 h-4 mr-2" />
            Transparent Pricing
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold mb-6 bg-gradient-hero bg-clip-text text-transparent">
            Choose Your Plan
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Start free and upgrade when you need unlimited power. 
            No hidden fees, no surprises.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan, index) => (
            <Card 
              key={index} 
              className={`relative ${plan.popular ? 'ring-2 ring-ai-primary shadow-glow' : ''} transition-all hover:shadow-card`}
            >
              {plan.popular && (
                <Badge 
                  variant="default" 
                  className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-hero px-4 py-1"
                >
                  Most Popular
                </Badge>
              )}
              
              <CardHeader className="text-center pb-4">
                <div className={`w-12 h-12 mx-auto mb-4 rounded-xl flex items-center justify-center ${
                  plan.popular ? 'bg-gradient-hero' : 'bg-gradient-card'
                }`}>
                  <plan.icon className={`w-6 h-6 ${plan.popular ? 'text-primary-foreground' : 'text-ai-primary'}`} />
                </div>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">/{plan.period}</span>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-3 text-success">✓ What's included:</h4>
                  <ul className="space-y-2">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                {plan.limitations.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3 text-muted-foreground">Limitations:</h4>
                    <ul className="space-y-2">
                      {plan.limitations.map((limitation, limitIndex) => (
                        <li key={limitIndex} className="flex items-start gap-2">
                          <span className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0">•</span>
                          <span className="text-sm text-muted-foreground">{limitation}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>

              <CardFooter>
                <Button variant={plan.variant} className="w-full" size="lg">
                  {plan.buttonText}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            Need custom enterprise features? 
          </p>
          <Button variant="outline">
            Contact Sales
          </Button>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;