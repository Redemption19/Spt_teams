import { HelpCircle, Book, MessageCircle, Mail, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function SupportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Support & Help</h1>
        <p className="text-muted-foreground">
          Get assistance and find answers to your questions
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Book className="h-5 w-5" />
              <span>Documentation</span>
            </CardTitle>
            <CardDescription>
              Browse comprehensive guides and tutorials
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">
              <ExternalLink className="h-4 w-4 mr-2" />
              View Docs
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageCircle className="h-5 w-5" />
              <span>Live Chat</span>
            </CardTitle>
            <CardDescription>
              Get instant help from our support team
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">Start Chat</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Mail className="h-5 w-5" />
              <span>Email Support</span>
            </CardTitle>
            <CardDescription>
              Send us a detailed message about your issue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">Send Email</Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">How do I create a new branch?</h4>              <p className="text-sm text-muted-foreground">
                Navigate to Organization → Branches and click &ldquo;Create Branch&rdquo;
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">How do I invite users to my workspace?</h4>
              <p className="text-sm text-muted-foreground">
                Go to Users → Invitations to send invitation links
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">How do I manage user permissions?</h4>
              <p className="text-sm text-muted-foreground">
                Use Users → User Management to edit roles and permissions
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium">Support Hours</h4>
              <p className="text-sm text-muted-foreground">
                Monday - Friday: 9:00 AM - 6:00 PM EST
              </p>
            </div>
            <div>
              <h4 className="font-medium">Response Time</h4>
              <p className="text-sm text-muted-foreground">
                We typically respond within 24 hours
              </p>
            </div>
            <div>
              <h4 className="font-medium">Emergency Support</h4>
              <p className="text-sm text-muted-foreground">
                For critical issues, use live chat for fastest response
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
