import { GradientHeading } from "@/components/ui/gradient-heading"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  CheckCircle2,
  Clock,
  Globe,
  LineChart,
  Shield,
  Smartphone,
  Star,
  Zap
} from "lucide-react"

export default function Home() {
  return (
    <>
      {/* Hero Section */}
      <section className="py-20 md:py-32">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center space-y-8">
          <GradientHeading>
            Monitor Your Services with Confidence
          </GradientHeading>
          <p className="text-xl text-muted-foreground max-w-[600px]">
            Enterprise-grade monitoring solution for modern applications and services. Get real-time insights and instant alerts.
          </p>
          <div className="flex gap-4">
            <Button size="lg">Start Monitoring</Button>
            <Button size="lg" variant="outline">View Demo</Button>
          </div>
          <div className="pt-12 grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-4xl">
            {[
              { number: "99.9%", label: "Uptime" },
              { number: "50M+", label: "Daily Checks" },
              { number: "5000+", label: "Happy Customers" },
            ].map((stat) => (
              <div key={stat.label} className="space-y-2 stat-number">
                <div className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/80">{stat.number}</div>
                <div className="text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-muted/50">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold">Powerful Features</h2>
            <p className="text-muted-foreground max-w-[600px] mx-auto">
              Everything you need to monitor your services and keep them running smoothly
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Real-time Monitoring",
                description: "Get instant insights into your service health with real-time monitoring and updates",
                icon: Activity
              },
              {
                title: "Smart Alerts",
                description: "Receive intelligent alerts based on customizable thresholds and patterns",
                icon: AlertTriangle
              },
              {
                title: "Global Coverage",
                description: "Monitor from multiple locations worldwide for comprehensive insights",
                icon: Globe
              },
              {
                title: "Performance Analytics",
                description: "Detailed performance metrics and trends with advanced analytics",
                icon: BarChart3
              },
              {
                title: "Instant Notifications",
                description: "Multi-channel notifications via email, SMS, Slack, and more",
                icon: Bell
              },
              {
                title: "Uptime Tracking",
                description: "Track and report on service uptime with detailed historical data",
                icon: Clock
              },
            ].map((feature) => {
              const Icon = feature.icon
              return (
                <Card key={feature.title} className="p-6 space-y-4">
                  <Icon className="w-12 h-12 text-primary" />
                  <h3 className="text-xl font-semibold">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold">Simple, Transparent Pricing</h2>
            <p className="text-muted-foreground max-w-[600px] mx-auto">
              Choose the perfect plan for your monitoring needs
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: "Starter",
                price: "$29",
                description: "Perfect for small projects",
                features: [
                  "Up to 10 monitors",
                  "5-minute check intervals",
                  "Email notifications",
                  "24-hour data retention",
                  "Basic reporting"
                ]
              },
              {
                name: "Professional",
                price: "$99",
                description: "For growing businesses",
                features: [
                  "Up to 50 monitors",
                  "1-minute check intervals",
                  "Multi-channel notifications",
                  "30-day data retention",
                  "Advanced analytics",
                  "API access"
                ],
                popular: true
              },
              {
                name: "Enterprise",
                price: "$299",
                description: "For large organizations",
                features: [
                  "Unlimited monitors",
                  "30-second check intervals",
                  "Priority support",
                  "1-year data retention",
                  "Custom integrations",
                  "SLA guarantees",
                  "Dedicated account manager"
                ]
              }
            ].map((plan) => (
              <Card key={plan.name} className={`p-6 space-y-6 ${plan.popular ? 'border-primary' : ''}`}>
                {plan.popular && (
                  <div className="text-primary text-sm font-medium flex items-center gap-2">
                    <Star className="w-4 h-4" /> Most Popular
                  </div>
                )}
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold">{plan.name}</h3>
                  <div className="text-3xl font-bold">{plan.price}<span className="text-muted-foreground text-sm font-normal">/month</span></div>
                  <p className="text-muted-foreground">{plan.description}</p>
                </div>
                <ul className="space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button className="w-full" variant={plan.popular ? "default" : "outline"}>
                  Get Started
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-muted/50">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold">Trusted by Thousands</h2>
            <p className="text-muted-foreground max-w-[600px] mx-auto">
              See what our customers have to say about Monitor SaaS
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                quote: "Monitor SaaS has transformed how we handle our service monitoring. The real-time alerts have saved us countless hours of downtime.",
                author: "Sarah Chen",
                role: "CTO at TechCorp",
                rating: 5
              },
              {
                quote: "The best monitoring solution we've used. The interface is intuitive and the alerts are reliable. Couldn't be happier!",
                author: "Mark Thompson",
                role: "DevOps Lead at StartupX",
                rating: 5
              },
              {
                quote: "Excellent service with great features. The global monitoring points give us confidence in our worldwide operations.",
                author: "Lisa Rodriguez",
                role: "Engineering Manager at GlobalTech",
                rating: 5
              }
            ].map((testimonial) => (
              <Card key={testimonial.author} className="p-6 space-y-4">
                <div className="flex gap-1">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-muted-foreground">{testimonial.quote}</p>
                <div>
                  <div className="font-semibold">{testimonial.author}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="p-12">
            <div className="max-w-2xl mx-auto text-center space-y-8">
              <h2 className="text-3xl font-bold">Ready to Get Started?</h2>
              <p className="text-muted-foreground">
                Join thousands of companies using Monitor SaaS to keep their services running smoothly.
              </p>
              <div className="flex gap-4 justify-center">
                <Button size="lg">Start Your Free Trial</Button>
                <Button size="lg" variant="outline">Contact Sales</Button>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </>
  )
}
